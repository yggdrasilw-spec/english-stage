import {units,questions,questionById,courseVersion} from './grade4-content.js';
import {recordForest} from './forest.js';
const DAY=86400000;
export const tokyoDay=at=>new Date(at).toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});
export const initialGrade4=()=>({version:1,attempts:[],session:null});
export function grade4(state){return state.grade4 ||= initialGrade4();}
const shuffle=(a,random=Math.random)=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function unitStatus(state,unit,now=Date.now()){
 const all=(state.grade4?.attempts||[]).filter(a=>questionById(a.qid)?.unit===unit),independent=all.filter(a=>!a.guided),last=all.at(-1);
 if(!last)return {key:'new',label:'未確認',due:false};
 const skills=['vocab','grammar','reading','listening'];
 const stable=skills.every(skill=>{const recentAll=all.filter(a=>questionById(a.qid).skill===skill),a=independent.filter(a=>questionById(a.qid).skill===skill).slice(-6);return recentAll.at(-1)?.correct&&!recentAll.at(-1)?.guided&&a.length>=2&&new Set(a.map(x=>tokyoDay(x.at))).size>=2&&new Set(a.map(x=>questionById(x.qid).variant)).size>=2&&a.filter(x=>x.correct).length/a.length>=.8&&a.at(-1).correct;});
 const due=tokyoDay(now)!==tokyoDay(last.at)&&now>last.at&&(now-last.at>=7*DAY||!stable);
 return {key:stable?'stable':last.correct&&!last.guided?'review':'weak',label:stable?'安定してきた':last.correct&&!last.guided?'別の日に確認':'ここを復習',due,lastAt:last.at};
}
export function recommendedUnit(state,grammarStatus,now=Date.now()){
 const pool=[...units];
 const rank=u=>{const status=unitStatus(state,u.id,now);return status.due?0:status.key==='weak'?1:grammarStatus?.(u.lesson)?.key==='weak'?2:status.key==='new'?3:4;};
 return pool.sort((a,b)=>rank(a)-rank(b))[0];
}
export function createGrade4Session(state,unitId,mode='learn',now=Date.now(),random=Math.random){
 if(!units.some(u=>u.id===unitId)||!['learn','diagnostic'].includes(mode))throw Error('Unknown course unit');
 const g=grade4(state);if(g.session&&g.session.index<g.session.queue.length)return g.session;
 const attempts=g.attempts,latest=attempts.filter(a=>questionById(a.qid)?.unit===unitId).at(-1);
 const variant=latest?questionById(latest.qid).variant==='a'?'b':'a':'a';
 const queue=mode==='diagnostic'?[questions.find(q=>q.unit==='past-be'&&q.variant==='a'&&q.skill==='vocab').id,...units.map(u=>questions.find(q=>q.unit===u.id&&q.variant==='a'&&q.skill==='grammar').id),...questions.filter(q=>q.unit==='past-be'&&q.variant==='a'&&q.skill==='reading').map(q=>q.id),questions.find(q=>q.unit==='past-regular'&&q.variant==='a'&&q.skill==='listening').id]:questions.filter(q=>q.unit===unitId&&q.variant===variant).map(q=>q.id);
 const id=globalThis.crypto?.randomUUID?.()||`${now}-${Math.random()}`;
 return g.session={id,version:courseVersion,mode,unitId,variant,queue,index:0,ruleSeen:mode==='diagnostic',orders:Object.fromEntries(queue.map(id=>[id,shuffle(questionById(id).choices.map((_,i)=>i),random)])),draft:null,plays:{},heard:{},supported:[],startedAt:now};
}
export function currentQuestion(state){const run=state.grade4?.session;return run&&questionById(run.queue[run.index]);}
export function currentAttempt(state){const run=state.grade4?.session,q=currentQuestion(state);return run&&q&&state.grade4.attempts.find(a=>a.id===`${run.id}:${q.id}`);}
export function submitGrade4(state,{choice,evidence=null},now=Date.now()){
 const g=grade4(state),run=g.session,q=currentQuestion(state);if(!q||currentAttempt(state))return false;
 if(!Number.isInteger(choice)||choice<0||choice>=q.choices.length)throw Error('Invalid choice');
 if(q.skill==='reading'&&(!Number.isInteger(evidence)||evidence<0||evidence>2))throw Error('Choose evidence');
 if(q.skill==='listening'&&!run.heard[q.id]&&!run.supported.includes(q.id))throw Error('音声を最後まで聞いてから答えよう。');
 const correct=choice===q.answer,guided=run.supported.includes(q.id)||(run.plays[q.id]||0)>2||(q.skill==='reading'&&evidence!==q.evidence);
 g.attempts.push({id:`${run.id}:${q.id}`,sid:run.id,qid:q.id,choice,evidence,correct,guided,plays:run.plays[q.id]||0,at:now,version:courseVersion});
 // One submitted item contributes once; Grade 5 vocabulary mastery/XP stays evidence-specific.
 recordForest(state,{skill:q.skill==='listening'?'listen':'read'},now);
 run.draft=null;return true;
}
export function nextGrade4(state){const run=state.grade4?.session;if(!currentAttempt(state))return false;run.index++;run.draft=null;return true;}
export function courseStats(state){return Object.fromEntries(['vocab','grammar','reading','listening'].map(skill=>{const all=(state.grade4?.attempts||[]).filter(a=>questionById(a.qid).skill===skill),a=all.filter(a=>!a.guided);return [skill,{answered:all.length,independent:a.length,correct:a.filter(a=>a.correct).length}];}));}
export function validGrade4(value){
 if(!value||value.version!==1||!Array.isArray(value.attempts)||value.attempts.length>20000)return false;
 const validA=a=>{const q=questionById(a?.qid);return !!q&&a.version===courseVersion&&typeof a.sid==='string'&&a.sid.length<=100&&a.id===`${a.sid}:${a.qid}`&&Number.isInteger(a.choice)&&a.choice>=0&&a.choice<q.choices.length&&a.correct===(a.choice===q.answer)&&typeof a.guided==='boolean'&&Number.isSafeInteger(a.plays)&&a.plays>=0&&a.plays<=1000&&Number.isFinite(a.at)&&a.at>0&&(a.plays<=2||a.guided)&&(q.skill!=='listening'||a.plays>0||a.guided)&&(q.skill!=='reading'||a.evidence===q.evidence||a.guided)&&(q.skill==='reading'?Number.isInteger(a.evidence)&&a.evidence>=0&&a.evidence<=2:a.evidence===null);};
 if(!value.attempts.every(validA)||new Set(value.attempts.map(a=>a.id)).size!==value.attempts.length)return false;
 const r=value.session;if(r===null)return true;
 if(!r||r.version!==courseVersion||typeof r.id!=='string'||r.id.length>100||!units.some(u=>u.id===r.unitId)||!['a','b'].includes(r.variant)||!['learn','diagnostic'].includes(r.mode)||typeof r.ruleSeen!=='boolean'||!Number.isFinite(r.startedAt)||r.startedAt<=0||!Array.isArray(r.queue)||!r.queue.length||r.queue.length>20||!r.queue.every(id=>questionById(id))||new Set(r.queue).size!==r.queue.length||!Number.isInteger(r.index)||r.index<0||r.index>r.queue.length)return false;
 if(!r.orders||!r.queue.every(id=>{const a=r.orders[id],q=questionById(id);return Array.isArray(a)&&a.length===q.choices.length&&new Set(a).size===a.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<q.choices.length);}))return false;
 if(!r.plays||!Object.entries(r.plays).every(([id,n])=>r.queue.includes(id)&&Number.isSafeInteger(n)&&n>=0&&n<=1000)||!r.heard||!Object.entries(r.heard).every(([id,b])=>r.queue.includes(id)&&b===true)||!Array.isArray(r.supported)||!r.supported.every(id=>r.queue.includes(id)))return false;
 if(r.draft!==null&&(!r.draft||r.draft.qid!==r.queue[r.index]||!Number.isInteger(r.draft.choice)||r.draft.choice<0||r.draft.choice>=questionById(r.draft.qid).choices.length))return false;
 return r.queue.slice(0,r.index).every(id=>value.attempts.some(a=>a.id===`${r.id}:${id}`));
}
