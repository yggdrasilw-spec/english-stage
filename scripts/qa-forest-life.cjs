const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'reports','life'),errors=[],evidence=[];
fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost'),file=path.join(root,'dist',url.pathname==='/'?'index.html':url.pathname);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`;
const read=p=>p.evaluate(async()=>await(await import('./src/storage.js')).read());
const ready=async p=>{await p.waitForFunction(()=>document.querySelector('.expanding-terrain')?.dataset.ready==='true');await p.waitForFunction(()=>[...document.querySelectorAll('#forest-landscape img')].every(i=>i.complete));assert.deepEqual(await p.locator('#forest-landscape img').evaluateAll(a=>a.filter(i=>!i.naturalWidth).map(i=>i.src)),[]);};
const coordinates=p=>p.locator('#forest-landscape [data-resident]').evaluateAll(a=>Object.fromEntries(a.map(i=>[i.dataset.resident,[i.style.left,i.style.top]])));
try{
 for(const [w,h,watered,key] of [[320,568,0,'acorn'],[390,844,6,'bench'],[430,932,8,'fish'],[768,1024,12,'mushroom-grove'],[1024,768,17,'campfire'],[1280,900,19,'rainbow']]){
  const p=await browser.newPage({viewport:{width:w,height:h}});p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('[data-forest-start="read"]').first().waitFor();
  await p.evaluate(async watered=>{const m=await import('./src/storage.js'),s=await m.read();s.stars=13;s.forest={version:1,total:105,watered,flowers:0,day:'',today:0,skills:[],decor:{}};await m.write(s);},watered);
  await p.goto(base+'#forest');await p.reload();await ready(p);const before=await coordinates(p),button=await p.locator('#forest-water').boundingBox();assert(button.y+button.height<h-(w<700?70:0),'water visible '+w);
  await p.locator('#forest-water').click();await p.waitForFunction(async n=>(await(await import('./src/storage.js')).read()).forest.watered===n,watered+1);await p.waitForFunction(()=>!document.querySelector('.is-watering'));await ready(p);
  assert.equal(await p.locator(`[data-resident="${key}"]`).count(),1);const after=await coordinates(p);for(const [id,value] of Object.entries(before))assert.deepEqual(after[id],value,id);
  assert(Object.keys(after).length>Object.keys(before).length);assert.equal((await read(p)).stars,13);assert.equal((await read(p)).history.length,0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  if(w===320){const next=await p.locator('#forest-water').boundingBox();assert(next.y+next.height<h-70,'water remains visible after new arrivals');}
  await p.locator('[data-map-action="fit"]').click();await p.screenshot({path:path.join(out,`stage-${watered+1}-${w}.png`),fullPage:true});await p.locator('#forest-landscape').screenshot({path:path.join(out,`scene-${watered+1}-${w}.png`)});
  await p.reload();await ready(p);if(watered===19){await p.locator('#forest-prev').click();await ready(p);}assert.deepEqual(await coordinates(p),after);
  await p.emulateMedia({reducedMotion:'reduce'});assert(await p.locator('#forest-landscape .forest-life').evaluateAll(a=>a.every(i=>getComputedStyle(i).animationName==='none')));
  await p.locator('.forest-page details').first().locator('summary').click();assert(await p.getByRole('heading',{name:'いまの森の仲間'}).isVisible());assert(await p.locator('.forest-resident-list [role="listitem"]').count()>0);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  evidence.push({width:w,height:h,watering:watered+1,newResident:key,residentCount:Object.keys(after).length,stable:true});await p.close();console.log('PASS life',w,'stage',watered+1,key,'assets, growth, stable placement, reload, motion, illustrated list');
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'evidence.json'),JSON.stringify({evidence,errors},null,2));
}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
