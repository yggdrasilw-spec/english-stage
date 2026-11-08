const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..');
const files=JSON.parse(fs.readFileSync(path.join(root,'dist/data/grade4-audio.json'))).files.filter(f=>f.passageId.startsWith('g4-future-'));
assert.equal(files.length,4);
const server=http.createServer((req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname;if(name==='/'){res.setHeader('Content-Type','text/html');res.end('<!doctype html><title>Audio decoding check</title>');return;}res.setHeader('Content-Type','audio/mpeg');res.end(fs.readFileSync(path.join(root,'dist',name)));}catch{res.writeHead(404);res.end();}});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const page=await browser.newPage();await page.goto(`http://127.0.0.1:${server.address().port}/`);
  // Muted parallel playback verifies real decoding and ended events, not human listening.
  const results=await page.evaluate(files=>Promise.all(files.map(f=>new Promise((resolve,reject)=>{
   const a=new Audio(f.path),timer=setTimeout(()=>{a.pause();reject(Error('Audio timeout: '+f.path));},45000);a.muted=true;
   a.onended=()=>{clearTimeout(timer);resolve({passageId:f.passageId,speed:f.speed,duration:a.duration,ended:a.ended});};
   a.onerror=()=>{clearTimeout(timer);reject(Error('Audio decode error: '+f.path));};
   a.play().catch(e=>{clearTimeout(timer);reject(e);});
  }))),files);
  assert(results.every(r=>r.ended&&Number.isFinite(r.duration)&&r.duration>1));
  fs.writeFileSync(path.join(root,'reports/grade4/future-audio-playback.json'),JSON.stringify(results,null,2)+'\n');
  console.log('PASS: 4 future MP3s (normal/slow, A/B), native muted decoding and ended events',results);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
