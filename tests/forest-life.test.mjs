import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {forestResidents,forestResidentSummary,forestArrival} from '../dist/src/forest-life.js';
import {forestFlowers,fogProgress} from '../dist/src/forest-geometry.js';
import {isOpenGround} from '../dist/src/forest-expansion.js';
import {nearPath} from '../dist/src/forest-landscape.js';
import {initial,validateBackup} from '../dist/src/storage.js';
import {forestScene} from '../dist/src/forest-view.js';
import {recordForest,waterForest} from '../dist/src/forest.js';

test('each watering adds woodland life; all referenced assets are shipped and all stages reopen identically',()=>{
 for(let area=0;area<31;area++){
  let before=[];
  for(let local=0;local<=20;local++){
   const items=forestResidents(local,area);assert(items.every(o=>o.at<=local));
   assert.deepEqual(items.slice(0,before.length),before);
   if(local)assert(items.length>before.length);
   for(const o of items)assert(existsSync(new URL('../dist/assets/forest/'+o.id+'.webp',import.meta.url)));
   before=items;
  }
  assert.equal(before.length,34);assert.equal(new Set(before.map(o=>o.key)).size,34);
 }
 assert.match(forestArrival(7),/ベンチ/);assert.match(forestArrival(20),/完成.*虹/);
});

test('ground ornaments stay on open grass, leave the path clear and avoid existing flower bases',()=>{
 for(let area=0;area<31;area++){
  const flowers=forestFlowers(20,area);
  for(const o of forestResidents(20,area).filter(o=>o.kind==='ground'&&!o.fixed)){
   const radius=Math.max(20,o.w*.28);
   assert(isOpenGround(o.x,o.y,fogProgress(o.at),[],45),o.key);
   assert(!nearPath(o.x-55,o.y-5,radius+20),o.key);
   assert(flowers.every(p=>Math.abs(o.x-p.x)>=radius+26||Math.abs(o.y-p.y)>=34),o.key);
  }
 }
});

test('pond visitors arrive after the pond and flower visitors stay near flowers',()=>{
 for(let area=0;area<31;area++){
  const items=forestResidents(20,area),flowers=forestFlowers(20,area),fish=items.find(o=>o.key==='fish');
  assert(fish.at>8);assert(((fish.x-1730)/160)**2+((fish.y-1165)/90)**2<1);
  assert(items.find(o=>o.key==='frog').at>8);assert(items.find(o=>o.key==='dragonfly').at>8);
  for(const o of items.filter(o=>o.flower!==undefined))assert(Math.hypot(o.x-flowers[o.flower].x,o.y-flowers[o.flower].y)<80);
  for(const o of items.filter(o=>o.relative&&o.kind==='ambience')){
   const anchor=items.find(p=>p.key===o.relative);assert.equal(o.x,anchor.x+o.dx);assert.equal(o.y,anchor.y+o.dy);
  }
 }
});

test('resident summaries count distinct species and distinguish scenery from ambient effects',()=>{
 assert.deepEqual(forestResidentSummary(0),{animals:0,objects:0,names:[]});
 const summary=forestResidentSummary(20);assert.equal(summary.animals,8);assert.equal(summary.objects,10);
 assert(!summary.names.includes('灯り'));assert(summary.names.includes('虹'));
});

test('existing saves and water balances acquire scenery without additional state or spending',()=>{
 const s=initial();s.stars=17;for(let i=0;i<160;i++)recordForest(s);for(let i=0;i<28;i++)waterForest(s,i);
 const before=structuredClone(s),restored=validateBackup({app:'english-stage',version:1,state:structuredClone(s)},new Set());
 assert.equal(forestScene(s),forestScene(restored));assert.deepEqual(s,before);assert.equal(s.stars,17);
 assert(forestScene(s).includes('data-resident="bench"'));assert(!forestScene(s).includes('data-resident="fish"'));
 for(let i=28;i<31;i++)waterForest(s,i);const reward=waterForest(s,31);assert.match(reward.arrival,/ランタン/);assert.equal(s.stars,17);
});
