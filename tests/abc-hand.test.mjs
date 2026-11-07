import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/hunter-data.js',import.meta.url),'utf8');
const data=vm.runInNewContext(source+';({D,GI,GN,audioFiles,hunterBase,hunterPoints})');
test('hunter and ABC HAND share every vocabulary/genre/audio index and all MP3 files exist',()=>{
 assert.equal(data.D.length,data.GI.length);assert.equal(data.D.length,data.audioFiles.length);
 for(let i=0;i<data.D.length;i++){
  assert(data.GN[data.GI[i]]);assert(existsSync(new URL('../dist/assets/audio/'+data.audioFiles[i]+'.mp3',import.meta.url)));
  const word=data.D[i][0].replace(/ \(.*?\)/g,'').replace(/[^a-z]/gi,'');assert(word.length>0&&word.length<=16,word);
 }
 for(const file of ['abc-hand.html','hunter.html'])assert.match(readFileSync(new URL('../dist/'+file,import.meta.url),'utf8'),/src="hunter-data\.js\?v=[a-f0-9]+"/);
});
test('hunter scoring retains rounded pool scaling, combo thresholds and no-hint doubling',()=>{
 assert.equal(data.hunterBase(30),100);assert.equal(data.hunterBase(120),200);
 assert.deepEqual([1,2,3,5,6,10].map(c=>data.hunterPoints(100,c,true)),[100,200,600,1000,1800,4000]);
 assert.equal(data.hunterPoints(100,3,false),1200);
});
