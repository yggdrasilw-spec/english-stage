const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),deck=JSON.parse(fs.readFileSync(root+'/dist/data/grade5.json','utf8'));
const server=http.createServer((req,res)=>{try{const p=new URL(req.url,'http://localhost').pathname,f=path.join(root,'dist',p==='/'?'index.html':p);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const errors=[];
try{for(const mode of ['listen','read','recall','match']){
 const p=await browser.newPage({viewport:{width:390,height:844}});p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${server.address().port}/`);await p.locator('[data-forest-start="read"]').first().click();await p.locator('[data-fast-answer]').first().waitFor();
 await p.evaluate(()=>{Math.random=()=>0;});
 await p.locator(`[data-mode="${mode}"]`).click();await p.locator(`[data-mode="${mode}"][aria-pressed="true"]`).waitFor();
 const read=()=>p.evaluate(async()=>await(await import('./src/storage.js')).read());let s=await read();
 assert.equal(s.fast.randomized,true,mode+': displayed order must already be saved');
 const order=s.fast.ids.slice(),seen=[];
 if(mode==='match'){
  for(const id of order.slice(0,4)){await p.locator(`[data-left="${id}"]`).click();await p.locator(`[data-right="${id}"]`).click();await p.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).fast.checked===n,seen.push(id));}
  await p.locator('#match-next').click();await p.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).fast.index===4);s=await read();assert.deepEqual(s.fast.ids,order);assert.equal(s.fast.index,4);
 }else for(let i=0;i<5;i++){
  s=await read();const id=s.fast.ids[s.fast.index],c=deck.find(c=>c.id===id);assert(!seen.includes(id));seen.push(id);
  if(mode!=='listen')assert.equal(await p.locator('.flash-word').innerText(),mode==='recall'?c.ja:c.en);
  await p.locator(`[data-fast-answer="${id}"]`).click();await p.locator('#fast-next').waitFor();s=await read();assert.equal(s.history.at(-1).id,id);assert.equal(s.history.at(-1).skill,mode);assert.equal(s.history.at(-1).quality,'correct');assert.deepEqual(s.fast.ids,order);assert(s.fast.feedback.ok);
  if(i===0){await p.locator('#fast-mix').evaluate(b=>b.click());await p.waitForFunction(async old=>(await(await import('./src/storage.js')).read()).fast.ids.join('|')!==old,order.join('|'));await p.locator('#fast-next').waitFor();const mixed=await read();assert.equal(mixed.fast.ids[0],id);order.splice(0,order.length,...mixed.fast.ids);}
  await p.reload();await p.locator('#fast-next').waitFor();assert.deepEqual((await read()).fast.ids,order);
  await p.locator('#fast-next').click();await p.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).fast.index===n,i+1);
 }
 console.log('PASS forest -> '+mode+': saved order, answers, unique questions, reload');await p.close();
}
// Migrate an interrupted save from before the fix, including paired review tasks.
const p=await browser.newPage();await p.goto(`http://127.0.0.1:${server.address().port}/`);await p.locator('[data-forest-start="read"]').first().click();await p.locator('[data-fast-answer]').first().waitFor();
await p.evaluate(async()=>{const m=await import('./src/storage.js'),s=await m.read();s.fast.randomized=false;s.fast.round=false;s.fast.tasks=s.fast.ids.map((id,i)=>({id,skill:['listen','read','recall'][i%3],due:0}));await m.write(s);});
await p.reload();await p.locator('[data-fast-answer]').first().waitFor();
let review=await p.evaluate(async()=>await(await import('./src/storage.js')).read());assert(review.fast.randomized);assert.deepEqual(review.fast.ids,review.fast.tasks.map(t=>t.id));
for(let i=0;i<5;i++){const t=review.fast.tasks[i];await p.locator(`[data-fast-answer="${t.id}"]`).click();await p.locator('#fast-next').waitFor();const answered=await p.evaluate(async()=>await(await import('./src/storage.js')).read());assert.equal(answered.history.at(-1).id,t.id);assert.equal(answered.history.at(-1).skill,t.skill);assert(answered.fast.feedback.ok);await p.locator('#fast-next').click();await p.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).fast.index===n,i+1);}
console.log('PASS legacy migration and mixed-skill review: displayed answers match saved tasks');await p.close();
assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
