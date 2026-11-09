import {
  answerSeconds, advanceListening, completeRepeat, examScore, finishPhase, format,
  listeningPractice, mockListening, mockReading, sections, startListening, startMock
} from './grade4-mock.js';
import {audioFiles} from './grade4-mock-audio.js';
import {recordForest} from './forest.js';

const mockRoute = '#grade4-mock';
const practiceRoute = '#grade4-dialogue';
const escape = value => String(value).replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
})[character]);
const lines = value => escape(value).replace(/\n/g, '<br>');
const twoDigits = value => String(value).padStart(2, '0');
const countdown = milliseconds => {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return Math.floor(seconds / 60) + ':' + twoDigits(seconds % 60);
};

let ctx, clock, player, playback, practiceView;
let writes = Promise.resolve();
let playbackMessage = '';

function save(change) {
  const write = writes.then(() => ctx?.mutate(change, {queue:true}));
  writes = write.catch(error => ctx?.tell(error.message));
  return writes;
}

export function cleanupGrade4Mock(route) {
  if (route !== 'grade4-mock') {
    playback?.abort();
    player?.pause();
    player = null;
    clearInterval(clock);
    clock = null;
    playbackMessage = '';
    renderedRun = null;
  }
  if (route !== 'grade4-dialogue') {
    practiceView?.audio?.pause();
    practiceView = null;
  }
}

function current() {
  return ctx?.state.grade4Exam?.active;
}

function mutateRun(expected, change) {
  return save(state => {
    const run = state.grade4Exam?.active;
    if (run?.id === expected.id && run.phase === expected.phase && run.index === expected.index) change(run, state);
  });
}

function readText(q) {
  const passage = q.passage;
  return `${passage ? `<div class="g4-passage" lang="en"><h3>${escape(passage.title)}</h3>
    ${passage.paragraphs.map(paragraph => `<p>${lines(paragraph)}</p>`).join('')}</div>` : ''}
    <p class="exam-prompt" lang="${q.tiles ? 'ja' : 'en'}">${lines(q.prompt)}</p>
    ${q.tiles ? `<p>2番目と4番目にくる語句の番号を選びましょう。</p>
      <p class="g4-mock-tiles" lang="en">${q.tiles.map((tile, index) => `<span>${'①②③④⑤'[index]} ${escape(tile)}</span>`).join('')}</p>` : ''}`;
}

function choices(q, selected, {hideText = false, disabled = false} = {}) {
  return `<div class="g4-choices">${q.options.map((option, index) =>
    `<button data-g4-exam-choice="${index}" aria-pressed="${selected === index}" ${disabled ? 'disabled' : ''}>
       ${hideText ? index + 1 : `<span>${index + 1}</span><span lang="en">${escape(option)}</span>`}
     </button>`).join('')}</div>`;
}

function review(q, selected) {
  const transcript = q.listening?.turns
    ? q.listening.turns.map(turn => turn.speaker + ': ' + turn.text).join('\n') + '\n' + q.script.split('\n').slice(1).join('\n')
    : q.script;
  return `<p>あなたの答え：${selected === undefined ? '未回答' : escape(q.options[selected])}</p>
    <p class="correct-text">正解：${escape(q.options[q.answer])}</p><p>${escape(q.explanation)}</p>
    ${transcript ? `<audio controls preload="none" src="${audioFiles[q.id]}" aria-label="復習用の音声"></audio>
      <p class="transcript" lang="en">${lines(transcript)}</p>` : ''}`;
}

function startScreen(app, latest) {
  const score = latest && examScore(latest);
  app.innerHTML = `<div class="narrow g4-wrap"><a href="#home">← 4級ホーム</a>
    <h1>4級 実戦模試</h1><section class="panel">
      <p>読む ${mockReading.length}問・${format.minutes.r}分 ／ 聞く ${mockListening.length}問・最大${format.minutes.l}分</p>
      <p>読む問題は見直しができます。聞く問題は同じ音声が2回流れ、その後${answerSeconds}秒で次へ進みます。</p>
      <p>途中の回答は保存します。制限時間は画面を閉じている間も進みます。</p>
      ${score ? `<p>前回は読む ${score.r.correct} / ${score.r.total}、聞く ${score.l.correct} / ${score.l.total} 問正解。</p>` : ''}
      <div class="actions"><button class="primary" id="g4-mock-start">${score ? 'もう一度始める' : '読む問題を始める'}</button>
        ${score ? '<button id="g4-mock-result">前回の答えを確かめる</button>' : ''}</div>
    </section><p class="muted">独自問題1セット。採点は正答数で表示します。</p></div>`;
  app.querySelector('#g4-mock-start').onclick = () => save(state => {
    state.course = 4;
    startMock(state, crypto.randomUUID());
  });
  app.querySelector('#g4-mock-result')?.addEventListener('click', () => renderResults(app, latest));
}

function renderResults(app, result) {
  const score = examScore(result);
  app.innerHTML = `<div class="narrow g4-wrap"><a href="#home">← 4級ホーム</a><h1 tabindex="-1">4級模試の結果</h1>
    <section class="panel result-score"><strong>${score.r.correct + score.l.correct}<small> / ${score.r.total + score.l.total}</small></strong>
      <p>読む ${score.r.correct} / ${score.r.total} · 聞く ${score.l.correct} / ${score.l.total}</p>
      <p>未回答 ${score.r.total + score.l.total - score.r.answered - score.l.answered}問</p>
      <p>独自問題の正答数です。</p></section>
    <label><input type="checkbox" id="g4-mock-wrong"> まちがい・未回答だけを見る</label>
    ${[...mockReading, ...mockListening].map(q => `<details class="panel result-item" data-wrong="${result.answers[q.id] !== q.answer}">
      <summary>${result.answers[q.id] === q.answer ? '○' : '△'} ${q.id.slice(-2)} · ${sections[q.section]}</summary>
      ${q.script ? '' : readText(q)}${review(q, result.answers[q.id])}</details>`).join('')}
    <button id="g4-mock-menu">模試の案内へ</button></div>`;
  app.querySelector('h1').focus();
  app.querySelector('#g4-mock-wrong').onchange = event => {
    app.querySelectorAll('[data-wrong="false"]').forEach(details => {
      details.hidden = event.target.checked;
      if (details.hidden) details.querySelector('audio')?.pause();
    });
  };
  app.querySelector('#g4-mock-menu').onclick = () => startScreen(app, result);
}

function renderBreak(app, run) {
  app.innerHTML = `<div class="narrow g4-wrap"><a href="#home">← 4級ホーム</a>
    <section class="panel"><h1>次はリスニング</h1><p>読む問題の回答を確定しました。</p>
    <p>30問です。開始ボタンを押すと音声が順番に流れます。音量を調整してから始めましょう。</p>
    <div class="actions"><button id="g4-mock-check">音量を確認</button>
      <button class="primary" id="g4-mock-listen">聞く問題を始める</button></div></section></div>`;
  app.querySelector('#g4-mock-check').onclick = () => {
    // A separate short clip keeps all test questions unseen before playback.
    player ||= new Audio();
    player.src = 'assets/audio/hunter/hello-34768221f080a664.mp3';
    player.play().catch(() => ctx.tell('音量確認の音を再生できません。'));
  };
  app.querySelector('#g4-mock-listen').onclick = async event => {
    event.currentTarget.disabled = true;
    player?.pause();
    await mutateRun(run, saved => startListening(saved));
    if (location.hash === mockRoute && current()?.id === run.id && current()?.phase === 'l') playListening();
  };
}

function renderReading(app, run) {
  const q = mockReading[run.index];
  const selected = run.answers[q.id];
  const answered = Object.keys(run.answers).length;
  const listOpen = app.querySelector('#g4-mock-list')?.open;
  const nav = index => mutateRun(run, saved => {
    if (Date.now() < saved.deadline) saved.index = index;
  });
  app.innerHTML = `<div class="exam-wrap g4-wrap">
    ${examHeader('読む', run)}
    <section class="panel exam-question"><h1 tabindex="-1">${sections[q.section]} · ${run.index + 1} / ${mockReading.length}</h1>
      ${readText(q)}${choices(q, selected)}</section>
    <div class="exam-controls"><button id="g4-mock-prev" ${run.index === 0 ? 'disabled' : ''}>← 前へ</button>
      <span>${answered}問 回答済み</span><button id="g4-mock-next" ${run.index === mockReading.length - 1 ? 'disabled' : ''}>次へ →</button></div>
    <details id="g4-mock-list" ${listOpen ? 'open' : ''}><summary>問題一覧</summary><div class="exam-grid">
      ${mockReading.map((item, index) => `<button data-g4-mock-jump="${index}"
        aria-label="${index + 1}問目 ${Object.hasOwn(run.answers, item.id) ? '回答済み' : '未回答'}"
        ${index === run.index ? 'aria-current="step"' : ''}
        class="${Object.hasOwn(run.answers, item.id) ? 'answered' : ''}">${index + 1}</button>`).join('')}
    </div></details>
    <button id="g4-mock-finish">読む問題を終了する</button><div id="g4-mock-confirm"></div>
    </div>`;
  app.querySelector('#g4-mock-prev').onclick = () => nav(run.index - 1);
  app.querySelector('#g4-mock-next').onclick = () => nav(run.index + 1);
  app.querySelectorAll('[data-g4-mock-jump]').forEach(button => {
    button.onclick = () => nav(Number(button.dataset.g4MockJump));
  });
  app.querySelector('#g4-mock-finish').onclick = () => {
    const confirm = app.querySelector('#g4-mock-confirm');
    confirm.innerHTML = `<section class="panel"><h2>読む問題を確定しますか？</h2>
      <p>未回答 ${mockReading.length - answered}問。確定後は聞く問題へ進みます。</p>
      <button class="primary" id="g4-mock-submit-reading">確定する</button>
      <button id="g4-mock-cancel">見直す</button></section>`;
    confirm.querySelector('#g4-mock-submit-reading').focus();
    confirm.querySelector('#g4-mock-submit-reading').onclick = () => mutateRun(run, (_, state) => finishPhase(state, 'r'));
    confirm.querySelector('#g4-mock-cancel').onclick = () => {
      confirm.replaceChildren();
      app.querySelector('#g4-mock-finish').focus();
    };
  };
  bindAnswers(app, run, q);
}

function examHeader(label, run) {
  return `<div class="study-top"><a href="#home">中断・保存</a><strong>4級模試 · ${label}</strong>
    <span id="exam-clock" role="timer" aria-label="残り時間">${countdown(run.deadline - Date.now())}</span></div>`;
}

function bindAnswers(app, run, q) {
  app.querySelectorAll('[data-g4-exam-choice]').forEach(button => {
    button.onclick = () => mutateRun(run, saved => {
      const now = Date.now();
      if (now < saved.deadline && (!saved.replyUntil || now < saved.replyUntil)) {
        saved.answers[q.id] = Number(button.dataset.g4ExamChoice);
      }
    });
  });
}

function renderListening(app, run) {
  const q = mockListening[run.index];
  const scene = q.scene ? `<figure class="g4-mock-scene">
    <svg viewBox="0 0 220 88" aria-hidden="true" fill="none" stroke="#315c57" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 78h202" stroke="#adc8b7"/>
      <use href="assets/grade4-mock-scenes.svg#${q.scene[0]}" x="62" y="2" width="96" height="72"/>
      <circle cx="34" cy="36" r="11" fill="#eec49f"/><circle cx="185" cy="36" r="11" fill="#c69270"/>
      <path d="M23 34q0-14 12-14 10 0 12 13-7-1-11-6-5 6-13 7zm151 0q0-14 12-14 10 0 12 13-8-1-11-6-5 6-13 7z" fill="#315c57"/>
      <path d="M15 78v-6a19 19 0 0 1 38 0v6z" fill="#e9aa65"/>
      <path d="M166 78v-6a19 19 0 0 1 38 0v6z" fill="#9fadd7"/>
      <path d="M43 38h.1m134 0h.1"/>
    </svg>
    <figcaption>${q.scene[1]}</figcaption></figure>` : '';
  app.innerHTML = `<div class="exam-wrap g4-wrap">${examHeader('聞く', run)}
    <section class="panel exam-question"><h1 tabindex="-1">${sections[q.section]} · ${run.index + 1} / ${mockListening.length}</h1>
      <p>${q.section === 'l1' ? '会話と選択肢を聞いて、返事の番号を選びましょう。' : '英語と質問を聞いて、答えを選びましょう。'}</p>
      ${scene}<div class="actions"><button class="primary" id="g4-mock-play" ${playback ? 'disabled hidden' : ''}>▶ 音声を再開</button>
        <span id="g4-mock-audio-status" role="status"></span><span id="g4-mock-reply" aria-hidden="true"></span></div>
      ${choices(q, run.answers[q.id], {hideText:q.section === 'l1'})}
    </section></div>`;
  app.querySelector('#g4-mock-play').onclick = playListening;
  updateListeningStatus();
  bindAnswers(app, run, q);
}

function updateListeningStatus() {
  const label = ctx?.app.querySelector('#g4-mock-audio-status');
  const run = current();
  if (!label || run?.phase !== 'l') return;
  const message = playbackMessage || (playback
    ? run.repeats < 2 ? `${run.repeats + 1}回目の音声` : '答えを選ぶ時間'
    : 'ここから音声を再開できます。');
  if (label.textContent !== message) label.textContent = message;
}

function until(time, signal) {
  return new Promise(resolve => {
    if (signal.aborted) return resolve();
    const finish = () => {
      clearTimeout(timer);
      signal.removeEventListener('abort', finish);
      resolve();
    };
    const timer = setTimeout(finish, Math.max(0, time - Date.now()));
    signal.addEventListener('abort', finish, {once:true});
  });
}

function playClip(src, signal) {
  player ||= new Audio();
  const audio = player;
  if (!audio.src.endsWith('/' + src)) audio.src = src;
  else audio.currentTime = 0;
  return new Promise((resolve, reject) => {
    const remove = () => {
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('error', failed);
      signal.removeEventListener('abort', aborted);
    };
    const ended = () => {remove(); resolve(true);};
    const failed = () => {remove(); reject(Error('音声を再生できません。通信や音量を確認して再開してください。'));};
    const aborted = () => {remove(); audio.pause(); resolve(false);};
    if (signal.aborted) return aborted();
    audio.addEventListener('ended', ended, {once:true});
    audio.addEventListener('error', failed, {once:true});
    signal.addEventListener('abort', aborted, {once:true});
    audio.play().catch(failed);
  });
}

async function playListening() {
  if (playback || current()?.phase !== 'l') return;
  const id = current().id;
  const controller = new AbortController();
  const {signal} = controller;
  playback = controller;
  playbackMessage = '';
  renderGrade4Mock(ctx);
  const loop = async () => {
    while (!signal.aborted && location.hash === mockRoute) {
      const run = current();
      if (run?.id !== id || run.phase !== 'l') break;
      if (run.repeats < 2 && Date.now() < run.deadline) {
        const q = mockListening[run.index];
        // Retry a failed request from a fresh media resource on the next user gesture.
        const completed = await playClip(audioFiles[q.id], signal);
        if (!completed || signal.aborted) break;
        await mutateRun(run, saved => {
          if (saved.repeats === run.repeats) completeRepeat(saved);
        });
      } else {
        if (run.replyUntil) await until(Math.min(run.replyUntil, run.deadline), signal);
        if (signal.aborted) break;
        await mutateRun(run, (_, state) => advanceListening(state));
      }
    }
  };
  try {
    if (navigator.locks) {
      await navigator.locks.request('english-stage-grade4-listening', {ifAvailable:true}, lock => {
        if (!lock) throw Error('別のタブで音声を再生中です。そのタブで続けられます。');
        return loop();
      });
    } else await loop();
  } catch (error) {
    if (!signal.aborted) {
      playbackMessage = error.message;
      player?.pause();
      player = null;
    }
  } finally {
    playback = null;
    if (location.hash === mockRoute) renderGrade4Mock(ctx);
  }
}

let renderedRun;
export function renderGrade4Mock(context) {
  ctx = context;
  const {app, state} = ctx;
  clearInterval(clock);
  clock = null;
  const run = current();
  const latest = state.grade4Exam?.latest;
  const previous = renderedRun;
  renderedRun = run;
  if (!run) {
    if (previous?.phase === 'l' && latest?.id === previous.id) {
      playback?.abort();
      renderResults(app, latest);
    } else if (!app.querySelector('#g4-mock-menu')) startScreen(app, latest);
    return;
  }
  if (run.phase === 'break') return renderBreak(app, run);

  const focusedChoice = app.contains(document.activeElement) ? document.activeElement.dataset.g4ExamChoice : undefined;
  const changedQuestion = previous?.id !== run.id || previous.phase !== run.phase || previous.index !== run.index;
  if (run.phase === 'r') renderReading(app, run);
  else renderListening(app, run);
  if (changedQuestion) {
    app.querySelector('h1').focus({preventScroll:true});
    window.scrollTo(0, 0);
  } else if (focusedChoice !== undefined) app.querySelector(`[data-g4-exam-choice="${focusedChoice}"]`)?.focus({preventScroll:true});

  const tick = () => {
    const remaining = run.deadline - Date.now();
    const display = app.querySelector('#exam-clock');
    if (display) {
      display.textContent = countdown(remaining);
      display.toggleAttribute('data-urgent', remaining <= 60_000);
    }
    const reply = app.querySelector('#g4-mock-reply');
    if (reply && playback && run.replyUntil) reply.textContent = '残り ' + Math.max(0, Math.ceil((run.replyUntil - Date.now()) / 1000)) + '秒';
    if (remaining > 0) return;
    clearInterval(clock);
    playback?.abort();
    void mutateRun(run, (_, state) => finishPhase(state, run.phase));
  };
  clock = setInterval(tick, 250);
  tick();
}

export function renderDialoguePractice(context) {
  ctx = context;
  const {app, state} = context;
  const practice = state.grade4Exam?.practice || {index:0, answers:[]};
  const q = listeningPractice[practice.index];
  const selected = practice.answers[practice.index];
  const pageKey = q ? q.id + ':' + selected : 'done';
  if (practiceView?.key === pageKey && app.querySelector('[data-g4-dialogue]')) return;
  practiceView?.audio?.pause();
  practiceView = {key:pageKey};
  const head = '<a href="#home">← 4級ホーム</a>';
  if (!q) {
    const correct = listeningPractice.filter((item, index) => item.answer === practice.answers[index]).length;
    app.innerHTML = `<div class="narrow g4-wrap" data-g4-dialogue="done">${head}<section class="panel">
      <h1>会話の聞き取り 練習終了</h1><p>${correct} / ${listeningPractice.length}問正解</p>
      <button id="g4-dialogue-restart">もう一度練習する</button></section></div>`;
    app.querySelector('#g4-dialogue-restart').onclick = () => save(saved => {
      if (saved.grade4Exam?.practice?.index === listeningPractice.length) saved.grade4Exam.practice = {index:0, answers:[]};
    });
    return;
  }
  app.innerHTML = `<div class="narrow g4-wrap" data-g4-dialogue="${q.id}">${head}<section class="panel">
    <h1 tabindex="-1">会話の聞き取り · ${practice.index + 1} / ${listeningPractice.length}問</h1>
    <p>二人の会話と最後の質問を聞きましょう。</p>
    ${selected === undefined ? `<audio controls preload="none" src="${audioFiles[q.id]}" aria-label="会話と質問"></audio>
      <p id="g4-dialogue-status" role="status">音声を聞くと、答えを選べます。</p>` : ''}
    ${choices(q, selected, {disabled:true})}
    ${selected === undefined ? '' : `<section class="g4-feedback"><h2>${selected === q.answer ? '正解' : '聞き直してみよう'}</h2>
      ${review(q, selected)}<button class="primary" id="g4-dialogue-next">${practice.index + 1 === listeningPractice.length ? '結果を見る' : '次の会話へ'} →</button>
    </section>`}</section></div>`;
  const audio = app.querySelector('audio');
  const buttons = app.querySelectorAll('[data-g4-exam-choice]');
  practiceView.audio = audio;
  if (selected === undefined) {
    audio.onended = () => {
      app.querySelector('#g4-dialogue-status').textContent = '答えを選びましょう。音声は何度でも聞けます。';
      buttons.forEach(button => {button.disabled = false;});
    };
    audio.onerror = () => {
      const status = app.querySelector('#g4-dialogue-status');
      status.textContent = '音声の読み込みに失敗しました。';
      const retry = document.createElement('button');
      retry.textContent = '再読み込み';
      retry.onclick = () => {audio.load(); status.textContent = 'もう一度、音声を聞いてください。';};
      status.append(' ', retry);
    };
  }
  buttons.forEach(button => {
    button.onclick = () => save(saved => {
      saved.course = 4;
      const record = saved.grade4Exam ||= {active:null, latest:null};
      const run = record.practice ||= {index:0, answers:[]};
      if (run.index !== practice.index || run.answers.length !== practice.index) return;
      run.answers.push(Number(button.dataset.g4ExamChoice));
      recordForest(saved, {skill:'listen'});
    });
  });
  app.querySelector('#g4-dialogue-next')?.addEventListener('click', async () => {
    await save(saved => {
      const run = saved.grade4Exam?.practice;
      if (run?.index === practice.index && run.answers.length === practice.index + 1) run.index++;
    });
    app.querySelector('h1')?.focus();
  });
}
