const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=path.join(root,'work/karuta-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.resolve(root,'dist','.'+u);if(!f.startsWith(path.join(root,'dist')+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
async function saved(p){return p.evaluate(async()=>{const s=await import('./src/storage.js');return s.read();});}
async function ready(p){await p.waitForFunction(()=>document.querySelector('[data-karuta-card]:not(:disabled)'));}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const p=await browser.newPage({viewport:{width:320,height:844}}),base=`http://127.0.0.1:${server.address().port}/`;
 try{
 await p.goto(base);await p.locator('#start').waitFor();
 const result=await p.evaluate(async()=>{
  const storage=await import('./src/storage.js'),{recordKaruta}=await import('./src/karuta-learning.js');
  const cards=await fetch('data/grade5.json').then(r=>r.json()),animals=cards.filter(c=>c.theme==='動物'),s=storage.initial(),now=Date.now();
  const mastered=animals[0].id,known=animals[1].id,weak=animals[2].id;
  s.screening={results:{[known]:{status:'known',at:now}}};
  for(const at of [now-86400000,now-1000,now])recordKaruta(s,mastered,'meaning',{correct:true,ms:1500,plays:1,slow:false,eligible:true,choices:8},at);
  recordKaruta(s,weak,'meaning',{correct:false,ms:2000,plays:1,slow:false,eligible:true,choices:8},now);
  await storage.write(s);return {mastered,known,weak,animals:animals.map(c=>c.id)};
 });
 await p.reload();await p.locator('#start').waitFor();await p.locator('a.karuta-entry').click();
 await p.locator('#karuta-theme').selectOption('動物');await p.locator('#karuta-count').fill('4');await p.locator('#karuta-config button[type=submit]').click();await ready(p);
 const first=await saved(p);assert(!first.karuta.ids.includes(result.mastered));assert(!first.karuta.ids.includes(result.known));assert(first.karuta.ids.includes(result.weak));
 const target=first.karuta.order[0];await p.locator('#karuta-stop').click();await p.locator('#karuta-play').click();await ready(p);await p.locator(`[data-karuta-card="${target}"]`).click();await p.locator('.just-taken').waitFor();
 assert.equal((await saved(p)).karutaLearning[target].meaning.streak,0);

 for(let i=1;i<4;i++){await ready(p);const s=await saved(p);await p.locator(`[data-karuta-card="${s.karuta.order[s.karuta.index]}"]`).click();if(i<3)await p.waitForFunction(i=>document.querySelectorAll('.karuta-card.taken').length===i+1,i);}
 await p.locator('#karuta-again').waitFor();await p.locator('#karuta-again').click();await ready(p);
 const repeated=await saved(p);assert.equal(repeated.karuta.theme,'動物');assert.equal(repeated.karuta.ids.length,4);
 assert(repeated.karuta.ids.every(id=>!first.karuta.ids.includes(id)));assert(!repeated.karuta.ids.includes(result.mastered));assert(!repeated.karuta.ids.includes(result.known));
 console.log('PASS repeat button: same category, unseen cards replace the previous board, known/mastered remain excluded');
 await p.locator('.karuta-wrap a[href="#home"]').click();await p.locator('#start').waitFor();
 await p.evaluate(async()=>{const storage=await import('./src/storage.js'),cards=await fetch('data/grade5.json').then(r=>r.json()),s=await storage.read();s.karuta=null;s.screening={results:Object.fromEntries(cards.map(c=>[c.id,{status:'known',at:Date.now()}]))};s.karutaLearning={};await storage.write(s);});
 await p.reload();await p.locator('#start').waitFor();await p.locator('a.karuta-entry').click();await p.locator('#karuta-config button[type=submit]').click();
 await p.waitForFunction(()=>document.querySelector('#karuta-game')?.textContent.includes('今練習する札がありません'));
 assert.equal(await p.locator('[data-karuta-card]').count(),0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 console.log('PASS adaptive browser: mastered/known excluded, weak prioritized, stopped response cannot prove mastery, empty pool has no forced refill');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
