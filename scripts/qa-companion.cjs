const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),errors=[];
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.join(root,'dist',url.pathname==='/'?'index.html':url.pathname);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`;
try{
 for(const width of [320,390,430,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('#start').waitFor();await page.locator('#companion-stage .km').waitFor();
  assert(await page.locator('[data-forest-start="read"]').first().boundingBox().then(b=>b.y+b.height<900));
  await page.locator('#companion-touch').click();assert.match(await page.locator('#companion-message').innerText(),/Hello/);
  await page.locator('#home-visit').click();await page.locator('#home-visit').waitFor({state:'detached'});
  await page.locator('a[href="#companion"]').first().click();await page.locator('#claim-visit').waitFor();assert(await page.locator('#claim-visit').isDisabled());assert.equal(await page.locator('.visit-stamp.received').count(),1);
  await page.evaluate(async()=>{const m=await import('./src/storage.js'),s=await m.read();s.stars=30;await m.write(s);});await page.reload();await page.locator('[data-preview="outfit:wizard"]').click();
  assert.equal(await page.evaluate(async()=>(await (await import('./src/storage.js')).read()).stars),30);
  await page.locator('[data-dress="outfit:wizard"]').click();await page.getByText('きみにぴったりの姿に。').waitFor();await page.waitForFunction(async()=>{const s=await(await import('./src/storage.js')).read();return s.companion?.outfit==='wizard';});
  assert.equal(await page.evaluate(async()=>(await(await import('./src/storage.js')).read()).stars),12);
  await page.locator('[data-dress="color:mint"]').click();await page.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).companion?.color==='mint');
  assert.equal(await page.evaluate(async()=>(await(await import('./src/storage.js')).read()).stars),6);
  await page.reload();await page.locator('#companion-stage .km').waitFor();assert(await page.locator('[data-dress="outfit:wizard"]').isDisabled());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  fs.mkdirSync(path.join(root,'reports'),{recursive:true});await page.screenshot({path:path.join(root,`reports/companion-${width}.png`),fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);const transform=await page.locator('#companion-stage .km > g').getAttribute('transform');await page.waitForTimeout(180);assert.equal(await page.locator('#companion-stage .km > g').getAttribute('transform'),transform);
  await page.goto(base+'#home');await page.locator('#start').waitFor();await page.locator('#start').click();await page.locator('#fast-flip').waitFor();
  await page.goto(base+'#settings');await page.locator('#motion').uncheck();await page.goto(base+'#companion');await page.locator('#companion-stage .km').waitFor();
  console.log('PASS',width,'home, visit, preview, exchange, persistence, reduced motion, card start, no overflow');await page.close();
 }
 // Two tabs claim under the app's shared Web Lock; only one claim may earn stars.
 const context=await browser.newContext(),a=await context.newPage(),b=await context.newPage();
 for(const p of [a,b]){p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'#companion');await p.locator('#claim-visit').waitFor();}
 await Promise.all([a,b].map(p=>p.evaluate(()=>document.querySelector('#claim-visit').click())));await a.waitForTimeout(200);
 assert.equal(await a.evaluate(async()=>(await(await import('./src/storage.js')).read()).stars),3);
 assert(await a.locator('#claim-visit').isDisabled());assert(await b.locator('#claim-visit').isDisabled());
 await a.evaluate(async()=>{const m=await import('./src/storage.js'),s=await m.read(),{dayKey}=await import('./src/scheduler.js');s.rewards=[];s.stars=0;for(let i=1;i<=6;i++){const d=new Date();d.setDate(d.getDate()-i*2);s.rewards.push('visit:'+dayKey(d));}await m.write(s);});
 await a.reload();await a.locator('#claim-visit').click();await a.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).stars===10);assert.equal(await a.locator('.visit-stamp.received').count(),7);
 console.log('PASS concurrent visit claims only earn one reward; seventh stamp gives ten stars');await context.close();assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
