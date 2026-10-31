export function choices(card,cards,skill,attempts=0){
 const key=skill==='recall'?'en':'ja';
 const pool=cards.filter(c=>c.id!==card.id&&c.theme===card.theme&&c.kind===card.kind&&c[key]!==card[key]);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return [card,...pool.slice(0,attempts>=3?3:1)].sort(()=>Math.random()-.5).map(c=>({id:c.id,label:c[key]}));
}
export function enqueueRetry(s,task){
 const key=task.id+':'+task.skill;
 if((s.tries[key]||0)>=3||s.tasks.slice(s.index+1).some(t=>t.id===task.id&&t.skill===task.skill))return;
 let insert=s.tasks.length,otherQuestions=0;
 for(let i=s.index+1;i<s.tasks.length;i++)if(!s.tasks[i].intro&&s.tasks[i].id!==task.id&&++otherQuestions===2){insert=i+1;break;}
 s.tasks.splice(insert,0,{id:task.id,skill:task.skill});
}
