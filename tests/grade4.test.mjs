import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {units,questions,passages,questionById} from '../dist/src/grade4-content.js';
import {initial,validateBackup} from '../dist/src/storage.js';
import {createGrade4Session,currentQuestion,submitGrade4,nextGrade4,validGrade4,unitStatus,courseStats,tokyoDay} from '../dist/src/grade4-core.js';
import {syncGrammar,validGrammarSnapshot,restoreGrammar} from '../dist/src/grammar-bridge.js';
import {validForest} from '../dist/src/forest.js';
const now=Date.parse('2026-11-09T03:00:00Z'),cards=JSON.parse(fs.readFileSync(new URL('../dist/data/grade5.json',import.meta.url))),ids=new Set(cards.map(c=>c.id));
function complete(s,time=now){let n=0;while(currentQuestion(s)){const q=currentQuestion(s),r=s.grade4.session;if(q.skill==='listening'){r.plays[q.id]=1;r.heard[q.id]=true;}assert(submitGrade4(s,{choice:q.answer,evidence:q.skill==='reading'?q.evidence:null},time+n++));assert(nextGrade4(s));}return s;}
test('bridge content: unique keys, independent variants, evidence, shared vocabulary, audio hashes',()=>{
 assert.equal(units.length,10);assert.equal(questions.length,140);assert.equal(new Set(questions.map(q=>q.id)).size,140);
 for(const u of units){assert(ids.has(u.wordId));for(const v of ['a','b'])assert.equal(questions.filter(q=>q.unit===u.id&&q.variant===v).length,7);}
 for(const q of questions){assert.equal(new Set(q.choices).size,q.choices.length);assert(q.explanation);if(q.passageId){const p=passages.find(p=>p.id===q.passageId);assert(p);assert(p.sentences[q.evidence]);assert.equal(p.sentences.length,p.translation.length);}}
 const m=JSON.parse(fs.readFileSync(new URL('../dist/data/grade4-audio.json',import.meta.url)));assert.equal(m.files.length,40);
 for(const f of m.files){const p=passages.find(p=>p.id===f.passageId);assert.equal(f.text,p.sentences.join(' '));const body={input:{text:f.text},voice:{languageCode:'en-US',name:m.voice},audioConfig:{audioEncoding:'MP3',speakingRate:f.speed==='normal'?.95:.75}};assert.equal(crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0,16),f.hash);assert(fs.statSync(new URL('../dist/'+f.path,import.meta.url)).size>100);}
});
test('resume preserves question/answer order; double submission and next do not grant water twice',()=>{
 const s=initial(),r=createGrade4Session(s,'past-be','learn',now,()=>.3),copy=structuredClone(r);assert.equal(createGrade4Session(s,'past-irregular').id,r.id);assert.deepEqual(r.orders,copy.orders);
 const q=currentQuestion(s);assert(submitGrade4(s,{choice:q.answer},now));assert.equal(submitGrade4(s,{choice:q.answer},now),false);assert.equal(s.forest.total,1);assert.equal(s.history.length,0);assert.equal(Object.keys(s.progress).length,0);assert(validForest(s.forest));assert(nextGrade4(s));assert.equal(nextGrade4(s),false);assert(validGrade4(s.grade4));
});
test('listening completion, hints, evidence and retries are separate from independent results',()=>{
 const s=initial();createGrade4Session(s,'past-be','learn',now);complete(s);assert.equal(s.forest.total,7);assert.equal(unitStatus(s,'past-be',now).key,'review');assert.equal(unitStatus(s,'past-be',now+86400000).due,true);
 createGrade4Session(s,'past-be','learn',now+86400000);assert.equal(s.grade4.session.variant,'b');
 while(currentQuestion(s)?.skill!=='reading'){const q=currentQuestion(s);submitGrade4(s,{choice:q.answer},now+86400000);nextGrade4(s);}
 let q=currentQuestion(s);submitGrade4(s,{choice:q.answer,evidence:(q.evidence+1)%3},now+86400000);assert.equal(s.grade4.attempts.at(-1).guided,true);nextGrade4(s);
 q=currentQuestion(s);submitGrade4(s,{choice:q.answer,evidence:q.evidence},now+86400000);nextGrade4(s);
 q=currentQuestion(s);assert.throws(()=>submitGrade4(s,{choice:q.answer},now+86400000));s.grade4.session.supported.push(q.id);submitGrade4(s,{choice:q.answer},now+86400000);assert(s.grade4.attempts.at(-1).guided);assert.equal(courseStats(s).listening.independent,2);
});
test('stability needs different days and variants for every skill',()=>{
 const s=initial();createGrade4Session(s,'past-regular','learn',now);complete(s,now);createGrade4Session(s,'past-regular','learn',now+1000);complete(s,now+1000);assert.notEqual(unitStatus(s,'past-regular',now+2000).key,'stable');
 createGrade4Session(s,'past-regular','learn',now+86400000);complete(s,now+86400000);assert.equal(unitStatus(s,'past-regular',now+86400000+100).key,'stable');assert.equal(unitStatus(s,'past-regular',now+9*86400000).due,true);
 assert.equal(tokyoDay(Date.parse('2026-11-09T15:01:00Z')),'2026-11-10');
});
test('old backups work and corrupt grade4 records, evidence or option orders are rejected',()=>{
 assert(validateBackup({app:'english-stage',version:1,state:initial()},ids));
 const s=initial();createGrade4Session(s,'past-be','learn',now);complete(s);s.course=4;
 const wrapped=()=>({app:'english-stage',version:1,state:structuredClone(s)});assert(validateBackup(wrapped(),ids).grade4);
 for(const damage of [x=>x.grade4.attempts[0].choice=99,x=>x.grade4.attempts.push(x.grade4.attempts[0]),x=>x.grade4.session.orders[x.grade4.session.queue[0]]=[0,0,0,0],x=>x.grade4.session.index=-1,x=>x.course=3,x=>x.grade4.session.draft={qid:'bad',choice:0}]){const b=wrapped();damage(b.state);assert.throws(()=>validateBackup(b,ids));}
});
test('grammar bridge merges by attempt id, preserves settings and rejects bad backup evidence',()=>{
 let data={version:1,settings:{auto:true},attempts:[{id:'s1:past-be-1',sid:'s1',qid:'past-be-1',correct:true,chosen:'was',at:now,guided:false}]};const storage={getItem:()=>JSON.stringify(data),setItem:(_,v)=>data=JSON.parse(v)},s=initial();syncGrammar(s,storage);syncGrammar(s,storage);assert.equal(s.grammarBridge.attempts.length,1);assert(validGrammarSnapshot(s.grammarBridge));restoreGrammar(s.grammarBridge,storage);assert.equal(data.settings.auto,true);assert.equal(data.attempts.length,1);
 const bad=structuredClone(s.grammarBridge);bad.attempts[0].qid='unknown';assert.equal(validGrammarSnapshot(bad),false);const b={app:'english-stage',version:1,state:{...s,grammarBridge:bad}};assert.throws(()=>validateBackup(b,ids));
});

test('adding future keeps the starter check at eight and preserves saved past sessions',()=>{
 const s=initial();createGrade4Session(s,'past-be','learn',now,()=>.3);
 const q=currentQuestion(s);submitGrade4(s,{choice:q.answer},now);nextGrade4(s);
 const old=JSON.parse(JSON.stringify(s)),run=structuredClone(old.grade4.session);
 const restored=validateBackup({app:'english-stage',version:1,state:old},ids);
 assert.deepEqual(createGrade4Session(restored,'future','learn',now+1000),run);
 complete(restored);assert.equal(restored.grade4.attempts.length,7);
 createGrade4Session(restored,'past-be','diagnostic',now+2000);
 assert.equal(restored.grade4.session.queue.length,8);
 assert(restored.grade4.session.queue.every(id=>questionById(id).unit.startsWith('past-')));
 assert(validGrade4(restored.grade4));
});

test('future A/B practice supports delayed confirmation, backups and the separate lab evidence',()=>{
 const s=initial();createGrade4Session(s,'future','learn',now);complete(s);
 assert.equal(unitStatus(s,'future',now).key,'review');assert.equal(s.forest.total,7);
 const restored=validateBackup({app:'english-stage',version:1,state:JSON.parse(JSON.stringify(s))},ids);
 createGrade4Session(restored,'future','learn',now+86400000);
 assert.equal(restored.grade4.session.variant,'b');complete(restored,now+86400000);
 assert.equal(unitStatus(restored,'future',now+86400000+100).key,'stable');
 assert.equal(restored.forest.total,14);assert.equal(restored.history.length,0);
 assert.deepEqual(restored.progress,{});assert(validGrade4(restored.grade4));
 const storage={getItem:()=>JSON.stringify({version:1,attempts:[{id:'future-lab:future-1',sid:'future-lab',qid:'future-1',correct:true,chosen:'play',at:now,guided:false}]})};
 syncGrammar(restored,storage);assert(validGrammarSnapshot(restored.grammarBridge));
 assert.equal(restored.grammarBridge.attempts[0].qid,'future-1');
});

test('all new grammar units preserve old runs and need independent evidence on different days',()=>{
 const s=initial();createGrade4Session(s,'future','learn',now,()=>.3);
 const before=structuredClone(s.grade4.session);
 assert.deepEqual(createGrade4Session(s,'infinitive','learn',now),before);
 complete(s);
 for(const unit of ['infinitive','gerund','comparison','connectors','modals']){
  createGrade4Session(s,unit,'learn',now);complete(s);
  assert.equal(unitStatus(s,unit,now).key,'review');
  const copy=validateBackup({app:'english-stage',version:1,state:structuredClone(s)},ids);
  createGrade4Session(copy,unit,'learn',now+86400000);
  assert.equal(copy.grade4.session.variant,'b');complete(copy,now+86400000);
  assert.equal(unitStatus(copy,unit,now+86400000+100).key,'stable');
  assert(validGrade4(copy.grade4));
  assert.equal(copy.history.length,0);assert.deepEqual(copy.progress,{});
 }
});
