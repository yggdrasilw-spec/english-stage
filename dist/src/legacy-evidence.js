import {recordEvidence} from './evidence.js';
// Old games did not save dated objective answers. Preserve their achievement
// summaries, without inventing independent answers or long-term mastery.
export function importLegacyEvidence(s,hunterIds,at=Date.now()){
 if(s.evidenceMigration===1)return false;
 for(const [id,faces] of Object.entries(s.karutaLearning||{}))for(const r of Object.values(faces)){
  if(!r.lastAt||s.history.some(h=>h.id===id&&h.skill==='listen'&&h.at>=r.lastAt))continue;
  const independent=r.lastTake?.comparable&&r.lastTake?.mistakes===0&&r.streak>0;
  recordEvidence(s,{id,skill:'listen',quality:independent?'correct':'guess',source:'karuta-legacy',eventId:'karuta-legacy:'+id+':'+r.lastAt},r.lastAt);
 }
 try{const old=JSON.parse(localStorage.getItem('eiken5_animals_v1'));for(const [index,count] of Object.entries(old?.c||{})){const id=hunterIds[index];if(id&&Number.isInteger(count)&&count>0){s.legacyGames||={};s.legacyGames[id]={...(s.legacyGames[id]||{}),hunter:count};s.seen[id]||=at;}}}catch{}
 try{const old=JSON.parse(localStorage.getItem('english-stage.word-nova.v1'));for(const r of Object.values(old?.words||{})){if(!r.en||!r.seen)continue;s.legacyNova||=[];s.legacyNova.push({en:r.en,seen:r.seen,correct:r.ok||0});}}catch{}
 s.evidenceMigration=1;return true;
}
