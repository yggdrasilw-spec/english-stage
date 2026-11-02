import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesAnswer,speakingPool,shuffledCards} from '../dist/src/speaking-answer.js';
test('spoken answers compare complete words, preserving number and word boundaries',()=>{
 for(const [answer,spoken] of [['apple',' Apple. '],['twenty','20'],['ice cream','ice-cream'],["o’clock","o'clock"]])assert(matchesAnswer({en:answer},spoken));
 for(const [answer,spoken] of [['cat','a cat'],['cat','cats'],['tooth','teeth'],['snow','snowy'],['red','bread'],['ice cream','icecream']])assert(!matchesAnswer({en:answer},spoken));
});
test('teaching diagrams with printed answers cannot leak the word',()=>{
 const word={kind:'word',theme:'number'};
 assert.equal(speakingPool([{...word,image:{url:'https://example.com/diagram-one.png'}},{...word,image:{url:'assets/vocabulary/g5-w-ph-son.svg'}},{...word,image:{url:'https://example.com/one.png',credit:'プログラム生成図'}}]).length,0);
 assert.equal(speakingPool([{...word,id:'g5-w-tooth',image:{url:'assets/vocabulary/g5-w-tooth.svg',credit:'学習図'}}]).length,1);
});
test('only pictured vocabulary is eligible and shuffle does not mutate source',()=>{
 const cards=[{id:'a',kind:'word',theme:'food',image:{url:'a'}},{id:'b',kind:'phrase',image:{url:'b'}},{id:'c',kind:'word',theme:'food'},{id:'d',kind:'word',theme:'animal',image:{url:'d'}}];
 assert.deepEqual(speakingPool(cards,'food').map(c=>c.id),['a']);assert.equal(speakingPool(cards).length,2);
 const result=shuffledCards(cards,()=>0);assert.equal(new Set(result.map(c=>c.id)).size,4);assert.equal(cards[0].id,'a');assert.notEqual(result[0].id,'a');
});
