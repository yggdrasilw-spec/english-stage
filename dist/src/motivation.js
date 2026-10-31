import {dayKey,skills} from './scheduler.js';

export const XP_PER_TASK=10, XP_PER_LEVEL=100;
export function daysBefore(now,offset){const d=new Date(now);d.setDate(d.getDate()-offset);return dayKey(d);}
const practice=h=>skills.includes(h.skill)&&['correct','wrong','guess'].includes(h.quality);
const taskKey=h=>`${dayKey(h.at)}:${h.id}:${h.skill}`;
export function journey(state,now=Date.now()){
 const history=state.history.filter(practice),today=dayKey(now),daily=history.filter(h=>dayKey(h.at)===today);
 const days=new Set(history.map(h=>dayKey(h.at))),unique=new Set(history.map(taskKey));
 const xp=unique.size*XP_PER_TASK,level=Math.floor(xp/XP_PER_LEVEL)+1;
 let streak=0,offset=days.has(today)?0:1;
 while(days.has(daysBefore(now,offset++)))streak++;
 const tasks=new Set(daily.map(taskKey)).size,types=new Set(daily.map(h=>h.skill)).size;
 const quests=[{id:'start',icon:'☀',title:'まずは1問',detail:'答えを確かめるだけでも一歩',value:Math.min(tasks,1),goal:1,stars:2},
  {id:'five',icon:'✎',title:'5問にチャレンジ',detail:'違うことば・技能で5問練習',value:Math.min(tasks,5),goal:5,stars:3},
  {id:'skills',icon:'♫',title:'3つの力を使おう',detail:'読む・聞く・日本語から英語',value:types,goal:3,stars:5}];
 const learned=Object.values(state.progress).filter(p=>skills.some(k=>p[k]?.correct>0)).length;
 const badges=[{icon:'🌱',title:'はじめの一歩',detail:'はじめて問題に挑戦',unlocked:history.length>0},
  {icon:'🔥',title:'3日つづいた！',detail:'3日連続で学習',unlocked:[...days].some(d=>[1,2].every(n=>days.has(daysBefore(new Date(d+'T12:00:00'),n))))},
  {icon:'📚',title:'ことばコレクター',detail:'10項目で自力正解',unlocked:learned>=10},
  {icon:'🚀',title:'レベル5へ',detail:'400 XPを積み重ねる',unlocked:level>=5}];
 return {xp,level,inLevel:xp%XP_PER_LEVEL,next:XP_PER_LEVEL-xp%XP_PER_LEVEL,streak,days,tasks,quests,badges,
  visits:state.rewards.filter(r=>r.startsWith('visit:')).length,visited:state.rewards.includes('visit:'+today),
  week:Array.from({length:7},(_,i)=>{const key=daysBefore(now,6-i);return {key,done:days.has(key),today:key===today};})};
}
export function settleQuests(state,now=Date.now()){
 for(const q of journey(state,now).quests){const key=`quest:${dayKey(now)}:${q.id}`;
  if(q.value>=q.goal&&!state.rewards.includes(key)){state.rewards.push(key);state.stars+=q.stars;}
 }
}
export function claimVisit(state,now=Date.now()){
 const j=journey(state,now);if(j.visited)return 0;
 const stars=(j.visits+1)%7===0?10:3;
 state.rewards.push('visit:'+dayKey(now));state.stars+=stars;return stars;
}
