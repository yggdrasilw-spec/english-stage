import fs from 'node:fs';
import assert from 'node:assert/strict';
import {buildExamAudio} from './exam-audio-plan.mjs';
const cards=JSON.parse(fs.readFileSync(new URL('../dist/data/grade5.json',import.meta.url)));
assert.equal(cards.length,977);assert.equal(cards.filter(c=>c.kind==='word').length,822);assert.equal(cards.filter(c=>c.kind==='phrase').length,155);
assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
assert.equal(new Set(cards.map(c=>c.en.toLowerCase())).size,cards.length);
for(const c of cards){for(const k of ['id','en','ja','example','exampleJa','theme','explanation','source'])assert.ok(c[k],`${c.id}: ${k}`);
 assert.equal(c.audioMode,'google-neural2');assert.equal(c.audioText,({'Mr.':'Mister','Ms.':'Miz','Mrs.':'Missus','orange (color)':'orange'})[c.en]||c.en);assert.equal(c.exampleAudioText,c.example);
 if(c.image){assert.ok(c.image.url.startsWith('https://shiritori-images.yggdrasil-learning.workers.dev/assets/shiritori/')||/^assets\/vocabulary\/g5-w-ph-[a-z-]+\.svg$/.test(c.image.url));if(c.image.url.startsWith('assets/'))assert.ok(fs.existsSync(new URL('../dist/'+c.image.url,import.meta.url)));}
}
const overrides=JSON.parse(fs.readFileSync(new URL('../audio-voice-overrides.json',import.meta.url)));
const audio=JSON.parse(fs.readFileSync(new URL('../dist/data/audio-manifest.json',import.meta.url)));
assert.equal(audio.voice,'en-US-Neural2-F');assert.equal(audio.files.length,cards.length*4);assert.equal(new Set(audio.files.map(f=>f.path)).size,cards.length*4);
for(const c of cards)for(const part of ['word','example'])for(const speed of ['normal','slow']){
 const f=audio.files.find(f=>f.id===c.id&&f.part===part&&f.speed===speed);assert.ok(f,c.id+' '+part+' '+speed);assert.equal(f.text,part==='word'?c.audioText:c.example);
 assert.equal(f.voice||audio.voice,overrides.entries.find(o=>o.id===c.id&&o.part===part)?.voice||audio.voice);
 assert.match(f.path,/^assets\/audio\/[a-z0-9-]+\.mp3$/);const b=fs.readFileSync(new URL('../dist/'+f.path,import.meta.url));assert.ok(b.length>100);assert.ok(b.toString('ascii',0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224),'MP3 header');
}
console.log('PASS: 822 words, 155 phrases, unique IDs, examples, 3908 matching Neural2 MP3 files, trusted image references');
const exams=JSON.parse(fs.readFileSync(new URL('../dist/data/mock-exams.json',import.meta.url)));
let listeningCount=0;
for(const exam of exams.exams)for(const q of exam.questions)if(q.script){
 const plan=buildExamAudio(q);assert.equal(q.audio,plan.path,q.id+' audio request is stale');
 const b=fs.readFileSync(new URL('../dist/'+q.audio,import.meta.url));assert.ok(b.length>1000);
 assert.ok(b.toString('ascii',0,3)==='ID3'||(b[0]===255&&(b[1]&224)===224),'Exam MP3 header');listeningCount++;
}
assert.equal(listeningCount,75);console.log('PASS: 75 listening plans, speaker/question consistency, matching request hashes and MP3 files');
