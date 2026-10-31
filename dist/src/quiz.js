export function choices(card,cards,skill,attempts=0){
 const key=skill==='recall'?'en':'ja';
 const pool=cards.filter(c=>c.id!==card.id&&c.theme===card.theme&&c.kind===card.kind&&c[key]!==card[key]);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return [card,...pool.slice(0,attempts>=3?3:1)].sort(()=>Math.random()-.5).map(c=>({id:c.id,label:c[key]}));
}
