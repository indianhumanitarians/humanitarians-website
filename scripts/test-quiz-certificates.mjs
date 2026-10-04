import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizePhone,registrationLookupPhone,claimLookupSlot } from '../supabase/functions/quiz-certificates/logic.mjs';
test('accepts exactly ten digits and maps stored registrations to domestic numbers',()=>{
  assert.equal(normalizePhone('9876543210'),'9876543210');
  assert.equal(normalizePhone('0485123456'),'0485123456');
  assert.equal(registrationLookupPhone('+919876543210'),'9876543210');
  assert.equal(registrationLookupPhone('+61485123456'),'0485123456');
  assert.equal(registrationLookupPhone('+441234567890'),null);
  for(const input of ['',null,123,'number9876543210','123','+00000000','+919876543210','919876543210','98765 43210','9'.repeat(41)]) assert.equal(normalizePhone(input),null);
});
test('atomic rate slots allow at most ten concurrent requests and reset next window',async()=>{
  const slots=new Set();
  const insert=async path=>{if(slots.has(path))return 'exists';slots.add(path);return 'created';};
  const results=await Promise.all(Array.from({length:20},()=>claimLookupSlot(insert,'test-ip',0)));
  assert.equal(results.filter(Boolean).length,10);
  assert.equal(await claimLookupSlot(insert,'test-ip',15*60*1000),true);
});
test('rate limiting fails closed when storage is unavailable',async()=>{
  await assert.rejects(()=>claimLookupSlot(async()=> 'failed','test-ip',0));
});
