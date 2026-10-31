import * as audio from './audio.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
import {karutaPool,createKaruta,takeKaruta,validKaruta} from './karuta-session.js';

let generation=0,heard=null,auto=false,acting=false;
export function cleanupKaruta(){generation++;heard=null;auto=false;acting=false;}
export function renderKaruta({app,cards,state,mutate,tell}){
 ++generation;acting=false;heard=null;
 const $=s=>app.querySelector(s),run=state.karuta,byId=new Map(cards.map(c=>[c.id,c]));
 const active=run&&validKaruta(run,new Set(byId.keys()))&&run.ids.length>0;
 const done=active&&run.index===run.order.length;
 const theme=active?run.theme:'all',face=active?run.face:'meaning',count=active?run.count:20;
 app.innerHTML=`<div class="karuta-wrap"><div class="section-head"><h1>音声かるた</h1><a href="#home">ホームへ</a></div><p class="muted">英語を聞いて、同じ意味の札をタップしよう。</p><details class="panel karuta-config" ${!active?'open':''}><summary>カテゴリ・枚数・札の表示</summary><form id="karuta-config"><label>カテゴリ<select id="karuta-theme"><option value="all">すべて</option>${[...new Set(cards.map(c=>c.theme))].map(t=>`<option value="${esc(t)}" ${theme===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>並べる枚数<input id="karuta-count" type="number" min="4" max="40" step="1" value="${count}" required></label><label>札の表示<select id="karuta-face"><option value="meaning" ${face==='meaning'?'selected':''}>絵＋日本語</option><option value="english" ${face==='english'?'selected':''}>英単語</option></select></label><p id="karuta-pool" class="muted"></p><button class="primary" type="submit">${active?'新しく並べてはじめる':'並べてはじめる'}</button>${active&&!done?'<small>今の回を終えて、新しい札に入れ替えます。</small>':''}</form></details><div id="karuta-game"></div><small class="muted">途中でも続きから遊べます。かるたは練習用で、準備度・XPには加算しません。</small></div>`;
 const pool=()=>{const n=karutaPool(cards,$('#karuta-theme').value,$('#karuta-face').value).length;$('#karuta-pool').textContent=`このカテゴリで並べられる札：${n}枚。指定枚数より少ないときは、ある札で遊びます。`;};pool();
 $('#karuta-theme').onchange=pool;$('#karuta-face').onchange=pool;
 $('#karuta-config').onsubmit=ev=>{ev.preventDefault();const t=$('#karuta-theme').value,n=$('#karuta-count').value,f=$('#karuta-face').value;audio.stop();auto=true;mutate(s=>{s.karuta=createKaruta(cards,t,n,f);});};
 const game=$('#karuta-game');
 if(!active){auto=false;game.innerHTML='<p>① カテゴリを選ぶ → ② 札を並べる → ③ 英語を聞いて取る</p>';return;}
 if(done){auto=false;game.innerHTML=`<section class="panel card"><div class="check">✓</div><h2>${run.ids.length}枚、とれたよ！</h2><p>おてつき ${run.mistakes}回</p>${run.missed.length?`<details><summary>聞き直してみよう · ${run.missed.length}枚</summary><div class="karuta-review">${run.missed.map(id=>{const c=byId.get(id);return `<button data-karuta-review="${esc(id)}"><span lang="en">${esc(c.en)}</span> · ${esc(c.ja)} ▶</button>`;}).join('')}</div></details>`:'<p>おてつきなし！よく聞けたね。</p>'}<div class="actions"><button id="karuta-again" class="primary">同じカテゴリでもう一回</button><a href="#home">今日はここまで</a></div></section>`;$('#karuta-again').onclick=()=>{auto=true;mutate(s=>{s.karuta=createKaruta(cards,theme,count,face);});};app.querySelectorAll('[data-karuta-review]').forEach(b=>b.onclick=()=>{if(!state.settings.sound){tell('音声 OFF です。上の「音声 OFF」を押して ON にしてください。');return;}audio.play(byId.get(b.dataset.karutaReview)).catch(e=>tell(e.message));});return;}
 const target=byId.get(run.order[run.index]),taken=new Set(run.order.slice(0,run.index));
 game.innerHTML=`<div class="karuta-toolbar"><div class="section-head"><strong>${esc(run.theme==='all'?'すべて':run.theme)} · ${run.index} / ${run.ids.length}枚</strong><span>おてつき ${run.mistakes}</span></div><progress value="${run.index}" max="${run.ids.length}" aria-label="取った札"></progress><div class="karuta-audio"><button id="karuta-play" class="primary">▶ 英語を聞く</button><button id="karuta-slow">ゆっくり</button><button id="karuta-stop">■ 停止</button></div><p id="karuta-feedback" role="status" aria-live="polite">${esc(run.feedback||'「英語を聞く」を押してから札を取ろう。')}</p></div><div class="karuta-grid" aria-label="取り札">${run.ids.map(id=>{const c=byId.get(id);return `<button class="karuta-card ${taken.has(id)?'taken':''}" data-karuta-card="${esc(id)}" disabled ${taken.has(id)?'aria-label="取った札"':''}>${face==='english'?`<strong lang="en">${esc(c.en)}</strong>`:`${c.image?`<img src="${esc(c.image.url)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:''}<strong>${esc(c.ja)}</strong>`}</button>`;}).join('')}</div>`;
 const lock=locked=>app.querySelectorAll('[data-karuta-card]').forEach(b=>{b.disabled=locked||taken.has(b.dataset.karutaCard);});
 const play=async slow=>{
  if(!state.settings.sound){$('#karuta-feedback').textContent='音声 OFF です。上の「音声 OFF」を押して ON にしてください。';return;}
  heard=null;lock(true);$('#karuta-feedback').textContent=(run.feedback?run.feedback+'　':'')+'英語を聞いて、札を探そう。';
  const attempt=++generation;
  try{const started=await audio.play(target,{slow});if(attempt!==generation||!app.contains(game))return;if(started){heard=target.id;lock(false);}}
  catch(e){if(attempt===generation){$('#karuta-feedback').textContent='再生できませんでした。「英語を聞く」でやり直そう。';tell(e.message);}}
 };
 $('#karuta-play').onclick=()=>play(false);$('#karuta-slow').onclick=()=>play(true);
 $('#karuta-stop').onclick=()=>{generation++;audio.stop();heard=null;lock(true);$('#karuta-feedback').textContent='停止しました。「英語を聞く」で再開できます。';};
 app.querySelectorAll('[data-karuta-card]').forEach(b=>b.onclick=async()=>{
  if(acting||heard!==target.id)return;acting=true;lock(true);audio.stop();
  const id=b.dataset.karutaCard,correct=id===target.id;
  auto=correct;
  await mutate(s=>{if(s.karuta?.order[s.karuta.index]!==target.id)return;if(takeKaruta(s.karuta,id))s.karuta.feedback=`とれた！ ${target.en} · ${target.ja}`;});
 });
 app.querySelectorAll('.karuta-card img').forEach(img=>img.onerror=()=>{img.style.visibility='hidden';});
 if(auto){auto=false;void play(false);}
}
