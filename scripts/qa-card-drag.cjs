const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{try{const u=req.url.split('?')[0],f=path.join(root,'dist',u==='/'?'index.html':u);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`,errors=[];
try{for(const width of [320,390,1280]){for(const route of ['screen','fast']){
 const p=await browser.newPage({viewport:{width,height:1000}});p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'#'+route);
 if(route==='fast'){await p.locator('#fast-init').click();}const button=p.locator('.flash-card');await button.waitFor();
 const text=()=>button.locator('.flash-front').textContent(),first=await text();
 await button.scrollIntoViewIfNeeded();const b=await button.boundingBox(),x=b.x+b.width/2,y=b.y+b.height/2;
 const matrix=()=>button.evaluate(e=>{const m=new DOMMatrixReadOnly(getComputedStyle(e).transform);return {x:m.m41,y:m.m42,b:m.b,c:m.c};});
 async function hold(dx,dy=0){await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+dx,y+dy,{steps:5});}
 await hold(-30);let m=await matrix();assert(Math.abs(m.x+30)<1);assert.equal(m.y,0);assert.equal(m.b,0);assert.equal(m.c,0);assert.equal(await text(),first);
 await p.mouse.up();await p.waitForTimeout(180);assert(Math.abs((await matrix()).x)<1);assert.equal(await button.getAttribute('aria-pressed'),'false');
 await hold(30);assert(Math.abs((await matrix()).x-6.6)<1);await p.mouse.up();await p.waitForTimeout(180);assert.equal(await text(),first);
 await hold(2,65);assert(Math.abs((await matrix()).x)<1);await p.mouse.up();await p.waitForTimeout(180);assert.equal(await text(),first);
 const dx=Math.min(b.width*.3,180);await hold(-dx);assert(Math.abs((await matrix()).x+dx)<1);await p.mouse.up();await p.waitForTimeout(30);
 m=await matrix();assert.equal(m.b,0);assert.equal(m.c,0);assert.equal(m.y,0);assert.equal(await p.locator('.leaving-known').count(),0);
 await p.waitForTimeout(380);assert.notEqual(await text(),first);assert.equal(await button.getAttribute('aria-pressed'),'false');
 await hold(dx);await p.mouse.up();await p.waitForTimeout(420);assert.equal(await text(),first);
 await hold(-35);await button.evaluate(e=>e.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));await p.mouse.up();await p.waitForTimeout(180);assert(Math.abs((await matrix()).x)<1);assert.equal(await text(),first);
 await p.waitForTimeout(450);await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');
 const known=p.locator(route==='fast'?'#fast-known':'[data-scan="known"]');await known.click();await p.waitForTimeout(220);assert.equal(await p.locator('.leaving-known').count(),1);m=await matrix();assert(m.y<0);assert(Math.abs(m.x)<1);assert.equal(m.b,0);assert.equal(m.c,0);
 await p.waitForTimeout(300);assert.notEqual(await text(),first);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.emulateMedia({reducedMotion:'reduce'});await hold(-dx);await p.mouse.up();await p.waitForTimeout(150);assert(Math.abs((await matrix()).x)<1);
 console.log('PASS',width,route,'pointer tracking, snap back, edge resistance, vertical scroll, horizontal-only exit, reverse, cancellation, upward removal, reduced motion');await p.close();
 }}assert.deepEqual(errors,[]);}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
