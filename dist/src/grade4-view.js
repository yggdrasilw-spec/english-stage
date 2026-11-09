import {units,questionById,passageById} from './grade4-content.js';
import {grade4,createGrade4Session,currentQuestion,currentAttempt,submitGrade4,nextGrade4,unitStatus,recommendedUnit,courseStats} from './grade4-core.js';
import {grammarStatus} from './grammar-bridge.js';
import {readingHome,renderLongReading} from './grade4-long-reading-view.js';
import {renderVocabularyPractice} from './grade4-vocabulary-view.js';
import {grade4Plan} from './grade4-plan.js';
import {readingSetById} from './grade4-long-reading.js';
import {vocabularySetById, vocabularySets} from './grade4-vocabulary.js';
import {forestJourney} from './forest.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={vocab:'ことば',grammar:'文法',reading:'読む',listening:'聞く'};
let media=null,generation=0,manifest=null,loading=null;
export function cleanupGrade4(){generation++;if(media)media.pause();media=null;}
document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanupGrade4();});
export const courseSwitch=course=>`<nav class="course-switch" aria-label="学習する級"><button data-course="5" aria-pressed="${course!==4}">5級コース</button><button data-course="4" aria-pressed="${course===4}">4級コース</button></nav>`;
export function bindCourseSwitch({app, mutate}) {
  app.querySelectorAll('[data-course]').forEach(button => {
    button.onclick = async () => {
      const course = Number(button.dataset.course);
      await mutate(saved => { saved.course = course; }, {queue: true});
      app.querySelector('[data-course="' + course + '"]')?.focus({preventScroll: true});
    };
  });
}
const lessonLink=(u,label='ぶんぽうラボで図を見る')=>`<a class="g4-lesson-link" href="./grammar/?course=4#lesson/${u.lesson}">${esc(label)} ↗</a>`;
const activityIcons = {
  words: '<path d="M3 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H3zM21 5h-6a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h6z"/>',
  listen: '<path d="M4 14v-3a8 8 0 0 1 16 0v3M4 13h4v7H6a2 2 0 0 1-2-2zM20 13h-4v7h2a2 2 0 0 0 2-2z"/>',
  speak: '<path d="M4 4h16v12h-7l-5 4v-4H4zM8 10h.01m4 0h.01m4 0h.01"/>',
  test: '<path d="M6 4h12v17H6zM9 8h6m-6 4h6m-6 4 2 2 4-4"/>',
};
const activityLink = (icon, route, title, description, action) => `
  <a href="#grade4-${route}" class="g4-activity g4-activity-${icon}">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${activityIcons[icon]}</svg>
    <span><strong>${title}</strong><small>${description}</small></span>
    <span class="g4-activity-action">${action} <span aria-hidden="true">→</span></span>
  </a>`;

const recordsPanel = stats => `<section class="panel g4-records">
      <h2>4級の学習記録</h2><p>支援なしでの正解 / 解答数</p>
      <div class="g4-stats">${Object.entries(stats).map(([key, value]) => `<div>
        <span>${labels[key]}</span><strong>${value.correct} / ${value.independent}</strong>
        <small>支援あり ${value.answered - value.independent}問</small></div>`).join('')}</div>
      <p class="muted">別の日にも、違う場面で分かるか確かめよう。</p>
    </section>`;

export function renderGrade4Records({app, state}) {
  const plan = grade4Plan(state);
  app.innerHTML = `<div class="narrow g4-wrap">
    <a class="g4-plan-link" href="#home">← 4級ホーム</a>
    <span class="g4-kicker" lang="en">GRADE 4 / PROGRESS</span>
    <h1>学習の記録</h1>
    <section class="panel g4-home-plan">
      <h2>一巡した練習</h2>
      <div class="g4-plan-meter"><span>単元・ことば・長文</span><strong>${plan.total - plan.remaining.length} / ${plan.total}</strong></div>
      <progress value="${plan.total - plan.remaining.length}" max="${plan.total}" aria-label="一巡した練習"></progress>
      <a class="g4-plan-link" href="#grade4-plan">学習計画へ →</a>
    </section>
    ${recordsPanel(courseStats(state))}
    <div class="actions">
      <a class="button-link" href="#grade4-mock">実戦模試へ →</a>
      <a class="g4-plan-link" href="#settings">学習記録のバックアップ →</a>
    </div>
  </div>`;
}

export function renderGrade4Home(ctx) {
  const {app, state, mutate} = ctx;
  const plan = grade4Plan(state);
  const pending = plan.pending;
  const recommended = recommendedUnit(state, id => grammarStatus(state, id));
  const suggested = plan.todayTasks?.[0] || plan.review;
  const activeMock = state.grade4Exam?.active;
  const stats = courseStats(state);
  const forest = forestJourney(state);
  const completed = plan.total - plan.remaining.length;
  const terms = vocabularySets.reduce((count, set) => count + set.entries.length, 0);
  const title = pending
    ? ({diagnostic: 'はじめのチェック', reading: readingSetById(pending.unitId)?.title,
        vocabulary: vocabularySetById(pending.unitId)?.title, learn: units.find(u => u.id === pending.unitId)?.title})[pending.mode]
    : suggested?.title || recommended.title;
  const focus = pending ? '前回のつづき'
    : suggested ? '今日の予定 · 約' + suggested.minutes + '分' : 'おすすめの単元 · 約12分';
  const description = pending ? '答えたところまで、端末に保存しています。'
    : suggested?.mode === 'vocabulary' ? '例文の中で、ことばや熟語の意味を選ぼう。'
    : suggested?.mode === 'reading' ? '文章を読んで、答えの根拠を確かめよう。'
    : 'ことばから始めて、図・短い文章・音声へ。';
  const startLabel = pending ? 'つづきから · ' + (pending.index + 1) + ' / ' + pending.queue.length + '問'
    : !suggested && unitStatus(state, recommended.id).due ? '別の場面で、もう一度確かめる' : '今日の練習をはじめる';
  app.innerHTML = `<div class="narrow g4-wrap g4-home">
    ${courseSwitch(4)}
    <section class="g4-hero" aria-labelledby="g4-home-title">
      <div class="g4-hero-copy">
        <span class="g4-kicker" lang="en">ENGLISH STAGE / LEVEL 04</span>
        <h1 id="g4-home-title">英検4級コース</h1>
        <p>短い文から、会話と長文へ。</p>
      </div>
      <img src="assets/grade4-route.svg" alt="" width="324" height="192" class="g4-hero-art">
    </section>
    ${activeMock ? `<a class="g4-mock-resume" href="#grade4-mock">
      <strong>途中の実戦模試</strong><span>${activeMock.phase === 'break' ? '聞く問題の開始前' :
        (activeMock.phase === 'r' ? '読む' : '聞く') + ' · ' + (activeMock.index + 1) + '問目'} →</span>
    </a>` : ''}
    <div class="g4-home-top">
      <section class="panel g4-today" aria-labelledby="g4-today-title">
        <span class="g4-kicker">${focus}</span>
        <h2 id="g4-today-title">${esc(title)}</h2>
        <p>${description}</p>
        <button class="primary start" id="g4-start">${startLabel} <span aria-hidden="true">→</span></button>
        ${pending ? '<button id="g4-end">この回を区切る（解答済みの記録は残す）</button>' : ''}
      </section>
      <section class="panel g4-home-plan" aria-labelledby="g4-home-plan-title">
        <span class="g4-kicker">受験日まで</span>
        <h2 id="g4-home-plan-title">学習計画</h2>
        <p>${plan.days > 0 ? '学習できる日 あと<strong>' + plan.days + '日</strong>'
          : plan.days === 0 ? '次の受験日を設定できます。' : '受験日と、1日に使える時間を決めよう。'}</p>
        <div class="g4-plan-meter"><span>一巡した練習</span><strong>${completed} / ${plan.total}</strong></div>
        <progress value="${completed}" max="${plan.total}" aria-label="一巡した練習"></progress>
        <a class="g4-plan-link" href="#grade4-plan">${state.grade4Goal ? '今日の予定を見る' : '学習計画をつくる'} →</a>
      </section>
    </div>
    <details class="panel g4-check">
      <summary>はじめのチェック <span class="pill">8問</span></summary>
      <p>5級の基礎と、過去形・短い文章・音声を確認します。結果は開始位置の参考に使います。</p>
      <button id="g4-diagnostic" ${pending ? 'disabled' : ''}>チェックをはじめる</button>
    </details>
    <section class="g4-home-section" aria-labelledby="g4-skills-title">
      <div class="g4-section-heading"><span class="g4-kicker" lang="en">PRACTICE</span><h2 id="g4-skills-title">練習を選ぶ</h2></div>
      <div class="g4-activities">
        ${activityLink('words', 'vocab', 'ことば・熟語', terms + '項目 · 1回6問', '練習する')}
        ${activityLink('listen', 'dialogue', '会話の聞き取り', '二人の会話 · 6問', '聞き取りを練習する')}
        ${activityLink('speak', 'speaking', 'スピーキング', '音読と受け答え · 2題材', '題材を選ぶ')}
        ${activityLink('test', 'mock', '4級 実戦模試', '読む35問・聞く30問', activeMock ? '模試のつづきへ' : '模試を開く')}
      </div>
    </section>
    ${readingHome(state, pending)}
    <section class="g4-home-section" aria-labelledby="g4-units-title">
      <div class="g4-section-heading"><span class="g4-kicker" lang="en">LESSONS</span><h2 id="g4-units-title">図で学ぶ ${units.length}単元</h2></div>
      <div class="g4-units g4-unit-grid">${units.map((u, index) => {
        const status = unitStatus(state, u.id);
        const grammar = grammarStatus(state, u.lesson);
        return `<section class="panel">
          <div class="g4-unit-meta"><span class="g4-unit-number">${String(index + 1).padStart(2, '0')}</span>
            <span class="pill">${status.label}${status.due ? ' · 復習の時期' : ''}</span></div>
          <h3>${esc(u.title)}</h3><p class="muted">ラボの記録 · ${grammar.label}</p>
          <button data-unit="${u.id}" ${pending ? 'disabled' : ''}>${status.key === 'new' ? 'この単元をはじめる' : '別の場面で練習'}</button>
          ${lessonLink(u)}
        </section>`;
      }).join('')}</div>
    </section>
    ${recordsPanel(stats)}
    <section class="panel g4-forest-link">
      <div><h2>英語の森</h2><p>水 ${forest.pending}回分 · 次の水まで ${forest.untilWater}問</p></div>
      <a class="button-link" href="#forest">森で水をやる →</a>
    </section>
    <a class="g4-plan-link" href="#settings">5級・4級・ラボの記録をまとめて保存 →</a>
  </div>`;
  bindCourseSwitch(ctx);
  const start = async (id, mode = 'learn') => {
    await mutate(saved => {
      saved.course = 4;
      createGrade4Session(saved, id, mode);
    }, {queue: true});
    if (!location.hash || location.hash === '#home') location.hash = 'grade4';
  };
  app.querySelector('#g4-start').onclick = () => start(suggested?.id || recommended.id, suggested?.mode);
  app.querySelector('#g4-diagnostic').onclick = () => start('past-be', 'diagnostic');
  app.querySelectorAll('[data-unit]').forEach(button => button.onclick = () => start(button.dataset.unit));
  app.querySelectorAll('[data-g4-reading]').forEach(button => button.onclick = () => start(button.dataset.g4Reading, 'reading'));
  app.querySelector('#g4-end')?.addEventListener('click', () => mutate(saved => {
    if (saved.grade4?.session?.id === pending.id) saved.grade4.session = null;
  }));
}

function rule(u){return `<section class="panel g4-rule"><span class="eyebrow">図で、きまりを確認</span><h2>${esc(u.title)}</h2>${u.timeline||u.id.startsWith('past-')?`<div class="g4-time">${(u.timeline||['← 過去 / yesterday・last Sunday','現在 / today']).map(t=>`<span>${esc(t)}</span>`).join('')}</div>`:''}<p lang="en">${esc(u.before)}</p><p class="g4-example" lang="en">${esc(u.after)}</p><div class="g4-blocks">${u.parts.map((p,i)=>`<div><b lang="en">${esc(p)}</b><small>${esc(u.roles[i])}</small></div>`).join('')}</div><p>${esc(u.rule)}</p>${lessonLink(u)}<div class="g4-bottom"><button class="primary" id="g4-rule-next">別の文で確かめる →</button></div></section>`;}
const supportPassage=(s,q)=>{const r=s.grade4.session;for(const id of r.queue){const x=questionById(id);if(x.id===q.id||q.passageId&&x.passageId===q.passageId)if(!r.supported.includes(id))r.supported.push(id);}};
async function loadAudio(){if(manifest)return manifest;if(!loading)loading=fetch('data/grade4-audio.json').then(r=>{if(!r.ok)throw Error('音声を読み込めません。再試行するか、台本を見て練習できます。');return r.json();}).then(m=>manifest=m).finally(()=>loading=null);return loading;}
export function renderGrade4(ctx){
 const {app,state,mutate,tell}=ctx,g=grade4(state),run=g.session;
 if(!run){renderGrade4Home(ctx);return;}
 if(run.mode==='reading'){renderLongReading(ctx,run);return;}
 if(run.mode==='vocabulary'){renderVocabularyPractice(ctx,run);return;}
 const q=currentQuestion(state),u=units.find(u=>u.id===run.unitId);
 if(!q){
  const a=g.attempts.filter(a=>a.sid===run.id),ind=a.filter(a=>!a.guided),weak=[...new Set(a.filter(a=>!a.correct||a.guided).map(a=>questionById(a.qid).unit))];
  app.innerHTML=`<div class="narrow g4-wrap"><section class="panel"><div class="check">✓</div><h1>${run.mode==='diagnostic'?'はじめの確認、おつかれさま！':'今日のステップが終わりました'}</h1><p>支援なしで ${ind.filter(a=>a.correct).length} / ${ind.length}問正解。支援を使った確認は ${a.length-ind.length}問です。</p><p>次は別の日に、人物や場面の違う問題で確かめます。今日の正解は保存されています。</p>${weak.length?`<h2>もう一度確かめるところ</h2>${weak.map(id=>{const unit=units.find(u=>u.id===id);return `<p>${lessonLink(unit,unit.title)}</p>`;}).join('')}`:'<p>ことば・文法・読む・聞くを、別の場面でも試してみよう。</p>'}<div class="actions"><a href="#home" class="pill">ホームへ</a><a href="#forest" class="pill">森で水をやる</a><a href="#grade4-plan" class="pill">学習計画へ</a></div><button id="g4-again">別の場面で練習する</button></section></div>`;
  app.querySelector('#g4-again').onclick=()=>mutate(s=>{const id=s.grade4.session.unitId;s.grade4.session=null;createGrade4Session(s,id);});return;
 }
 const answered=currentAttempt(state),p=passageById(q.passageId),supported=run.supported.includes(q.id),draft=run.draft?.qid===q.id?run.draft:null;
 const head=`<div class="study-top"><span>${run.mode==='diagnostic'?'はじめのチェック':esc(u.title)} · ${run.index+1} / ${run.queue.length}</span><a href="#home">休んでホームへ</a></div><progress class="journey-meter" value="${run.index}" max="${run.queue.length}" aria-label="今日の進み具合"></progress>`;
 if(run.mode==='learn'&&!run.ruleSeen&&run.index>=1){app.innerHTML=`<div class="narrow g4-wrap">${head}${rule(u)}</div>`;app.querySelector('#g4-rule-next').onclick=()=>mutate(s=>{s.grade4.session.ruleSeen=true;});return;}
 const passageFinished=p&&!run.queue.slice(run.index+1).some(id=>questionById(id).passageId===p.id);
 const visible=p&&(q.skill==='reading'||supported||answered&&passageFinished);
 app.innerHTML=`<div class="narrow g4-wrap" data-g4-question="${q.id}" data-g4-session="${run.id}">${head}<section class="panel g4-question"><span class="eyebrow">${labels[q.skill]}</span>${p?`<h2>${esc(p.title)}</h2>`:''}${q.skill==='reading'?'<p class="muted">答えを選び、根拠の文も選ぼう。</p>':''}${q.skill==='listening'?`<div class="audio-controls"><button id="g4-listen" class="primary">▶ 音声を聞く</button><button id="g4-slow">ゆっくり</button><button id="g4-stop">■ 停止</button></div><p id="g4-audio-status" role="status">${run.heard[q.id]?'聞き終えました。':media?'再生中です。':'音声を最後まで聞いてから答えよう。'} 再生 ${run.plays[q.id]||0}回</p><button id="g4-support">台本を見て練習する</button>`:''}${visible?`<div class="g4-passage" lang="en">${p.sentences.map((text,i)=>`<p class="${answered&&i===q.evidence?'g4-evidence':''}"><span class="g4-sentence-number">${i+1}</span>${esc(text)}</p>`).join('')}</div>`:''}${supported||answered&&(!p||passageFinished)?`<div class="g4-translation">${p?p.translation.map(t=>`<p>${esc(t)}</p>`).join(''):`<p>${esc(units.find(u=>u.id===q.unit).rule)}</p>`}</div>`:''}${!answered&&q.skill!=='listening'?'<button id="g4-support">ヒントを見て練習する</button>':''}<h2 class="g4-prompt" lang="${q.prompt.includes('？')||q.prompt.includes('意味')?'ja':'en'}">${esc(q.prompt)}</h2><div class="g4-choices">${run.orders[q.id].map((n,i)=>`<button data-g4-choice="${n}" ${answered?'disabled':''} aria-pressed="${draft?.choice===n}" class="${answered&&n===q.answer?'correct':answered&&n===answered.choice?'wrong':''}"><span>${i+1}</span>${esc(q.choices[n])}${answered&&n===q.answer?' ✓':''}</button>`).join('')}</div>${draft&&!answered&&q.skill==='reading'?`<section class="g4-evidence-picker"><h3>根拠になる文は？</h3>${p.sentences.map((t,i)=>`<button data-g4-evidence="${i}"><span>${i+1}</span><span lang="en">${esc(t)}</span></button>`).join('')}</section>`:''}${answered?`<section class="g4-feedback" tabindex="-1" role="region" aria-label="答えと解説"><h3>${answered.correct?'✓ 正解':'答えを確かめよう'}</h3><p>正解：${esc(q.choices[q.answer])}</p><p>${esc(q.explanation)}</p>${q.skill==='reading'?`<p>${answered.evidence===q.evidence?'根拠の文も確認できました。':`根拠は ${q.evidence+1}番目の文です。別の問題でも確かめよう。`}</p>`:''}${answered.guided?'<p>支援を使った練習として保存しました。</p>':''}${!answered.correct?lessonLink(units.find(u=>u.id===q.unit),'この部分を図で確かめる')+lessonLink({lesson:units.find(u=>u.id===q.unit).prerequisite},'5級の基本も短く確認する'):''}<div class="g4-bottom"><button id="g4-next" class="primary">${run.index+1===run.queue.length?'結果を見る':'次へ'} →</button></div></section>`:''}</section></div>`;
 const sid=run.id,qid=q.id;
 const live=s=>s.grade4?.session?.id===sid&&currentQuestion(s)?.id===qid&&!currentAttempt(s);
 app.querySelector('#g4-support')?.addEventListener('click',()=>mutate(s=>{if(s.grade4?.session?.id===sid&&currentQuestion(s)?.id===qid)supportPassage(s,q);}));
 app.querySelectorAll('[data-g4-choice]').forEach(b=>b.onclick=async()=>{await mutate(s=>{if(!live(s))return;if(q.skill==='reading')s.grade4.session.draft={qid,choice:+b.dataset.g4Choice};else submitGrade4(s,{choice:+b.dataset.g4Choice});});app.querySelector('.g4-evidence-picker')?.scrollIntoView({block:'center'});app.querySelector('.g4-feedback')?.focus({preventScroll:true});});
 app.querySelectorAll('[data-g4-evidence]').forEach(b=>b.onclick=async()=>{await mutate(s=>{if(live(s)&&s.grade4.session.draft)submitGrade4(s,{choice:s.grade4.session.draft.choice,evidence:+b.dataset.g4Evidence});});app.querySelector('.g4-feedback')?.focus({preventScroll:true});});
 app.querySelector('#g4-next')?.addEventListener('click',async()=>{await mutate(s=>{if(s.grade4?.session?.id===sid&&currentQuestion(s)?.id===qid)nextGrade4(s);});window.scrollTo(0,0);});
 const play=async slow=>{
  cleanupGrade4();const ticket=generation;let files;
  try{files=await loadAudio();}catch(e){tell(e.message);return;}
  if(ticket!==generation||location.hash!=='#grade4'||!live(ctx.state))return;
  const file=files.files.find(f=>f.passageId===q.passageId&&f.speed===(slow?'slow':'normal'));
  if(!file||!/^assets\/audio\/g4-[a-z0-9-]+\.mp3$/.test(file.path)){tell('音声がありません。台本を見て練習できます。');return;}
  await mutate(s=>{if(live(s)){const r=s.grade4.session;r.plays[qid]=Math.min(1000,(r.plays[qid]||0)+1);if(slow)supportPassage(s,q);}});
  // ctx is replaced by render; only touch the captured session after rechecking the DOM.
  if(location.hash!=='#grade4'||app.querySelector('[data-g4-question]')?.dataset.g4Question!==qid||app.querySelector('[data-g4-question]')?.dataset.g4Session!==sid)return;
  const mine=generation,a=new Audio(file.path);media=a;const status=()=>app.querySelector('#g4-audio-status');
  if(status())status().textContent='再生中です。';
  const fail=async()=>{if(mine!==generation)return;media=null;tell('音声を再生できません。再試行するか、台本で練習できます。');await mutate(s=>{if(live(s))s.grade4.session.plays[qid]=Math.max(0,(s.grade4.session.plays[qid]||1)-1);});};
  a.onended=async()=>{if(mine!==generation)return;media=null;await mutate(s=>{if(live(s))s.grade4.session.heard[qid]=true;});};a.onerror=fail;
  try{await a.play();}catch{await fail();}
 };
 app.querySelector('#g4-listen')?.addEventListener('click',()=>play(false));app.querySelector('#g4-slow')?.addEventListener('click',()=>play(true));
 app.querySelector('#g4-stop')?.addEventListener('click',()=>{cleanupGrade4();const el=app.querySelector('#g4-audio-status');if(el)el.textContent='停止しました。もう一度聞けます。';});
}
