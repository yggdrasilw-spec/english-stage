const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'work/image-link-qa');fs.mkdirSync(out,{recursive:true});
const cards=JSON.parse(fs.readFileSync(path.join(root,'dist/data/grade5.json')));
const server=http.createServer((req,res)=>{try{const name=decodeURIComponent(req.url.split('?')[0]);const f=path.join(root,'dist',name==='/'?'index.html':name);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));}catch{res.writeHead(404);res.end();}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{
 const p=await browser.newPage();await p.goto(`http://127.0.0.1:${server.address().port}/`);
 const images=[...new Set(cards.filter(c=>c.image).map(c=>c.image.url))];
 const failed=await p.evaluate(async urls=>{let at=0;const failed=[];await Promise.all(Array.from({length:12},async()=>{while(at<urls.length){const url=urls[at++];try{const img=new Image();img.referrerPolicy='no-referrer';img.src=url;await img.decode();if(img.naturalWidth<20)failed.push(url);}catch{failed.push(url);}}}));return failed;},images);assert.deepEqual(failed,[]);console.log('PASS decoded',images.length,'remote images');
 for(const width of [390,1366]){
  await p.setViewportSize({width,height:844});
  for(const en of ['sandwich','frog','bee','onion','inside','orange','dress','month']){
   const c=cards.find(c=>c.en===en);await p.goto(`http://127.0.0.1:${server.address().port}/#card/${c.id}`);await p.locator('.card-en').waitFor();
   assert.equal(await p.locator('.card-en').innerText(),en);
   if(c.image){await p.locator('img.picture').evaluate(img=>img.decode());assert.equal(await p.locator('img.picture').getAttribute('src'),c.image.url);}else assert.equal(await p.locator('img.picture').count(),0);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(en==='sandwich')await p.screenshot({path:path.join(out,`sandwich-${width}.png`),fullPage:true});
  }
 }
 console.log('PASS 8 card routes at mobile and desktop widths; missing images use existing fallback');
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
