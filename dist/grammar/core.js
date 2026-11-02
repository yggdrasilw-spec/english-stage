import {lessons,questionBank,clean} from './content.js';
export const shuffle=(items,random=Math.random)=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export const byId=id=>questionBank.find(q=>q.id===id);
export const lessonById=id=>lessons.find(l=>l.id===id);
export const normalize=s=>clean(String(s)).replace(/[.!?]$/,'').replace(/[’]/g,"'").replace(/\s+/g,' ').trim();
export const grade=(question,answer)=>normalize(answer)===normalize(question.answer);
export function validAttempt(a){return a&&typeof a.id==='string'&&!!byId(a.qid)&&typeof a.correct==='boolean'&&typeof a.sid==='string'&&Number.isFinite(a.at)&&a.at>0;}
export function mergeAttempts(...groups){return [...new Map(groups.flat().filter(validAttempt).map(a=>[a.id,a])).values()].sort((a,b)=>a.at-b.at).slice(-5000);}
export function statusFor(lessonId,attempts,now=Date.now()){
 const a=attempts.filter(a=>byId(a.qid)?.lessonId===lessonId&&!a.guided);
 if(!a.length)return {key:'new',label:'未確認',count:0,accuracy:null};
 const recent=a.slice(-6),accuracy=recent.filter(a=>a.correct).length/recent.length;
 if(a.length<3)return {key:'checking',label:'確認中',count:a.length,accuracy};
 const sessions=new Set(recent.map(a=>a.sid)),distinct=new Set(recent.map(a=>a.qid));
 const latest=a.at(-1),firstCorrect=a.find(a=>a.correct);
 const delayed=firstCorrect&&latest.at-firstCorrect.at>=12*60*60*1000;
 if(recent.length>=5&&accuracy>=.8&&sessions.size>=2&&distinct.size>=4&&delayed&&latest.correct)return {key:'mastered',label:'身についた',count:a.length,accuracy};
 if(accuracy<.7||!latest.correct)return {key:'weak',label:'ここを復習',count:a.length,accuracy};
 return {key:'review',label:'別の日に確認',count:a.length,accuracy,due:now-latest.at>=12*60*60*1000};
}
export function practiceQueue(lessonId,attempts,count=4,avoid=[]){
 const pool=lessonById(lessonId).questions;
 const last=new Map();attempts.forEach(a=>last.set(a.qid,a.at));
 return shuffle(pool).sort((a,b)=>Number(avoid.includes(a.id))-Number(avoid.includes(b.id))||(last.get(a.id)||0)-(last.get(b.id)||0)).slice(0,count).map(q=>q.id);
}
export function diagnosticQueue(attempts,full=false){
 const pool=lessons.filter(l=>!l.extension);
 const rank=l=>{const s=statusFor(l.id,attempts);return s.key==='new'?0:s.key==='weak'?1:s.due?2:3;};
 return shuffle(pool).sort((a,b)=>rank(a)-rank(b)).slice(0,full?pool.length:8).map(l=>practiceQueue(l.id,attempts,1)[0]);
}
export function makeSession(queue,mode,title,source=null){
 const sid=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`;
 const options={};for(const id of queue){const q=byId(id);options[id]=q.mode==='order'?shuffle(q.tokens.map((_,i)=>i)):shuffle(q.choices);}
 return {sid,queue,mode,title,source,options,index:0,answers:[],draft:[],created:Date.now()};
}
export function validSession(s){
 return s&&typeof s.sid==='string'&&typeof s.title==='string'&&['practice','diagnostic','retry'].includes(s.mode)&&Array.isArray(s.queue)&&s.queue.length>0&&s.queue.every(id=>!!byId(id))&&Number.isInteger(s.index)&&s.index>=0&&s.index<s.queue.length&&Array.isArray(s.answers)&&s.answers.every(a=>s.queue.includes(a.qid)&&typeof a.correct==='boolean'&&typeof a.chosen==='string')&&s.options&&s.queue.every(id=>{const q=byId(id),options=s.options[id];return Array.isArray(options)&&(q.mode==='order'?options.length===q.tokens.length&&new Set(options).size===q.tokens.length&&options.every(n=>Number.isInteger(n)&&n>=0&&n<q.tokens.length):options.length===q.choices.length&&new Set(options).size===q.choices.length&&options.every(c=>q.choices.includes(c)));});
}
