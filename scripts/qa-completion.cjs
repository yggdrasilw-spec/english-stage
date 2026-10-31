const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/completion-qa');fs.mkdirSync(out,{recursive:true});
const server=http.createServer((req,res)=>{try{let u=decodeURIComponent(req.url.split('?')[0]);if(u.endsWith('/'))u+='index.html';const f=path.resolve(root,'dist','.'+u);if(!f.startsWith(path.join(root,'dist')+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});const base=`http://127.0.0.1:${server.address().port}/`,errors=[];
try{for(const width of [320,390,1280]){
 const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base);await p.locator('#start').waitFor();await p.locator('#sound').click();
 assert((await p.locator('.learning-overview').innerText()).includes('0 / 830'));
 await p.goto(base+'#screen');await p.locator('#scan-reveal').waitFor();assert.equal(await p.locator('.card-ja').count(),0);
 await p.locator('[data-scan="known"]').click();await p.waitForFunction(()=>document.querySelector('.card-en')?.textContent==='banana');
 await p.reload();await p.locator('#scan-reveal').waitFor();assert.equal(await p.locator('.card-en').innerText(),'banana');
 await p.locator('#scan-undo').click();await p.waitForFunction(()=>document.querySelector('.card-en')?.textContent==='apple');
 await p.locator('[data-scan="known"]').click();await p.waitForFunction(()=>document.querySelector('.card-en')?.textContent==='banana');
 await p.locator('#scan-reveal').click();assert.equal(await p.locator('.card-ja').innerText(),'バナナ');
 await p.locator('[data-scan="unknown"]').click();await p.waitForFunction(()=>document.querySelector('.card-en')?.textContent==='orange');
 await p.goto(base+'#conversation');await p.locator('#talk-prompt').waitFor();assert((await p.locator('#talk-prompt').inputValue()).includes('banana（バナナ）'));
 await p.locator('#talk-turns').selectOption('3');assert((await p.locator('#talk-prompt').inputValue()).includes('3往復'));
 const downloadPromise=p.waitForEvent('download');await p.locator('#save-prompt').click();const dl=await downloadPromise;await dl.saveAs(out+'/prompt-'+width+'.txt');assert(fs.readFileSync(out+'/prompt-'+width+'.txt','utf8').includes('返事を待って'));
 await p.locator('#copy-prompt').click();await p.waitForFunction(()=>document.querySelector('#copy-status')?.textContent.length>0);
 await p.screenshot({path:out+'/conversation-'+width+'.png',fullPage:true});
 for(const route of ['home','roadmap','progress','screen','settings']){await p.goto(base+'#'+route);await p.waitForTimeout(120);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),route+' '+width);await p.screenshot({path:out+'/'+route+'-'+width+'.png',fullPage:true});}
 await p.goto(base+'#home');await p.locator('#start').click();await p.locator('#understood').waitFor();assert.equal(await p.locator('.card-en').innerText(),'banana');
 let answers=0;for(let i=0;i<30;i++){
  if(await p.locator('#finish').count())break;
  if(await p.locator('#understood').count())await p.locator('#understood').click();
  else if(await p.locator('#next').count())await p.locator('#next').click();
  else{await p.locator('#unknown').click();answers++;}
  await p.waitForTimeout(60);
 }
 assert.equal(answers,5);await p.locator('#finish').waitFor();await p.screenshot({path:out+'/done-'+width+'.png',fullPage:true});
 await p.locator('#finish').click();await p.locator('#start').waitFor();await p.waitForTimeout(100);await p.goto(base+'#card/g5-w-apple');await p.locator('#known-toggle').click();await p.waitForFunction(()=>document.querySelector('#known-toggle')?.textContent.includes('学習から外す'));
 console.log('PASS',width,'screening/undo/reload, prompt/export, five-question reward, restore known word, responsive routes');await p.close();
 }
 const p=await browser.newPage();await p.goto(base+'#screen');await p.locator('[data-scan="known"]').waitFor();for(let i=0;i<20;i++){await p.locator('[data-scan="known"]').click();await p.waitForTimeout(50);}await p.locator('#scan-more').waitFor();assert((await p.locator('h1').innerText()).includes('20'));await p.locator('#scan-more').click();await p.locator('[data-scan="known"]').waitFor();console.log('PASS 20-item checkpoint and next block');
 assert.deepEqual(errors,[]);console.log('PASS no browser exceptions');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
