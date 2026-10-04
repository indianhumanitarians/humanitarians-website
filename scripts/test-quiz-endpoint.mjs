// Exercise the deployed handler's code with synthetic records and in-memory Storage.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import ts from 'typescript';
let handler;
globalThis.Deno = { env:{get:name=>({SUPABASE_URL:'https://test.supabase.co',SUPABASE_SERVICE_ROLE_KEY:'test-only-secret'}[name])},serve:fn=>{handler=fn;} };
let source=await readFile(new URL('../supabase/functions/quiz-certificates/index.ts',import.meta.url),'utf8');
source=source.replace("'./logic.mjs'",JSON.stringify(new URL('../supabase/functions/quiz-certificates/logic.mjs',import.meta.url).href));
await import('data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText).toString('base64'));
test('lookup returns all siblings, signs only matches, rejects bulk access, and throttles',async()=>{
  const originalFetch=globalThis.fetch;
  const slots=new Set();const signed=[];
  globalThis.fetch=async(url,init)=>{
    const path=new URL(url).pathname;
    if(path.includes('/limits/')) { if(slots.has(path)) return Response.json({error:'Duplicate',statusCode:'409'},{status:400});slots.add(path);return Response.json({}); }
    if(path.endsWith('/registrations.json')) return Response.json([{id:'a',name:'Test Student One',phone:'+919876543210'},{id:'b',name:'Test Student Two',phone:'+919876543210'},{id:'c',name:'Different Student',phone:'+919999999999'}]);
    if(path.includes('/object/sign/')){assert.equal(JSON.parse(init.body).expiresIn,600);signed.push(path);return Response.json({signedURL:path.replace('/storage/v1','')+'?token=test-token'});}
    throw new Error('Unexpected storage call');
  };
  try {
    const request=(phone,method='POST',origin='https://indianhumanitarians.com')=>new Request('https://test.supabase.co/functions/v1/quiz-certificates',{method,headers:{origin,'x-forwarded-for':'test-ip','content-type':'application/json'},...(method==='POST'?{body:JSON.stringify({phone})}:{})});
    const result=await handler(request('9876543210'));assert.equal(result.status,200);
    const data=await result.json();assert.equal(data.certificates.length,2);assert.equal(signed.length,2);
    assert(!JSON.stringify(data).includes('phone'));assert(!JSON.stringify(data).includes('Different Student'));
    assert(data.certificates.every(c=>c.url.includes('download=')));
    assert.equal(result.headers.get('cache-control'),'no-store');
    assert.equal((await handler(request('', 'GET'))).status,405);
    assert.equal((await handler(request('9876543210','POST','https://untrusted.example'))).status,403);
    const missing=await handler(request('9111111111'));assert.deepEqual((await missing.json()).certificates,[]);
    assert.equal((await handler(request('bad'))).status,400);
    for(let i=0;i<7;i++) await handler(request('9876543210'));
    const limited=await handler(request('9876543210'));assert.equal(limited.status,429);
    assert.equal(limited.headers.get('retry-after'),'900');
  } finally {globalThis.fetch=originalFetch;delete globalThis.Deno;}
});
