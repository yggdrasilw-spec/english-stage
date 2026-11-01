import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,validateBackup} from '../dist/src/storage.js';
import {plan} from '../dist/src/scheduler.js';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url)));
const cards=read('dist/data/grade5.json'),extra=read('scripts/grade5-expansion-03.json'),coverage=read('scripts/rarejob-coverage.json');
test('every referenced vocabulary row resolves to a learnable card, including noun and verb senses',()=>{
 assert.equal(coverage.referenceRows,305);assert.equal(coverage.entries.length,305);
 assert.equal(coverage.addedItems,extra.length);
 assert.deepEqual(coverage.entries.map(e=>e.row),Array.from({length:305},(_,i)=>i+1));
 for(const e of coverage.entries){assert(e.itemIds.length);for(const id of e.itemIds)assert(cards.some(c=>c.id===id),`${e.row}: ${id}`);}
 for(const en of ['watch','drink','his']){
  const rows=coverage.entries.filter(e=>e.referenceEnglish===en);
  assert.equal(rows.length,2);assert.notEqual(rows[0].itemIds[0],rows[1].itemIds[0]);
 }
 for(const [raw,en] of [['automn','autumn'],['cityhall','city hall'],['clearup','clear up'],['thesun','sun'],['tabletennis','table tennis']]){
  const e=coverage.entries.find(e=>e.referenceEnglish===raw);assert.equal(cards.find(c=>c.id===e.itemIds[0]).en,en);
 }
});
test('published learning content survives the supplement and all new cards enter planning and backup restore',()=>{
 const previous=[...read('tests/grade5-v2.json'),...read('scripts/grade5-expansion-02.json')];
 assert.equal(previous.length,830);
 for(const old of previous){const {image:_,...before}=old;const {image:__,...after}=cards.find(c=>c.id===old.id);assert.deepEqual(after,before);}
 assert.equal(extra.length,71);assert.equal(cards.length,previous.length+extra.length);
 const state=initial(),ids=new Set(cards.map(c=>c.id));
 for(const c of previous)state.seen[c.id]=1;
 for(const c of extra){assert(plan([c],state).some(t=>t.id===c.id),c.id);state.seen[c.id]=2;}
 assert.deepEqual(validateBackup({app:'english-stage',version:1,state},ids).seen,state.seen);
});
