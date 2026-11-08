export const KEY='english-prefix-lab-v1';
export const DAY=86400000;
export function fresh(){return {schemaVersion:1,sound:true,attempts:[]};}
export function normalize(raw){
 if(!raw||raw.schemaVersion!==1)return fresh();
 return {schemaVersion:1,sound:raw.sound!==false,attempts:Array.isArray(raw.attempts)?raw.attempts.filter(a=>a&&typeof a.id==='string'&&typeof a.item==='string'&&typeof a.correct==='boolean'&&Number.isFinite(a.at)&&typeof a.mode==='string'&&Number.isInteger(a.stage)&&a.stage>=1&&a.stage<=4&&typeof a.prefix==='string'):[]};
}
export function merge(a,b){return [...new Map([...a,...b].map(x=>[x.id,x])).values()].sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
export function itemStatus(attempts,item,now=Date.now()){
 const rows=attempts.filter(a=>a.item===item).sort((a,b)=>a.at-b.at);let streak=0;
 // Early practice never advances a spaced-repetition interval.
 let due=0;for(const a of rows){if(!a.correct){streak=0;due=a.at+10*60000;}else if(a.at>=due){streak++;due=a.at+[1,3,7][Math.min(streak-1,2)]*DAY;}}
 return {attempts:rows.length,wrong:rows.filter(a=>!a.correct).length,streak,due,isDue:rows.length>0&&due<=now,last:rows.at(-1)};
}
export function unlocked(stage,attempts,ids){if(stage===1)return true;if(stage===2)return ids.filter(p=>p.stage===1).every(p=>attempts.some(a=>a.prefix===p.id&&a.correct));if(stage===3)return ids.every(p=>attempts.some(a=>a.prefix===p.id&&a.correct));return attempts.filter(a=>a.stage===3&&a.correct).length>=4;}
export function shuffle(xs,rng=Math.random){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function activeWords(data){return data.words.filter(w=>data.mvp.prefix_ids.includes(w.prefix_id));}
export function eligibleWords(data){return activeWords(data).filter(w=>w.quiz_eligible&&data.editorial.words[w.word]?.use==='quiz');}
export function question(data,w,mode,rng=Math.random){
 if(!eligibleWords(data).some(x=>x.id===w.id))throw Error('許可リスト外の出題');
 const edit=data.editorial.words[w.word];if(edit.modes&&!edit.modes.includes(mode))throw Error('この語の問題形式は制限されています');
 const p=data.prefixes.find(p=>p.id===w.prefix_id),all=eligibleWords(data);let answer,prompt,pool;
 if(mode==='meaning'){answer=p.meaning_ja;prompt='この接頭辞は、どんな意味？';const related=['un_not','un_reverse','dis_negative','non_not'];pool=data.prefixes.filter(x=>data.mvp.prefix_ids.includes(x.id)&&!(related.includes(p.id)&&related.includes(x.id))).map(x=>x.meaning_ja);}
 else if(mode==='build'){answer=w.word;prompt=`「${w.meaning_ja}」になる単語を組み立てよう`;pool=all.map(x=>x.word);}
 else if(mode==='split'){answer=w.split;prompt='接頭辞と元の単語に分けると？';pool=all.map(x=>x.split);}
 else if(mode==='infer'){answer=w.meaning_ja;prompt='パーツを手がかりに、意味を考えよう';pool=all.map(x=>x.meaning_ja);}
 else throw Error('Unknown mode');
 const count=mode==='meaning'?2:3;
 return {item:w.id,prefix:p.id,word:w,mode,prompt,answer,choices:shuffle([answer,...shuffle([...new Set(pool)].filter(x=>x!==answer),rng).slice(0,count-1)],rng)};
}
export function trapQuestion(t){return {item:t.id,prefix:'',mode:'trap',prompt:t.claim,word:t.word,answer:t.answer,choices:['そう考えてよい','その考え方は使えない'],explanation:t.explanation};}
