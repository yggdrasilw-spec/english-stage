import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {choiceCards,choices} from '../dist/src/quiz.js';
import {plan,dueTasks,updateProgress} from '../dist/src/scheduler.js';
import {initial,validateBackup} from '../dist/src/storage.js';
const cards=JSON.parse(fs.readFileSync(new URL('../dist/data/grade5.json',import.meta.url)));
const byWord=w=>cards.find(c=>c.en===w);
const seeded=seed=>()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
test('months, weekdays and numbers compete with their own meaning family in every quiz skill',()=>{
 for(const [word,pattern] of [['January',/^\d+月$/],['Monday',/曜日$/],['one',/^(\d+|一|二|三|四|五|六|七|八|九|十)/]])for(const skill of ['read','listen','recall']){
  const c=byWord(word),options=choiceCards(c,cards,skill,seeded(7));
  assert.equal(options.length,4);assert(options.every(x=>pattern.test(x.ja)),options.map(x=>x.ja).join(','));assert.equal(options.filter(x=>x.id===c.id).length,1);
 }
});
test('month distractors and answer positions vary across sessions',()=>{
 const variants=new Set(),positions=new Set(),c=byWord('January');
 for(let seed=1;seed<=30;seed++){const opts=choiceCards(c,cards,'read',seeded(seed));variants.add(opts.filter(x=>x.id!==c.id).map(x=>x.id).sort().join());positions.add(opts.findIndex(x=>x.id===c.id));}
 assert(variants.size>10);assert.equal(positions.size,4);
});
test('equivalent meanings, homophones and interchangeable answers cannot be wrong choices',()=>{
 for(const [a,b] of [['big','large'],['phone','telephone'],['fall','autumn'],['bike','bicycle']])for(const skill of ['read','listen','recall']){
  const target={id:'test-a',kind:'word',theme:'test',en:a,ja:'同義語の訳A'},other={...target,id:'test-b',en:b,ja:'同義語の訳B'};
  assert(!choices(target,[target,other,...cards],skill,0).some(x=>x.id===other.id));
 }
 const fruit=byWord('orange'),color={...fruit,id:'test-orange-color',en:'orange (color)',audioText:fruit.audioText||fruit.en,ja:'オレンジ色'};
 assert(!choices(fruit,[...cards,color],'listen').some(x=>x.id===color.id));
});
test('fresh plans vary without losing introduction-before-question or changing input',()=>{
 const s=initial(),before=structuredClone(s),variants=new Set();
 for(let i=0;i<12;i++){const p=plan(cards,s);variants.add(p.map(t=>t.id).join());for(const t of p.filter(t=>!t.intro))assert(p.findIndex(x=>x.id===t.id&&x.intro)<p.indexOf(t));}
 assert(variants.size>1);assert.deepEqual(s,before);
});
test('overdue deadlines retain priority and randomized order restores from backup',()=>{
 const s=initial(),now=Date.now();for(const [i,c] of cards.slice(0,5).entries())s.progress[c.id]={read:{...updateProgress({},'wrong',now-86400000),due:now-i*1000}};
 const due=dueTasks(cards,s,now);assert.deepEqual(due.map(t=>t.due),[...due.map(t=>t.due)].sort((a,b)=>a-b));
 s.fast={ids:cards.slice(0,5).map(c=>c.id),index:0,mode:'read',filter:'all',theme:'all',order:'random',checked:0,correct:0,known:0,feedback:null,auto:true,randomized:true};
 assert.equal(validateBackup({app:'english-stage',version:1,state:s},new Set(cards.map(c=>c.id))).fast.order,'random');
});
