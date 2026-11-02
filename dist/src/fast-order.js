import {shuffle} from './quiz.js';

// Call inside mutate, so displayed IDs and review skills are saved together.
export function shuffleFastTail(f,keepCurrent=false,random=Math.random){
 const start=f.index+(keepCurrent?1:0);
 const tail=shuffle(f.ids.slice(start).map((id,i)=>({id,task:f.tasks?.[start+i]})),random);
 f.ids.splice(start,tail.length,...tail.map(x=>x.id));
 if(f.tasks)f.tasks.splice(start,tail.length,...tail.map(x=>x.task));
 f.randomized=true;
}
