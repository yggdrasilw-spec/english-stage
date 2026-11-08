import test from 'node:test';import assert from 'node:assert/strict';
import {initial,validateBackup} from '../dist/src/storage.js';
import {recordEvidence,wordStatus,goalPlan} from '../dist/src/evidence.js';
import {DAY,updateProgress,dueTasks} from '../dist/src/scheduler.js';
import {automaticTasks} from '../dist/src/learning-plan.js';
import {recordKarutaResult} from '../dist/src/karuta-learning.js';
import {forestJourney,recordForest,waterForest} from '../dist/src/forest.js';
const now=Date.parse('2026-11-08T03:00:00Z');
test('different games share word and skill evidence; assistance, duplicates and mistakes stay distinct',()=>{
 const s=initial();recordEvidence(s,{id:'cat',skill:'listen',quality:'correct',source:'nova',eventId:'1'},now);
 assert.equal(recordEvidence(s,{id:'cat',skill:'listen',quality:'correct',source:'nova',eventId:'1'},now),false);
 recordEvidence(s,{id:'cat',skill:'listen',quality:'correct',source:'karuta',assisted:true},now+DAY);
 assert.equal(s.history.length,2);assert.equal(s.progress.cat.listen.correct,1);assert.equal(s.progress.cat.listen.lastQuality,'guess');
 recordEvidence(s,{id:'cat',skill:'spell',quality:'correct',source:'abc-hand'},now);assert.equal(s.progress.cat.spell.correct,1);assert.equal(s.progress.cat.recall,undefined);
 const restored=validateBackup({app:'english-stage',version:1,state:s},new Set(['cat']));assert.deepEqual(restored.progress,s.progress);
});
test('long term retirement needs all delayed intervals and a 60 day independent check; daily repetition cannot farm it',()=>{
 const s=initial();for(const skill of ['read','listen','recall'])for(const d of [0,1,4,11,25,55,115])recordEvidence(s,{id:'cat',skill,quality:'correct'},now+d*DAY);
 assert.equal(wordStatus(s,'cat').key,'settled');assert.deepEqual(dueTasks([{id:'cat'}],s,now+999*DAY),[]);
 recordEvidence(s,{id:'cat',skill:'listen',quality:'wrong'},now+1000*DAY);assert.notEqual(wordStatus(s,'cat').key,'settled');assert.equal(dueTasks([{id:'cat'}],s,now+1001*DAY).length,1);
 let p;for(let d=0;d<120;d++)p=updateProgress(p,'correct',now+d*DAY);assert.equal(p.retired,false);
});
test('today quota survives repeat visits and prioritizes due work; extension material does not inflate the 5th grade target',()=>{
 const cards=Array.from({length:100},(_,i)=>({id:'w'+i}));cards.push({id:'extra',level:'extension'});const s=initial();s.goal={date:'2027-01-08',dailyLimit:5};
 const g=goalPlan(cards,s,now);assert.equal(g.fresh,100);assert.equal(g.newCount,3);
 const a=automaticTasks(cards,s,now);assert.equal(a.length,3);for(const t of a)s.seen[t.id]=now;assert.equal(goalPlan(cards,s,now).available,0);assert(!automaticTasks(cards,s,now).some(t=>!s.seen[t.id]));
});
test('karuta writes objective evidence to the common wordbook without confusing hinted answers',()=>{
 const s=initial(),run={face:'meaning',errors:{},missed:[]};recordKarutaResult(s,run,'cat',{correct:true,eligible:true,choices:4,plays:1,slow:false,ms:1800,comparable:true},now);
 assert.equal(s.progress.cat.listen.correct,1);assert.equal(s.history[0].source,'karuta');
});
test('new forests require 80 waterings while old forests retain their earned scenery',()=>{
 const s=initial();for(let i=0;i<400;i++)recordForest(s);for(let i=0;i<79;i++)waterForest(s,i);assert.equal(forestJourney(s).area,0);waterForest(s,79);assert.equal(forestJourney(s).area,1);
 const old=initial();old.forest={version:1,total:139,watered:27,flowers:0,today:0,day:'',skills:[],decor:{}};assert.equal(forestJourney(old).area,1);assert.equal(forestJourney(old).local,7);recordForest(old);assert.equal(forestJourney(old).local,7);waterForest(old,27);assert.equal(forestJourney(old).local,7.25);
});
