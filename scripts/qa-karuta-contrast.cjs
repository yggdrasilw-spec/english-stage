const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/karuta-contrast-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const u=decodeURIComponent(req.url.split('?')[0]),f=path.resolve(root,'dist','.'+(u==='/'?'/index.html':u));if(!f.startsWith(path.join(root,'dist')+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
const read=p=>p.evaluate(async()=>{const s=await import('./src/storage.js');return s.read();});
const ready=p=>p.waitForFunction(()=>document.querySelector('[data-karuta-card]:not(:disabled)'));
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`,errors=[];
try{for(const width of [320,390,430,1280]){
 const p=await browser.newPage({viewport:{width,height:width===320?568:844}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(...args){window.qaAudio=this;window.qaPlays=(window.qaPlays||0)+1;return play.apply(this,args);};});
 await p.goto(base);await p.locator('#start').waitFor();
 async function seed(target,chosen,face='meaning'){
  await p.evaluate(async({target,chosen,face})=>{const st=await import('./src/storage.js'),s=st.initial(),cards=await fetch('data/grade5.json').then(r=>r.json()),ids=[target,chosen,...['apple','banana','cat'].filter(en=>en!==target&&en!==chosen).slice(0,2)].map(en=>cards.find(c=>c.en.toLowerCase()===en).id);s.karuta={theme:'all',count:4,face,ids,order:[...ids],index:0,mistakes:0,missed:[],feedback:''};await st.write(s);},{target,chosen,face});
  await p.goto(base+'#karuta');await p.reload();await p.locator('#karuta-play').waitFor();await p.locator('#karuta-play').click();await ready(p);
 }
 async function mistake(){const s=await read(p);await p.locator(`[data-karuta-card="${s.karuta.order[1]}"]`).evaluate(b=>{b.click();b.click();});await p.locator('dialog[open]').waitFor();assert.equal((await read(p)).karuta.mistakes,1);assert.equal((await read(p)).karuta.index,0);assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);}
 await seed('snow','snowy');await mistake();
 assert((await p.locator('dialog').innerText()).includes('snow は雪そのもの'));assert.equal(await p.locator('dialog .karuta-contrast-word').count(),2);
 assert(await p.locator('dialog').evaluate(d=>d.scrollWidth<=d.clientWidth));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const bounds=await p.locator('#karuta-contrast-back').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=p.viewportSize().height);
 await p.screenshot({path:path.join(out,`snow-${width}.png`)});
 for(const role of ['chosen','target']){await p.locator(`[data-contrast-audio="${role}"]`).click();await p.waitForFunction(()=>window.qaAudio&&!window.qaAudio.paused);const s=await read(p);assert(await p.evaluate(id=>qaAudio.src.includes(id+'-word-normal-'),s.karuta.order[role==='target'?0:1]));}
 await p.locator('#karuta-contrast-stop').click();assert(await p.evaluate(()=>qaAudio.paused));
 await p.locator('#karuta-contrast-back').click();await ready(p);await p.waitForFunction(()=>window.qaAudio&&!window.qaAudio.paused);
 await p.locator('#karuta-compare').click();await p.locator('dialog[open]').waitFor();await p.keyboard.press('Escape');await p.locator('dialog[open]').waitFor({state:'hidden'});await p.waitForFunction(()=>document.querySelector('#karuta-play')===document.activeElement);assert.equal(await p.locator('[data-karuta-card]:not(:disabled)').count(),0);
 await p.locator('#karuta-play').click();await ready(p);const s=await read(p);await p.locator(`[data-karuta-card="${s.karuta.order[0]}"]`).click();await p.locator('.taken').waitFor();assert.equal(await p.locator('dialog').count(),0);assert.equal((await read(p)).karuta.index,1);
 await seed('snowy','snow','english');await mistake();assert.equal(await p.locator('.karuta-contrast-word h3 [lang=en]').first().innerText(),'snowy');await p.reload();await p.locator('#karuta-play').waitFor();assert.equal(await p.locator('dialog').count(),0);assert.equal((await read(p)).karuta.mistakes,1);
 await seed('bicycle','bike');await mistake();assert((await p.locator('dialog').innerText()).includes('どちらも「自転車」'));await p.locator('#karuta-contrast-back').click();await ready(p);
 await p.locator('#sound').click();await p.locator('#karuta-compare').click();const plays=await p.evaluate(()=>window.qaPlays);await p.locator('[data-contrast-audio="chosen"]').click();assert.equal(await p.evaluate(()=>window.qaPlays),plays);await p.locator('#karuta-contrast-back').click();await p.waitForFunction(()=>document.querySelector('#karuta-feedback')?.textContent.includes('音声 OFF'));
 await seed('snow','apple');const ordinary=await read(p);await p.locator(`[data-karuta-card="${ordinary.karuta.order[1]}"]`).click();await p.waitForFunction(()=>document.querySelector('.just-wrong'));assert.equal(await p.locator('dialog').count(),0);
 await p.close();console.log(`PASS ${width}px: snow/snowy both directions, comparison audio, retry, Escape, repeated tap, synonyms, mute, reload, unrelated errors`);
}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
