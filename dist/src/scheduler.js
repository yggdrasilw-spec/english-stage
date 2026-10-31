import {isKnown} from './learning.js';
export const DAY=86400000;
export const intervals=[1,3,7,14,30,60];
export const dayKey=t=>new Date(t).toLocaleDateString('sv-SE');
export function updateProgress(old={},quality,now=Date.now()){
 const p={stage:0,days:[],attempts:0,correct:0,mistakes:0,...old};
 const prior=p.lastAt||0, same=prior&&dayKey(prior)===dayKey(now);
 p.attempts++;p.lastAt=now;p.lastQuality=quality;
 if(quality==='correct'){
  p.correct++;const newDay=!p.days.includes(dayKey(now));
  if(newDay){p.days=[...p.days,dayKey(now)];p.stage=Math.min(intervals.length,p.stage+1);}
  p.lastGap=prior?(now-prior)/DAY:0;
  p.due=now+intervals[Math.max(0,p.stage-1)]*DAY;
  p.mastered=!!old.mastered||(p.days.length>=3&&p.lastGap>=7);
 }else{
  if(quality==='wrong')p.mistakes++;
  p.stage=0;p.mastered=false;p.due=now+DAY;
 }
 // A same-day retry never promotes an interval beyond its existing stage.
 if(same&&quality==='correct'&&old.stage===0){p.stage=0;p.due=now+DAY;}
 return p;
}
export const skills=['read','listen','recall'];
const nextDay=at=>{const d=new Date(at);d.setHours(24,0,0,0);return d.getTime();};
export function knownChecks(card,state,now=Date.now()){
 const at=state.screening.results[card.id].at,first=nextDay(at),records=state.progress[card.id]||{};
 if(now<first)return [];
 const latest=Math.max(0,...skills.map(k=>records[k]?.lastAt||0));
 // One objective skill per known word per day, rather than three at once.
 if(latest>=at&&dayKey(latest)===dayKey(now))return [];
 const candidates=skills.map(skill=>{const p=records[skill];return {id:card.id,skill,due:p?Math.max(first,p.due):Math.max(first,latest>=at?nextDay(latest):first),priority:p?.lastQuality==='wrong'||p?.lastQuality==='guess'?0:!p?1:2};}).filter(t=>t.due<=now);
 candidates.sort((a,b)=>a.priority-b.priority||a.due-b.due);
 return candidates.slice(0,1).map(({priority,...task})=>task);
}
export function dueTasks(cards,state,now=Date.now()){
 return cards.flatMap(c=>isKnown(state,c.id)?knownChecks(c,state,now):skills.flatMap(skill=>{
  const p=state.progress[c.id]?.[skill];return p&&p.due<=now?[{id:c.id,skill,due:p.due}]:[];
 })).sort((a,b)=>a.due-b.due);
}
export function plan(cards,state,mode='daily',now=Date.now()){
 if(mode==='quick')return plan(cards,state,'daily',now).slice(0,10);
 const tasks=dueTasks(cards,state,now).slice(0,12);
 cards=cards.filter(c=>!isKnown(state,c.id));
 if(mode==='mistakes')return cards.flatMap(c=>skills.flatMap(skill=>{
  const p=state.progress[c.id]?.[skill];return p&&(p.lastQuality!=='correct'||(p.mistakes&&p.due<=now))?[{id:c.id,skill}]:[];
 })).slice(0,20);
 const fresh=cards.filter(c=>!state.seen[c.id]).slice(0,tasks.length>=10?0:state.settings.newCount);
 for(const c of fresh)tasks.push({id:c.id,skill:'read',intro:true},{id:c.id,skill:'read'});
 // Seed missing skills for previously introduced cards.
 for(const c of cards.filter(c=>state.seen[c.id]))for(const skill of skills)if(!state.progress[c.id]?.[skill]&&tasks.length<20)tasks.push({id:c.id,skill});
 return tasks.slice(0,20);
}
