import {updateProgress,DAY,dayKey,skills} from './scheduler.js';
import {verifyScreening} from './learning.js';
export const evidenceSkills=['read','listen','recall','spell','speak','accent','intonation','grammar'];
export const evidenceLabels={read:'読む',listen:'聞く',recall:'英語にする',spell:'つづる',speak:'話す',accent:'アクセント',intonation:'イントネーション',grammar:'文のしくみ'};
// Only a response without an answer/hint counts as independent recall.
export function recordEvidence(s,{id,skill,quality,source='practice',assisted=false,eventId},at=Date.now()){
 if(!id||!evidenceSkills.includes(skill)||!['correct','wrong','guess','self'].includes(quality))throw Error('学習記録の形式が違います');
 s.history||=[];s.progress||={};s.seen||={};
 if(eventId&&s.history.some(h=>h.eventId===eventId))return false;
 if(assisted&&quality==='correct')quality='guess';
 verifyScreening(s,id,quality,at);s.seen[id]||=at;s.progress[id]||={};
 s.progress[id][skill]=updateProgress(s.progress[id][skill],quality,at);
 s.history.push({id,skill,quality,source,assisted,at,...(eventId?{eventId}:{})});return true;
}
export function wordStatus(s,id,now=Date.now()){
 const ps=s.progress?.[id]||{},records=Object.values(ps),done=skills.filter(k=>ps[k]?.retired&&ps[k].policy===2).length;
 if(done===3)return {key:'settled',label:'大きな木 · 長期定着',icon:'🌳',done};
 if(records.some(p=>['wrong','guess'].includes(p.lastQuality)))return {key:'growing',label:'もう一度で、もっと強く',icon:'🌱',done};
 if(records.some(p=>p.mastered))return {key:'bloom',label:'花が咲いた · 定着確認中',icon:'🌸',done};
 if(records.some(p=>p.correct))return {key:'leaf',label:'若葉 · 思い出せた',icon:'🍀',done};
 return {key:s.seen?.[id]?'growing':'seed',label:s.seen?.[id]?'芽が出た · 練習中':'たね · これから出会う',icon:s.seen?.[id]?'🌱':'🌰',done};
}
export function evidenceSummary(s,id){return evidenceSkills.filter(k=>s.progress?.[id]?.[k]).map(k=>({skill:k,label:evidenceLabels[k],...s.progress[id][k]}));}
export function goalPlan(cards,s,now=Date.now()){
 cards=cards.filter(c=>c.level!=='extension');
 const goal=s.goal,remaining=cards.filter(c=>wordStatus(s,c.id,now).key!=='settled');
 const target=goal?.date&&/^\d{4}-\d{2}-\d{2}$/.test(goal.date)?new Date(goal.date+'T23:59:59+09:00').getTime():now+60*DAY;
 const days=Math.max(1,Math.ceil((target-now)/DAY)),fresh=remaining.filter(c=>!s.seen?.[c.id]);
 const budget=Math.max(1,Math.min(50,goal?.dailyLimit||10)),needed=Math.ceil(fresh.length/Math.max(1,days-14));
 const newCount=Math.min(budget,needed),today=dayKey(now),introduced=cards.filter(c=>s.seen?.[c.id]&&dayKey(s.seen[c.id])===today).length;
 return {days,remaining:remaining.length,fresh:fresh.length,newCount,available:Math.max(0,newCount-introduced),needed,overloaded:needed>budget,reviewDays:14,target};
}
