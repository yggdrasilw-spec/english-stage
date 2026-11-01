import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateBackup} from '../dist/src/storage.js';
import {recordForest,forestJourney,validForest,decorateForest} from '../dist/src/forest.js';
import {journey} from '../dist/src/motivation.js';
const at=Date.parse('2026-11-01T14:59:00Z');
test('every five attempts earns water and stars on the same day; no XP invented',()=>{
 const s=initial();for(let i=0;i<15;i++)recordForest(s,{skill:'card'},at);
 assert.equal(s.stars,9);assert.equal(forestJourney(s,at).rounds,3);assert.equal(journey(s,at).xp,0);assert.equal(s.history.length,0);assert.equal(forestJourney(s,at).today,15);
});
test('Tokyo midnight clears only today count; breaks and multiple complete areas never erase growth',()=>{
 const s=initial();for(let i=0;i<205;i++)recordForest(s,{skill:'listen'},at);
 assert.equal(forestJourney(s,at).area,2);assert.equal(forestJourney(s,at+120000).today,0);assert.equal(forestJourney(s,at+86400000*30).total,205);
 recordForest(s,{skill:'read'},at+120000);assert.equal(forestJourney(s,at+120000).today,1);assert.deepEqual(s.forest.skills,['read']);
});
test('growth stages, water boundaries, recovery flowers and decorations are exact',()=>{
 const s=initial();for(let i=0;i<19;i++)recordForest(s,{},at);assert.equal(forestJourney(s,at).stage,0);assert.equal(forestJourney(s,at).untilTree,1);
 recordForest(s,{recovered:true},at);assert.equal(forestJourney(s,at).stage,1);assert.equal(s.forest.flowers,1);assert.equal(s.stars,12);
 assert.equal(decorateForest(s,0,0,'lantern_01'),false);assert.equal(decorateForest(s,0,0,'flower_small_01'),true);assert.equal(decorateForest(s,1,0,'flower_small_01'),false);assert.equal(decorateForest(s,0,6,'flower_small_01'),false);
});
test('old backups remain compatible; new backups preserve forest and reject corrupt counts and assets',()=>{
 const ids=new Set(['apple']),s=initial(),restore=x=>validateBackup({app:'english-stage',version:1,state:structuredClone(x)},ids);
 assert.equal(restore(s).forest,undefined);for(let i=0;i<5;i++)recordForest(s,{},at);decorateForest(s,0,0,'flower_small_01');assert.deepEqual(restore(s).forest,s.forest);
 for(const value of [-1,NaN,Infinity,1.5]){const f={...s.forest,total:value};assert.equal(validForest(f),false);assert.throws(()=>restore({...s,forest:f}));}
 assert.equal(validForest({...s.forest,decor:{'0:0':'<script>'}}),false);assert.equal(validForest({...s.forest,decor:{'99:0':'flower_small_01'}}),false);
});
