import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {score,createRun} from '../dist/src/exams.js';
import {initial,validateBackup} from '../dist/src/storage.js';
const data=JSON.parse(fs.readFileSync(new URL('../dist/data/mock-exams.json',import.meta.url)));
test('three complete choice-only forms match official section counts; every listening item has an MP3 and illustration where needed',()=>{
 assert.equal(data.exams.length,3);const ids=new Set();
 for(const ex of data.exams){assert.equal(ex.questions.length,50);assert.deepEqual(Object.fromEntries(['r1','r2','r3','l1','l2','l3'].map(k=>[k,ex.questions.filter(q=>q.section===k).length])),{r1:15,r2:5,r3:5,l1:10,l2:5,l3:10});
 for(const q of ex.questions){assert(!ids.has(q.id));ids.add(q.id);assert.equal(q.options.length,['l1','l3'].includes(q.section)?3:4);assert.equal(new Set(q.options).size,q.options.length);assert(q.options[q.answer]);assert(q.explanation);
 if(q.script){assert(/^assets\/audio\/exam-g5-m[123]-\d{2}-[a-f0-9]{16}\.mp3$/.test(q.audio));assert(fs.statSync(new URL('../dist/'+q.audio,import.meta.url)).size>1000);}
 if(['l1','l3'].includes(q.section))assert(q.scene.includes('<svg'));}
 }
});
test('unanswered items get zero and reading and listening scores remain separate',()=>{const ex=data.exams[0],run=createRun(ex.id,'r',1000);assert.equal(run.deadline,1501000);assert.deepEqual(score(ex,run),{r:{correct:0,total:25,answered:0},l:{correct:0,total:25,answered:0}});for(const q of ex.questions)run.answers[q.id]=q.answer;run.answers[ex.questions[0].id]=(ex.questions[0].answer+1)%4;delete run.answers[ex.questions[25].id];assert.deepEqual(score(ex,run),{r:{correct:24,total:25,answered:25},l:{correct:24,total:25,answered:24}});});
test('mock progress survives backup and malformed audio counts are rejected',()=>{const s=initial(),run=createRun('g5-m1');run.answers['g5-m1-01']=2;run.plays['g5-m1-26']=1;s.mock={active:run,results:[]};const backup={app:'english-stage',version:1,state:s};assert.deepEqual(validateBackup(structuredClone(backup),new Set()).mock,s.mock);run.plays['g5-m1-26']=3;assert.throws(()=>validateBackup(backup,new Set()),/実戦テスト/);});
