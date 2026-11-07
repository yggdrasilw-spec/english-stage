const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../dist'),report=path.resolve(__dirname,'../reports/abc-hand');fs.mkdirSync(report,{recursive:true});
const server=http.createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));const base=process.argv[2]?.replace(/\/$/,'')||`http://127.0.0.1:${server.address().port}`;
await page.goto(base+'/abc-hand.html');await page.locator('#settings[open]').waitFor();
assert.equal(await page.locator('#genres input').count(),26);
for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(report,`settings-${width}.png`)});}
// Missing audio files or vocabulary drift must fail before shipping.
const data=await page.evaluate(()=>({d:D,audio:audioFiles,gi:GI,gn:GN}));assert.equal(data.d.length,904);assert.equal(data.audio.length,904);assert.equal(data.gi.length,904);
for(const file of data.audio)assert(fs.existsSync(path.join(root,'assets/audio',file+'.mp3')),file);
await page.locator('#distractors').selectOption('8');await page.locator('#hints').selectOption('none');await page.locator('#rounds').selectOption('5');
await page.locator('button[type=submit]').click();await page.waitForFunction(()=>waiter!==null);
assert.equal(await page.evaluate(()=>tiles.length),await page.evaluate(()=>W.w.length+8));
await page.locator('#sn').click();await page.locator('#card').click({force:true});await page.waitForFunction(()=>wordAudio.currentTime>0);assert(await page.evaluate(()=>wordAudio.src.endsWith('.mp3')));
const before=await page.evaluate(()=>({score,combo}));
await page.evaluate(()=>tiles.find(t=>t.ch!==W.w[currentStep]).el.onclick());await page.waitForFunction(()=>errors===1&&waiter!==null);assert.equal(await page.evaluate(()=>combo),0);assert.equal(await page.evaluate(()=>S[currentStep].g.querySelector('text').getAttribute('opacity')),'0');
// Real user-selectable tiles drive the original crane animation. Speed only animation clocks.
await page.evaluate(()=>{const realNow=performance.now.bind(performance),realRaf=requestAnimationFrame,realTimeout=setTimeout;performance.now=()=>realNow()*30;window.requestAnimationFrame=fn=>realRaf(t=>fn(t*30));window.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms/30,...args);});
for(let j=0;j<5;j++){while(await page.evaluate(()=>wi===window.__qaWi&&waiter===null).catch(()=>false))await page.waitForTimeout(20);
const current=await page.evaluate(()=>wi);await page.evaluate(()=>window.__qaWi=wi);
for(let i=0;i<await page.evaluate(()=>W.w.length);i++){await page.waitForFunction(()=>waiter!==null);await page.evaluate(()=>tiles.find(t=>!t.used&&t.ch===W.w[currentStep]).el.onclick());}
await page.waitForFunction(n=>wi>n||sessionDone,current);}
await page.waitForFunction(()=>sessionDone);const result=await page.evaluate(()=>({score,combo,best,base:hunterBase(deckPoolSize),demoUsed}));assert.equal(result.score,[1,2,3,4,5].reduce((n,c)=>n+result.base*c*(1+Math.floor(c/3))*2,0));
await page.locator('#settings-open').click();await page.locator('button[type=submit]').click();await page.waitForFunction(()=>waiter!==null);await page.locator('#am').click();await page.waitForFunction(()=>sessionDone);assert.equal(await page.evaluate(()=>score),0);
await page.locator('#settings-open').click();await page.locator('#all-genres').click();const all=await page.evaluate(()=>eligible());assert.equal(all.length,904);assert(Math.max(...all.map(w=>w.w.length))<=16);
// Check the longest spelling uses the second slot row and all three tile rows.
await page.evaluate(()=>{deck=[eligible().sort((a,b)=>b.w.length-a.w.length)[0]];deckPoolSize=904;wi=score=combo=0;sessionDone=false;auto=false;started=true;resume();main();});await page.waitForFunction(()=>waiter!==null);
for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(report,`game-${width}.png`)});}
assert.equal(await page.evaluate(()=>Math.max(...S.map(s=>s.y))<Math.min(...tiles.map(t=>t.home.y))-38),true);
await page.locator('#settings-open').click();assert(await page.locator('#hints').isDisabled());await page.locator('#close-settings').click();
await page.addInitScript(()=>Math.random=()=>.5);await page.goto(base+'/abc-hand.html');await page.locator('#hints').selectOption('mistake');await page.locator('button[type=submit]').click();await page.waitForFunction(()=>waiter!==null);assert.equal(await page.evaluate(()=>D[W.id][0]),'cat');
assert.equal(await page.evaluate(()=>S[0].g.querySelector('text').getAttribute('opacity')),'0');await page.evaluate(()=>tiles.find(t=>t.ch!==W.w[0]).el.onclick());await page.waitForFunction(()=>errors===1&&waiter!==null);assert.equal(await page.evaluate(()=>S[0].g.querySelector('text').getAttribute('opacity')),'.5');
const imageURL=await page.locator('#ci image').getAttribute('href');assert(imageURL&&!imageURL.endsWith('.svg'));assert(await page.evaluate(url=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src=url;}),imageURL));await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(report,'illustration-390.png')});
await page.goto(base+'/abc-hand.html');assert.equal(await page.locator('#hints').inputValue(),'mistake');await page.locator('#hints').selectOption('always');await page.locator('button[type=submit]').click();await page.waitForFunction(()=>waiter!==null);assert.equal(await page.evaluate(()=>S[0].g.querySelector('text').getAttribute('opacity')),'0.3');
await page.goto(base+'/hunter.html');await page.locator('#home.on').waitFor();await page.evaluate(()=>start());assert.equal(await page.evaluate(()=>D.length),904);assert.equal(await page.evaluate(()=>pts(3)),await page.evaluate(()=>BASE*6));
assert.deepEqual(errors,[]);console.log('PASS: 904 words/MP3, 26 genres, real playback, mistakes, 2x combo scoring, auto 0 points, long words, settings, 4 widths, hunter regression');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});

