import {karutaPool} from './karuta-session.js';
import {dayKey} from './scheduler.js';
import * as audio from './audio.js';
import * as effects from './effects.js';

const seconds = 90;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function shuffle(items) {
 const copy = [...items];
 for (let i = copy.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [copy[i], copy[j]] = [copy[j], copy[i]];
 }
 return copy;
}
let run = null, page = 'setup', theme = 'all', count = 10, hint = true;
let timer = null, advance = null;

export function cleanupHunter() {
 if (page === 'setup' && !run) return;
 clearInterval(timer);
 clearTimeout(advance);
 effects.stop();
 run = null;
 page = 'setup';
}

export function renderHunter({app, cards, state, mutate, tell}) {
 clearInterval(timer);
 clearTimeout(advance);
 const words = cards.filter(card => card.kind === 'word');
 const themes = [...new Set(words.map(card => card.theme))];
 const record = state.hunter;
 const catches = record?.catches || {};
 const pool = karutaPool([...words].sort((a, b) => Number(!!b.image) - Number(!!a.image)), theme);
 const byId = new Map(words.map(card => [card.id, card]));
 const $ = selector => app.querySelector(selector);
 const draw = () => renderHunter({app, cards, state, mutate, tell});
 const play = card => {
  if (state.settings.sound) audio.play(card).catch(error => tell(error.message));
 };
 const frame = body => {
  app.innerHTML = `<section class="hunter"><div class="section-head"><h1>たんごハンター</h1><a href="#home">アプリのホーム</a></div>${body}</section>`;
 };

 function deal() {
  const paired = run.queue.splice(0, 3);
  // Keep a single-sided card on each side when the category has enough words.
  const extras = shuffle(pool.filter(card => !paired.includes(card))).slice(0, 2);
  run.left = shuffle(extras[0] ? [...paired, extras[0]] : paired);
  run.right = shuffle(extras[1] ? [...paired, extras[1]] : paired);
  run.remaining = new Set(paired.map(card => card.id));
 }

 function start(mode) {
  const deck = shuffle(pool).sort((a, b) => (catches[a.id] || 0) - (catches[b.id] || 0))
   .slice(0, mode === 'stage' ? 10 : count);
  if (!deck.length) return;
  run = {mode, deck, queue: shuffle(deck), selected: null, done: 0, laps: 0, misses: 0,
   combo: 0, bestCombo: 0, score: 0, deadline: performance.now() + seconds * 1000,
   matched: new Set(), missed: new Set(), feedback: '英語と意味のペアを見つけよう。', assisted: hint};
  page = 'game';
  deal();
  draw();
 }

 function finish() {
  if (page !== 'game') return;
  clearInterval(timer);
  clearTimeout(advance);
  audio.stop();
  page = 'result';
  const finished = run;
  draw();
  void mutate(s => {
   const today = dayKey(Date.now());
   const yesterday = dayKey(Date.now() - 86400000);
   const saved = s.hunter ||= {catches: {}, stage: 0, time: 0, streak: 0, day: today};
   finished.newBest = finished.score > saved[finished.mode];
   saved[finished.mode] = Math.max(saved[finished.mode], finished.score);
   if (!finished.done) return;
   if (saved.day !== today || saved.streak === 0) {
    saved.streak = saved.day === yesterday ? saved.streak + 1 : 1;
    saved.day = today;
   }
   for (const id of finished.matched) {
    if (!finished.missed.has(id)) saved.catches[id] = Math.min(2, (saved.catches[id] || 0) + 1);
   }
  });
 }

 if (page === 'setup') {
  const mastered = pool.filter(card => catches[card.id] === 2).length;
  frame(`<div class="hunter-intro"><p>英語と意味の札をタップして、ペアをつかまえよう！<br><small>ヒントありでは、相手がいない札が暗くなるよ。</small></p>
   <div class="hunter-config"><label>ジャンル<select id="hunter-theme"><option value="all">すべて</option>${themes.map(value => `<option value="${esc(value)}" ${value === theme ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>
   <label>時間チャレンジの1周<select id="hunter-count">${[10,20,30,50].map(n => `<option ${n === count ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div>
   <p>マスター <strong>${mastered} / ${pool.length}</strong> 語${record?.streak ? ` · 🔥 ${record.streak}日れんぞく` : ''}</p>
   <div class="hunter-buttons"><button id="hunter-start" class="primary">スタート · ${Math.min(10, pool.length)}ペア</button><button id="hunter-time">⏱ 90秒チャレンジ</button><button id="hunter-book">📖 ずかん</button></div>
   <small>ベスト　ふつう ${record?.stage || 0}点 ／ 90秒 ${record?.time || 0}点</small></div>`);
  $('#hunter-theme').onchange = event => { theme = event.target.value; draw(); $('#hunter-theme').focus(); };
  $('#hunter-count').onchange = event => { count = Number(event.target.value); };
  $('#hunter-start').onclick = () => start('stage');
  $('#hunter-time').onclick = () => start('time');
  $('#hunter-book').onclick = () => { page = 'book'; draw(); };
  return;
 }

 const wordList = list => `<ul class="hunter-words">${list.map(card => `<li><button data-hunter-audio="${esc(card.id)}"><b lang="en">${esc(card.en)}</b><span>${esc(card.ja)}</span></button></li>`).join('')}</ul>`;
 const bindWords = () => {
  app.querySelectorAll('[data-hunter-audio]').forEach(button => {
   button.onclick = () => play(byId.get(button.dataset.hunterAudio));
  });
 };
 const back = () => { cleanupHunter(); audio.stop(); draw(); $('#hunter-start').focus(); };

 if (page === 'book') {
  const captured = words.filter(card => (theme === 'all' || theme === card.theme) && catches[card.id]);
  frame(`<div class="hunter-intro"><h2>ずかん · ${theme === 'all' ? 'すべて' : esc(theme)}</h2>
   <p>ミスなく取った回が2回になるとマスター！</p><button id="hunter-back">もどる</button>
   <h3>マスター</h3>${wordList(captured.filter(card => catches[card.id] === 2))}
   <h3>つかまえた</h3>${captured.length ? wordList(captured.filter(card => catches[card.id] === 1)) : '<p>ゲームでペアを集めよう。</p>'}</div>`);
  $('#hunter-back').onclick = back;
  bindWords();
  return;
 }

 if (page === 'result') {
  const timed = run.mode === 'time';
  const stars = timed ? Math.min(3, run.laps + Number(run.done > 0)) : run.misses === 0 ? 3 : run.misses <= 2 ? 2 : 1;
  const review = [...run.missed].map(id => byId.get(id)).filter(Boolean);
  frame(`<div class="hunter-intro"><h2>${timed ? 'タイムアップ！' : 'クリア！'}</h2>
   <p class="hunter-stars" aria-label="${stars}つ星">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</p>
   <p><strong>${run.score.toLocaleString()} 点</strong>${run.newBest ? ' · ベストこうしん！' : ''}</p>
   <p>${run.done}ペア${timed ? `（${run.laps}周）` : ''} · ミス ${run.misses}回 · 最高 ${run.bestCombo}コンボ</p>
   <div class="hunter-buttons"><button class="primary" id="hunter-again">もういちど！</button><button id="hunter-back">もどる</button></div>
   ${review.length ? `<details><summary>まちがえた単語を見直す</summary>${wordList(review)}</details>` : ''}</div>`);
  $('#hunter-again').onclick = () => start(run.mode);
  $('#hunter-back').onclick = back;
  bindWords();
  return;
 }

 const timed = run.mode === 'time';
 const tile = (card, side) => {
  const en = side === 'en';
  const hasPair = run.remaining.has(card.id);
  return `<button class="hunter-tile" data-hunter-id="${esc(card.id)}" data-side="${side}" data-pair="${hasPair}" aria-pressed="false"><span class="hunter-face" ${en ? 'lang="en"' : ''}>${!en && card.image ? `<img src="${esc(card.image.url)}" alt="" referrerpolicy="no-referrer">` : ''}<span>${esc(en ? card.en : card.ja)}</span></span></button>`;
 };
 frame(`<div class="hunter-game"><div class="hunter-hud">
  <strong id="hunter-score"></strong><span id="hunter-combo"></span><button id="hunter-hint" type="button"></button><button id="hunter-back">やめる</button>
  <progress id="hunter-progress" max="${timed ? seconds : run.deck.length}" aria-label="${timed ? 'のこり時間' : '取ったペア'}"></progress>
  <span id="hunter-counter"></span></div>
  <p id="hunter-feedback" role="status">${esc(run.feedback)}</p>
  <div class="hunter-board"><div><h2>英語</h2>${run.left.map(card => tile(card, 'en')).join('')}</div>
  <div><h2>絵と意味</h2>${run.right.map(card => tile(card, 'ja')).join('')}</div></div></div>`);
 const board = $('.hunter-board');
 const buttons = [...board.querySelectorAll('button')];
 for (const img of board.querySelectorAll('img')) {
  img.onerror = () => img.remove();
  if (img.complete && !img.naturalWidth) img.remove();
 }
 function paint() {
  board.classList.toggle('hunter-hints', hint);
  $('#hunter-hint').textContent = hint ? 'ヒントあり' : 'ヒントなし ×2';
  $('#hunter-hint').setAttribute('aria-pressed', String(hint));
  $('#hunter-score').textContent = `⭐ ${run.score}点`;
  $('#hunter-combo').textContent = run.combo ? `🔥 ${run.combo}コンボ` : '';
  $('#hunter-feedback').textContent = run.feedback;
  for (const button of buttons) {
   const {hunterId: id, side, pair} = button.dataset;
   const taken = pair === 'true' && !run.remaining.has(id);
   button.classList.toggle('hunter-taken', taken);
   button.disabled = taken || !!run.wrong;
   button.classList.toggle('hunter-wrong', !!run.wrong?.includes(button));
   button.setAttribute('aria-pressed', String(run.selected?.id === id && run.selected.side === side));
  }
 }
 function updateClock() {
  if (!timed) {
   $('#hunter-progress').value = run.done;
   $('#hunter-counter').textContent = `${run.done} / ${run.deck.length}ペア`;
   return;
  }
  const left = Math.max(0, Math.ceil((run.deadline - performance.now()) / 1000));
  $('#hunter-progress').value = left;
  $('#hunter-counter').textContent = `あと${left}秒 · ${run.done}ペア`;
  if (!left) finish();
 }
 function next() {
  if (run.remaining.size) return;
  if (!run.queue.length) {
   run.laps++;
   if (!timed) { finish(); return; }
   run.queue = shuffle(run.deck);
  }
  deal();
  draw();
  $('.hunter-tile')?.focus({preventScroll: true});
 }
 $('#hunter-hint').onclick = () => {
  hint = !hint;
  if (hint) run.assisted = true;
  paint();
 };
 $('#hunter-back').onclick = back;
 for (const button of buttons) button.onclick = () => {
  if (timed && performance.now() >= run.deadline) { finish(); return; }
  const {hunterId: id, side} = button.dataset;
  const card = byId.get(id);
  if (side === 'en' && (!run.selected || run.selected.side === side)) play(card);
  if (!run.selected || run.selected.side === side) {
   run.selected = run.selected?.id === id ? null : {id, side, button};
   run.feedback = run.selected ? 'もう片方の札をえらぼう。' : '英語と意味のペアを見つけよう。';
   paint();
   return;
  }
  const selected = run.selected;
  run.selected = null;
  if (id !== selected.id) {
   run.misses++;
   run.combo = 0;
   run.missed.add(id);
   run.missed.add(selected.id);
   run.feedback = 'ちがうペアだよ。もう一度さがそう！';
   run.wrong = [button, selected.button];
   paint();
   effects.play('wrong', state.settings.sound);
   advance = setTimeout(() => { run.wrong = null; paint(); button.focus({preventScroll: true}); }, 360);
   return;
  }
  run.remaining.delete(id);
  run.matched.add(id);
  run.combo++;
  run.done++;
  run.bestCombo = Math.max(run.bestCombo, run.combo);
  const points = (10 + 5 * Math.min(run.combo - 1, 9)) * (run.assisted ? 1 : 2);
  run.assisted = hint;
  run.score += points;
  run.feedback = `ペアをゲット！ ＋${points}点`;
  play(card);
  effects.play('correct', state.settings.sound);
  paint();
  updateClock();
  if (page !== 'game') return;
  if (!run.remaining.size) advance = setTimeout(next, 310);
  else buttons.find(candidate => candidate.dataset.pair === 'true' && !candidate.disabled)?.focus({preventScroll: true});
 };

 // A settings refresh can redraw the board while feedback is showing.
 run.selected = null;
 run.wrong = null;
 paint();
 updateClock();
 if (page !== 'game') return;
 if (!run.remaining.size) advance = setTimeout(next, 310);
 if (timed) timer = setInterval(updateClock, 150);
}
