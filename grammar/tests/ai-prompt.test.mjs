import test from 'node:test';
import assert from 'node:assert/strict';
import {questionBank,lessons} from '../content.js';
import {buildHandoff,normalizeDraft,recommendedTopics} from '../ai-prompt.js';
const now=Date.now();
const a=(qid,correct,chosen,at=now-1000,sid='test')=>({qid,correct,...(chosen===undefined?{}:{chosen}),at,sid,id:`${sid}:${qid}:${at}`});

test('handoff carries actual incorrect answer, correct rule, and evidence only for selected topics',()=>{
 const h=buildHandoff({selectedIds:['third-s']},{attempts:[a('third-s-1',false,'play'),a('be-1',false,'is')]});
 assert(h.valid);assert.equal(h.payload.mistakes.length,1);const m=h.payload.mistakes[0];assert.equal(m.questionId,'third-s-1');assert.equal(m.learnerAnswer.text,'play');assert.equal(m.correctAnswer,'plays');assert.match(m.explanation,/Ken/);assert.equal(h.payload.summaries[0].attemptCount,1);assert.equal(h.payload.summaries[0].status,'確認中');assert(!h.text.includes('be-1'));
});
test('old records never invent the chosen distractor; exact same-session answers can supply it',()=>{
 const record=a('third-s-1',false,undefined),input={selectedIds:['third-s']};
 assert.equal(buildHandoff(input,{attempts:[record]}).payload.mistakes[0].learnerAnswer.text,null);
 const context={sid:'test',answers:[{qid:'third-s-1',correct:false,chosen:'play'}]};
 assert.equal(buildHandoff(input,{attempts:[record],contexts:[context]}).payload.mistakes[0].learnerAnswer.text,'play');
 assert.equal(buildHandoff(input,{attempts:[record],contexts:[{...context,sid:'unrelated'}]}).payload.mistakes[0].learnerAnswer.text,null);
 assert.equal(buildHandoff(input,{attempts:[a('third-s-1',false,'plays')]}).payload.mistakes[0].learnerAnswer.text,null);
});
test('excluding history actually removes evidence while preserving topic references',()=>{
 const h=buildHandoff({selectedIds:['third-s'],includeHistory:false},{attempts:[a('third-s-1',false,'play')]});
 assert.equal(h.payload.mistakes.length,0);assert.equal(h.payload.summaries.length,0);assert.equal(h.payload.totalMistakenQuestions,0);assert.equal(h.payload.teachingReference[0].topic,'三単現のs');assert.equal(h.payload.historyIncluded,false);
});
test('a later correct answer is reported as improvement without erasing the earlier mistake',()=>{
 const attempts=[a('third-s-1',false,'play',now-2000),a('third-s-1',true,'plays',now-1000,'later')];
 const h=buildHandoff({selectedIds:['third-s']},{attempts});assert.match(h.payload.mistakes[0].laterRecord,/その後/);assert.equal(h.payload.summaries[0].distinctQuestions,1);assert.deepEqual(recommendedTopics(attempts),[]);
});
test('many errors stay bounded and a specifically requested old error has priority',()=>{
 const q=questionBank.slice(0,12),attempts=q.map((q,i)=>a(q.id,false,q.mode==='order'?'bad order':q.choices.find(c=>c!==q.answer),now-20000+i));
 const h=buildHandoff({selectedIds:lessons.map(l=>l.id),focusQids:[q[0].id]},{attempts});assert.equal(h.payload.mistakes.length,8);assert.equal(h.payload.totalMistakenQuestions,12);assert.equal(h.payload.omittedMistakenQuestions,4);assert.equal(h.payload.mistakes[0].questionId,q[0].id);
});
test('missing topics block export; custom topics work with no fabricated evidence',()=>{
 assert.equal(buildHandoff({}).valid,false);assert.equal(buildHandoff({selectedIds:['missing']}).text,'');
 const h=buildHandoff({customTopic:'現在形と現在進行形の違い',mode:'text',minutes:15});assert(h.valid);assert.equal(h.payload.customTopic,'現在形と現在進行形の違い');assert.equal(h.payload.summaries.length,0);assert.match(h.text,/文字で対話する場合/);assert.match(h.text,/15分程度/);
 assert.equal(normalizeDraft({goal:'__proto__'}).goal,'verify');assert.equal(normalizeDraft(null).goal,'verify');
});
test('coaching targets reasoning rather than advanced vocabulary, waits one question at a time',()=>{
 const h=buildHandoff({selectedIds:['be'],goal:'transfer'});
 assert.match(h.text,/英語の未習事項を、思考力の低さと混同しない/);assert.match(h.text,/難しい単語ではなく、比較・理由・推論/);assert.match(h.text,/一問だけ出し、必ず返答を待つ/);assert.match(h.text,/音声機能がない環境/);assert.equal(h.payload.summaries[0].status,'未確認');
});
