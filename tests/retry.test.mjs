import {test} from 'node:test';import assert from 'node:assert/strict';import {enqueueRetry} from '../dist/src/quiz.js';
const task=id=>({id,skill:'read'});
test('an error waits for two other questions, skipping introduction cards',()=>{
 const s={index:0,tries:{'a:read':1},tasks:[task('a'),{...task('b'),intro:true},task('b'),{...task('c'),intro:true},task('c'),task('d')]};
 enqueueRetry(s,task('a'));assert.equal(s.tasks[5].id,'a');assert.equal(s.tasks[6].id,'d');
 enqueueRetry(s,task('a'));assert.equal(s.tasks.filter(t=>t.id==='a').length,2);
});
test('a third attempt leaves practice for tomorrow without extending the queue',()=>{
 const s={index:0,tries:{'a:read':3},tasks:[task('a'),task('b'),task('c')]};enqueueRetry(s,task('a'));assert.equal(s.tasks.length,3);
});
