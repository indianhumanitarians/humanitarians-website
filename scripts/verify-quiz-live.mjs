// Verify private storage and live downloads without printing participant data or signed URLs.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { registrationLookupPhone } from '../supabase/functions/quiz-certificates/logic.mjs';
const env=Object.fromEntries((await readFile('.env','utf8')).split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const base=env.VITE_SUPABASE_URL, service=env.SUPABASE_SERVICE_ROLE_KEY, anon=env.VITE_SUPABASE_ANON_KEY;
const bucket='quiz-certificates-2026';
const headers=key=>({apikey:key,Authorization:`Bearer ${key}`,'Content-Type':'application/json'});
const records=JSON.parse(await readFile('.certificates-private/registrations.json','utf8'));
async function request(path,key,init={}) { return fetch(`${base}${path}`,{...init,headers:{...headers(key),...init.headers},signal:AbortSignal.timeout(30000)}); }
const info=await request(`/storage/v1/bucket/${bucket}`,service);assert.equal(info.status,200);assert.equal((await info.json()).public,false);
const files=await request(`/storage/v1/object/list/${bucket}`,service,{method:'POST',body:JSON.stringify({prefix:'pdfs',limit:1000})});assert.equal(files.status,200);
const listed=await files.json();for(const r of records)assert(listed.some(f=>f.name===`${r.id}.pdf`));
const privateRead=await request(`/storage/v1/object/authenticated/${bucket}/registrations.json`,anon);assert(!privateRead.ok);
const publicRead=await request(`/storage/v1/object/public/${bucket}/pdfs/${records[0].id}.pdf`,anon);assert(!publicRead.ok);
const anonymousList=await request(`/storage/v1/object/list/${bucket}`,anon,{method:'POST',body:JSON.stringify({prefix:'pdfs',limit:1000})});
assert(!anonymousList.ok || (await anonymousList.json()).length===0);
console.log(`Verified ${records.length} uploaded PDFs; bucket private; anonymous reads and listing denied.`);
const grouped=Map.groupBy(records,r=>registrationLookupPhone(r.phone));
const single=[...grouped].find(([,r])=>r.length===1);
const shared=[...grouped].find(([,r])=>r.length>1);
const international=[...grouped].find(([,r])=>r[0].phone.startsWith('+61'));
for(const [label,pair] of [['single',single],['shared',shared],['international',international],['unknown',['0000000000',[]]]]) {
  assert(pair);const [phone,expected]=pair;
  const response=await request('/functions/v1/quiz-certificates',anon,{method:'POST',headers:{Origin:'https://www.indianhumanitarians.com'},body:JSON.stringify({phone})});
  assert.equal(response.status,200,`${label} lookup HTTP ${response.status}`);
  assert.equal(response.headers.get('access-control-allow-origin'),'https://www.indianhumanitarians.com');
  const data=await response.json();assert.deepEqual(data.certificates.map(r=>r.id).sort(),expected.map(r=>r.id).sort());
  assert(data.certificates.every(r=>!('phone' in r)));
  if(data.certificates.length){const pdf=await fetch(data.certificates[0].url,{signal:AbortSignal.timeout(30000)});assert.equal(pdf.status,200);assert(pdf.headers.get('content-type').includes('application/pdf'));const bytes=Buffer.from(await pdf.arrayBuffer());assert.equal(bytes.subarray(0,5).toString(),'%PDF-');}
  console.log(`Live ${label} lookup and download passed (${expected.length} matches).`);
}
