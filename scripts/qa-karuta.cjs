const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..')),out=path.join(root,'work/karuta-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.resolve(root,'dist','.'+u);if(!f.startsWith(path.join(root,'dist')+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
async function saved(p){return p.evaluate(async()=>{const s=await import('./src/storage.js');return s.read();});}
async function ready(p){await p.waitForFunction(()=>document.querySelector('[data-karuta-card]:not(:disabled)'));}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`,errors=[];
try{
for(const width of [320,360,390,430,1280]){
 const p=await browser.newPage({viewport:{width,height:844}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const original=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.qaAudio=this;return original.apply(this,args);};});
 await p.goto(base);await p.locator('#start').waitFor();await p.locator('a.karuta-entry').click();await p.locator('#karuta-config').waitFor();
 assert.equal(await p.locator('#karuta-count').inputValue(),'20');
 await p.locator('#karuta-theme').selectOption('食べ物');await p.locator('#karuta-config button[type=submit]').click();await ready(p);
 assert.equal(await p.locator('[data-karuta-card]').count(),20);assert.equal(await p.locator('.karuta-config').getAttribute('open'),null);
 await p.waitForFunction(()=>window.qaAudio?.currentTime>0);assert(await p.evaluate(()=>window.qaAudio.src.includes('-word-normal-')));
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const boxes=await p.locator('[data-karuta-card]').evaluateAll(bs=>bs.map(b=>{const r=b.getBoundingClientRect();return {width:r.width,height:r.height};}));assert(boxes.every(b=>b.width>=44&&Math.abs(b.height-b.width)<1));
 if(width<=430)assert(boxes.every(b=>b.width>=90));
 const pic=await p.locator('.karuta-card img').first().evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return {picture:a.width,card:b.width,height:a.height};});assert(pic.picture>=pic.card-5);assert(Math.abs(pic.picture-pic.height)<1);
 await p.locator('[data-karuta-card]').last().scrollIntoViewIfNeeded();
 assert(await p.locator('.karuta-config').evaluate(e=>e.getBoundingClientRect().bottom<0));
 assert(await p.locator('.karuta-toolbar').evaluate(e=>Math.abs(e.getBoundingClientRect().top)<2));
 await p.evaluate(()=>scrollTo(0,0));
 await p.screenshot({path:path.join(out,`board-${width}.png`),fullPage:true});
 const before=await saved(p),k=before.karuta,id=k.order[0],wrong=await p.evaluate(async({k,id})=>{const {karutaContrast}=await import('./src/karuta-contrast.js'),cards=await fetch('data/grade5.json').then(r=>r.json()),target=cards.find(c=>c.id===id);return k.order.slice(1).find(other=>!karutaContrast(target,cards.find(c=>c.id===other)));},{k,id});const position=()=>p.locator(`[data-karuta-card="${id}"]`).evaluate(el=>({x:el.offsetLeft,y:el.offsetTop,width:el.offsetWidth,height:el.offsetHeight}));const box=await position();
 await p.locator(`[data-karuta-card="${wrong}"]`).click();await p.waitForFunction(()=>document.querySelector('#karuta-feedback')?.textContent.includes('おてつき'));
 assert.equal((await saved(p)).karuta.index,0);assert.equal((await saved(p)).karuta.mistakes,1);
 assert.equal(await p.locator('.just-wrong').count(),1);assert.equal(await p.locator('#karuta-feedback .karuta-result-symbol').innerText(),'×');
 await p.screenshot({path:path.join(out,`wrong-${width}.png`)});
 await p.locator('#karuta-slow').click();await ready(p);assert(await p.evaluate(()=>window.qaAudio.src.includes('-word-slow-')));
 await p.locator(`[data-karuta-card="${id}"]`).click();await p.waitForFunction(()=>document.querySelector('.karuta-card.taken'));
 assert.equal(await p.locator('#karuta-feedback .karuta-result-symbol').innerText(),'○');assert.equal(await p.locator('.just-taken').count(),1);
 assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);
 await p.screenshot({path:path.join(out,`correct-${width}.png`)});await ready(p);
 const next=await saved(p);assert.equal(next.karuta.index,1);assert.equal(next.history.length,before.history.length);assert.deepEqual(next.progress,before.progress);const evidence=next.karutaLearning[id].meaning;assert.equal(evidence.takes,1);assert.equal(evidence.mistakes,1);assert.equal(evidence.plays,2);assert.equal(evidence.slow,true);assert(evidence.lastMs>0);assert.equal(evidence.masteredUntil,0);
 assert.deepEqual(await position(),box);
 await p.locator('#karuta-stop').click();assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);assert(await p.evaluate(()=>window.qaAudio.paused));
 await p.reload();await p.locator('#karuta-play').waitFor();assert.equal((await saved(p)).karuta.index,1);assert.deepEqual((await saved(p)).karutaLearning,next.karutaLearning);assert.equal(await p.locator('.karuta-card.taken').count(),1);assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);
 await p.locator('.karuta-config summary').click();await p.locator('#karuta-theme').selectOption('動物');await p.locator('#karuta-count').fill('4');await p.locator('#karuta-face').selectOption('english');await p.locator('#karuta-config button[type=submit]').click();await ready(p);
 assert.equal(await p.locator('[data-karuta-card]').count(),4);assert.equal(await p.locator('.karuta-card img').count(),0);
 for(let i=0;i<4;i++){await ready(p);const s=await saved(p);await p.locator(`[data-karuta-card="${s.karuta.order[s.karuta.index]}"]`).click();if(i<3)await p.waitForFunction(i=>document.querySelectorAll('.karuta-card.taken').length===i+1,i);}
 await p.locator('#karuta-again').waitFor();assert((await p.locator('#karuta-game').innerText()).includes('秒'));assert((await p.locator('#karuta-game').innerText()).includes('4枚、とれたよ！'));
 await p.locator('#karuta-again').click();await ready(p);assert.equal((await saved(p)).karuta.index,0);
 await p.locator('#sound').click();await p.locator('#karuta-play').click();assert((await p.locator('#karuta-feedback').innerText()).includes('音声 OFF'));assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);
 await p.locator('#sound').click();await p.locator('#karuta-play').click();await ready(p);
 const cancelState=await saved(p);await p.locator(`[data-karuta-card="${cancelState.karuta.order[cancelState.karuta.index]}"]`).click();await p.locator('.just-taken').waitFor();
 await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('.just-taken').evaluate(e=>e.getAnimations().length),0);await p.emulateMedia({reducedMotion:'no-preference'});
 await p.locator('#karuta-stop').click();await p.waitForTimeout(1100);assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);assert(await p.evaluate(()=>window.qaAudio.paused));
 await p.locator('.karuta-wrap a[href="#home"]').click();await p.locator('#start').waitFor();assert(await p.evaluate(()=>window.qaAudio.paused));
 await p.locator('a.karuta-entry').click();await p.locator('#karuta-play').waitFor();assert.equal((await saved(p)).karuta.index,1);
 await p.locator('.karuta-config summary').click();await p.locator('#karuta-count').fill('20');await p.locator('#karuta-config button[type=submit]').click();await ready(p);assert.equal(await p.locator('[data-karuta-card]').count(),10);
 await p.close();console.log('PASS karuta '+width+'px: real audio, board, wrong/correct, stop, resume, complete, sound, category cap');
}
assert.deepEqual(errors,[]);console.log('PASS no browser errors');
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
