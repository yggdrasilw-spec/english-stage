import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sortVocabulary,vocabularyPriority} from '../dist/src/vocabulary-priority.js';
import {initial,validateBackup} from '../dist/src/storage.js';
import {plan} from '../dist/src/scheduler.js';
import {choices,spokenWord} from '../dist/src/quiz.js';
import {karutaPool} from '../dist/src/karuta-session.js';
import {hasReviewedImageUpdate} from './reviewed-image-updates.mjs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const cards=read('dist/data/grade5.json'),by=new Map(cards.map(c=>[c.id,c])),extra=read('scripts/grade5-expansion-04.json'),coverage=read('scripts/print-ho-kan-coverage.json');
test('all 23 PDF pages and 530 rows resolve, retaining spelling corrections and different senses',()=>{
 assert.equal(coverage.referenceRows,530);assert.equal(coverage.entries.length,530);
 for(let page=1;page<=23;page++){
  const rows=coverage.entries.filter(e=>e.page===page),count=[1,2,3,13,14,15,18,22,23].includes(page)?20:25;
  assert.equal(rows.length,count);assert.deepEqual(rows.map(e=>e.number),Array.from({length:count},(_,i)=>i+1));
  assert(rows.every(e=>e.rank===(page<=18?'A':'B')));
 }
 for(const e of coverage.entries){assert(e.itemIds.length);for(const id of e.itemIds)assert(by.has(id));}
 const row=(page,term)=>coverage.entries.find(e=>e.page===page&&e.referenceEnglish===term);
 assert.equal(by.get(row(23,'high').itemIds[0]).en,'hi');
 assert.equal(by.get(row(21,'chopstick(s)').itemIds[0]).en,'chopsticks');
 assert.equal(by.get(row(6,'P.E.').itemIds[0]).en,'PE');
 assert.deepEqual(row(18,'a, an').itemIds.map(id=>by.get(id).en),['a','an']);
 assert.notEqual(row(1,'watch').itemIds[0],row(4,'watch').itemIds[0]);
 assert.notEqual(row(8,'orange').itemIds[0],row(12,'orange').itemIds[0]);
});
test('source ranks precede other entries and work with filters without mutating the original deck',()=>{
 const order=cards.map(c=>c.id),sorted=sortVocabulary(cards),ranks=sorted.map(c=>({A:0,B:1}[vocabularyPriority(c)?.rank]??2));
 assert.deepEqual(ranks,[...ranks].sort((a,b)=>a-b));assert.equal(sorted[0].en,'cook');
 assert.deepEqual(cards.map(c=>c.id),order);assert.deepEqual(sortVocabulary(cards,'original'),cards);
 const filtered=cards.filter(c=>c.theme==='食べ物');assert.equal(sortVocabulary(filtered).length,filtered.length);
 const alpha=sortVocabulary(cards,'alphabetical');assert.equal(new Set(alpha.map(c=>c.id)).size,cards.length);
});
test('all 901 published IDs and unreviewed fields survive corrections; new cards enter planning and backup restore',()=>{
 const previous=read('tests/grade5-v3.json');assert.equal(previous.length,901);assert.equal(extra.length,76);assert.equal(cards.length,977);
 const corrected=new Set(fs.readFileSync(new URL('../scripts/reviewed-examples.txt',import.meta.url),'utf8').trim().split(/\r?\n/).map(row=>row.split('|')[0]).concat('teeth'));
 const revised=new Set(['example','exampleJa','exampleAudioText','explanation','revision','grammarPoints']);
 for(const c of previous){const current=by.get(c.id),imageUpdated=hasReviewedImageUpdate(current);if(!corrected.has(c.en)){const keep=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!(imageUpdated&&k==='image')));assert.deepEqual(keep(current),keep(c));continue;}
  const allowed=new Set([...revised,...(imageUpdated?['image']:[]),...(['tooth','teeth'].includes(c.en)?['ja','image']:[])]),keep=o=>Object.fromEntries(Object.entries(o).filter(([k])=>!allowed.has(k)));
  assert.deepEqual(keep(current),keep(c));
 }
 const state=initial();
 for(const c of extra){
  assert(c.image?.url,c.id);assert(c.example&&c.exampleJa&&c.explanation);assert(plan([c],state).some(t=>t.id===c.id));
  if(c.image.url.startsWith('assets/'))assert(fs.existsSync(new URL('../dist/'+c.image.url,import.meta.url)));
  state.seen[c.id]=1;
 }
 assert.deepEqual(validateBackup({app:'english-stage',version:1,state},new Set(by.keys())).seen,state.seen);
});
test('validated backup retains supported fast-session order and rejects damaged order',()=>{
 const state=initial();state.fast={ids:sortVocabulary(cards).map(c=>c.id),index:0,mode:'card',filter:'all',theme:'all',order:'importance',checked:0,correct:0,known:0,auto:false};
 assert.equal(by.get(state.fast.ids[0]).en,'cook');assert.equal(state.fast.order,'importance');
 const restored=validateBackup({app:'english-stage',version:1,state},new Set(by.keys()));assert.equal(restored.fast.order,'importance');
 state.fast.order='invalid';assert.throws(()=>validateBackup({app:'english-stage',version:1,state},new Set(by.keys())));
});

test('duplicate distractor translations cannot appear as separate choices',()=>{
 const c={id:'correct',en:'correct',ja:'正解',theme:'test',kind:'word'};
 const pool=[c,{...c,id:'a',en:'a',ja:'同じ訳'},{...c,id:'b',en:'b',ja:'同じ訳'},{...c,id:'c',en:'c',ja:'別の訳'}];
 const options=choices(c,pool,'read',3);assert.equal(options.length,3);assert.equal(new Set(options.map(o=>o.label)).size,3);
});

test('orange fruit and color cannot compete in a listening question or on one karuta board',()=>{
 const fruit=cards.find(c=>c.en==='orange'),color=cards.find(c=>c.en==='orange (color)');assert.equal(fruit.audioText,color.audioText);
 const pool=[fruit,{...color,theme:fruit.theme},cards.find(c=>c.en==='apple')];
 assert(!choices(fruit,pool,'listen',3).some(o=>o.id===color.id));
 for(const face of ['meaning','english']){
  const board=karutaPool(cards,'all',face);assert.equal(board.filter(c=>spokenWord(c)==='orange').length,1);
 }
});
