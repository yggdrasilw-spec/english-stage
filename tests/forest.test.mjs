import test from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateBackup} from '../dist/src/storage.js';
import {recordForest,forestJourney,validForest,decorateForest,waterForest} from '../dist/src/forest.js';
import {forestScene} from '../dist/src/forest-view.js';
import {forestFlowers,fogProgress} from '../dist/src/forest-geometry.js';
import {isOpenGround} from '../dist/src/forest-expansion.js';
import {journey} from '../dist/src/motivation.js';
const at=Date.parse('2026-11-01T14:59:00Z');
const earn=(s,n)=>{for(let i=0;i<n;i++)recordForest(s,{skill:'read'},at);};

test('water can be earned repeatedly without growing scenery or granting stars or XP',()=>{
 const s=initial(),before=forestScene(s);earn(s,15);
 assert.equal(s.stars,0);assert.equal(forestJourney(s,at).pending,3);assert.equal(forestJourney(s,at).watered,0);
 assert.equal(forestScene(s),before);assert.equal(journey(s,at).xp,0);assert.equal(s.history.length,0);
});

test('each watering consumes exactly one unit and visibly adds a flower; stale clicks cannot spend twice',()=>{
 const s=initial();assert.equal(waterForest(s,0),null);earn(s,10);
 const before=forestScene(s),first=waterForest(s,0);assert.match(first.change,/花/);
 assert.equal(forestJourney(s).pending,1);assert.equal(forestJourney(s).watered,1);assert.notEqual(forestScene(s),before);
 assert.equal(waterForest(s,0),null);assert.equal(forestJourney(s).pending,1);
 assert(waterForest(s,1));assert.equal(forestJourney(s).pending,0);assert.equal(waterForest(s,2),null);
});

test('growth milestones match the displayed flowers, tree, pond, bridge and animals across two forests',()=>{
 const s=initial();earn(s,200);
 for(let n=1;n<=40;n++){
  const change=waterForest(s,n-1);assert(change);assert.equal(change.area,Math.floor((n-1)/20));
  const j=forestJourney(s,at);assert.equal(j.area,Math.floor(n/20));assert.equal(j.local,n%20);
  const scene=forestScene(s,change.area),local=(n-1)%20+1;
  assert.equal((scene.match(/forest-bloom/g)||[]).length,local*3);
  assert.equal(scene.includes(' forest-pond"'),local>=8);
  assert.equal(scene.includes(' forest-bridge"'),local>=10);
  assert.equal(scene.includes(' forest-animal"'),local>=12);
  assert.equal(scene.includes(' forest-squirrel"'),local>=16);
  if(local===20)assert.match(change.change,/完成/);
 }
 assert.equal(forestJourney(s).pending,0);assert.match(forestScene(s,0),/花咲く木/);
});

test('Tokyo midnight and long breaks preserve unused water and partial progress',()=>{
 const s=initial();earn(s,8);recordForest(s,{skill:'listen'},at+120000);recordForest(s,{skill:'listen'},at+120000);
 assert.equal(forestJourney(s,at+120000).today,2);assert.equal(forestJourney(s,at+120000).pending,2);
 assert.equal(forestJourney(s,at+30*86400000).pending,2);assert.equal(forestJourney(s,at+30*86400000).watered,0);
});

test('legacy saves preserve already grown forests and only new water needs manual watering',()=>{
 const s=initial();s.stars=18;s.forest={version:1,total:104,flowers:1,day:'2026-11-01',today:104,skills:['read'],decor:{'1:0':'flower_small_01'}};
 const old=forestJourney(s,at);assert.equal(old.area,1);assert.equal(old.pending,0);assert.equal(old.watered,20);
 recordForest(s,{},at);assert.equal(s.forest.watered,20);assert.equal(forestJourney(s).pending,1);assert.equal(forestJourney(s).area,1);
 assert(waterForest(s,20));assert.equal(s.stars,18);assert.equal(s.forest.decor['1:0'],'flower_small_01');
});

test('backups preserve pending water and consumed growth and reject invalid balances',()=>{
 const ids=new Set(['apple']),s=initial(),restore=x=>validateBackup({app:'english-stage',version:1,state:structuredClone(x)},ids);
 assert.equal(restore(s).forest,undefined);earn(s,10);waterForest(s,0);decorateForest(s,0,0,'flower_small_01');
 const restored=restore(s);assert.deepEqual(restored.forest,s.forest);assert.equal(forestJourney(restored).pending,1);
 for(const value of [-1,NaN,Infinity,1.5,3]){assert.equal(validForest({...s.forest,watered:value}),false);assert.throws(()=>restore({...s,forest:{...s.forest,watered:value}}));}
 for(const value of [-1,NaN,Infinity,1.5])assert.equal(validForest({...s.forest,total:value}),false);
 assert.equal(decorateForest(s,1,0,'flower_small_01'),false);assert.equal(decorateForest(s,0,6,'flower_small_01'),false);
 assert.equal(validForest({...s.forest,decor:{'0:0':'<script>'}}),false);
 assert.equal(validForest({...s.forest,decor:{'1:0':'flower_small_01'}}),false);
});

test('flowers scatter stably in previously open ground; mist retreats only every fourth watering',()=>{
 for(let area=0;area<5;area++){
  let before=[];
  for(let local=0;local<=20;local++){
   const points=forestFlowers(local,area);assert.equal(points.length,local*3);
   assert.deepEqual(points.slice(0,before.length),before);
   for(const p of points)assert(isOpenGround(p.x,p.y,fogProgress(p.water-1),[],45));
   for(let i=0;i<points.length;i++)for(let j=i+1;j<points.length;j++)assert(Math.hypot(points[i].x-points[j].x,points[i].y-points[j].y)>=48);
   assert.equal(fogProgress(local),Math.floor(local/4)*20);before=points;
  }
 }
 assert.notDeepEqual(forestFlowers(4,0),forestFlowers(4,1));
 const s=initial();earn(s,25);
 for(let n=0;n<5;n++){const r=waterForest(s,n);assert.equal(r.flowersAdded,3);assert.equal(r.fogExpanded,n===3);}
});
