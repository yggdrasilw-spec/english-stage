const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root='C:/Users/user/english-stage',errors=[];
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;const file=path.join(root,'dist',name==='/'?'index.html':name);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__recs=[];
   class FakeRecognition{constructor(){window.__recs.push(this);}start(){this.onstart?.();}abort(){this.aborted=true;this.onend?.();}result(text){const result=[{transcript:text,confidence:0.9}];result.isFinal=true;this.onresult?.({resultIndex:0,results:[result]});}}
   window.SpeechRecognition=FakeRecognition;window.webkitSpeechRecognition=FakeRecognition;
  });
  await page.goto(base);await page.locator('.speaking-entry').click();await page.locator('#speaking-config').waitFor();
  await page.locator('#speaking-config button[type=submit]').click();
  assert.equal(await page.locator('#speaking-answer').isVisible(),false);
  await page.locator('#speaking-mic').click();
  assert.deepEqual(await page.evaluate(()=>{const r=__recs.at(-1);return [r.lang,r.continuous,r.interimResults,r.maxAlternatives];}),['en-US',false,false,1]);
  await page.evaluate(()=>__recs.at(-1).result('totally unrelated word'));
  assert.match(await page.locator('#speaking-status').innerText(),/一致しません/);assert.equal(await page.locator('#speaking-mic').isEnabled(),true);
  assert.equal(await page.locator('#speaking-answer').isVisible(),false);
  await page.locator('#speaking-hint').click();assert.equal(await page.locator('#speaking-answer').isVisible(),true);
  const answer=await page.locator('#speaking-answer .card-en').innerText();
  await page.locator('#speaking-mic').click();await page.evaluate(answer=>__recs.at(-1).result(answer),answer);
  assert.match(await page.locator('#speaking-status').innerText(),/一致したよ/);assert.equal(await page.locator('#speaking-mic').isDisabled(),true);
  await page.locator('#speaking-next').click();assert.equal(await page.locator('#speaking-answer').isVisible(),false);
  await page.locator('#speaking-mic').click();
  await page.evaluate(()=>{window.__late=__recs.at(-1).onresult;});
  await page.locator('#speaking-stop').click();await page.evaluate(()=>{const r=[{transcript:'apple'}];r.isFinal=true;__late({resultIndex:0,results:[r]});});
  assert.match(await page.locator('#speaking-status').innerText(),/止めました/);
  await page.locator('#speaking-mic').click();await page.evaluate(()=>__recs.at(-1).onerror({error:'not-allowed'}));
  assert.match(await page.locator('#speaking-status').innerText(),/許可/);assert.equal(await page.locator('#speaking-mic').isEnabled(),true);
  await page.locator('#speaking-mic').click();await page.evaluate(()=>__recs.at(-1).onend());assert.match(await page.locator('#speaking-status').innerText(),/聞き取れません/);
  await page.locator('#speaking-mic').click();await page.evaluate(()=>{window.__late=__recs.at(-1).onresult;location.hash='home';});await page.locator('.speaking-entry').waitFor();assert(await page.evaluate(()=>__recs.at(-1).aborted));
  await page.evaluate(()=>{const r=[{transcript:'apple'}];r.isFinal=true;__late({resultIndex:0,results:[r]});});
  await page.locator('.speaking-entry').click();await page.locator('#speaking-mic').waitFor();
  for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:900});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);await page.screenshot({path:path.join(root,`reports/speaking-${width}.png`),fullPage:true});}
  while(await page.locator('#speaking-next').count())await page.locator('#speaking-next').click();
  assert.match(await page.locator('#speaking-game').innerText(),/0 \/ 5問/);await page.locator('#speaking-retry').click();assert.match(await page.locator('#speaking-game').innerText(),/1 \/ 5問/);
  // Clean first-try success is counted only once, even if a service sends duplicate results.
  const en=await page.locator('#speaking-answer .card-en').textContent();
  await page.locator('#speaking-mic').click();await page.evaluate(en=>{const r=__recs.at(-1);const cb=r.onresult;r.result(en);const result=[{transcript:en}];result.isFinal=true;cb({resultIndex:0,results:[result]});},en);
  while(await page.locator('#speaking-next').count())await page.locator('#speaking-next').click();assert.match(await page.locator('#speaking-game').innerText(),/1 \/ 5問/);
  const unsupported=await browser.newPage();await unsupported.addInitScript(()=>{window.SpeechRecognition=undefined;window.webkitSpeechRecognition=undefined;});await unsupported.goto(base+'#speaking');await unsupported.getByText('この環境では音声入力を使えません',{exact:true}).waitFor();await unsupported.close();
  assert.deepEqual(errors,[]);console.log('PASS en-US configuration, concealed answer, mismatch/retry/hint, correct/duplicate scoring, stop/stale callbacks, errors, route cleanup/resume, results/retry, unsupported browser, 320/390/430/1280px');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
