const CACHE='english-prefix-lab-v3'+'@'+self.registration.scope;
const ASSETS=['./','./index.html','./style.css','./app.js','./core.mjs','./audio.mjs',...['prefixes','words','mvp','stages','pitfalls','editorial'].map(n=>`./data/${n}.json`),'./docs/REVIEW.md'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('english-prefix-lab-')&&k.endsWith('@'+self.registration.scope)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const url=new URL(e.request.url);if(e.request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(new URL('./',self.location).pathname))return;e.respondWith(caches.open(CACHE).then(async c=>(await c.match(e.request,{ignoreSearch:true}))||fetch(e.request)));});
