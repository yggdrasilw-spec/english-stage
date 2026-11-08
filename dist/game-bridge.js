// The queue is installed synchronously, before any game can produce an answer.
(()=>{
 let queue=Promise.resolve();const module=import('./src/game-evidence.js');let pending=[];
 let learning;window.wordLearningReady=module.then(async m=>{await m.loadGameLearning();learning=m;}).catch(()=>{});
 window.sharedWordPriority=(en,ja,skill)=>learning?.sharedPriority(en,ja,skill)??1;
 window.recordWordEvidence=event=>{
  const record={...event,eventId:event.eventId||crypto.randomUUID()},key='english-stage-evidence:'+record.eventId;
  try{localStorage.setItem(key,JSON.stringify(record));}catch{}
  queue=queue.then(async()=>{try{await (await module).saveGameEvidence(record);try{localStorage.removeItem(key);}catch{}}catch{pending.push(record);showFailure();}});return queue;
 };
 function showFailure(){let el=document.getElementById('word-save-status');if(!el){el=document.createElement('button');el.id='word-save-status';el.style.cssText='position:fixed;bottom:8px;left:8px;z-index:99999;max-width:90vw;padding:12px;background:#fff3d6;color:#253b35;border:2px solid;border-radius:12px';document.body.append(el);}el.textContent='ことば帳に保存できませんでした。タップして再試行';el.onclick=()=>{const events=pending;pending=[];for(const event of events)window.recordWordEvidence(event);queue.then(()=>{if(!pending.length)el.remove();});};}
 window.flushWordEvidence=()=>queue;
 try{for(const key of Object.keys(localStorage).filter(k=>k.startsWith('english-stage-evidence:'))){const event=JSON.parse(localStorage.getItem(key));if(event?.eventId)window.recordWordEvidence(event);}}catch{}
})();
