import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const context=vm.createContext({setTimeout,clearTimeout,Date});
vm.runInContext(readFileSync(new URL('../dist/abc-hand-engine.js',import.meta.url),'utf8'),context);
const {createSpellingInput,createImageLoader}=context.ABCHand;
test('rapid taps reserve repeated letters exactly once and keep their order through mistakes',()=>{
 const input=createSpellingInput('BANANA'),tiles=[...'BANANA'].map(ch=>({ch}));
 assert.equal(input.accept({ch:'X'}).kind,'wrong');assert.equal(input.accepted,0);
 for(const tile of tiles){assert.equal(input.accept(tile).kind,'correct');assert.equal(input.accept(tile).kind,'ignored');}
 assert.equal(input.accepted,6);assert.equal(input.pending,6);
 assert.equal(input.accept({ch:'X'}).kind,'ignored');
 for(const tile of tiles)assert.equal(input.take(),tile);
 assert.equal(input.pending,0);assert.equal(input.take(),undefined);
});
test('slow images remain pending, concurrent preload is shared and decoded success is reused',async()=>{
 let image,requests=0;const loader=createImageLoader({makeImage(){requests++;return image={naturalWidth:100};},timeout:1000});
 const first=loader.load('https://example.com/cat.png');const second=loader.load('https://example.com/cat.png');
 assert.equal(first,second);assert.equal(requests,1);await new Promise(r=>setTimeout(r,25));assert.equal(image.src,'https://example.com/cat.png');
 image.onload();assert.equal(await first,'https://example.com/cat.png');assert.equal(await loader.load('https://example.com/cat.png'),'https://example.com/cat.png');assert.equal(requests,1);
});
test('temporary failures retry with a new URL and permanent failures permit a later manual retry',async()=>{
 const urls=[];let failed=2;
 const loader=createImageLoader({delay:()=>Promise.resolve(),makeImage(){return {naturalWidth:100,set src(url){if(!url)return;urls.push(url);queueMicrotask(()=>failed-->0?this.onerror():this.onload());}};}});
 const source=await loader.load('https://example.com/cat.png');assert.equal(urls.length,3);assert.match(source,/abc_retry=/);
 failed=3;await assert.rejects(loader.load('https://example.com/dog.png'));const before=urls.length;failed=0;
 assert.match(await loader.load('https://example.com/dog.png',{force:true}),/abc_retry=/);assert.equal(urls.length,before+1);
});
test('a hung request times out, retries a bounded number of times and releases its stale image',async()=>{
 const timers=[],images=[];const loader=createImageLoader({attempts:2,delay:()=>Promise.resolve(),setTimer(fn){timers.push(fn);return timers.length;},clearTimer(){},makeImage(){const image={naturalWidth:100};images.push(image);return image;}});
 const pending=loader.load('https://example.com/hung.png');const rejected=assert.rejects(pending);
 timers[0]();await new Promise(r=>setImmediate(r));assert.equal(images[0].src,'');assert.equal(images.length,2);
 timers[1]();await rejected;assert.equal(images[1].src,'');assert.equal(images.length,2);
});
