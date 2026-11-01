import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateBackup} from '../dist/src/storage.js';
import {recordKarutaResult,karutaRecord} from '../dist/src/karuta-learning.js';
import {createKaruta,takeKaruta,validKaruta} from '../dist/src/karuta-session.js';
import {karutaGrowth,renderKarutaResults} from '../dist/src/karuta-results.js';
const cards=Array.from({length:8},(_,i)=>({id:'w'+i,en:'word'+i,ja:'意味'+i,theme:'動物'}));
const evidence={correct:true,ms:3000,plays:1,slow:false,choices:8,comparable:true,eligible:false};
const snapshot={ms:3000,plays:1,mistakes:0,slow:false,choices:8,comparable:true};
test('growth names concrete improvements without turning slower results into failure',()=>{
 const result=(previous,current)=>karutaGrowth({previous,current,first:false});
 assert.deepEqual(result({...snapshot,ms:5000},snapshot).notes,['2.0秒速く取れた！']);
 assert.deepEqual(result({...snapshot,mistakes:2,plays:3},snapshot).notes,['おてつきが2回へった！','聞き直しが2回へった！']);
 assert.deepEqual(result(snapshot,{...snapshot,ms:5000,mistakes:1}).notes,['今回も取れた！']);
 assert.deepEqual(karutaGrowth({previous:null,current:snapshot,first:true}).notes,['はじめて取れた！']);
 assert.equal(karutaGrowth().improved,false);
});
test('speed comparisons require matching conditions and usable timing',()=>{
 for(const change of [{choices:1},{slow:true},{plays:2},{mistakes:1},{comparable:false},{ms:null}]){
  assert.equal(karutaGrowth({previous:{...snapshot,ms:5000},current:{...snapshot,...change},first:false}).notes.some(n=>n.includes('秒速く')),false);
 }
 assert.equal(karutaGrowth({previous:{...snapshot,ms:3040},current:snapshot,first:false}).improved,false);
 assert.equal(karutaGrowth({previous:{...snapshot,ms:3050},current:{...snapshot,ms:3049},first:false}).improved,false);
});
test('previous take survives mistakes, completion, reload and backup with a stable per-round comparison',()=>{
 const s=initial(),ids=new Set(cards.map(c=>c.id)),run=createKaruta(cards,'動物',8),id=run.order[0];s.karuta=run;
 const old={face:'meaning',missed:[],errors:{[id]:2}};
 recordKarutaResult(s,old,id,{...evidence,ms:6000,plays:3});
 recordKarutaResult(s,run,id,{...evidence,correct:false});takeKaruta(run,run.order[1]);
 recordKarutaResult(s,run,id,evidence);takeKaruta(run,id);
 assert.equal(run.results[id].previous.ms,6000);assert.equal(run.results[id].previous.mistakes,2);assert.equal(run.results[id].current.mistakes,1);assert.equal(run.results[id].first,false);
 const saved=validateBackup({app:'english-stage',version:1,state:structuredClone(s)},ids);
 assert.deepEqual(saved.karuta.results,run.results);
 const stable=structuredClone(run.results[id]);recordKarutaResult(s,{face:'meaning',missed:[],errors:{}},id,{...evidence,ms:2000});assert.deepEqual(run.results[id],stable);
 assert.equal(karutaRecord(s,id).lastTake.ms,2000);
 for(const mutate of [k=>k.results[id].current.ms=-1,k=>k.results[id].previous.choices=100,k=>k.results[id].first='yes',k=>k.errors[id]=-1]){
  const broken=structuredClone(run);mutate(broken);assert.equal(validKaruta(broken,ids),false);
 }
});
test('old saves remain valid; result table escapes content and collapses excess rows',()=>{
 const run=createKaruta(cards,'動物',8);delete run.results;delete run.errors;
 assert(validKaruta(run,new Set(cards.map(c=>c.id))));
 const html=renderKarutaResults(run,new Map(cards.map(c=>[c.id,{...c,en:'<script>bad</script>'}])));
 assert(!html.includes('<script>'));assert(html.includes('&lt;script&gt;'));assert(html.includes('のこり5語'));assert(html.includes('<table'));assert(!html.includes('はじめて取れた！'));
});
