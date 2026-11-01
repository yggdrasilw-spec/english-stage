import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildExamAudio,validateListening} from '../scripts/exam-audio-plan.mjs';
const questions=JSON.parse(fs.readFileSync(new URL('../dist/data/mock-exams.json',import.meta.url))).exams.flatMap(e=>e.questions);
const get=id=>structuredClone(questions.find(q=>q.id===id));

test('all 75 listening requests match shipped audio, and response options use the respondent voice',()=>{
 const listening=questions.filter(q=>q.script);assert.equal(listening.length,75);
 for(const q of listening){
  const plan=buildExamAudio(q);assert.equal(q.audio,plan.path,q.id);
  assert(fs.statSync(new URL('../dist/'+plan.path,import.meta.url)).size>1000);
  if(q.section==='l1'){
   // Independently check the current authored conversation: A male, B female, A male, B replies.
   assert.equal(q.listening.responseSpeaker,'B');
   const voices=[...plan.body.input.ssml.matchAll(/<voice name="([^"]+)">/g)].map(m=>m[1]);
   assert.deepEqual(voices,['en-US-Neural2-D','en-US-Neural2-F','en-US-Neural2-D','en-US-Neural2-F'],q.id);
  }
 }
});

test('six reported referent errors stay corrected, including subject versus father pronouns',()=>{
 for(const id of ['g5-m1-37','g5-m1-39','g5-m2-36','g5-m2-38','g5-m3-36','g5-m3-38']){
  const q=get(id);assert.match(q.listening.question.text,/the girl/);
  assert.equal(q.listening.question.subjectSpeaker,'B');assert.equal(q.listening.question.evidenceTurn,1);
  assert.equal(q.listening.speakers.B.gender,'female');validateListening(q);
 }
 const dog=get('g5-m1-37');assert.match(dog.listening.turns[1].text,/My dog is white/);assert.equal(dog.options[dog.answer],'White.');
 const walk=get('g5-m1-39');assert.equal(walk.options[walk.answer],'She walks.');
 const father=get('g5-m3-38');assert.equal(father.options[father.answer],'He is a teacher.');
});

test('dialogue question narration is explicitly separated from the two characters',()=>{
 for(const q of questions.filter(q=>q.section==='l2')){
  const ssml=buildExamAudio(q).body.input.ssml;
  assert.equal(q.listening.narratorVoice,'en-US-Neural2-H');
  assert(ssml.includes('<voice name="en-US-Neural2-H">'+q.listening.question.text+'</voice>'));
 }
});

test('reject regressions in response speaker, question gender, answer evidence, and transcript',()=>{
 const response=get('g5-m1-26');response.listening.responseSpeaker='A';assert.throws(()=>validateListening(response),/other speaker/);
 const dog=get('g5-m1-37');dog.listening.question.text=dog.listening.question.text.replace('girl','boy');dog.script=dog.script.replace('girl','boy');assert.throws(()=>validateListening(dog),/person\/voice mismatch/);
 const evidence=get('g5-m1-37');evidence.listening.question.evidenceTurn=0;assert.throws(()=>validateListening(evidence),/another speaker/);
 const voice=get('g5-m1-37');voice.listening.speakers.B.voice='en-US-Neural2-D';assert.throws(()=>validateListening(voice),/voice\/gender mismatch/);
 const options=get('g5-m1-26');options.options[0]='different';assert.throws(()=>validateListening(options));
});

test('response voice follows the respondent when male and female speakers are reversed',()=>{
 const q=get('g5-m1-26');[q.listening.speakers.A,q.listening.speakers.B]=[q.listening.speakers.B,q.listening.speakers.A];
 const ssml=buildExamAudio(q).body.input.ssml;
 assert.deepEqual([...ssml.matchAll(/<voice name="([^"]+)">/g)].map(m=>m[1]),['en-US-Neural2-F','en-US-Neural2-D','en-US-Neural2-F','en-US-Neural2-D']);
});
