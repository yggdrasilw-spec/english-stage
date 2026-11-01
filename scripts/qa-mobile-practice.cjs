const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/mobile-practice-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{
 let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';
 const file=path.resolve(root,'dist','.'+u);if(!file.startsWith(path.join(root,'dist')+path.sep))throw Error();
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
}catch{res.writeHead(404);res.end();}});
async function seed(p,base,route,mode='read',auto=false){
 await p.goto(base);await p.locator('#start').waitFor();
 await p.evaluate(async({route,mode,auto})=>{
  const st=await import('./src/storage.js'),s=st.initial();s.settings.sound=false;s.settings.motion=false;
  if(route==='fast')s.fast={ids:['g5-w-apple','g5-w-banana','g5-w-orange'],index:0,mode,filter:'all',theme:'all',checked:0,correct:0,known:0,feedback:null,auto};
  else s.session={id:crypto.randomUUID(),tasks:[{id:'g5-w-apple',skill:mode},{id:'g5-w-banana',skill:mode}],index:0,tries:{},feedback:null,started:Date.now(),startedXp:0,answered:0,newSeen:0,correct:0,recovered:0,mode:'quick'};
  await st.write(s);
 },{route,mode,auto});
 await p.goto(base+'#'+route);await p.reload();
 await p.locator(route==='fast'?'[data-fast-answer]':'[data-choice]').first().waitFor();
}
async function geometry(p,button){
 const bounds=await p.locator(button).boundingBox(),view=p.viewportSize();
 assert(bounds&&bounds.y>=0&&bounds.y+bounds.height<=view.height+.5,`${button} outside phone viewport: ${JSON.stringify(bounds)}`);
 assert(bounds.height>=44,'next action too short');
 assert(await p.locator(button).evaluate(el=>{const r=el.getBoundingClientRect();return el.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),'next action obscured');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');
 return bounds;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({channel:'msedge',headless:true}),errors=[];
 try{
  const viewports=process.argv.includes('--small-phone')?[[320,568]]:[[320,568],[390,664],[430,740],[1280,900]];
  for(const [width,height] of viewports){
   const p=await browser.newPage({viewport:{width,height},isMobile:width<701,hasTouch:width<701});p.on('pageerror',e=>errors.push(e.message));
   for(const route of ['fast','study'])for(const mode of ['read','recall','listen']){
    await seed(p,base,route,mode);
    const answer=route==='fast'?'data-fast-answer':'data-choice',next=route==='fast'?'#fast-next':'#next';
    if(width<701&&route==='fast'){
     await p.waitForFunction(()=>{const r=document.querySelector('#fast-content').getBoundingClientRect(),bar=document.querySelector('.fast-top').getBoundingClientRect();return r.top>=bar.bottom&&(r.top<bar.bottom+12||Math.abs(innerHeight+scrollY-document.documentElement.scrollHeight)<2);});
     const last=await p.locator('[data-fast-answer]').last().boundingBox();assert(last.y+last.height<=height,'all four choices must fit on a phone');
    }
    if(mode==='read')await p.screenshot({path:out+`/${route}-question-${width}.png`,fullPage:false});
    await p.locator(`[${answer}="g5-w-apple"]`).click();await p.locator(next).waitFor();
    const details=p.locator('.practice-details');
    if(width<701){
     const before=await geometry(p,next);assert.equal(await details.getAttribute('open'),null,'correct answer details should start collapsed');
     if(route==='fast')assert.equal(await p.locator('.fast-options').isVisible(),false);
     const feedback=await p.locator('[data-practice-focus]').boundingBox();assert(feedback.y>=0&&feedback.y+feedback.height<before.y,'answer hidden behind next action');
     if(mode==='read')await p.screenshot({path:out+`/${route}-correct-${width}.png`,fullPage:false});
     await details.locator('summary').click();await p.evaluate(()=>scrollTo(0,document.body.scrollHeight));
     const after=await geometry(p,next);assert.equal(Math.round(after.y),Math.round(before.y),'next action moved when reading details');
     await p.screenshot({path:out+`/${route}-${mode}-${width}.png`,fullPage:false});
    }else assert.notEqual(await details.getAttribute('open'),null,'desktop details should remain expanded');
    await p.locator(next).click();await p.locator(`[${answer}="g5-w-banana"]`).waitFor();
    if(width<701){
     await p.waitForFunction(route=>{const el=document.querySelector(route==='fast'?'#fast-content':'.quiz-practice'),r=el.getBoundingClientRect(),offset=route==='fast'?document.querySelector('.fast-top').getBoundingClientRect().bottom:0;return r.top>=offset&&(r.top<offset+12||Math.abs(innerHeight+scrollY-document.documentElement.scrollHeight)<2);},route);
     assert(await p.locator(route==='fast'?'#fast-content':'.quiz-practice').evaluate(e=>e.contains(document.activeElement)));
    }
    const wrong=await p.locator(`[${answer}]`).evaluateAll((bs,attr)=>bs.find(b=>b.getAttribute(attr)!=='g5-w-banana').getAttribute(attr),answer);
    await p.locator(`[${answer}="${wrong}"]`).click();await p.locator(next).waitFor();
    assert.notEqual(await p.locator('.practice-details').getAttribute('open'),null,'wrong answer explanation should open');
    if(width<701)await geometry(p,next);
    if(route==='study'){
     // The existing accidental-correct correction remains reachable on phones.
     await seed(p,base,route,mode);await p.locator('[data-choice="g5-w-apple"]').click();await p.locator('#guess').click();
     await p.waitForFunction(()=>!document.querySelector('#guess'));assert.notEqual(await p.locator('.practice-details').getAttribute('open'),null);
    }
   }
   // Fast auto progression remains optional and records only one answer.
   await seed(p,base,'fast','read',true);await p.locator('[data-fast-answer="g5-w-apple"]').evaluate(b=>{b.click();b.click();});
   await p.waitForFunction(()=>document.querySelector('[data-fast-answer="g5-w-banana"]')&&!document.querySelector('#fast-next'));
   const state=await p.evaluate(async()=>{const st=await import('./src/storage.js');return st.read();});assert.equal(state.fast.index,1);assert.equal(state.history.length,1);
   await p.goto(base+'#home');await p.locator('#start').waitFor();assert.equal(await p.locator('.practice-actions').count(),0);
   console.log('PASS',width+'x'+height,'read/recall/listen, correct/wrong/guess, pinned next, detail scroll, next-question reset, auto and desktop');await p.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS no browser errors');
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
