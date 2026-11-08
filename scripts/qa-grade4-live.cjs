const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='https://yggdrasilw-spec.github.io/english-stage/',expected=Number(process.argv[2]||10);
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'?release-check='+Date.now());await page.locator('[data-course="4"]').click();await page.locator('#g4-start').waitFor();
  assert.equal(await page.locator('[data-unit]').count(),expected);
  const data=await page.evaluate(async()=>{const c=await import('./src/grade4-content.js');const m=await(await fetch('data/grade4-audio.json')).json();return{units:c.units.map(u=>u.id),items:c.questions.length,audio:m.files.length};});
  assert.equal(data.items,expected*14);assert.equal(data.audio,expected*4);
  for(const unit of expected===5?['future']:expected===7?['infinitive','gerund']:['comparison','connectors','modals']){
   await page.locator(`[data-unit="${unit}"]`).click();await page.locator('[data-g4-question]').waitFor();
   for(let i=0;i<7;i++){
    const q=await page.evaluate(async()=>{const st=await import('./src/storage.js'),c=await import('./src/grade4-core.js');return c.currentQuestion(await st.read());});
    await page.waitForFunction(id=>document.querySelector('.g4-rule')||document.querySelector('[data-g4-question]')?.dataset.g4Question===id,q.id);
    if(await page.locator('#g4-rule-next').count())await page.locator('#g4-rule-next').click();
    await page.locator(`[data-g4-question="${q.id}"]`).waitFor();
    if(q.skill==='listening'){await page.locator('#g4-listen').click();await page.waitForFunction(()=>document.querySelector('#g4-audio-status')?.textContent.includes('聞き終えました'),null,{timeout:30000});}
    await page.locator(`[data-g4-choice="${q.answer}"]`).click();
    if(q.skill==='reading')await page.locator(`[data-g4-evidence="${q.evidence}"]`).click();
    try{await page.locator('#g4-next').click();}catch(e){console.error({unit,index:i,question:q.id,body:await page.locator('body').innerText()});throw e;}
    await page.waitForFunction(async index=>{const st=await import('./src/storage.js');return (await st.read()).grade4.session.index===index+1;},i);
   }
   await page.getByRole('heading',{name:'今日のステップが終わりました'}).waitFor();
   await page.goto(base+'#home');await page.locator('#g4-start').waitFor();
  }
  await page.locator('[data-course="5"]').click();await page.locator('#start').waitFor();assert.deepEqual(errors,[]);
  console.log('PASS LIVE Grade 4: '+JSON.stringify(data)+'; new unit answers, native normal MP3s, Grade 5 return');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
