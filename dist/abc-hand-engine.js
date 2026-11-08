/* ABC HAND input and raster-image loading, independent of robot animation. */
(()=>{
 function createSpellingInput(word){
  let accepted=0;const pending=[],reserved=new Set();
  return {
   get accepted(){return accepted;},get pending(){return pending.length;},
   accept(tile){
    if(!tile||tile.used||reserved.has(tile)||accepted>=word.length)return {kind:'ignored'};
    if(tile.ch!==word[accepted])return {kind:'wrong',index:accepted};
    const index=accepted++;reserved.add(tile);pending.push(tile);tile.reserved=true;
    return {kind:'correct',index};
   },
   take(){return pending.shift();}
  };
 }
 function createImageLoader({makeImage=()=>new Image(),timeout=12000,attempts=3,maxEntries=24,delay=ms=>new Promise(r=>setTimeout(r,ms)),setTimer=setTimeout,clearTimer=clearTimeout}={}){
  const cache=new Map();
  const trim=()=>{for(const [key,entry] of cache){if(cache.size<=maxEntries)break;if(entry.ready)cache.delete(key);}};
  const request=url=>new Promise((resolve,reject)=>{
   const img=makeImage();let settled=false,timer;
   const finish=(error)=>{if(settled)return;settled=true;clearTimer(timer);img.onload=img.onerror=null;error?reject(error):resolve(url);};
   img.onload=()=>img.naturalWidth>0?finish():finish(Error('empty image'));
   img.onerror=()=>finish(Error('image unavailable'));
   img.decoding='async';img.referrerPolicy='no-referrer';
   timer=setTimer(()=>{finish(Error('image timeout'));img.src='';},timeout);
   img.src=url;
  });
  function load(url,{force=false}={}){
   if(!url)return Promise.resolve(null);
   if(force)cache.delete(url);
   const hit=cache.get(url);if(hit){cache.delete(url);cache.set(url,hit);return hit.promise;}
   const entry={ready:false,promise:null};cache.set(url,entry);
   entry.promise=(async()=>{
    for(let attempt=0;attempt<attempts;attempt++){
     // A retry bypasses a cached failure, while the first request reuses the normal cache.
     const suffix=(attempt||force)?`${url.includes('?')?'&':'?'}abc_retry=${Date.now()}-${attempt}`:'';
     try{const src=await request(url+suffix);entry.ready=true;trim();return src;}
     catch(error){if(attempt===attempts-1)throw error;await delay(400*2**attempt);}
    }
   })().catch(error=>{if(cache.get(url)===entry)cache.delete(url);throw error;});
   return entry.promise;
  }
  return {load,preload(urls){for(const url of new Set(urls.filter(Boolean)))load(url).catch(()=>{});},forget(url){cache.delete(url);}};
 }
 globalThis.ABCHand={createSpellingInput,createImageLoader};
})();
