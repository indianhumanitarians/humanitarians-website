import { readFile } from 'node:fs/promises';
const env=Object.fromEntries((await readFile('.env','utf8')).split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const url=env.VITE_SUPABASE_URL, key=env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||!key||key.includes('PASTE_')) throw new Error('Configure local Supabase service credentials');
const bucket='quiz-certificates-2026';
const records=JSON.parse(await readFile('.certificates-private/registrations.json','utf8'));
const write=process.argv.includes('--write');
console.log(`${write?'Uploading':'Dry run:'} ${records.length} certificates to private storage.`);
async function request(path,init={}){
  const response=await fetch(`${url}/storage/v1/${path}`,{...init,headers:{apikey:key,Authorization:`Bearer ${key}`,...init.headers},signal:AbortSignal.timeout(60000)});
  if(!response.ok) throw new Error(`Storage operation failed (${response.status})`);
  return response;
}
// Validate every file before any remote writes.
for(const r of records){if(!/^[a-f0-9]{32}$/.test(r.id))throw new Error('Invalid certificate ID');await readFile(`.certificates-private/pdfs/${r.id}.pdf`);}
if(!write) process.exit(0);
const existing=await fetch(`${url}/storage/v1/bucket/${bucket}`,{headers:{apikey:key,Authorization:`Bearer ${key}`}});
if(existing.ok){if((await existing.json()).public)throw new Error('Certificate bucket must be private');}
else if(existing.status===404 || existing.status===400){await request('bucket',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:bucket,name:bucket,public:false})});}
else throw new Error('Cannot inspect private bucket');
for(let start=0;start<records.length;start+=4){
  await Promise.all(records.slice(start,start+4).map(async r=>request(`object/${bucket}/pdfs/${r.id}.pdf`,{method:'POST',headers:{'Content-Type':'application/pdf','x-upsert':'true'},body:await readFile(`.certificates-private/pdfs/${r.id}.pdf`)})));
  console.log(`Uploaded ${Math.min(start+4,records.length)}/${records.length}`);
}
// Publish the registry last so lookups never point at incomplete uploads.
await request(`object/${bucket}/registrations.json`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'true'},body:JSON.stringify(records.map(({id,name,phone})=>({id,name,phone})))});
console.log('Private upload complete. No public storage policy was created.');
