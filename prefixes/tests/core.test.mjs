import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fresh,normalize,merge,itemStatus,unlocked,eligibleWords,activeWords,question,trapQuestion,DAY} from '../core.mjs';
const data=Object.fromEntries(['prefixes','words','mvp','stages','pitfalls','editorial'].map(n=>[n,JSON.parse(readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'))]));
const ps=data.prefixes.filter(p=>data.mvp.prefix_ids.includes(p.id));
const attempt=(item,at,correct=true,extra={})=>({id:`${item}-${at}`,item,at,correct,mode:'infer',stage:1,prefix:'un_not',...extra});
test('original pack, 14 lessons and complete editorial coverage; one quiz word per lesson',()=>{
 assert.equal(data.prefixes.length,43);assert.equal(data.words.length,179);assert.equal(data.mvp.prefix_ids.length,14);assert.equal(activeWords(data).length,66);assert.equal(eligibleWords(data).length,56);
 assert.equal(new Set(data.words.map(w=>w.word)).size,data.words.length);
 for(const p of ps)assert(eligibleWords(data).some(w=>w.prefix_id===p.id),p.id);
 for(const w of activeWords(data)){assert(data.editorial.words[w.word].base_hint_ja);assert.equal(w.review_status,'editorial_seed_verify_before_release');}
 assert.equal(data.editorial.words.oversleep.meaning_ja,'寝過ごす');
});
test('all allowed modes, 30 random rounds: unique choices, exactly one listed answer, no fabricated words',()=>{
 const known=new Set(data.words.map(w=>w.word)),splits=new Set(data.words.map(w=>w.split));
 for(let i=0;i<30;i++)for(const w of eligibleWords(data))for(const mode of data.editorial.words[w.word].modes||['meaning','build','split','infer']){
  const q=question(data,w,mode);assert.equal(q.choices.filter(c=>c===q.answer).length,1);assert.equal(new Set(q.choices).size,q.choices.length);assert(q.choices.length>=2);
  if(mode==='build')q.choices.forEach(c=>assert(known.has(c),c));if(mode==='split')q.choices.forEach(c=>assert(splits.has(c),c));
  if(mode==='meaning'&&['un_not','dis_negative','non_not','un_reverse'].includes(w.prefix_id)){const forbidden=ps.filter(p=>['un_not','dis_negative','non_not','un_reverse'].includes(p.id)&&p.id!==w.prefix_id).map(p=>p.meaning_ja);assert(!q.choices.some(c=>forbidden.includes(c)));}
 }
});
test('reject non-MVP, ineligible, held words and restricted biplane modes',()=>{
 for(const w of data.words.filter(w=>!eligibleWords(data).includes(w)))assert.throws(()=>question(data,w,'build'));
 assert.throws(()=>question(data,{id:'unbig',word:'unbig',prefix_id:'un_not'},'build'));
 assert.throws(()=>question(data,data.words.find(w=>w.word==='biplane'),'build'));
});
test('unlocks are derived from all required lessons and application results',()=>{
 const rows=ps.filter(p=>p.stage===1).map((p,i)=>attempt('w'+i,i,true,{prefix:p.id}));
 assert(unlocked(1,[],ps));assert(!unlocked(2,rows.slice(1),ps));assert(unlocked(2,rows,ps));assert(!unlocked(3,rows,ps));
 const all=ps.map((p,i)=>attempt('w'+i,i,true,{prefix:p.id}));assert(unlocked(3,all,ps));assert(!unlocked(4,all,ps));assert(unlocked(4,[...all,...Array.from({length:4},(_,i)=>attempt('a'+i,i,true,{stage:3}))],ps));
});
test('spaced review 1/3/7 days; early repetitions cannot postpone; errors reset',()=>{
 const t=1700000000000,rows=[attempt('w',t)];assert.equal(itemStatus(rows,'w',t).due,t+DAY);assert(!itemStatus(rows,'w',t+DAY-1).isDue);assert(itemStatus(rows,'w',t+DAY).isDue);
 rows.push(attempt('w',t+1000));assert.equal(itemStatus(rows,'w').due,t+DAY);assert.equal(itemStatus(rows,'w').streak,1);
 rows.push(attempt('w',t+DAY));assert.equal(itemStatus(rows,'w').due,t+4*DAY);rows.push(attempt('w',t+4*DAY));assert.equal(itemStatus(rows,'w').due,t+11*DAY);
 rows.push(attempt('w',t+5*DAY,false));assert.equal(itemStatus(rows,'w').streak,0);assert.equal(itemStatus(rows,'w').due,t+5*DAY+600000);rows.push(attempt('w',t+5*DAY+1));assert.equal(itemStatus(rows,'w').due,t+5*DAY+600000);
});
test('safe storage validation and merge preserve independent tab attempts',()=>{
 assert.deepEqual(normalize(null),fresh());assert.deepEqual(normalize({schemaVersion:99}),fresh());assert.deepEqual(normalize({schemaVersion:1,attempts:[null,{},attempt('w',1)],sound:false}),{schemaVersion:1,attempts:[attempt('w',1)],sound:false});
 const a=attempt('a',1),b=attempt('b',2);assert.deepEqual(merge([a],[b,a]),[a,b]);
});
test('advanced traps map to supplied pitfall IDs and have both true and false answers',()=>{
 assert(data.editorial.traps.every(t=>data.pitfalls.some(p=>p.id===t.id)));assert.equal(new Set(data.editorial.traps.map(t=>t.answer)).size,2);
 data.editorial.traps.forEach(t=>{const q=trapQuestion(t);assert(q.choices.includes(q.answer));assert(q.explanation);});
});
