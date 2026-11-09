import {vocabularySets, vocabularySetById} from './grade4-vocabulary.js';
import {createGrade4Session, currentQuestion, currentAttempt, nextGrade4, submitGrade4, tokyoDay} from './grade4-core.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const exampleHtml = ([before, target, after]) =>
  `<p lang="en">${escapeHtml(before)}<mark>${escapeHtml(target)}</mark>${escapeHtml(after)}</p>`;

function vocabularyStatus(entry, attempts) {
  const a = attempts.get(`g4-vocab-${entry.id}-a`) || [];
  const b = attempts.get(`g4-vocab-${entry.id}-b`) || [];
  const latest = [...a, ...b].sort((first, second) => first.at - second.at).at(-1);
  if (!latest) return 'これから';
  if (!latest.correct || latest.guided) return 'もう一度確かめよう';
  const days = rows => new Set(rows.filter(row => row.correct && !row.guided).map(row => tokyoDay(row.at)));
  const daysA = days(a), daysB = days(b);
  return daysA.size && daysB.size && new Set([...daysA, ...daysB]).size > 1
    ? '別の日・別の文でも正解'
    : '別の日に確かめよう';
}

export function renderVocabularyHome({app, state, cards, mutate}) {
  const session = state.grade4?.session;
  const pending = session && session.index < session.queue.length;
  const attempts = new Map();
  for (const attempt of state.grade4?.attempts || []) {
    if (!attempt.qid.startsWith('g4-vocab-')) continue;
    if (!attempts.has(attempt.qid)) attempts.set(attempt.qid, []);
    attempts.get(attempt.qid).push(attempt);
  }
  const cardIds = new Set(cards.map(card => card.id));
  app.innerHTML = `<div class="narrow g4-wrap">
    <a href="#home">← ホーム</a>
    <div class="eyebrow">GRADE 4 · VOCABULARY</div>
    <h1>4級のことば・熟語</h1>
    <p>${vocabularySets.length}テーマ・${vocabularySets.reduce((count, set) => count + set.entries.length, 0)}語義・熟語。各テーマ6問ずつ、文の中で使われている意味を選ぼう。次の回は別の文で出題します。</p>
    ${pending ? '<p><a class="button-link primary" href="#grade4">途中の練習をつづける →</a></p>' : ''}
    <div class="g4-units">${vocabularySets.map(set => `<section class="panel" aria-labelledby="g4-vocab-${set.id}">
      <h2 id="g4-vocab-${set.id}">${escapeHtml(set.title)}</h2>
      <button class="primary" data-g4-vocab-set="${set.id}" ${pending ? 'disabled' : ''}>文の中で練習する →</button>
      ${set.entries.map(entry => `<details class="g4-translation">
        <summary><strong lang="en">${escapeHtml(entry.en)}</strong> <small>· ${vocabularyStatus(entry, attempts)}</small></summary>
        <p>${escapeHtml(entry.ja)}</p>
        ${exampleHtml(entry.examples[0])}<p>${escapeHtml(entry.examples[0][3])}</p>
        <p>${escapeHtml(entry.note)}</p>
        ${cardIds.has(entry.sharedId) ? `<a href="#card/${entry.sharedId}">ことば帳のカードへ →</a>` : ''}
        ${cardIds.has(entry.relatedId) ? `<a href="#card/${entry.relatedId}">ことば帳で元の語の使い方を見る →</a>` : ''}
      </details>`).join('')}
    </section>`).join('')}</div>
  </div>`;
  app.querySelectorAll('[data-g4-vocab-set]').forEach(button => {
    button.onclick = async () => {
      const id = button.dataset.g4VocabSet;
      let started = false;
      await mutate(saved => {
        saved.course = 4;
        createGrade4Session(saved, id, 'vocabulary');
        started = true;
      });
      if (started && location.hash === '#grade4-vocab') location.hash = 'grade4';
    };
  });
}

export function renderVocabularyPractice({app, state, mutate}, run) {
  const set = vocabularySetById(run.unitId);
  const question = currentQuestion(state);
  if (!question) {
    const answers = state.grade4.attempts.filter(attempt => attempt.sid === run.id);
    const correct = answers.filter(attempt => attempt.correct).length;
    app.innerHTML = `<div class="narrow g4-wrap"><section class="panel">
      <h1>ことばの練習、おつかれさま！</h1>
      <p>${escapeHtml(set.title)} · ${correct} / ${run.queue.length}問 正解</p>
      <p>次は別の日に、違う文でも意味が分かるか確かめよう。</p>
      <a class="button-link primary" href="#grade4-vocab">ことば・熟語に戻る →</a>
      <a class="pill" href="#home">4級のホームへ</a>
      <a class="pill" href="#grade4-plan">学習計画へ</a>
    </section></div>`;
    return;
  }

  const answer = currentAttempt(state);
  const sameQuestion = saved => saved.grade4?.session?.id === run.id && currentQuestion(saved)?.id === question.id;
  app.innerHTML = `<div class="narrow g4-wrap" data-g4-vocab-question="${question.id}">
    <div class="study-top"><span>${escapeHtml(set.title)} · ${run.index + 1} / ${run.queue.length}問</span>
      <a href="#grade4-vocab">休んでことば帳へ</a></div>
    <progress class="journey-meter" value="${run.index}" max="${run.queue.length}" aria-label="練習の進み具合"></progress>
    <section class="panel g4-question">
      <h1 class="g4-prompt" tabindex="-1">色のついた部分は、どんな意味？</h1>
      <div class="g4-passage">${exampleHtml(question.example)}</div>
      <div class="g4-choices">${run.orders[question.id].map((choice, index) => `
        <button data-g4-vocab-choice="${choice}" ${answer ? 'disabled' : ''}
          class="${answer && choice === question.answer ? 'correct' : answer?.choice === choice ? 'wrong' : ''}">
          <span>${index + 1}</span>${escapeHtml(question.choices[choice])}</button>`).join('')}</div>
      ${answer ? `<section class="g4-feedback" tabindex="-1" aria-label="答えと解説">
        <h2>${answer.correct ? '✓ 正解' : '答えを確かめよう'}</h2>
        <p>正解は「${escapeHtml(question.entry.ja)}」</p>
        <p>${escapeHtml(question.example[3])}</p><p>${escapeHtml(question.entry.note)}</p>
        <div class="g4-bottom"><button id="g4-vocab-next" class="primary">${run.index + 1 === run.queue.length ? '結果を見る' : '次へ'} →</button></div>
      </section>` : ''}
    </section>
  </div>`;
  app.querySelectorAll('[data-g4-vocab-choice]').forEach(button => {
    button.onclick = async () => {
      await mutate(saved => {
        if (sameQuestion(saved)) submitGrade4(saved, {choice: Number(button.dataset.g4VocabChoice)});
      });
      app.querySelector('.g4-feedback')?.focus({preventScroll: true});
    };
  });
  app.querySelector('#g4-vocab-next')?.addEventListener('click', async () => {
    await mutate(saved => {
      if (sameQuestion(saved)) nextGrade4(saved);
    });
    app.querySelector('.g4-prompt')?.focus();
    window.scrollTo(0, 0);
  });
}
