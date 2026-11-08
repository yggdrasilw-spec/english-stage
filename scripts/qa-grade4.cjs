const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),report=path.join(root,'reports/grade4');fs.mkdirSync(report,{recursive:true});
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname,file=path.join(root,'dist',name.endsWith('/')?name+'index.html':name);res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html; charset=utf-8','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 let debugPage;
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();debugPage=page;page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);await page.locator('[data-course="4"]').click();await page.locator('#g4-start').waitFor();
  const saved=()=>page.evaluate(async()=>(await import('./src/storage.js')).read());
  const until=async(f,timeout=25000)=>{const end=Date.now()+timeout;while(!await f()){if(Date.now()>end)throw Error('Timed out waiting for saved course state');await new Promise(r=>setTimeout(r,50));}};
  for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(report,`home-${width}.png`),fullPage:true});}
  await page.locator('[data-unit="past-be"]').click();await page.locator('[data-g4-question]').waitFor();
  let r=(await saved()).grade4.session;const first=r.queue[0],order=r.orders[first];await page.reload();await page.locator('[data-g4-question]').waitFor();r=(await saved()).grade4.session;assert.equal(r.queue[0],first);assert.deepEqual(r.orders[first],order);
  const solve=async({screenshot=false,nativeAudio=false}={})=>{
   if(await page.locator('#g4-rule-next').count()){if((await saved()).grade4.session.unitId==='future'){for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.match(await page.locator('.g4-time').innerText(),/未来/);await page.screenshot({path:path.join(report,`future-rule-${width}.png`),fullPage:true});}}await page.locator('#g4-rule-next').click();await page.locator('[data-g4-question]').waitFor();}
   const q=await page.evaluate(async()=>{const s=await(await import('./src/storage.js')).read();return(await import('./src/grade4-core.js')).currentQuestion(s);});
   if(q.skill==='listening'){
    assert.equal(await page.locator('.g4-passage').count(),0);
    if(nativeAudio){await page.locator('#g4-listen').click();await until(async()=>!!(await saved()).grade4.session.heard[q.id]);}
    else{await page.evaluate(()=>{window.__RealAudio=window.Audio;window.Audio=class{constructor(src){this.src=src;}pause(){}async play(){setTimeout(()=>this.onended?.(),20);}};});await page.locator('#g4-listen').click();await until(async()=>!!(await saved()).grade4.session.heard[q.id]);await page.evaluate(()=>{window.Audio=window.__RealAudio;});}
   }
   if(screenshot){await page.setViewportSize({width:320,height:568});await page.screenshot({path:path.join(report,q.unit+'-'+q.skill+'-320.png'),fullPage:true});}
   await page.locator(`[data-g4-choice="${q.answer}"]`).click();
   if(q.skill==='reading')await page.locator(`[data-g4-evidence="${q.evidence}"]`).click();
   await page.locator('#g4-next').waitFor();
   const box=await page.locator('#g4-next').boundingBox();assert(box&&box.y>=0&&box.y+box.height<=await page.evaluate(()=>innerHeight));
   const before=(await saved()).forest.total;
   // Re-render/reload must not repeat the forest credit or the first answer.
   if(screenshot){await page.reload();await page.locator('#g4-next').waitFor();assert.equal((await saved()).forest.total,before);}
   const previous=(await saved()).grade4.session.index;await page.locator('#g4-next').click();await until(async()=>{const r=(await saved()).grade4.session;return r.index===previous+1;});await until(async()=>{const r=(await saved()).grade4.session;return r.index===r.queue.length||await page.locator('.g4-rule').count()||await page.locator(`[data-g4-question="${r.queue[r.index]}"]`).count();});return q;
  };
  for(let i=0;i<7;i++)await solve({screenshot:true,nativeAudio:i===5});
  await page.getByRole('heading',{name:'今日のステップが終わりました'}).waitFor();assert.equal((await saved()).grade4.attempts.length,7);assert.equal((await saved()).forest.total,7);
  await page.locator('#g4-again').click();await until(async()=>(await saved()).grade4.session.variant==='b'&&await page.locator('[data-g4-question="g4-past-be-b-vocab-1"]').count());assert.equal((await saved()).grade4.session.variant,'b');for(let i=0;i<7;i++)await solve();
  for(const unit of ['past-regular','past-irregular','past-questions','future','infinitive','gerund'])for(const variant of ['a','b']){
   await page.goto(base+'#home');await page.locator(`[data-unit="${unit}"]`).click();await until(async()=>{const r=(await saved()).grade4.session;return r.unitId===unit&&r.variant===variant&&r.index===0&&await page.locator(`[data-g4-question="${r.queue[0]}"]`).count();});assert.equal((await saved()).grade4.session.variant,variant);for(let i=0;i<7;i++)await solve({screenshot:['future','infinitive','gerund'].includes(unit),nativeAudio:['infinitive','gerund'].includes(unit)&&i===5});
  }
  let s=await saved();assert.equal(s.grade4.attempts.length,98);assert.equal(s.forest.total,98);assert.equal(s.grade4.attempts.filter(a=>a.guided).length,0);
  assert(await page.evaluate(async()=>{const m=await import('./src/storage.js'),s=await m.read(),cards=await(await fetch('data/grade5.json')).json();return !!m.validateBackup({app:'english-stage',version:1,state:s},new Set(cards.map(c=>c.id)));}));
  // The initial check stays at eight even after expanding the learning map.
  await page.goto(base+'#home');await page.locator('details summary').click();await page.locator('#g4-diagnostic').click();await page.locator('[data-g4-question]').waitFor();assert.equal((await saved()).grade4.session.queue.length,8);for(let i=0;i<8;i++)await solve();
  // The new lab topic keeps its fixed return link and works at all screen widths.
  await page.goto(base+'grammar/?course=4#lesson/future');await page.getByRole('heading',{name:'これからの予定と予想'}).waitFor();
  for(const width of [320,390,430,1280]){await page.setViewportSize({width,height:844});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(report,`future-lab-${width}.png`),fullPage:true});}
  await page.locator('a[href="../#grade4"]').click();await page.getByRole('heading',{name:'はじめの確認、おつかれさま！'}).waitFor();
  // Real lab navigation and return preserve the in-flight course and import its answer.
  await page.goto(base+'#home');await page.locator('[data-unit="past-be"]').click();await page.locator('[data-g4-question]').waitFor();const sid=(await saved()).grade4.session.id;await page.locator('[data-g4-choice]').first().click();await page.locator('#g4-next').click();await page.locator('.g4-rule').waitFor();
  await page.locator('.g4-lesson-link').click();await page.locator('a[href="../#grade4"]').waitFor();
  await page.evaluate(()=>localStorage.setItem('eiken-grammar-v1',JSON.stringify({version:1,attempts:[{id:'qa:past-be-1',sid:'qa',qid:'past-be-1',correct:true,chosen:'was',at:Date.now(),guided:false}],settings:{}})));
  await page.locator('a[href="../#grade4"]').click();await page.locator('.g4-rule').waitFor();s=await saved();assert.equal(s.grade4.session.id,sid);assert(s.grammarBridge.attempts.some(a=>a.id==='qa:past-be-1'));
  // Export/import through the actual settings UI keeps the course AND the lab.
  await page.goto(base+'#settings');const download=page.waitForEvent('download');await page.locator('#export').click();const d=await download,backup=path.join(report,'qa-backup.json');await d.saveAs(backup);await page.locator('#import').setInputFiles(backup);await page.locator('#restore').click();await page.waitForFunction(()=>document.querySelector('#notice').textContent.includes('復元しました'));assert.equal((await saved()).grade4.session.id,sid);
  const tab=await context.newPage();await tab.goto(base+'#grade4');await tab.locator('.g4-rule').waitFor();await tab.locator('#g4-rule-next').click();await page.goto(base+'#grade4');await page.locator('[data-g4-question]').waitFor();
  const q=await page.evaluate(async()=>{const s=await(await import('./src/storage.js')).read();return(await import('./src/grade4-core.js')).currentQuestion(s);}),before=(await saved()).forest.total;
  await Promise.all([page.evaluate(n=>{window.__g4Answer=document.querySelector(`[data-g4-choice="${n}"]`).onclick;},q.answer),tab.evaluate(n=>{window.__g4Answer=document.querySelector(`[data-g4-choice="${n}"]`).onclick;},q.answer)]);await Promise.all([page.evaluate(()=>window.__g4Answer()),tab.evaluate(()=>window.__g4Answer())]);await until(async()=>(await saved()).forest.total===before+1);assert.equal((await saved()).forest.total,before+1);await tab.close();
  await page.goto(base+'#home');await page.locator('[data-course="5"]').click();await page.locator('#start').waitFor();assert.equal((await saved()).course,5);
  assert.deepEqual(errors,[]);console.log('PASS Grade 4: all 98 items + 8-item check, new normal MP3 playback, future lab, 4 widths, resume, lab return, backup restore, 2-tab deduplication, Grade 5 return');
 }catch(e){console.error({errors,saved:await debugPage?.evaluate(async()=>(await(await import('./src/storage.js')).read()).grade4.session),body:await debugPage?.locator('body').innerText()});throw e;}finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
