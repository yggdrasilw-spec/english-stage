const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=root+'/work/effects-qa';fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{const f=path.join(root,'dist',req.url.split('?')[0]==='/'?'index.html':req.url.split('?')[0]);res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.json':'application/json','.html':'text/html'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true}),base=`http://127.0.0.1:${server.address().port}/`,errors=[];
try{for(const width of [320,390,1280]){
 const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>{errors.push(e.message);console.error('PAGE',e.message);});
 await p.addInitScript(()=>{window.tones=[];const create=AudioContext.prototype.createOscillator;AudioContext.prototype.createOscillator=function(){const node=create.call(this),start=node.start.bind(node);node.start=(at)=>{window.tones.push({hz:node.frequency.value,at});start(at);};return node;};});
 await p.goto(base,{waitUntil:'domcontentloaded'});await p.locator('#start').waitFor().catch(async e=>{console.error(await p.locator('body').innerText());throw e;});
 async function seed(sound=true,motion=true){await p.evaluate(async({sound,motion})=>{const st=await import('./src/storage.js'),s=st.initial();s.settings.sound=sound;s.settings.motion=motion;s.session={id:crypto.randomUUID(),tasks:[{id:'g5-w-apple',skill:'read'},{id:'g5-w-banana',skill:'read'}],index:0,tries:{},feedback:null,started:Date.now(),startedXp:0,answered:0,newSeen:0,correct:0,recovered:0,mode:'quick'};await st.write(s);}, {sound,motion});await p.goto(base+'#study');await p.reload();await p.locator('[data-choice="g5-w-apple"]').waitFor();}
 await seed();await p.locator('[data-choice="g5-w-apple"]').evaluate(b=>{b.click();b.click();});await p.locator('.just-correct').waitFor();
 await p.waitForFunction(()=>window.tones.length===3);assert.equal(await p.locator('.correct-ring').count(),1);
 const timing=await p.locator('.correct-ring').evaluate(e=>e.getAnimations()[0]?.effect.getTiming().duration);assert.equal(timing,220);
 assert(await p.locator('#next').isEnabled());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.screenshot({path:out+`/correct-${width}.png`,fullPage:true});
 await p.reload();await p.locator('#next').waitFor();assert.equal(await p.locator('.just-correct').count(),0);assert.equal(await p.evaluate(()=>tones.length),0);
 await p.locator('#guess').click();await p.waitForTimeout(100);assert.equal(await p.locator('.correct-mark').count(),0);
 await seed(false);await p.locator('[data-choice="g5-w-apple"]').click();await p.locator('.correct-mark').waitFor();assert.equal(await p.evaluate(()=>tones.length),0);
 await seed(true,false);await p.locator('[data-choice="g5-w-apple"]').click();await p.locator('.correct-mark').waitFor();assert.equal(await p.locator('.correct-ring').evaluate(e=>e.getAnimations().length),0);
 await seed();await p.locator('#unknown').click();await p.locator('#next').waitFor();assert.equal(await p.locator('.correct-mark').count(),0);assert.equal(await p.evaluate(()=>tones.length),0);
 await p.goto(base+'#screen');await p.locator('#scan-reveal').waitFor();await p.locator('#scan-reveal').click();await p.waitForFunction(()=>tones.length===1);
 await p.locator('#scan-next').click();await p.waitForFunction(()=>tones.length===2);await p.waitForTimeout(200);
 await p.locator('[data-scan="known"]').click();await p.waitForFunction(()=>tones.length===5);await p.waitForTimeout(450);
 await p.locator('#sound').click();await p.waitForFunction(()=>document.querySelector('#sound').getAttribute('aria-pressed')==='false');const before=await p.evaluate(()=>tones.length);
 await p.locator('#scan-reveal').click();await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>tones.length),before);
 console.log('PASS',width,'correct ring 220ms, chime once, no replay, wrong/guess, mute, reduced motion, flash sounds');await p.close();
 }
 const p=await browser.newPage();await p.addInitScript(()=>{window.AudioContext=undefined;window.webkitAudioContext=undefined;});await p.goto(base+'#screen');await p.locator('#scan-reveal').click();assert.equal(await p.locator('#scan-reveal').getAttribute('aria-pressed'),'true');await p.close();
 assert.deepEqual(errors,[]);
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
