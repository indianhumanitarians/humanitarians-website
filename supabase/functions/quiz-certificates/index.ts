import { normalizePhone, registrationLookupPhone, claimLookupSlot } from './logic.mjs';

const bucket = 'quiz-certificates-2026';
const base = Deno.env.get('SUPABASE_URL')!;
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowedOrigins = new Set((Deno.env.get('CERTIFICATE_ALLOWED_ORIGINS') || 'https://indianhumanitarians.com,https://www.indianhumanitarians.com,http://localhost:5173,http://127.0.0.1:5173').split(',').map(s=>s.trim()));
const storageHeaders = { apikey:secret, Authorization:`Bearer ${secret}` };
type Participant = { id:string; name:string; phone:string };

async function storage(path:string, init:RequestInit = {}) {
  return fetch(`${base}/storage/v1/${path}`, { ...init, headers:{ ...storageHeaders, ...init.headers }, signal:AbortSignal.timeout(15000) });
}

Deno.serve(async req => {
  const origin = req.headers.get('origin');
  const headers:Record<string,string> = { 'Content-Type':'application/json', 'Cache-Control':'no-store', 'Vary':'Origin', 'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods':'POST, OPTIONS' };
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  const reply = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers});
  if (origin && !allowedOrigins.has(origin)) return reply({error:'Origin not allowed'},403);
  if (req.method==='OPTIONS') return new Response(null,{status:204,headers});
  if (req.method!=='POST') return reply({error:'Use POST'},405);
  try {
    // Use the gateway-appended address, not a caller-supplied first forwarded address.
    const address = req.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || 'unknown';
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw',encoder.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const signature = await crypto.subtle.sign('HMAC',key,encoder.encode(address));
    const ipHash = Array.from(new Uint8Array(signature),b=>b.toString(16).padStart(2,'0')).join('');
    const permitted = await claimLookupSlot(async (path:string, body:string) => {
      const response = await storage(`object/${bucket}/${path}`,{method:'POST',headers:{'Content-Type':'application/json','x-upsert':'false'},body});
      if(response.ok) return 'created';
      const data = await response.json().catch(()=>({}));
      if(response.status===409 || data.error==='Duplicate' || data.statusCode==='409') return 'exists';
      return 'failed';
    },ipHash);
    if(!permitted) { headers['Retry-After']='900'; return reply({error:'Too many searches. Please try again in 15 minutes.'},429); }
    if(Number(req.headers.get('content-length')||0)>1024) return reply({error:'Request too large'},413);
    // Bound streamed bodies as well, including requests without Content-Length.
    const reader=req.body?.getReader();
    if(!reader) return reply({error:'Enter your registered mobile number.'},400);
    let length=0; const chunks:Uint8Array[]=[];
    while(true){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>1024){await reader.cancel();return reply({error:'Request too large'},413);}chunks.push(value);}
    const payload=new Uint8Array(length);let offset=0;for(const chunk of chunks){payload.set(chunk,offset);offset+=chunk.length;}
    let body;try{body=JSON.parse(new TextDecoder().decode(payload));}catch{return reply({error:'Invalid request'},400);}
    const phone=normalizePhone(body?.phone);
    if(!phone) return reply({error:'Enter your 10-digit registered mobile number.'},400);
    const registryResponse=await storage(`object/authenticated/${bucket}/registrations.json`);
    if(!registryResponse.ok) throw new Error('Registry unavailable');
    const registry:Participant[]=await registryResponse.json();
    const matches=registry.filter(r=>registrationLookupPhone(r.phone)===phone);
    const certificates=await Promise.all(matches.map(async participant=>{
      const response=await storage(`object/sign/${bucket}/pdfs/${participant.id}.pdf`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({expiresIn:600})});
      if(!response.ok) throw new Error('Signing failed');
      const {signedURL}=await response.json();
      if(typeof signedURL!=='string') throw new Error('Missing signed URL');
      const url=new URL(`${base}/storage/v1${signedURL}`);
      url.searchParams.set('download',`Humanitarians-Quiz-2026-${participant.name.replace(/[^\p{L}\p{N} -]/gu,'').slice(0,80)}.pdf`);
      return {id:participant.id,name:participant.name,url:url.toString()};
    }));
    return reply({certificates,expiresIn:600});
  } catch {
    // Do not log phone numbers, names, signed URLs, or service credentials.
    return reply({error:'Certificates are temporarily unavailable. Please try again shortly.'},503);
  }
});
