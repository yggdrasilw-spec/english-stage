import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initial,validateBackup} from '../dist/src/storage.js';
import {DAY,updateProgress,dueTasks} from '../dist/src/scheduler.js';
import {choices} from '../dist/src/quiz.js';
import {hasReviewedImageUpdate} from './reviewed-image-updates.mjs';
const cards=JSON.parse(fs.readFileSync(new URL('../dist/data/grade5.json',import.meta.url)));
const original=JSON.parse(fs.readFileSync(new URL('./grade5-v1.json',import.meta.url)));
test('published IDs, meanings and examples are preserved; image changes require an explicit reviewed adoption',()=>{
 assert.equal(original.length,130);
 for(const old of original){
  const current=cards.find(c=>c.id===old.id);
  const {image:oldImage,...oldContent}=old;const {image:currentImage,...currentContent}=current;
  assert.deepEqual(currentContent,oldContent);
  if(oldImage&&!hasReviewedImageUpdate(current))assert.equal(currentImage.url,oldImage.url);
 }
});
test('old backups keep their skill records and due dates after expansion',()=>{
 const state=initial(),at=new Date('2026-10-31T03:00:00Z').getTime();
 for(const c of original){state.seen[c.id]=at;state.progress[c.id]={read:updateProgress({},'wrong',at)};}
 const restored=validateBackup({app:'english-stage',version:1,state},new Set(cards.map(c=>c.id)));
 assert.deepEqual(restored,state);
 const due=dueTasks(cards,restored,at+2*DAY);
 assert.equal(due.length,130);assert.ok(due.every(t=>t.due===at+DAY));
 assert.ok(cards.filter(c=>!original.some(o=>o.id===c.id)).every(c=>!restored.seen[c.id]));
});
test('every expanded item has usable distinct choices in all three skills',()=>{
 for(const c of cards)for(const skill of ['read','listen','recall'])for(const attempts of [0,3]){
  const options=choices(c,cards,skill,attempts);
  assert.ok(options.length>=2,c.id);assert.equal(new Set(options.map(o=>o.label)).size,options.length,c.id);
  assert.equal(options.filter(o=>o.id===c.id).length,1);
 }
});
