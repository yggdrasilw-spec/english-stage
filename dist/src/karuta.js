import {recordKarutaResult} from './karuta-learning.js';
import {renderKarutaResults} from './karuta-results.js';
import * as audio from './audio.js';
import * as effects from './effects.js';
import {karutaContrast} from './karuta-contrast.js';

const targetLabel=r=>r.en+' · '+r.ja;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
import {karutaPool,createKaruta,takeKaruta,validKaruta} from './karuta-session.js';

let generation=0,heard=null,auto=false,acting=false,feedback=null,nextTimer=null,lastComparison=null,measurement=null;
export function cleanupKaruta(){generation++;clearTimeout(nextTimer);heard=null;auto=false;acting=false;feedback=null;lastComparison=null;measurement=null;effects.stop();}
export function renderKaruta({app,cards,state,mutate,tell}){
 ++generation;clearTimeout(nextTimer);acting=false;heard=null;
 const result=feedback;feedback=null;
 if(document.hidden&&measurement){measurement.eligible=false;measurement.comparable=false;}
 const $=s=>app.querySelector(s),run=state.karuta,byId=new Map(cards.map(c=>[c.id,c]));
 const active=run&&validKaruta(run,new Set(byId.keys()))&&run.ids.length>0;
 const done=active&&run.index===run.order.length;
 const theme=active?run.theme:'all',face=active?run.face:'meaning',count=active?run.count:20;
 app.innerHTML=`<div class="karuta-wrap"><div class="section-head"><h1>音声かるた</h1><a href="#home">ホームへ</a></div><p class="muted">英語を聞いて、同じ意味の札をタップしよう。</p><details class="panel karuta-config" ${!active?'open':''}><summary>${active?esc(theme==='all'?'すべて':theme)+' · '+run.ids.length+'枚 ／ 設定を変える':'カテゴリ・枚数・札の表示'}</summary><form id="karuta-config"><label>カテゴリ<select id="karuta-theme"><option value="all">すべて</option>${[...new Set(cards.map(c=>c.theme))].map(t=>`<option value="${esc(t)}" ${theme===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>並べる枚数<input id="karuta-count" type="number" min="4" max="40" step="1" value="${count}" required></label><label>札の表示<select id="karuta-face"><option value="meaning" ${face==='meaning'?'selected':''}>絵＋日本語</option><option value="english" ${face==='english'?'selected':''}>英単語</option></select></label><p id="karuta-pool" class="muted"></p><button class="primary" type="submit">${active?'新しく並べてはじめる':'並べてはじめる'}</button>${active&&!done?'<small>今の回を終えて、新しい札に入れ替えます。</small>':''}</form></details><div id="karuta-game"></div><small class="muted">取るまでの時間・おてつき・聞き直しを記録します。別の日にもすぐ取れた語は30日お休み。未習・苦手な語から出します。準備度・XPには加算しません。</small></div>`;
 const pool=()=>{const n=karutaPool(cards,$('#karuta-theme').value,$('#karuta-face').value,state).length;$('#karuta-pool').textContent=`今練習する札：${n}枚。わかる語はお休み。指定枚数より少ないときは、ある札で遊びます。`;};pool();
 $('#karuta-theme').onchange=pool;$('#karuta-face').onchange=pool;
 $('#karuta-config').onsubmit=ev=>{ev.preventDefault();const t=$('#karuta-theme').value,n=$('#karuta-count').value,f=$('#karuta-face').value;audio.stop();auto=true;mutate(s=>{s.karuta=createKaruta(cards,t,n,f,Math.random,s);measurement={fresh:true};});};
 const game=$('#karuta-game');
 if(!active){auto=false;game.innerHTML=run?.ids.length===0?'<p>このカテゴリは今練習する札がありません。ほかのカテゴリを選ぼう。定着した札は30日後にまた確かめます。</p>':'<p>① カテゴリを選ぶ → ② 札を並べる → ③ 英語を聞いて取る</p>';return;}
 if(done){auto=false;game.innerHTML=`<section class="panel card"><div class="karuta-complete" aria-hidden="true">✦ ○ ✦</div><h2>${run.ids.length}枚、とれたよ！</h2><p>おてつき ${run.mistakes}回</p>${renderKarutaResults(run,byId)}${run.missed.length?`<details><summary>聞き直してみよう · ${run.missed.length}枚</summary><div class="karuta-review">${run.missed.map(id=>{const c=byId.get(id);return `<button data-karuta-review="${esc(id)}"><span lang="en">${esc(c.en)}</span> · ${esc(c.ja)} ▶</button>`;}).join('')}</div></details>`:'<p>おてつきなし！よく聞けたね。</p>'}<p class="muted">次は、まだ練習していない札・練習回数が少ない札から並べます。</p><div class="actions"><button id="karuta-again" class="primary">同じカテゴリでもう一回</button><a href="#home">今日はここまで</a></div></section>`;$('#karuta-again').onclick=()=>{auto=true;mutate(s=>{s.karuta=createKaruta(cards,theme,count,face,Math.random,s,Date.now(),true);measurement={fresh:true};});};app.querySelectorAll('[data-karuta-review]').forEach(b=>b.onclick=()=>{if(!state.settings.sound){tell('音声 OFF です。上の「音声 OFF」を押して ON にしてください。');return;}audio.play(byId.get(b.dataset.karutaReview)).catch(e=>tell(e.message));});return;}
 const target=byId.get(run.order[run.index]),taken=new Set(run.order.slice(0,run.index));
 if(measurement?.target!==target.id){const fresh=measurement?.fresh||result?.correct;measurement={target:target.id,start:null,plays:0,slow:false,eligible:!!fresh,comparable:!!fresh};}
 game.innerHTML=`<div class="karuta-toolbar"><div class="section-head"><strong>${run.index} / ${run.ids.length}枚 とれた</strong><span>おてつき ${run.mistakes}</span></div><progress value="${run.index}" max="${run.ids.length}" aria-label="取った札"></progress><div class="karuta-audio"><button id="karuta-play" class="primary">▶ 英語を聞く</button><button id="karuta-slow">ゆっくり</button><button id="karuta-stop">■ 停止</button></div><div id="karuta-feedback" class="${result?'is-'+(result.correct?'correct':'wrong'):''}" role="status" aria-live="polite" aria-atomic="true">${result?`<span class="karuta-result-symbol" aria-hidden="true">${result.correct?'○':'×'}</span>`:''}<span>${esc(result?(result.correct?'とれた！ '+targetLabel(result)+(result.ms!=null?' · '+(result.ms/1000).toFixed(1)+'秒':''):'おてつき！ もう一度聞こう。'):(run.feedback||'「英語を聞く」を押してから札を取ろう。'))}</span></div></div><div class="karuta-grid" aria-label="取り札">${run.ids.map(id=>{const c=byId.get(id);return `<button class="karuta-card ${taken.has(id)?'taken':''} ${result?.id===id?(result.correct?'just-taken':'just-wrong'):''}" data-karuta-card="${esc(id)}" disabled ${taken.has(id)?'aria-label="取った札"':''}>${face==='english'?`<strong lang="en">${esc(c.en)}</strong>`:`${c.image?`<img src="${esc(c.image.url)}" alt="" referrerpolicy="no-referrer" loading="lazy">`:''}<strong>${esc(c.ja)}</strong>`}</button>`;}).join('')}</div>`;
 const lock=locked=>app.querySelectorAll('[data-karuta-card]').forEach(b=>{b.disabled=locked||taken.has(b.dataset.karutaCard);});
 const play=async slow=>{
  if(!state.settings.sound){$('#karuta-feedback').textContent='音声 OFF です。上の「音声 OFF」を押して ON にしてください。';return;}
  if(acting)return;clearTimeout(nextTimer);effects.stop();
  heard=null;lock(true);$('#karuta-feedback').textContent='英語を聞いて、札を探そう。';
  $('#karuta-feedback').className='';app.querySelectorAll('.just-taken,.just-wrong').forEach(b=>b.classList.remove('just-taken','just-wrong'));
  const attempt=++generation;measurement.plays++;measurement.slow||=slow;
  try{const started=await audio.play(target,{slow});if(attempt!==generation||!app.contains(game)||document.hidden)return;if(started){measurement.start??=performance.now();heard=target.id;lock(false);}}
  catch(e){if(measurement){measurement.eligible=false;measurement.comparable=false;}if(attempt===generation){$('#karuta-feedback').textContent='再生できませんでした。「英語を聞く」でやり直そう。';tell(e.message);}}
 };
 $('#karuta-play').onclick=()=>play(false);$('#karuta-slow').onclick=()=>play(true);
 $('#karuta-stop').onclick=()=>{if(acting)return;generation++;clearTimeout(nextTimer);audio.stop();effects.stop();heard=null;if(measurement){measurement.eligible=false;measurement.comparable=false;}lock(true);$('#karuta-feedback').textContent='停止しました。「英語を聞く」で再開できます。';};
 app.querySelectorAll('[data-karuta-card]').forEach(b=>b.onclick=async()=>{
  if(acting||heard!==target.id)return;acting=true;lock(true);audio.stop();
  const id=b.dataset.karutaCard,correct=id===target.id;
  const evidence={correct,ms:measurement.start===null?null:Math.max(0,Math.round(performance.now()-measurement.start)),plays:measurement.plays,slow:measurement.slow,eligible:measurement.eligible&&!document.hidden&&!run.missed.includes(target.id),choices:run.ids.length-run.index,comparable:measurement.comparable&&!document.hidden};
  feedback={id,correct,en:target.en,ja:target.ja,ms:evidence.ms};effects.play(correct?'correct':'wrong',state.settings.sound);
  auto=correct;
  await mutate(s=>{if(s.karuta?.order[s.karuta.index]!==target.id)return;if(s.karuta.ids.join('|')!==run.ids.join('|')||s.karuta.face!==face||s.karuta.index!==run.index)return;recordKarutaResult(s,s.karuta,target.id,evidence);if(!correct)measurement.eligible=false;if(takeKaruta(s.karuta,id))s.karuta.feedback=`とれた！ ${target.en} · ${target.ja}`;});
 });
 const key=run.ids.join('|');
 if(result?.correct||lastComparison&&(lastComparison.key!==key||lastComparison.target!==target.id||lastComparison.mistakes!==run.mistakes))lastComparison=null;
 const chosen=result&&!result.correct?byId.get(result.id):byId.get(lastComparison?.id),contrast=karutaContrast(target,chosen);
 if(contrast){
  lastComparison={key,target:target.id,mistakes:run.mistakes,id:chosen.id};
  const dialog=document.createElement('dialog');dialog.className='karuta-contrast';dialog.setAttribute('aria-labelledby','karuta-contrast-title');
  const row=(c,note,label,key)=>`<section class="karuta-contrast-word"><small>${label}</small><h3><span lang="en">${esc(c.en)}</span> <span>${esc(c.ja)}</span></h3><p>${esc(note)}</p><p class="karuta-contrast-example"><span lang="en">${esc(c.example)}</span><br>${esc(c.exampleJa)}</p><button type="button" data-contrast-audio="${key}" aria-label="${esc(c.en)}の音を聞く">▶ ${esc(c.en)} を聞く</button></section>`;
  dialog.innerHTML=`<div class="karuta-contrast-body"><h2 id="karuta-contrast-title">ふたつのことばをくらべよう</h2>${contrast.sharedImage?'<p class="muted">同じ絵で、まぎらわしいね。</p>':''}<p class="karuta-contrast-tip">${esc(contrast.note)}</p>${row(target,contrast.targetNote,'聞こえたのは','target')}${row(chosen,contrast.chosenNote,'選んだのは','chosen')}</div><div class="karuta-contrast-actions"><p id="karuta-contrast-status" role="status"></p><button type="button" id="karuta-contrast-stop">■ 停止</button><button type="button" class="primary" id="karuta-contrast-back" autofocus>聞き直して、札を探す</button></div>`;
  game.append(dialog);
  const reopen=document.createElement('button');reopen.id='karuta-compare';reopen.textContent='さっきの２語をくらべる';reopen.onclick=()=>{generation++;audio.stop();effects.stop();heard=null;lock(true);dialog.returnValue='';dialog.showModal();};
  game.querySelector('.karuta-toolbar').append(reopen);
  dialog.querySelectorAll('[data-contrast-audio]').forEach(b=>b.onclick=()=>{
   if(!state.settings.sound){dialog.querySelector('#karuta-contrast-status').textContent='音声 OFF です。説明を閉じて、上の音声ボタンで ON にできます。';return;}
   effects.stop();audio.play(b.dataset.contrastAudio==='target'?target:chosen).catch(e=>{if(dialog.isConnected)dialog.querySelector('#karuta-contrast-status').textContent=e.message;});
  });
  dialog.querySelector('#karuta-contrast-stop').onclick=()=>{audio.stop();effects.stop();};
  dialog.querySelector('#karuta-contrast-back').onclick=()=>dialog.close('retry');
  dialog.addEventListener('close',()=>{audio.stop();if(!app.contains(game))return;$('#karuta-play').focus({preventScroll:true});if(dialog.returnValue==='retry')void play(false);});
  if(result&&!result.correct)dialog.showModal();
 }
 app.querySelectorAll('.karuta-card img').forEach(img=>img.onerror=()=>{img.style.visibility='hidden';});
 if(auto){auto=false;const mine=generation;nextTimer=setTimeout(()=>{if(mine===generation&&app.contains(game)&&!document.hidden)void play(false);},result?950:0);}
}

// A background interruption never counts as fluent recall, even after replay.
document.addEventListener('visibilitychange',()=>{if(document.hidden){if(measurement){measurement.eligible=false;measurement.comparable=false;}heard=null;document.querySelectorAll('[data-karuta-card]').forEach(b=>b.disabled=true);}});
