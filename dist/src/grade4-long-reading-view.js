import {readingSets, readingSetById, questionsForReadingSet} from './grade4-long-reading.js';
import {currentQuestion, currentAttempt, nextGrade4, submitGrade4} from './grade4-core.js';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);

export function readingHome(state, pending) {
  const answered = new Set((state.grade4?.attempts || []).map(attempt => attempt.qid));
  return `<section class="panel g4-reading-home" aria-labelledby="g4-long-title">
    <h2 id="g4-long-title">長めの文章に挑戦</h2>
    <p>掲示・メール・説明文を読んで、文章ごとに4問。答えと根拠は、読み終えた後にまとめて確かめます。</p>
    <div class="g4-units">${readingSets.map(set => {
      const count = questionsForReadingSet(set.id).filter(question => answered.has(question.id)).length;
      return `<div><span class="pill">${set.kind} · ${count} / 4問を解答</span>
        <h3>${set.title}</h3><button data-g4-reading="${set.id}" ${pending ? 'disabled' : ''}>読む →</button></div>`;
    }).join('')}</div>
  </section>`;
}

function renderReadingResults(ctx, run, set) {
  const attempts = ctx.state.grade4.attempts.filter(attempt => attempt.sid === run.id);
  const independent = attempts.filter(attempt => !attempt.guided);
  const questions = questionsForReadingSet(set.id);
  ctx.app.innerHTML = `<div class="narrow g4-wrap"><section class="panel">
    <h1>読んだ答えを確かめよう</h1><p>${set.title}</p>
    <p>支援なしで ${independent.filter(attempt => attempt.correct).length} / ${independent.length}問正解。支援あり ${attempts.length - independent.length}問。</p>
    ${questions.map((question, index) => {
      const attempt = attempts.find(answer => answer.qid === question.id);
      return `<section class="g4-feedback"><h2>問${index + 1} · ${attempt?.correct ? '正解' : '見直そう'}</h2>
        <p lang="en">${escapeHtml(question.prompt)}</p>
        <p>正解：<span lang="en">${escapeHtml(question.choices[question.answer])}</span></p>
        ${attempt && !attempt.correct ? `<p>選んだ答え：<span lang="en">${escapeHtml(question.choices[attempt.choice])}</span></p>` : ''}
        <p>${escapeHtml(question.explanation)}</p>
        <details><summary>根拠の段落を見る</summary><p lang="en">${escapeHtml(set.paragraphs[question.paragraph])}</p></details>
      </section>`;
    }).join('')}
    <details class="g4-translation"><summary>本文と日本語訳</summary>
      ${set.paragraphs.map((paragraph, index) => `<p lang="en">${escapeHtml(paragraph)}</p><p>${escapeHtml(set.translations[index])}</p>`).join('')}
    </details>
    <div class="actions"><a class="pill" href="#home">4級のホームへ →</a><a class="pill" href="#grade4-plan">学習計画へ</a></div>
  </section></div>`;
}

export function renderLongReading(ctx, run) {
  const {app, state, mutate} = ctx;
  const set = readingSetById(run.unitId);
  const question = currentQuestion(state);
  if (!question) {
    renderReadingResults(ctx, run, set);
    return;
  }

  const answer = currentAttempt(state);
  const hintShown = run.supported.includes(question.id);
  const sameQuestion = state => state.grade4?.session?.id === run.id && currentQuestion(state)?.id === question.id;
  app.innerHTML = `<div class="narrow g4-wrap" data-long-question="${question.id}">
    <div class="study-top"><span>${set.kind} · ${run.index + 1} / ${run.queue.length}問</span><a href="#home">休んでホームへ</a></div>
    <progress class="journey-meter" value="${run.index}" max="${run.queue.length}" aria-label="今日の進み具合"></progress>
    <section class="panel g4-question"><h1>${set.title}</h1>
      <div id="g4-long-text" class="g4-passage" lang="en" tabindex="-1">
        <h2>${set.heading}</h2>${set.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('')}
      </div>
      <div class="actions"><button id="g4-long-to-text">本文の先頭へ</button>
        ${hintShown || answer ? '' : '<button id="g4-long-hint">読み方のヒント</button>'}</div>
      ${hintShown ? `<p class="g4-translation">${escapeHtml(set.hint)}<br>ここからは支援ありの解答として記録します。</p>` : ''}
      <h2 id="g4-long-prompt" class="g4-prompt" lang="en" tabindex="-1">${escapeHtml(question.prompt)}</h2>
      <div class="g4-choices">${run.orders[question.id].map((choice, index) =>
        `<button data-long-choice="${choice}" ${answer ? 'disabled' : ''} aria-pressed="${answer?.choice === choice}" lang="en">
          <span>${index + 1}</span>${escapeHtml(question.choices[choice])}</button>`).join('')}
      </div>
      ${answer ? `<div class="g4-feedback" tabindex="-1"><p>解答を保存しました。</p><div class="g4-bottom">
        <button id="g4-long-next" class="primary">${run.index + 1 === run.queue.length ? '答えを確かめる' : '次の問題へ'} →</button>
      </div></div>` : ''}
    </section>
  </div>`;

  app.querySelector('#g4-long-to-text').onclick = () => app.querySelector('#g4-long-text').focus();
  app.querySelector('#g4-long-hint')?.addEventListener('click', () => mutate(state => {
    if (sameQuestion(state) && !currentAttempt(state)) state.grade4.session.supported = [...run.queue];
  }));
  app.querySelectorAll('[data-long-choice]').forEach(button => {
    button.onclick = async () => {
      await mutate(state => {
        if (sameQuestion(state)) submitGrade4(state, {choice: Number(button.dataset.longChoice)});
      });
      app.querySelector('.g4-feedback')?.focus({preventScroll: true});
    };
  });
  app.querySelector('#g4-long-next')?.addEventListener('click', async () => {
    await mutate(state => {
      if (sameQuestion(state)) nextGrade4(state);
    });
    const prompt = app.querySelector('#g4-long-prompt');
    if (prompt) prompt.focus();
    else window.scrollTo(0, 0);
  });
}
