import {validCompanion} from './companion.js';
import {validKarutaLearning} from './karuta-learning.js';
import {validKaruta} from './karuta-session.js';
export const initial=()=>({schema:1,deckVersion:1,progress:{},seen:{},history:[],rewards:[],stars:0,settings:{newCount:5,sound:true,motion:true},session:null});
let db;
export async function open(){db=await new Promise((res,rej)=>{const r=indexedDB.open('english-stage',1);r.onupgradeneeded=()=>r.result.createObjectStore('state');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});return read();}
export function read(){return new Promise((res,rej)=>{const r=db.transaction('state').objectStore('state').get('main');r.onsuccess=()=>res(r.result||initial());r.onerror=()=>rej(r.error);});}
export function write(state){return new Promise((res,rej)=>{const tx=db.transaction('state','readwrite');tx.objectStore('state').put(state,'main');tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error||Error('保存を中止しました'));});}
export function validateBackup(b,ids){
 if(!b||b.app!=='english-stage'||b.version!==1||!b.state||b.state.schema!==1)throw Error('このアプリのバックアップではありません。');
 const s=b.state;
 if(s.companion!==undefined&&!validCompanion(s.companion))throw Error('着せ替えの記録が壊れています。');
 if(!s.progress||!s.seen||!Array.isArray(s.history)||!Array.isArray(s.rewards)||!Number.isSafeInteger(s.stars)||s.stars<0||s.stars>1000000||![3,5,10].includes(s.settings?.newCount)||typeof s.settings.sound!=='boolean'||typeof s.settings.motion!=='boolean')throw Error('記録の形式が正しくありません。');
 if(s.history.length>100000||s.rewards.length>100000)throw Error('記録が大きすぎます。');
 for(const [id,p] of Object.entries(s.progress)){
  if(!ids.has(id)||!p||typeof p!=='object')throw Error('教材のIDが一致しません。');
  for(const [skill,r] of Object.entries(p)){
   if(!['read','listen','recall','self'].includes(skill)||!r||!Number.isFinite(r.due)||r.due<0||!Number.isFinite(r.lastAt)||!Number.isInteger(r.stage)||r.stage<0||r.stage>6||!Array.isArray(r.days)||r.days.some(x=>typeof x!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(x))||!['correct','wrong','guess','self'].includes(r.lastQuality)||!['attempts','correct','mistakes'].every(k=>Number.isInteger(r[k])&&r[k]>=0))throw Error('復習記録が壊れています。');
  }
 }
 if(Object.entries(s.seen).some(([id,t])=>!ids.has(id)||!Number.isFinite(t)))throw Error('学習記録が壊れています。');
 if(s.history.some(h=>!h||!ids.has(h.id)||!['read','listen','recall','self'].includes(h.skill)||!['correct','wrong','guess','self'].includes(h.quality)||!Number.isFinite(h.at)))throw Error('回答履歴が壊れています。');
 if(s.rewards.some(r=>typeof r!=='string'))throw Error('星の記録が壊れています。');
 if(s.screening){
  if(!s.screening.results||typeof s.screening.results!=='object'||Array.isArray(s.screening.results))throw Error('最初のチェックの形式が正しくありません。');
  for(const [id,r] of Object.entries(s.screening.results))if(!ids.has(id)||!r||!['known','unsure','unknown'].includes(r.status)||!Number.isFinite(r.at))throw Error('最初のチェックの記録が壊れています。');
  // Undo is temporary UI history; never trust imported commands.
  s.screening={results:s.screening.results,undo:[]};
 }
 if(s.fast){
  const f=s.fast;
  if(!Array.isArray(f.ids)||f.ids.length>ids.size||f.ids.some(id=>!ids.has(id))||!Number.isInteger(f.index)||f.index<0||f.index>f.ids.length||!['card','read','recall','listen','match'].includes(f.mode)||!['all','new','weak','due'].includes(f.filter)||typeof f.theme!=='string'||typeof f.auto!=='boolean'||!['checked','correct','known'].every(k=>Number.isSafeInteger(f[k])&&f[k]>=0))throw Error('カードの中断記録が壊れています。');
  f.feedback=null;
  if(f.tasks&&(!Array.isArray(f.tasks)||f.tasks.length!==f.ids.length||f.tasks.length>10||f.tasks.some((t,i)=>!t||t.id!==f.ids[i]||!['read','listen','recall'].includes(t.skill)||!Number.isFinite(t.due))))throw Error('復習チェックの中断記録が壊れています。');
 }
 if(s.karutaLearning!==undefined&&!validKarutaLearning(s.karutaLearning,ids))throw Error('かるたの学習記録が壊れています。');
 if(s.karuta&&!validKaruta(s.karuta,ids))throw Error('かるたの中断記録が壊れています。');
 if(s.mock){
  const validRun=r=>r&&/^g5-m[123]$/.test(r.examId)&&['r','l','break'].includes(r.phase)&&Number.isInteger(r.index)&&r.index>=0&&r.index<25&&Number.isFinite(r.deadline)&&r.deadline>=0&&r.answers&&typeof r.answers==='object'&&!Array.isArray(r.answers)&&Object.keys(r.answers).length<=50&&Object.entries(r.answers).every(([k,v])=>new RegExp('^'+r.examId+'-(0[1-9]|[1-4][0-9]|50)$').test(k)&&Number.isInteger(v)&&v>=0&&v<=3)&&r.plays&&typeof r.plays==='object'&&Object.keys(r.plays).length<=25&&Object.entries(r.plays).every(([k,v])=>new RegExp('^'+r.examId+'-(2[6-9]|[34][0-9]|50)$').test(k)&&Number.isInteger(v)&&v>=0&&v<=2);
  if(!Array.isArray(s.mock.results)||s.mock.results.length>30||s.mock.results.some(r=>!validRun(r))||(s.mock.active&&!validRun(s.mock.active)))throw Error('実戦テストの記録が壊れています。');
 }
 // Do not restore an in-flight legacy question from a different tab or content version.
 return {...s,session:null};
}
