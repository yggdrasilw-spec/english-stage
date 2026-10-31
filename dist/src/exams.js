const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={r1:'短文の空所補充',r2:'会話文の空所補充',r3:'語句の並べ替え',l1:'会話への応答',l2:'会話の内容',l3:'絵に合う英文'};
let data=null,ctx,media=null,generation=0,timer=null,playing=false,onlyWrong=false;
export function cleanupExam(){generation++;media?.pause();media=null;playing=false;clearInterval(timer);timer=null;}
export async function loadExams(){if(!data){const r=await fetch('data/mock-exams.json');if(!r.ok)throw Error('テストを読み込めません。通信を確認してもう一度開いてください。');data=await r.json();}return data;}
const answered=(run,qs)=>qs.filter(q=>Number.isInteger(run.answers[q.id])).length;
export function score(exam,run){return Object.fromEntries(['r','l'].map(p=>{const qs=exam.questions.filter(q=>q.section.startsWith(p));return [p,{correct:qs.filter(q=>run.answers[q.id]===q.answer).length,total:qs.length,answered:answered(run,qs)}];}));}
export function createRun(examId,phase='r',now=Date.now()){return {examId,phase,index:0,answers:{},plays:{},startedAt:now,deadline:now+(phase==='r'?25:20)*60000,readingDone:phase==='l'};}
async function playQuestion(q){
 if(playing)return;const run=ctx.state.mock.active;if((run.plays[q.id]||0)>=2)return;
 const my=++generation;playing=true;
 try{
  for(let repeat=0;repeat<2;repeat++){
   if(my!==generation||location.hash!=='#exam')return;
   const current=ctx.state.mock.active;if((current.plays[q.id]||0)>=2)break;
   // Save the count before playback, including across reloads.
   await ctx.mutate(s=>{s.mock.active.plays[q.id]=(s.mock.active.plays[q.id]||0)+1;});
   const a=repeat===0?new Audio(q.audio):media;a.currentTime=0;media=a;
   await new Promise((resolve,reject)=>{a.onended=resolve;a.onpause=()=>{if(my!==generation)resolve();};a.onerror=()=>reject(Error('音声を読み込めません。通信を確認し、再生をやり直してください。'));a.play().catch(reject);});
   if(my!==generation)return;
  }
 }catch(err){if(my===generation){await ctx.mutate(s=>{s.mock.active.plays[q.id]=Math.max(0,(s.mock.active.plays[q.id]||1)-1);});ctx.tell(err.message);}}
 finally{if(my===generation){playing=false;media=null;renderExam(ctx);}}
}
export async function renderExams(context){
 ctx=context;cleanupExam();const {app,state,mutate,tell}=context;
 app.innerHTML='<p>実戦テストを準備しています…</p>';
 try{await loadExams();}catch(err){tell(err.message);app.innerHTML='<p>読み込みに失敗しました。ホームからもう一度開いてください。</p>';return;}
 if(location.hash!=='#exams')return;
 const active=state.mock?.active;
 app.innerHTML=`<div class="narrow"><div class="eyebrow">GRADE 5 · PRACTICE</div><h1>実戦テスト</h1><p>リーディング25問・25分 ＋ リスニング25問・20分</p><p class="muted">すべて選択式。途中保存できます。音声は各問２回、再生の開始は自分で操作します。</p>${active?`<section class="panel"><h2>${e(data.exams.find(x=>x.id===active.examId)?.title)} のつづき</h2><p>回答は保存済み。制限時間は画面を閉じても進みます。</p><a class="primary button-link" href="#exam">再開する →</a></section>`:''}<div class="exam-list">${data.exams.map(ex=>{const attempts=(state.mock?.results||[]).filter(r=>r.examId===ex.id);return `<section class="panel"><h2>${e(ex.title)}</h2><p>空所補充15・会話5・並べ替え5<br>聞く：会話10・内容5・イラスト10</p>${attempts.length?`<small>前回：読む ${attempts.at(-1).score.r.correct}/25・聞く ${attempts.at(-1).score.l.correct}/25</small>`:'<small>まだ挑戦していません</small>'}<div class="actions"><button data-exam-start="${ex.id}" class="primary">挑戦する</button>${attempts.length?`<button data-exam-result="${ex.id}">前回を復習</button>`:''}</div></section>`;}).join('')}</div><details class="panel"><summary>形式・出典と使い方</summary><p>${e(data.notice)}</p><p>公式形式を参考に、初級の語彙・文法・日常会話を独自に作問しています。音声は米国英語の合成音声。実際の放送の進行・話者・間隔とは異なります。結果は正答数で、CSEスコア・合格確率への換算はしません。</p>${data.sources.map(s=>`<p><a href="${e(s.url)}" target="_blank" rel="noopener">${e(s.title)} ↗</a></p>`).join('')}</details><div id="exam-confirm"></div></div>`;
 app.querySelectorAll('[data-exam-start]').forEach(b=>b.onclick=()=>{const begin=async()=>{await mutate(s=>{s.mock||={results:[]};s.mock.active=createRun(b.dataset.examStart);});location.hash='exam';};if(!active){begin();return;}const box=app.querySelector('#exam-confirm');box.innerHTML='<section class="panel"><p>保存中のテストを終了して、新しく始めますか？</p><button id="exam-replace">新しく始める</button> <a href="#exam">保存中のテストへ戻る</a></section>';box.querySelector('button').onclick=begin;box.scrollIntoView({block:'center'});});
 app.querySelectorAll('[data-exam-result]').forEach(b=>b.onclick=()=>{onlyWrong=false;location.hash='exam-result/'+b.dataset.examResult;});
}
export async function renderExam(context){
 ctx=context;const {app,state,mutate,tell}=context;clearInterval(timer);
 try{await loadExams();}catch(err){tell(err.message);return;}
 if(location.hash!=='#exam')return;
 const run=state.mock?.active,exam=data.exams.find(x=>x.id===run?.examId);
 if(!run||!exam){location.hash='exams';return;}
 if(run.phase==='break'){
  cleanupExam();app.innerHTML='<section class="narrow panel card"><h1>次はリスニング</h1><p>25問・20分。音量を確認し、準備ができたら始めよう。</p><p>リーディングの回答は確定しました。</p><button id="exam-sound-check">▶ 音声を確認</button><button id="exam-listen-start" class="primary">リスニングを始める</button><p><a href="#exams">あとで始める</a></p></section>';
  app.querySelector('#exam-sound-check').onclick=()=>{media?.pause();media=new Audio(exam.questions[25].audio);media.play().catch(()=>tell('音声を再生できません。音量・通信を確認してください。'));};
  app.querySelector('#exam-listen-start').onclick=()=>{cleanupExam();mutate(s=>Object.assign(s.mock.active,{phase:'l',index:0,deadline:Date.now()+20*60000}));};return;
 }
 const qs=exam.questions.filter(q=>q.section.startsWith(run.phase)),q=qs[run.index]||qs[0];
 const advancePhase=()=>{cleanupExam();return mutate(s=>{const r=s.mock.active;if(r.phase==='r'){r.phase='break';r.readingDone=true;r.index=0;}else{const result={...r,finishedAt:Date.now(),score:score(exam,r)};s.mock.results=[...(s.mock.results||[]),result].slice(-30);s.mock.active=null;location.hash='exam-result/'+exam.id;}});};
 if(Date.now()>=run.deadline){await advancePhase();return;}
 const isAudio=run.phase==='l',hideOptions=['l1','l3'].includes(q.section),count=run.plays[q.id]||0;
 app.innerHTML=`<div class="exam-wrap"><div class="fast-top"><a href="#exams" id="exam-save">中断・保存</a><strong>${e(exam.title)} · ${isAudio?'聞く':'読む'}</strong><span id="exam-clock" role="timer" aria-label="残り時間"></span></div><div class="section-head"><h2>${e(labels[q.section])}</h2><span>${run.index+1} / 25</span></div><section class="panel exam-question"><p class="exam-prompt" lang="${isAudio||q.section==='r3'?'ja':'en-US'}">${e(q.prompt).replace(/\n/g,'<br>')}</p>${q.scene?`<div class="exam-scene">${q.scene}</div>`:''}${isAudio?`<div class="actions"><button id="exam-play" class="primary" ${playing||count>=2?'disabled':''}>${playing?'再生中…':count>=2?'２回再生済み':'▶ '+(count?'残り１回を聞く':'２回聞く')}</button><span>${count} / 2 回</span></div>`:''}<div class="exam-options">${q.options.map((o,i)=>`<button data-exam-answer="${i}" aria-pressed="${run.answers[q.id]===i}" ${run.answers[q.id]===i?'class="selected"':''}>${i+1}${hideOptions?'':'. '+e(o)}</button>`).join('')}</div></section><div class="exam-controls"><button id="exam-prev" ${run.index===0?'disabled':''}>← 前へ</button><span>${Number.isInteger(run.answers[q.id])?'回答済み':'未回答'}</span><button id="exam-next">${run.index===24?'確認へ':'次へ →'}</button></div><details><summary>問題一覧 · 回答 ${answered(run,qs)} / 25</summary><div class="exam-grid">${qs.map((x,i)=>`<button data-exam-jump="${i}" class="${run.answers[x.id]!==undefined?'answered':''}" aria-label="${i+1}問目 ${run.answers[x.id]!==undefined?'回答済み':'未回答'}" ${i===run.index?'aria-current="step"':''}>${i+1}</button>`).join('')}</div></details><div id="exam-submit"></div></div>`;
 const $=s=>app.querySelector(s);
 const nav=i=>{cleanupExam();mutate(s=>{s.mock.active.index=i;});};
 $('#exam-save').onclick=cleanupExam;
 if(isAudio)$('#exam-play').onclick=()=>playQuestion(q);
 app.querySelectorAll('[data-exam-answer]').forEach(b=>b.onclick=()=>mutate(s=>{s.mock.active.answers[q.id]=+b.dataset.examAnswer;}));
 $('#exam-prev').onclick=()=>nav(run.index-1);
 app.querySelectorAll('[data-exam-jump]').forEach(b=>b.onclick=()=>nav(+b.dataset.examJump));
 $('#exam-next').onclick=()=>{if(run.index<24){nav(run.index+1);return;}const n=25-answered(run,qs);$('#exam-submit').innerHTML=`<section class="panel"><h2>${isAudio?'テストを採点する':'リーディングを終了する'}</h2><p>${n?'未回答が '+n+' 問あります（不正解として採点）。':'25問すべて回答しています。'}${isAudio?'':'終了すると読む問題には戻れません。'}</p><button id="exam-confirm-submit" class="primary">${isAudio?'採点する':'確定してリスニングへ'}</button> <button id="exam-cancel-submit">見直す</button></section>`;$('#exam-confirm-submit').onclick=advancePhase;$('#exam-cancel-submit').onclick=()=>{$('#exam-submit').innerHTML='';};$('#exam-submit').scrollIntoView({block:'center'});};
 const tick=()=>{if(location.hash!=='#exam'){clearInterval(timer);return;}const sec=Math.max(0,Math.ceil((run.deadline-Date.now())/1000));const clock=$('#exam-clock');if(clock)clock.textContent=Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0');if(sec===0){clearInterval(timer);advancePhase();}};tick();timer=setInterval(tick,1000);
}
export async function renderResult(context,id){
 ctx=context;cleanupExam();const {app,state,tell}=context;try{await loadExams();}catch(err){tell(err.message);return;}
 if(!location.hash.startsWith('#exam-result/'))return;
 const run=(state.mock?.results||[]).filter(r=>r.examId===id).at(-1),exam=data.exams.find(x=>x.id===id);if(!run||!exam){location.hash='exams';return;}
 const result=score(exam,run),total=result.r.correct+result.l.correct;
 app.innerHTML=`<div class="narrow"><a href="#exams">← テスト一覧</a><h1>${e(exam.title)} の結果</h1><section class="panel result-score"><strong>${total}<small> / 50</small></strong><p>読む ${result.r.correct} / 25 · 聞く ${result.l.correct} / 25</p><small>独自問題の正答数です。CSEスコア・合格確率ではありません。</small></section><div class="mode-tabs"><button id="result-all" aria-pressed="${!onlyWrong}">すべて</button><button id="result-wrong" aria-pressed="${onlyWrong}">まちがい・未回答</button></div>${exam.questions.filter(q=>!onlyWrong||run.answers[q.id]!==q.answer).map(q=>`<details class="panel result-item"><summary>${run.answers[q.id]===q.answer?'✓':'△'} ${exam.questions.indexOf(q)+1}. ${e(labels[q.section])}</summary><p class="exam-prompt">${e(q.prompt).replace(/\n/g,'<br>')}</p>${q.scene?`<div class="exam-scene">${q.scene}</div>`:''}<p>自分の回答：${run.answers[q.id]===undefined?'未回答':e(q.options[run.answers[q.id]])}</p><p class="correct-text">正解：${q.answer+1}. ${e(q.options[q.answer])}</p><p>${e(q.explanation)}</p>${q.script?`<audio controls preload="none" src="${e(q.audio)}"></audio><p class="transcript" lang="en-US">${e(q.script).replace(/\n/g,'<br>')}</p>`:''}</details>`).join('')}<a class="button-link primary" href="#fast">カードで確認する →</a></div>`;
 app.querySelector('#result-all').onclick=()=>{onlyWrong=false;renderResult(context,id);};app.querySelector('#result-wrong').onclick=()=>{onlyWrong=true;renderResult(context,id);};
}
