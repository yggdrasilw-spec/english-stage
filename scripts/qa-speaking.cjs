const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),errors=[];
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname,file=path.join(root,'dist',name==='/'?'index.html':name);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=process.argv[2]||`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__recs=[];window.__tones=0;
   const Native=window.AudioContext||window.webkitAudioContext;
   if(Native){const oscillator=Native.prototype.createOscillator;Native.prototype.createOscillator=function(){window.__tones++;return oscillator.call(this);};}
   class FakeRecognition{constructor(){window.__recs.push(this);}start(){this.onstart?.();}abort(){this.aborted=true;this.onend?.();}result(text){const result=[{transcript:text,confidence:.9}];result.isFinal=true;return this.onresult?.({resultIndex:0,results:[result]});}}
   window.SpeechRecognition=FakeRecognition;window.webkitSpeechRecognition=FakeRecognition;
  });
  const saved=()=>page.evaluate(async()=>(await(await import('./src/storage.js')).read()));
  const count=()=>page.evaluate(()=>__recs.length);
  const correct=async()=>{
   const answer=await page.locator('#speaking-answer .card-en').textContent();
   await page.evaluate(answer=>__recs.at(-1).result(answer),answer);
   await page.locator('#speaking-correct').waitFor();
   await page.waitForFunction(()=>!document.querySelector('#speaking-next').disabled);
  };
  await page.goto(base);await page.locator('.forest-home [data-forest-start="speak"]').click();
  await page.waitForFunction(()=>window.__recs.length===1);
  assert.equal(await page.locator('#speaking-answer').isVisible(),false);
  assert.deepEqual(await page.evaluate(()=>{const r=__recs.at(-1);return [r.lang,r.continuous,r.interimResults,r.maxAlternatives];}),['en-US',false,false,1]);
  assert.equal(await page.locator('#speaking-mic').isDisabled(),true);
  await page.evaluate(()=>__recs.at(-1).result('totally unrelated word'));
  assert.match(await page.locator('#speaking-status').innerText(),/一致しません/);assert.equal((await saved()).forest,undefined);
  const n=await count();await page.locator('#speaking-hint').click();assert.equal(await page.locator('#speaking-answer').isVisible(),true);assert.equal(await count(),n);
  await page.locator('#speaking-mic').click();await page.evaluate(()=>window.__late=__recs.at(-1).onresult);await correct();
  assert.match(await page.locator('#speaking-correct').innerText(),/○ 正解/);assert.equal((await saved()).forest.total,1);
  await page.waitForFunction(()=>__tones>=3);const tones=await page.evaluate(()=>__tones);assert.equal(tones,3);
  await page.evaluate(()=>{const result=[{transcript:'apple'}];result.isFinal=true;return __late({results:[result],resultIndex:0});});assert.equal((await saved()).forest.total,1);
  assert.match(await page.locator('#speaking-heard').innerText(),/聞こえた英語/);
  for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(root,`reports/speaking-correct-${width}.png`),fullPage:true});}
  const beforeNext=await count();await page.locator('#speaking-next').click();assert.equal(await count(),beforeNext+1);assert.equal(await page.locator('#speaking-stop').isVisible(),true);
  await page.evaluate(()=>window.__late=__recs.at(-1).onresult);await page.locator('#speaking-stop').click();
  await page.evaluate(()=>{const result=[{transcript:'apple'}];result.isFinal=true;return __late({results:[result],resultIndex:0});});assert.equal((await saved()).forest.total,1);
  assert.match(await page.locator('#speaking-status').innerText(),/止めました/);
  for(const error of ['not-allowed','no-speech','network']){await page.locator('#speaking-mic').click();await page.evaluate(error=>__recs.at(-1).onerror({error}),error);assert.equal(await page.locator('#speaking-mic').isEnabled(),true);}
  assert.equal((await saved()).forest.total,1);
  await page.locator('#speaking-mic').click();const beforeHide=await count();
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));});
  assert(await page.evaluate(()=>__recs.at(-1).aborted));
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(()=>!document.querySelector('#speaking-mic').disabled);assert.equal(await count(),beforeHide);
  await page.locator('#speaking-mic').click();await page.evaluate(()=>window.__late=__recs.at(-1).onresult);await page.locator('.speaking-wrap a[href="#home"]').click();
  await page.locator('.speaking-entry').waitFor();assert(await page.evaluate(()=>__recs.at(-1).aborted));
  await page.locator('.speaking-entry').click();assert.equal(await count(),beforeHide+1);assert.equal(await page.locator('#speaking-mic').isEnabled(),true);
  // Muting is persisted without starting recognition or playing the correct effect.
  await page.locator('#sound').click();await page.waitForFunction(()=>document.querySelector('#sound').textContent==='音声 OFF');
  await page.locator('#speaking-mic').click();const mutedTones=await page.evaluate(()=>__tones);await correct();assert.equal(await page.evaluate(()=>__tones),mutedTones);
  for(let i=0;i<3;i++){await page.locator('#speaking-next').click();assert(await page.locator('#speaking-mic').isDisabled());await correct();}
  const s=await saved();assert.equal(s.forest.total,5);assert.equal(s.forest.watered,0);assert.equal(s.history.length,0);assert.equal(s.stars,0);
  assert(await page.evaluate(async()=>{const m=await import('./src/storage.js'),s=await m.read(),cards=await(await fetch('data/grade5.json')).json();return !!m.validateBackup({app:'english-stage',version:1,state:s},new Set(cards.map(c=>c.id)));}));
  await page.locator('#speaking-next').click();await page.getByText('5問、おつかれさま！',{exact:true}).waitFor();
  await page.locator('#speaking-game a[href="#forest"]').click();await page.locator('#forest-water').click();
  await page.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).forest.watered===1);
  await page.reload();await page.locator('#forest-practice').waitFor();assert.equal((await saved()).forest.watered,1);
  await page.locator('.forest-water-actions [data-forest-start="speak"]').click();await page.locator('#speaking-stop').waitFor();assert.equal(await page.locator('#speaking-mic').isDisabled(),true);
  while(await page.locator('#speaking-next').count())await page.locator('#speaking-next').click();assert.equal((await saved()).forest.total,5);
  // The existing five-question practice also offers the voice round.
  await page.goto(base+'#home');await page.locator('.forest-home [data-forest-start="read"]').click();await page.locator('.mode-tabs [data-forest-start="speak"]').click();await page.locator('#speaking-stop').waitFor();
  const unsupported=await browser.newPage();await unsupported.addInitScript(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;});await unsupported.goto(base+'#speaking');await unsupported.getByText('この環境では音声入力を使えません',{exact:true}).waitFor();await unsupported.close();
  assert.deepEqual(errors,[]);console.log('PASS automatic en-US waiting on start/next, correct circle and actual Web Audio scheduling, mute, exactly-once water, hints/retries, no credit on mismatch/error/skip, stop/hidden/navigation safety, saved water/backup/watering, all forest entries, 320/390/430/1280px');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
