const sets = [
  {
    id: 'garden', title: 'The School Garden', label: '学校の花だん',
    passage: 'Our school has a small garden. On Fridays, students work there after lunch. They water the flowers and look for insects. In summer, they can see many butterflies.',
    readingTip: '文の終わりでひと息。after lunch や in summer はひとまとまりで読もう。',
    pictureDescription: '学校の花だん。左の女の子はじょうろで花に水をやっています。右に赤い花が3本あります。',
    questions: [
      ['When do the students work in the garden on Fridays?', '何時ごろの活動かをたずねています。本文の after lunch を探そう。', ['They work there after lunch.', 'After lunch.']],
      ['What is the girl doing?', '女の子が今していることを、She is ...ing で言ってみよう。', ['She is watering the flowers.', 'She’s watering the plants.']],
      ['How many red flowers can you see?', '赤い花だけを数えよう。数と flowers を一緒に言えるかな？', ['I can see three red flowers.', 'Three red flowers.']],
      ['What do you like to do after school?', '自分が放課後にするのが好きなことを一つ言おう。', ['I like to play soccer.', 'I like reading comics.']]
    ]
  },
  {
    id: 'library', title: 'Saturday at the Library', label: '土曜日の図書館',
    passage: 'Mina goes to the library on Saturday mornings. She usually reads books about animals. Last Saturday, she chose a book about birds. She took it home to read with her brother.',
    readingTip: 'usually と Last Saturday が表す時間の違いを意識しよう。最後の文は to read with her brother をつなげて読もう。',
    pictureDescription: '図書館。左の男の子は椅子に座って本を読んでいます。右の机の上に閉じた本が2冊あります。',
    questions: [
      ['What kind of books does Mina usually read?', 'ふだん読む本の種類を聞いています。通常の習慣を述べた文を探そう。', ['She usually reads books about animals.', 'Books about animals.']],
      ['What is the boy doing?', '男の子が今していることを、He is ...ing で言ってみよう。', ['He is reading a book.', 'He’s reading.']],
      ['How many books are on the table?', '机の上にある本を数えよう。男の子が手に持っている本は数に入らないよ。', ['There are two books on the table.', 'Two books.']],
      ['What do you like to do on weekends?', '自分の好きな週末の過ごし方を一つ言おう。', ['I like to visit my grandparents.', 'I like riding my bike.']]
    ]
  }
];

const escapeHtml = value => value.replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[character]);
const steps = ['音読', '本文について', '絵について', '絵について', '自分のこと'];
let practice = null;
let utterance = null;

export function stopGrade4Speech() {
  if (!utterance) return;
  utterance = null;
  window.speechSynthesis.cancel();
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopGrade4Speech();
});
window.addEventListener('pagehide', stopGrade4Speech);

export function renderGrade4Speaking({app, state}) {
  const head = '<div class="narrow g4-wrap"><a href="#home">← 4級ホーム</a>';
  const menu = (focus = false) => {
    stopGrade4Speech();
    app.innerHTML = `${head}<h1 tabindex="-1">4級 スピーキング練習</h1><section class="panel">
      <p>英文を音読し、本文・絵・自分のことについて英語で答えよう。1セット約4分が目安です。</p>
      <p>声に出したあと、解答例で自分の答えを確かめます。マイクは使いません。練習の途中から再開できるのは、このページを開いている間です。</p>
      <div class="actions">${practice ? '<button class="primary" id="g4-speaking-resume">前回のつづき →</button>' : ''}
        ${sets.map(set => `<button data-g4-speaking-set="${set.id}">${set.label} →</button>`).join('')}
      </div></section></div>`;
    app.querySelectorAll('[data-g4-speaking-set]').forEach(button => {
      button.onclick = () => {
        practice = {set: sets.find(set => set.id === button.dataset.g4SpeakingSet), index: 0, review: false};
        showStep(true);
      };
    });
    app.querySelector('#g4-speaking-resume')?.addEventListener('click', () => showStep(true));
    if (focus) app.querySelector('h1').focus();
  };
  function showStep(focus = false) {
    stopGrade4Speech();
    const {set, index, review} = practice;
    const [prompt, tip, answers] = set.questions[index - 1] || [set.passage, set.readingTip, []];
    const canSpeak = state.settings.sound && !!window.speechSynthesis && !!window.SpeechSynthesisUtterance;
    const picture = index === 2 || index === 3;
    app.innerHTML = `${head}<div class="study-top"><span>${set.label} · ${index + 1} / ${steps.length}</span>
      <button id="g4-speaking-menu">題材を選ぶ</button></div>
      <progress value="${index}" max="${steps.length}" aria-label="練習の進み具合"></progress>
      <section class="panel"><h1 tabindex="-1">${steps[index]}</h1>
        ${index < 2 ? `<div class="g4-passage" lang="en"><strong>${set.title}</strong><p>${set.passage}</p></div>` : ''}
        ${picture ? `<img class="g4-speaking-picture" src="assets/grade4-speaking-${set.id}.svg" alt="${set.pictureDescription}">` : ''}
        ${index ? `<p class="g4-example" lang="en">${escapeHtml(prompt)}</p>` : ''}
        <p>${index ? '英語で答えてみよう。' : 'まず黙って読んでから、声に出して読もう。'}</p>
        ${canSpeak && index ? '<button data-g4-say="prompt">▶ 質問を聞く</button>' : ''}
        ${review ? `<section class="g4-feedback" tabindex="-1"><h2>${index ? '解答例' : '読み方を確認'}</h2>
          ${answers.map(answer => `<p lang="en">${escapeHtml(answer)}</p>`).join('')}
          <p>${tip}</p>${index === 4 ? '<p>自分のことが英語で言えたか確かめよう。</p>' : ''}
          ${canSpeak ? '<button data-g4-say="model">▶ お手本を聞く</button>' : ''}</section>`
          : `<button id="g4-speaking-check" class="primary">${index ? '答えを確かめる' : '読み方を確かめる'}</button>`}
        ${canSpeak && (index || review) ? '<button id="g4-speaking-stop" hidden>■ 停止</button>' : ''}
        <p id="g4-speaking-status" role="status"></p>
        ${review ? `<button class="primary" id="g4-speaking-next">${index + 1 === steps.length ? '練習を終える' : '次へ'} →</button>` : ''}
      </section></div>`;
    app.querySelector('#g4-speaking-menu').onclick = () => menu(true);
    app.querySelector('#g4-speaking-check')?.addEventListener('click', () => {
      practice.review = true;
      showStep();
      app.querySelector('.g4-feedback').focus();
    });
    app.querySelector('#g4-speaking-next')?.addEventListener('click', () => {
      if (index + 1 < steps.length) {
        practice.index++;
        practice.review = false;
        showStep(true);
        return;
      }
      practice = null;
      stopGrade4Speech();
      app.innerHTML = `${head}<section class="panel"><h1 tabindex="-1">スピーキング練習、おつかれさま！</h1>
        <p>音読と4つの質問を練習しました。</p><button class="primary" id="g4-speaking-again">別の題材を選ぶ →</button>
        <a class="pill" href="#grade4-plan">学習計画へ</a></section></div>`;
      app.querySelector('#g4-speaking-again').onclick = () => menu(true);
      app.querySelector('h1').focus();
    });
    const stop = app.querySelector('#g4-speaking-stop');
    const status = app.querySelector('#g4-speaking-status');
    if (stop) stop.onclick = () => {
      stopGrade4Speech();
      stop.hidden = true;
      status.textContent = '読み上げを止めました。';
    };
    app.querySelectorAll('[data-g4-say]').forEach(button => {
      button.onclick = () => {
        stopGrade4Speech();
        const text = button.dataset.g4Say === 'model' ? answers[0] || prompt : prompt;
        const current = new SpeechSynthesisUtterance(text);
        current.lang = 'en-US';
        current.rate = 0.85;
        const finish = message => {
          if (utterance !== current) return;
          utterance = null;
          stop.hidden = true;
          status.textContent = message;
        };
        current.onend = () => finish('');
        current.onerror = () => finish('読み上げを利用できません。画面の英文で練習できます。');
        utterance = current;
        stop.hidden = false;
        status.textContent = '読み上げ中…';
        try { window.speechSynthesis.speak(current); } catch { current.onerror(); }
      };
    });
    if (focus) {
      app.querySelector('h1').focus();
      window.scrollTo(0, 0);
    }
  }
  if (practice) showStep();
  else menu();
}
