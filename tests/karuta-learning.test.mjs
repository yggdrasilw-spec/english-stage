import {test} from 'node:test';
import assert from 'node:assert/strict';
import {recordKaruta,karutaPriority} from '../dist/src/karuta-learning.js';
import {createKaruta} from '../dist/src/karuta-session.js';
import {initial,validateBackup} from '../dist/src/storage.js';
const at=Date.UTC(2026,10,1),DAY=86400000;
const answer={correct:true,ms:1800,plays:1,slow:false,eligible:true,choices:8};
const cards=Array.from({length:12},(_,i)=>({id:'w'+i,en:'word'+i,ja:'意味'+i,theme:'動物'}));
test('repeat rounds cover unseen cards before replaying even weak cards, then choose least practiced',()=>{
 const s=initial(),repeat=()=>createKaruta(cards,'動物',4,'meaning',()=>.5,s,at,true),seen=new Set();
 for(let round=0;round<3;round++){
  const run=repeat();assert.equal(run.ids.length,4);
  for(const id of run.ids){assert(!seen.has(id));seen.add(id);recordKaruta(s,id,'meaning',{...answer,eligible:false},at);}
 }
 assert.equal(seen.size,12);
 for(const c of cards.slice(0,8))for(let i=0;i<3;i++)recordKaruta(s,c.id,'meaning',{...answer,correct:false},at);
 assert.deepEqual(new Set(repeat().ids),new Set(cards.slice(8).map(c=>c.id)));
 assert.equal(repeat().theme,'動物');
});
test('repeat mode excludes mastered cards and prefers unseen ambiguous meanings before deduplication',()=>{
 const s=initial();for(let i=0;i<3;i++)recordKaruta(s,'w0','meaning',answer,at+i*DAY);
 for(const c of cards.slice(1,9))recordKaruta(s,c.id,'meaning',{...answer,eligible:false},at);
 const run=createKaruta(cards,'動物',4,'meaning',()=>.5,s,at+3*DAY,true);
 assert(!run.ids.includes('w0'));for(const c of cards.slice(9))assert(run.ids.includes(c.id));
 const d=initial();recordKaruta(d,'w0','meaning',{...answer,correct:false},at);
 const duplicate={...cards[1],ja:cards[0].ja};
 const k=createKaruta([cards[0],duplicate,...cards.slice(2)],'動物',4,'meaning',()=>.5,d,at,true);
 assert(k.ids.includes('w1'));assert(!k.ids.includes('w0'));
});
test('fluent recall needs three independent successes on at least two days; expires',()=>{
 const s=initial();
 for(let i=0;i<3;i++)recordKaruta(s,'w0','meaning',answer,at+i);
 assert(Number.isFinite(karutaPriority(s,'w0','meaning',at+3)));
 recordKaruta(s,'w0','meaning',answer,at+DAY);
 assert.equal(karutaPriority(s,'w0','meaning',at+DAY),Infinity);
 assert(Number.isFinite(karutaPriority(s,'w0','meaning',at+32*DAY)));
 assert(Number.isFinite(karutaPriority(s,'w0','english',at+DAY)));
 recordKaruta(s,'w0','meaning',{...answer,correct:false},at+2*DAY);
 assert.equal(karutaPriority(s,'w0','meaning',at+2*DAY),0);
 assert.equal(s.karutaLearning.w0.meaning.masteredUntil,0);
});
test('replay, slow, errors, interruption, long search and small boards never prove fluency',()=>{
 for(const extra of [{plays:2},{slow:true},{eligible:false},{ms:5000},{ms:null},{choices:3},{correct:false}]){
  const s=initial();for(let i=0;i<4;i++)recordKaruta(s,'w0','meaning',{...answer,...extra},at+i*DAY);
  assert.equal(s.karutaLearning.w0.meaning.streak,0);
  assert.equal(s.karutaLearning.w0.meaning.masteredUntil,0);
 }
});
test('selection excludes known words, orders weak and new before partially learned, never refills mastered',()=>{
 const s=initial();s.screening={results:{w0:{status:'known',at},w1:{status:'unknown',at}}};
 for(let i=2;i<12;i++)recordKaruta(s,'w'+i,'meaning',answer,at);
 const run=createKaruta(cards,'all',4,'meaning',()=>.5,s,at);
 assert(!run.ids.includes('w0'));assert(run.ids.includes('w1'));
 s.progress.w0={listen:{lastQuality:'wrong'}};
 assert.equal(karutaPriority(s,'w0','meaning',at),0);
 const known=initial();known.screening={results:Object.fromEntries(cards.map(c=>[c.id,{status:'known',at}]))};
 assert.equal(createKaruta(cards,'all',20,'meaning',Math.random,known,at).ids.length,0);
 const unseen=initial();for(let i=2;i<12;i++)recordKaruta(unseen,'w'+i,'meaning',answer,at);
 const board=createKaruta(cards,'all',4,'meaning',()=>.5,unseen,at);
 assert(board.ids.includes('w0'));assert(board.ids.includes('w1'));
});
test('prioritization happens before ambiguous meanings are removed',()=>{
 const s=initial();recordKaruta(s,'w0','meaning',answer,at);
 const duplicate={...cards[1],ja:cards[0].ja};
 assert(createKaruta([cards[0],duplicate,...cards.slice(2)],'all',4,'meaning',()=>.5,s,at).ids.includes('w1'));
});
test('new listening errors reopen mastered words and older errors do not override fresh karuta evidence',()=>{
 const s=initial();for(const t of [at,at+1,at+DAY])recordKaruta(s,'w0','meaning',answer,t);
 s.progress.w0={listen:{lastQuality:'wrong',lastAt:at+2*DAY}};
 assert.equal(karutaPriority(s,'w0','meaning',at+2*DAY),0);
 recordKaruta(s,'w0','meaning',answer,at+2*DAY+1);
 assert.equal(s.karutaLearning.w0.meaning.streak,1);
 assert.equal(s.karutaLearning.w0.meaning.masteredUntil,0);
 assert.equal(karutaPriority(s,'w0','meaning',at+2*DAY+1),2);
});
test('timings and mistakes survive backup; malformed evidence is rejected; old backups work',()=>{
 const s=initial(),ids=new Set(cards.map(c=>c.id));
 recordKaruta(s,'w0','meaning',{...answer,correct:false},at);
 recordKaruta(s,'w0','meaning',{...answer,plays:2,eligible:false},at+1000);
 const backup=()=>({app:'english-stage',version:1,state:structuredClone(s)});
 const r=validateBackup(backup(),ids).karutaLearning.w0.meaning;
 assert.equal(r.lastMs,1800);assert.equal(r.totalMs,1800);assert.equal(r.takes,1);assert.equal(r.mistakes,1);assert.equal(r.plays,2);
 for(const bad of [null,[],{foreign:{meaning:r}},{w0:{bad:r}},{w0:{meaning:{...r,lastMs:-1}}},{w0:{meaning:{...r,streak:Infinity}}},{w0:{meaning:{...r,days:['bad']}}}]){
  const b=backup();b.state.karutaLearning=bad;assert.throws(()=>validateBackup(b,ids));
 }
 assert(validateBackup({app:'english-stage',version:1,state:initial()},ids));
});
