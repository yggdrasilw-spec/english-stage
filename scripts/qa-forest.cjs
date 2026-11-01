const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),errors=[];
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.join(root,'dist',url.pathname==='/'?'index.html':url.pathname);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.txt':'text/plain'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`;
try{
 for(const width of [320,390,430,1280]){
  const page=await browser.newPage({viewport:{width,height:900}});page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('[data-forest-start="read"]').first().waitFor();
  assert(await page.locator('[data-forest-start="read"]').first().boundingBox().then(b=>b.y+b.height<900));
  await page.locator('[data-forest-start="read"]').first().click();await page.locator('[data-fast-answer]').first().waitFor();
  for(let i=0;i<5;i++){
   const correct=await page.evaluate(async()=>{const s=await(await import('./src/storage.js')).read();return s.fast.ids[s.fast.index];});
   await page.locator(`[data-fast-answer="${correct}"]`).click();await page.locator('#fast-next').click();await page.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).fast.index===n,i+1);
  }
  await page.locator('.forest-round-result').waitFor();assert.match(await page.locator('.forest-summary').innerText(),/5問/);
  const saved=await page.evaluate(async()=>await(await import('./src/storage.js')).read());assert.equal(saved.forest.total,5);assert(saved.stars>=3);
  await page.reload();await page.locator('.forest-round-result').waitFor();assert.equal(await page.evaluate(async()=>(await(await import('./src/storage.js')).read()).forest.total),5);
  await page.locator('[data-forest-start="listen"]').click();await page.locator('#fast-play').waitFor();await page.goto(base+'#forest');await page.locator('[data-slot="0"]').waitFor();
  await page.locator('[data-slot="0"]').click();await page.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).forest.decor['0:0']==='flower_small_01');
  await page.reload();await page.locator('.forest-decoration').waitFor();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const broken=await page.locator('.forest-scene img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
  fs.mkdirSync(path.join(root,'reports'),{recursive:true});await page.screenshot({path:path.join(root,`reports/forest-${width}.png`),fullPage:true});
  await page.goto(base+'#home');await page.locator('.forest-home').waitFor();await page.screenshot({path:path.join(root,`reports/forest-home-${width}.png`),fullPage:true});
  await page.close();console.log('PASS forest',width,'5 questions, repeated start, persistence, decoration, images, no overflow');
 }
 const page=await browser.newPage();await page.goto(base);await page.locator('#start').waitFor();
 await page.evaluate(async()=>{const m=await import('./src/storage.js'),s=await m.read(),{recordForest}=await import('./src/forest.js');for(let i=0;i<105;i++)recordForest(s,{skill:'listen',recovered:i===1});await m.write(s);});
 await page.goto(base+'#forest');await page.reload();await page.locator('#forest-prev').click();assert.match(await page.locator('.forest-area-nav').innerText(),/完成/);await page.locator('[data-slot="0"]').click();await page.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).forest.decor['0:0']==='flower_small_01');assert.match(await page.locator('.forest-area-nav').innerText(),/1番目/);
 await page.locator('#forest-next').click();assert.match(await page.locator('.forest-area-nav').innerText(),/2番目/);
 await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.forest-glints').evaluate(e=>getComputedStyle(e).animationName),'none');
 console.log('PASS completed forest preserved, next area, editable old area, reduced motion');
 await page.goto(base+'#home');await page.locator('[data-forest-start="read"]').first().click();await page.locator('[data-fast-answer]').first().waitFor();
 let before=await page.evaluate(async()=>(await(await import('./src/storage.js')).read()).forest.total);
 await page.locator('#fast-skip').click();await page.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).fast.index===1);
 assert.equal(await page.evaluate(async()=>(await(await import('./src/storage.js')).read()).forest.total),before);
 await page.locator('#fast-undo').click();await page.waitForFunction(async()=>(await(await import('./src/storage.js')).read()).fast.index===0);
 for(let round=0;round<2;round++){
  for(let i=0;i<5;i++){
   const id=await page.evaluate(async()=>{const s=await(await import('./src/storage.js')).read();return s.fast.ids[s.fast.index];});
   await page.locator(`[data-fast-answer="${id}"]`).click();await page.locator('#fast-next').waitFor();
   if(i===0&&round===0){await page.locator('#fast-undo').click();await page.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).forest.total===n,before);await page.locator(`[data-fast-answer="${id}"]`).click();await page.locator('#fast-next').waitFor();}
   await page.locator('#fast-next').click();await page.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).fast.index===n,i+1);
  }
  await page.locator('.forest-round-result').waitFor();assert.equal(await page.evaluate(async()=>(await(await import('./src/storage.js')).read()).forest.total),before+5*(round+1));
  if(round===0){await page.locator('[data-forest-start="read"]').click();await page.locator('[data-fast-answer]').first().waitFor();}
 }
 await page.locator('#round-karuta').click();await page.locator('[data-karuta-card]').first().waitFor();assert((await page.locator('[data-karuta-card]').count())<=5);
 console.log('PASS skip earns nothing, undo revokes growth, second round grows again, same-word karuta starts');

 assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
