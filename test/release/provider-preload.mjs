import fs from 'node:fs';
import { createHash } from 'node:crypto';
const url = new URL(process.env.DATABASE_URL || 'http://invalid');
if (process.env.UNLOCK_RELEASE_FAKE_PROVIDER !== '1' || !['127.0.0.1','localhost'].includes(url.hostname) || url.pathname !== '/tarot_credit_task3' || url.username !== 'credit_test' || url.search || url.hash) throw new Error('Release preload requires explicit isolated database');
const original = globalThis.fetch;
const attempts = new Map();
const events = process.env.UNLOCK_RELEASE_PROVIDER_EVENTS;
const holdFile = process.env.UNLOCK_RELEASE_HOLD_FILE;
const result = {
 summary: 'Bản đọc kiểm thử đã được lưu. Đây là dữ liệu giả.', overview: 'Tổng quan kiểm thử release được lưu từ phản hồi provider giả.', themes: ['Kiểm tra', 'Lưu bài', 'Đối soát'],
 perCard: ['Bối cảnh','Hiện tại','Hướng đi'].map((position,i)=>({position,keyMessage:`Thông điệp kiểm thử ${i+1}.`,text:`Diễn giải kiểm thử vị trí ${i+1}.`})),
 connections: 'Liên hệ trong bản đọc kiểm thử.', actionSuggestions: ['Bước kiểm thử thứ nhất.','Bước kiểm thử thứ hai.','Bước kiểm thử thứ ba.'], reflectiveQuestion: 'Bạn muốn kiểm tra điều gì?', closingNote: 'Lời kết kiểm thử.'
};
globalThis.fetch = async (input, init) => {
 const target = new URL(typeof input === 'string' || input instanceof URL ? input.toString() : input.url);
 if(target.hostname === 'api.deepseek.com') {
  if(init?.headers?.Authorization !== 'Bearer release-test-only-key') throw new Error('Fake provider requires synthetic key');
  const body=String(init?.body ?? '');
  const mode=body.includes('E2E_RELEASE_HOLD')?'hold':body.includes('E2E_RELEASE_ABORT')?'abort':body.includes('E2E_RELEASE_FAIL_ONCE')?'fail_once':'success';
  const key=createHash('sha256').update(body).digest('hex');const count=(attempts.get(key)||0)+1;attempts.set(key,count);
  if(events)fs.appendFileSync(events,JSON.stringify({mode,count,at:new Date().toISOString()})+'\n');
  if(mode==='abort') { await new Promise(r=>setTimeout(r,100));throw new DOMException('Synthetic provider timeout','TimeoutError'); }
  if(mode==='fail_once'&&count===1)return new Response('Synthetic provider failure',{status:503});
  if(mode==='hold') await new Promise((resolve,reject)=>{
   const timer=setInterval(()=>{if(holdFile&&fs.existsSync(holdFile)){clearInterval(timer);resolve();}},30);
   init.signal.addEventListener('abort',()=>{clearInterval(timer);reject(init.signal.reason);},{once:true});
  });
  return Response.json({choices:[{finish_reason:'stop',message:{content:JSON.stringify(result)}}],usage:{prompt_tokens:100,completion_tokens:200}});
 }
 if(!['127.0.0.1','localhost'].includes(target.hostname))throw new Error('External HTTP blocked in release test server');
 return original(input,init);
};
