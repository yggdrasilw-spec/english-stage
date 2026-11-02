import {test} from 'node:test';
import assert from 'node:assert/strict';
import {shuffleFastTail} from '../dist/src/fast-order.js';

test('mode changes keep current and completed words, and persist remaining order',()=>{
 const saved={ids:['done','current','a','b','c'],index:1};
 const state=structuredClone(saved);shuffleFastTail(state,true,()=>0);
 assert.deepEqual(state.ids,['done','current','b','c','a']);
 const restored=JSON.parse(JSON.stringify(state));
 assert.equal(restored.randomized,true);assert.deepEqual(restored.ids,state.ids);
 restored.index++;assert.equal(restored.ids[restored.index],'b');
 assert.equal(new Set(restored.ids).size,5);
});
test('review shuffle preserves ID and skill pairing including repeated word IDs',()=>{
 const tasks=[{id:'a',skill:'read'},{id:'a',skill:'listen'},{id:'b',skill:'recall'}];
 const f={ids:tasks.map(t=>t.id),tasks:structuredClone(tasks),index:0};
 shuffleFastTail(f,false,()=>0);
 assert.deepEqual(f.ids,f.tasks.map(t=>t.id));
 assert.deepEqual(f.tasks.map(t=>t.id+':'+t.skill).sort(),tasks.map(t=>t.id+':'+t.skill).sort());
});
test('shuffle after an answer retains its feedback and current question',()=>{
 const f={ids:['a','b','c'],index:0,feedback:{ok:true,answer:'A'}};
 shuffleFastTail(f,true,()=>0);assert.equal(f.ids[0],'a');assert.deepEqual(f.feedback,{ok:true,answer:'A'});
});
