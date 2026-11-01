const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=path.join(root,'work/karuta-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.resolve(root,'dist','.'+u);if(!f.startsWith(path.join(root,'dist')+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
async function saved(p){return p.evaluate(async()=>{const s=await import('./src/storage.js');return s.read();});}
async function ready(p){await p.waitForFunction(()=>document.querySelector('[data-karuta-card]:not(:disabled)'));}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
 try{for(const width of [320,390,430,1280]){
 const p=await browser.newPage({viewport:{width,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(`http://127.0.0.1:${server.address().port}/`);await p.locator('#start').waitFor();
 await p.evaluate(async()=>{
  const storage=await import('./src/storage.js'),{createKaruta,takeKaruta}=await import('./src/karuta-session.js'),{recordKarutaResult}=await import('./src/karuta-learning.js');
  const cards=await fetch('data/grade5.json').then(r=>r.json()),s=storage.initial(),k=createKaruta(cards,'all',8),ev={correct:true,ms:3000,plays:1,slow:false,choices:8,comparable:true,eligible:false};
  s.karuta=k;
  for(let i=0;i<8;i++){
   const id=k.order[i],old={face:k.face,missed:[],errors:{}};
   if(i!==2&&i!==6)recordKarutaResult(s,old,id,{...ev,ms:i===3?1000:5000,plays:i===0?3:1});
   if(i===0){old.errors[id]=2;s.karutaLearning[id][k.face].lastTake.mistakes=2;}
   if(i===6){takeKaruta(k,id);continue;}
   recordKarutaResult(s,k,id,{...ev,choices:i===4?1:8,comparable:i!==5,slow:i===7});takeKaruta(k,id);
  }
  await storage.write(s);
 });
 await p.reload();await p.locator('#start').waitFor();await p.locator('a.karuta-entry').click();await p.locator('#karuta-growth-title').waitFor();
 assert((await p.locator('.karuta-growth-summary').innerText()).includes('2語で'));
 assert.equal(await p.locator('.karuta-growth-table').first().locator('tbody tr').count(),3);
 const text=await p.locator('.karuta-growth').innerText();assert(text.includes('2.0秒速く取れた！'));assert(text.includes('おてつきが2回へった！'));assert(text.includes('聞き直しが2回へった！'));assert(text.includes('はじめて取れた！'));
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.locator('.karuta-growth details summary').click();assert.equal(await p.locator('.karuta-growth details tbody tr:visible').count(),5);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:path.join(out,`growth-${width}.png`),fullPage:true});
 const before=await p.locator('.karuta-growth').innerText();await p.reload();await p.locator('#karuta-growth-title').waitFor();await p.locator('.karuta-growth details summary').click();assert.equal(await p.locator('.karuta-growth').innerText(),before);
 assert.deepEqual(errors,[]);console.log('PASS growth '+width+'px: specific progress, first success, matching conditions, compact table, reload');await p.close();
 }}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
