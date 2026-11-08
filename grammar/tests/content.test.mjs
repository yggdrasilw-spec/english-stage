import test from 'node:test';
import assert from 'node:assert/strict';
import {lessons,basic,questionBank,clean} from '../content.js';
import {grade,statusFor,diagnosticQueue,practiceQueue,makeSession,validSession,mergeAttempts} from '../core.js';
test('20 core lessons, seven extensions, complete original examples and fresh retry pools',()=>{
 assert.equal(basic.length,20);assert.equal(lessons.filter(l=>l.extension).length,7);
 assert.equal(new Set(lessons.map(l=>l.id)).size,27);assert.equal(new Set(questionBank.map(q=>q.id)).size,questionBank.length);
 for(const l of lessons){assert(l.examples.length>=2,l.id);assert(l.questions.length>=6,l.id);for(const e of l.examples){assert(e.parts.length>=2);assert(e.ja&&e.en&&e.point&&e.scene);assert(!/undefined|NaN/.test(e.en));}for(const q of l.questions){assert(q.hint&&q.sentence&&q.focus,q.id);if(q.mode==='order'){assert(grade(q,q.tokens.join(' ')),q.id);assert(!grade(q,[...q.tokens].reverse().join(' ')),q.id);}else{assert.equal(new Set(q.choices).size,3,q.id);assert(q.choices.includes(q.answer));assert(grade(q,q.answer));for(const wrong of q.choices.filter(c=>c!==q.answer))assert(!grade(q,wrong),q.id);}}}
});
test('grammar counterexamples: plural subjects, does, can, progressive and past',()=>{
 const find=p=>questionBank.find(q=>q.prompt===p);
 for(const [p,a,b]of[
 ['She is going to ___ tennis tomorrow.','play','plays'],['Will she ___ here tomorrow?','come','comes'],['Will Ken cook tomorrow? — No, he ___.','won’t','doesn’t'],
 ['She wants to ___ a doctor.','be','is'],['She enjoys ___ books.','reading','to read'],['Thank you for ___ me.','helping','to help'],['I like reading. と I like to read. は？','どちらも「読むことが好き」を表せる','ingだけがいつも正しい'],
 ['My cats ___ fast.','run','runs'],['The cat ___ fast.','runs','run'],['You ___ tennis.','play','plays'],['Does Ken ___ soccer?','play','plays'],['He can ___ fast.','run','runs'],['She ___ playing tennis now.','is','are'],['Did he ___ to school yesterday?','go','went'],['You ___ happy yesterday.','were','was'],['one tooth → two ___','teeth','tooths'],['She has ___ orange bag.','an','a'],['It is ___ big apple.','a','an']]){const q=find(p);assert(q,p);assert(grade(q,a),p);assert(!grade(q,b),p);}
});
const attempt=(qid,correct,i=0,at=Date.now(),sid='a')=>({id:`${sid}-${i}`,sid,qid,correct,at});
test('a single correct answer never implies mastery; delayed independent evidence does',()=>{
 const t=Date.now(),qs=lessons.find(l=>l.id==='be').questions;
 assert.equal(statusFor('be',[]).key,'new');assert.equal(statusFor('be',[attempt(qs[0].id,true)]).key,'checking');
 const a=qs.slice(0,4).map((q,i)=>attempt(q.id,true,i,t,'a'));
 assert.equal(statusFor('be',a).key,'review');assert.equal(statusFor('be',[...a,attempt(qs[4].id,true,5,t+1000,'b')]).key,'review');
 assert.equal(statusFor('be',[...a,attempt(qs[4].id,true,5,t+13*3600000,'b')]).key,'mastered');
 assert.equal(statusFor('be',[...a,attempt(qs[4].id,false,5,t+13*3600000,'b')]).key,'weak');
 const repeated=Array.from({length:8},(_,i)=>attempt(qs[0].id,true,i,t+i*3600000,'repeat'+i));assert.notEqual(statusFor('be',repeated).key,'mastered');
});
test('diagnostics cover core only; retries avoid the just-seen questions',()=>{
 const full=diagnosticQueue([],true);assert.equal(full.length,20);assert.equal(new Set(full.map(id=>questionBank.find(q=>q.id===id).lessonId)).size,20);
 assert.equal(diagnosticQueue([]).length,8);const pool=practiceQueue('be',[],4,['be-1']);assert(!pool.includes('be-1'));
 const attempts=[attempt('be-1',false,0),attempt('be-2',false,1)];assert(!practiceQueue('be',attempts,4).includes('be-1'));
});
test('session resumption rejects corrupted or incomplete option data',()=>{
 const s=makeSession(['be-1','word-order-1'],'practice','test');assert(validSession(s));assert(validSession(JSON.parse(JSON.stringify(s))));
 assert(!validSession({...s,index:8}));assert(!validSession({...s,options:{}}));assert(!validSession({...s,queue:['missing']}));assert(!validSession({...s,options:{...s.options,'be-1':['am','am','am']}}));
});
test('multi-tab attempt merging is idempotent and rejects broken records',()=>{
 const a=attempt('be-1',true),b=attempt('be-2',false,1);assert.equal(mergeAttempts([a,b],[a,b]).length,2);assert.equal(mergeAttempts([null,{id:'bad'},a]).length,1);assert.equal(clean('She [is playing] tennis.'),'She is playing tennis.');
});
