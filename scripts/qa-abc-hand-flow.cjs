const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'../dist'),report=path.resolve(__dirname,'../reports/abc-hand-flow');fs.mkdirSync(report,{recursive:true});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const server=http.createServer((req,res)=>{try{const f=path.join(root,decodeURIComponent(new URL(req.url,'http://localhost').pathname));res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=process.argv[2]?.replace(/\/$/,'')||`http://127.0.0.1:${server.address().port}`,errors=[];
async function game(mode){
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});const requests=[];let catCalls=0;
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>Math.random=()=>.5);
 await page.route('https://shiritori-images.yggdrasil-learning.workers.dev/**',async route=>{
  const url=route.request().url();requests.push(url);const cat=url.includes('common-word-4285.png');
  if(cat){catCalls++;if(mode==='fail'||mode==='retry'&&catCalls===1){await route.abort('failed');return;}if(mode==='slow'||mode==='retry')await new Promise(r=>setTimeout(r,1800));if(mode==='stale')await new Promise(r=>setTimeout(r,6000));}
  try{await route.fulfill({status:200,contentType:'image/png',body:png});}catch{}
 });
 await page.goto(base+'/abc-hand.html');await page.locator('#hints').selectOption('mistake');await page.locator('#rounds').selectOption('5');await page.locator('button[type=submit]').click();await page.waitForFunction(()=>inputReady&&waiter!==null);
 return {page,requests,get catCalls(){return catCalls;},setMode(next){mode=next;}};
}
const tap=async(page,ch)=>{const box=await page.getByRole('button',{name:ch,exact:true}).first().boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);};
try{
 const g=await game('retry'),p=g.page;assert.equal(await p.evaluate(()=>imageState),'loading');assert.match(await p.locator('#ci').textContent(),/読み込み/);
 assert(g.requests.some(u=>u.includes('common-word-398.png')),'dog must be prefetched before word 2');
 const started=Date.now();await tap(p,'C');await p.waitForFunction(()=>transporting);await tap(p,'A');await tap(p,'T');
 assert.equal(await p.evaluate(()=>input.accepted),3);assert.equal(await p.evaluate(()=>currentStep),0);assert.equal(await p.evaluate(()=>errors),0);
 await p.screenshot({path:path.join(report,'rapid-390.png')});await p.waitForFunction(()=>wi===2&&inputReady);assert(Date.now()-started<6000,'queued word should finish promptly at real animation speed');
 assert.equal(await p.evaluate(()=>input.accepted),0);assert.equal(await p.evaluate(()=>score),await p.evaluate(()=>hunterBase(deckPoolSize)));
 // A pause preserves queued letters, and taps behind the settings dialog cannot add answers.
 await p.evaluate(()=>{for(const ch of W.w)tiles.find(t=>!t.reserved&&t.ch===ch).el.onclick();});await p.locator('#settings-open').click();
 await p.waitForFunction(()=>!transporting&&paused);const held=await p.evaluate(()=>input.accepted);await p.evaluate(()=>tiles.find(t=>!t.used).el.onclick());assert.equal(await p.evaluate(()=>input.accepted),held);
 await p.locator('#close-settings').click();await p.waitForFunction(()=>wi===3&&inputReady);
 const beforeDemo=await p.evaluate(()=>score);await p.evaluate(()=>{$('#am').click();$('#am').click();for(const ch of W.w)tiles.find(t=>!t.reserved&&t.ch===ch).el.onclick();});await p.waitForFunction(()=>wi===4&&inputReady);assert.equal(await p.evaluate(()=>score),beforeDemo);
 await p.close();
 // Slow success is not treated as a failure; loading text remains until it is really drawn.
 const slow=await game('slow');assert.equal(await slow.page.evaluate(()=>imageState),'loading');await slow.page.waitForFunction(()=>imageState==='ready');assert.equal(slow.requests.filter(u=>u.includes('common-word-4285.png')&&u.includes('abc_retry')).length,0);await slow.page.close();
 const failed=await game('fail');await failed.page.waitForFunction(()=>imageState==='error');assert.equal(failed.catCalls,3);assert(await failed.page.locator('#image-retry').isVisible());assert.match(await failed.page.locator('#ci').textContent(),/再読込/);
 failed.setMode('ready');await failed.page.locator('#image-retry').click();await failed.page.waitForFunction(()=>imageState==='ready');assert(await failed.page.locator('#image-retry').isHidden());await failed.page.close();
 const stale=await game('stale');await stale.page.evaluate(()=>{for(const ch of W.w)tiles.find(t=>!t.reserved&&t.ch===ch).el.onclick();});await stale.page.waitForFunction(()=>wi===2&&inputReady&&imageState==='ready');await stale.page.waitForTimeout(6500);assert.match(await stale.page.locator('#ci image').getAttribute('href'),/common-word-398\.png/);await stale.page.close();
 // APPLE has two physical P tiles; a wrong queued choice must point to the input position.
 const repeated=await game('ready');await repeated.page.goto(base+'/abc-hand.html');for(const box of await repeated.page.locator('#genres input').all())await box.uncheck();await repeated.page.locator('#genres input[value="1"]').check();await repeated.page.locator('button[type=submit]').click();await repeated.page.waitForFunction(()=>inputReady&&waiter!==null);
 assert.equal(await repeated.page.evaluate(()=>W.w),'APPLE');
 await repeated.page.evaluate(()=>{const select=ch=>tiles.find(t=>!t.reserved&&t.ch===ch).el.onclick();select('A');select('P');tiles.find(t=>t.reserved&&t.ch==='P').el.onclick();tiles.find(t=>!W.w.includes(t.ch)).el.onclick();window.__hintAt=S[2].g.querySelector('text').getAttribute('opacity');for(const ch of 'PLE')select(ch);});
 assert.equal(await repeated.page.evaluate(()=>input.accepted),5);assert.equal(await repeated.page.evaluate(()=>errors),1);assert.equal(await repeated.page.evaluate(()=>__hintAt),'.5');await repeated.page.waitForFunction(()=>wi===2&&inputReady);assert.equal(await repeated.page.evaluate(()=>score),await repeated.page.evaluate(()=>hunterBase(deckPoolSize)));await repeated.page.close();
 assert.deepEqual(errors,[]);console.log('PASS rapid real touch, faster queue drain, repeated letters, targeted errors, pause/resume, auto scoring, image prefetch, slow success, automatic/manual retry, stale image isolation');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
