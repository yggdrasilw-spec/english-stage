import {spokenWord} from './quiz.js';
import {karutaPriority,karutaRecord,validKarutaTake} from './karuta-learning.js';
const compare=(state,face,now,leastPracticed)=>(a,b)=>{
 if(!state)return 0;
 if(leastPracticed){
  const count=id=>{const r=karutaRecord(state,id,face);return (r?.takes||0)+(r?.mistakes||0);};
  const difference=count(a.id)-count(b.id);if(difference)return difference;
 }
 return karutaPriority(state,a.id,face,now)-karutaPriority(state,b.id,face,now);
};
const shuffle=(xs,random=Math.random)=>{const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
export function karutaPool(cards,theme='all',face='meaning',state=null,now=Date.now(),leastPracticed=false){
 const seen=new Set();
 return [...cards].sort(compare(state,face,now,leastPracticed)).filter(c=>{
  if(state&&!Number.isFinite(karutaPriority(state,c.id,face,now)))return false;
  if(theme!=='all'&&c.theme!==theme)return false;
  // Identical visible meanings or spoken English must never compete on one board.
  const keys=['en:'+c.en.trim().toLowerCase(),'audio:'+spokenWord(c),...(face==='meaning'?['ja:'+c.ja.trim()]:[])];
  if(keys.some(k=>seen.has(k)))return false;
  keys.forEach(k=>seen.add(k));return true;
 });
}
export function createKaruta(cards,theme='all',count=20,face='meaning',random=Math.random,state=null,now=Date.now(),leastPracticed=false){
 face=face==='english'?'english':'meaning';
 count=Math.max(4,Math.min(40,Math.round(Number(count)||20)));
 const ids=shuffle(karutaPool(cards,theme,face,state,now,leastPracticed),random).sort(compare(state,face,now,leastPracticed)).slice(0,count).map(c=>c.id);
 return {theme,count,face,ids,order:shuffle(ids,random),index:0,mistakes:0,missed:[],feedback:'',errors:{},results:{}};
}
export function takeKaruta(run,id){
 if(run.index>=run.order.length||!run.ids.includes(id)||run.order.slice(0,run.index).includes(id))return false;
 if(id!==run.order[run.index]){run.mistakes++;run.errors||={};const target=run.order[run.index];run.errors[target]=(run.errors[target]||0)+1;if(!run.missed.includes(target))run.missed.push(target);run.feedback='おてつき。もう一度聞いて、探そう。';return false;}
 run.index++;return true;
}
export function validKaruta(k,ids){
 if(k?.errors!==undefined&&(!k.errors||typeof k.errors!=='object'||Array.isArray(k.errors)||Object.entries(k.errors).some(([id,n])=>!k.ids?.includes(id)||!Number.isSafeInteger(n)||n<0)))return false;
 if(k?.results!==undefined&&(!k.results||typeof k.results!=='object'||Array.isArray(k.results)||Object.entries(k.results).some(([id,r])=>!k.order?.slice(0,k.index).includes(id)||!r||!validKarutaTake(r.current)||(r.previous!==null&&!validKarutaTake(r.previous))||typeof r.first!=='boolean')))return false;
 return !!k&&typeof k.theme==='string'&&['meaning','english'].includes(k.face)&&Number.isInteger(k.count)&&k.count>=4&&k.count<=40&&Array.isArray(k.ids)&&k.ids.length<=40&&new Set(k.ids).size===k.ids.length&&k.ids.every(id=>ids.has(id))&&Array.isArray(k.order)&&k.order.length===k.ids.length&&new Set(k.order).size===k.ids.length&&k.order.every(id=>k.ids.includes(id))&&Number.isInteger(k.index)&&k.index>=0&&k.index<=k.ids.length&&Number.isSafeInteger(k.mistakes)&&k.mistakes>=0&&Array.isArray(k.missed)&&k.missed.length<=k.ids.length&&k.missed.every(id=>k.ids.includes(id))&&typeof k.feedback==='string'&&k.feedback.length<=500;
}
