import {recordForest,forestJourney} from './forest.js';
import {forestReward,bindForestStarts} from './forest-view.js';
import {createKaruta} from './karuta-session.js';
import {companionMilestone} from './companion-view.js';
import {warmImages,bindFlash,animateCard,enterCard} from './flashcards.js';
import * as effects from './effects.js';
import {updateProgress,dueTasks} from './scheduler.js';
import {isKnown,setScreening,verifyScreening} from './learning.js';
import * as audio from './audio.js';
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const modes={card:'カード',read:'英語 → 意味',recall:'意味 → 英語',listen:'音声 → 意味',match:'組み合わせ'};
let ctx,ui={},timer,undo=null,configure=false,acting=false;
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
export function cleanupFast(){clearTimeout(timer);timer=null;}
export function startFast(s,cards,mode='card',filter='all',theme='all'){
 const due=new Set(dueTasks(cards,s).map(t=>t.id));
 const ids=cards.filter(c=>(theme==='all'||c.theme===theme)&&(filter==='all'||filter==='new'&&!isKnown(s,c.id)||filter==='weak'&&Object.values(s.progress[c.id]||{}).some(p=>p.lastQuality==='wrong'||p.lastQuality==='guess')||filter==='due'&&due.has(c.id))).map(c=>c.id);
 s.fast={ids,index:0,mode,filter,theme,checked:0,correct:0,known:0,feedback:null,auto:s.fast?.auto??true};ui={};undo=null;
}
export function startReview(s,cards){const tasks=dueTasks(cards,s).slice(0,10);startFast(s,cards,tasks[0]?.skill||'read','due');s.fast.ids=tasks.map(t=>t.id);s.fast.tasks=tasks;}
function record(s,c,skill,quality){const now=Date.now();recordForest(s,{skill,recovered:quality==='correct'&&['wrong','guess'].includes(s.progress[c.id]?.[skill]?.lastQuality)},now);verifyScreening(s,c.id,quality,now);s.seen[c.id]||=now;s.progress[c.id]||={};s.progress[c.id][skill]=updateProgress(s.progress[c.id][skill],quality,now);s.history.push({id:c.id,skill,quality,at:now});}
function snapshot(){const s=ctx.state;undo={fast:structuredClone(s.fast),screening:structuredClone(s.screening),progress:structuredClone(s.progress),seen:structuredClone(s.seen),history:structuredClone(s.history),forest:structuredClone(s.forest),stars:s.stars,rewards:structuredClone(s.rewards)};}
export function startForestRound(s,cards,mode='read'){
 const weak=mode==='weak';startFast(s,cards,weak?'read':mode,weak?'all':'new');if(!s.fast.ids.length)startFast(s,cards,weak?'read':mode,'all');
 const count=id=>Object.values(s.progress[id]||{}).reduce((n,p)=>n+(p.attempts||0),0);
 const isWeak=id=>Object.values(s.progress[id]||{}).some(p=>['wrong','guess'].includes(p.lastQuality));
 s.fast.ids.sort((a,b)=>(weak?Number(isWeak(b))-Number(isWeak(a)):0)||count(a)-count(b));
 s.fast.ids=s.fast.ids.slice(0,5);s.fast.round=true;s.fast.startedForest=s.forest?.total||0;s.fast.auto=false;
}
function next(f){f.index++;f.feedback=null;ui={};}
function draw(){renderFast(ctx);}
async function judge(c,selected){
 const {state,mutate}=ctx,f=state.fast;if(f.feedback||acting)return;acting=true;audio.stop();effects.prepare(state.settings.sound);
 snapshot();const ok=selected===c.id,recovered=ok&&['wrong','guess'].includes(state.progress[c.id]?.[f.mode]?.lastQuality);
 await mutate(s=>{const f=s.fast;if(ok){effects.play('correct',s.settings.sound);ui.freshCorrect=true;}record(s,c,s.fast.tasks?.[s.fast.index]?.skill||f.mode,ok?'correct':'wrong');f.checked++;if(ok)f.correct++;f.feedback={ok,recovered,answer:c.ja,en:c.en};});
 if(ok&&ctx.state.fast.auto){const at=ctx.state.fast.index;timer=setTimeout(()=>{if(location.hash==='#fast'&&ctx.state.fast.index===at&&ctx.state.fast.feedback)ctx.mutate(s=>next(s.fast));},320);}
}
export function renderFast(context){
 ctx=context;acting=false;const {app,cards,state,mutate}=context;cleanupFast();
 if(!state.fast){app.innerHTML='<section class="narrow panel"><h1>カードを準備</h1><button id="fast-init" class="primary">はじめる</button></section>';app.querySelector('#fast-init').onclick=()=>mutate(s=>startFast(s,cards));return;}
 const f=state.fast,byId=new Map(cards.map(c=>[c.id,c])),c=byId.get(f.ids[f.index]);
 if(f.tasks?.[f.index])f.mode=f.tasks[f.index].skill;
 app.innerHTML=`<div class="fast-wrap"><div class="fast-top"><a href="#home">← 終える</a><span>${Math.min(f.index,f.ids.length)} / ${f.ids.length} <small>確認 ${f.checked}・わかる ${f.known}</small></span><button id="fast-undo" ${undo?'':'disabled'}>１つ戻す</button></div><div class="mode-tabs" aria-label="確認のしかた">${Object.entries(modes).map(([k,v])=>`<button data-mode="${k}" aria-pressed="${f.mode===k}">${v}</button>`).join('')}</div><details class="fast-config"><summary>対象・テーマ・進み方</summary><div class="fast-filters"><label>テーマ <select id="fast-theme"><option value="all">すべて</option>${[...new Set(cards.map(c=>c.theme))].map(t=>`<option ${t===f.theme?'selected':''}>${e(t)}</option>`).join('')}</select></label><label>対象 <select id="fast-filter">${Object.entries({all:'すべて',new:'「わかる」以外',weak:'まちがえた語',due:'復習の時期'}).map(([k,v])=>`<option value="${k}" ${k===f.filter?'selected':''}>${v}</option>`).join('')}</select></label><label><input id="fast-auto" type="checkbox" ${f.auto?'checked':''}>正解したら次へ</label></div></details><progress value="${f.index}" max="${f.ids.length||1}" aria-label="確認したカード"></progress><div class="forest-live" role="status">森への水まで、あと${forestJourney(state).untilWater}問${forestJourney(state).water===0&&forestJourney(state).total>0?' · 水が届いたよ！':''}<a href="#forest">森の成長を見る →</a></div><div id="fast-content"></div><div class="fast-bottom"><button id="fast-skip">今回は飛ばす →</button><button id="fast-mix">シャッフル</button><span id="fast-status" role="status" aria-live="polite"></span></div><details class="fast-help"><summary>操作のヒント</summary><small>「わかる」は初回説明を省き、翌日以降に選択式で確認します。自己申告は正解とは別です。Space：めくる／次へ、→：わかる、←：あとで</small></details></div>`;
 const $=sel=>app.querySelector(sel),content=$('#fast-content');
 $('.fast-config').open=configure;$('.fast-config').ontoggle=ev=>{configure=ev.target.open;};
 app.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>mutate(s=>{delete s.fast.tasks;s.fast.mode=b.dataset.mode;s.fast.feedback=null;ui={};undo=null;}));
 $('#fast-theme').onchange=ev=>mutate(s=>startFast(s,cards,f.mode,f.filter,ev.target.value));
 $('#fast-filter').onchange=ev=>mutate(s=>startFast(s,cards,f.mode,ev.target.value,f.theme));
 $('#fast-auto').onchange=ev=>mutate(s=>{s.fast.auto=ev.target.checked;});
 $('#fast-undo').onclick=()=>{const saved=undo;undo=null;ui={};mutate(s=>Object.assign(s,saved));};
 $('#fast-skip').onclick=()=>{snapshot();mutate(s=>next(s.fast));};
 $('#fast-mix').onclick=()=>mutate(s=>{s.fast.ids=[...f.ids.slice(0,f.index),...shuffle(f.ids.slice(f.index))];s.fast.feedback=null;ui={};});
 if(!c&&f.round){content.innerHTML=`<section class="panel card forest-round-result"><h1>5問のラウンド、おつかれさま！</h1><p>答えを確認 ${f.checked}問 · 自力で正解 ${f.correct}問</p>${forestReward(state)}<div class="actions"><button class="primary" data-forest-start="read">次の5問で、森を育てる</button><button data-forest-start="listen">今度は聞く5問</button><button data-forest-start="recall">意味から英語の5問</button><button data-forest-start="weak">苦手をもう一度</button><button id="round-karuta">今のことばで、かるた！</button><a href="#home">ここでおしまい</a></div></section>`;$('#fast-skip').disabled=true;bindForestStarts(ctx);$('#round-karuta').onclick=async()=>{await mutate(s=>{s.karuta=createKaruta(cards.filter(c=>f.ids.includes(c.id)),'all',5,'meaning',Math.random,null);});location.hash='karuta';};return;}
 if(!c){content.innerHTML=`<section class="panel card"><h1>${f.ids.length?'ひと通り確認！':'この条件のカードはありません'}</h1>${companionMilestone(state)}<p>選択で確認 ${f.checked}回 · 正解 ${f.correct}回 · わかる ${f.known}こ</p><button class="primary" id="fast-again">もう一度</button> <a href="#exams">実戦テストへ</a></section>`;$('#fast-skip').disabled=true;$('#fast-again').onclick=()=>mutate(s=>startFast(s,cards,f.mode,f.filter,f.theme));return;}
 if(f.mode==='match'){renderMatch(content,f,byId,mutate);return;}
 if(f.mode==='card'){
  warmImages(f.ids.slice(Math.max(0,f.index-2),f.index+6).map(id=>byId.get(id)));
  content.innerHTML=`<div class="flash-stack"><button id="fast-flip" class="flash-card flash-face ${ui.flipped?'is-flipped':''}" aria-label="${ui.flipped?'英語に戻す':'意味を表示'}" aria-pressed="${!!ui.flipped}"><span class="flash-inner"><span class="flash-side flash-front" ${ui.flipped?'inert aria-hidden="true"':''}><small>${e(c.theme)} · タップでめくる</small><span class="flash-word" lang="en-US">${e(c.en)}</span><span class="muted">意味を思い出してみよう</span></span><span class="flash-side flash-back" ${ui.flipped?'':'inert aria-hidden="true"'}><span class="card-ja">${e(c.ja)}</span><span lang="en-US">${e(c.en)}</span>${c.image?`<img src="${e(c.image.url)}" alt="" referrerpolicy="no-referrer">`:''}<span lang="en-US">${e(c.example)}</span><small>${e(c.exampleJa)}</small></span></span></button><span class="flash-sparkles" aria-hidden="true">✦ ✧ ✦<br>✧ ✓ ✧<br>✦ ✧ ✦</span></div><div class="actions"><button id="fast-prev" ${f.index===0?'disabled':''}>← 前のカード</button><button id="fast-forward" ${f.index+1>=f.ids.length?'disabled':''}>次のカード →</button></div><small>左スワイプで次へ・右スワイプで前へ</small><div class="actions fast-rating"><button id="fast-later">← あとで確認</button><button id="fast-known" class="primary">わかる ✓</button></div><div class="actions"><button id="fast-play">▶ 発音</button><button id="fast-slow">ゆっくり</button></div>`;
  const move=async direction=>{
   if(acting||f.index+direction<0||f.index+direction>=f.ids.length)return false;acting=true;audio.stop();effects.play('move',state.settings.sound);
   const el=$('.flash-stack');await animateCard(el,direction>0?'next':'previous',state.settings.motion);if(!el.isConnected)return;
   snapshot();await mutate(s=>{s.fast.index+=direction;s.fast.feedback=null;ui={};});enterCard(ctx.app.querySelector('.flash-stack'),direction,ctx.state.settings.motion);return true;
  };
  bindFlash($('#fast-flip'),()=>{ui.flipped=!ui.flipped;effects.play('flip',state.settings.sound);return ui.flipped;},move,()=>acting,d=>f.index+d>=0&&f.index+d<f.ids.length);
  $('#fast-prev').onclick=()=>move(-1);$('#fast-forward').onclick=()=>move(1);
  for(const [id,status] of [['#fast-known','known'],['#fast-later','unsure']])$(id).onclick=async()=>{
   if(acting)return;acting=true;audio.stop();effects.play(status==='known'?'known':'move',state.settings.sound);
   const el=$('.flash-stack');await animateCard(el,status==='known'?'known':'next',state.settings.motion);if(!el.isConnected)return;
   snapshot();await mutate(s=>{setScreening(s,c.id,status);if(ui.flipped)recordForest(s,{skill:'card'});s.seen[c.id]||=Date.now();if(status==='known'){s.fast.known++;s.fast.ids.splice(s.fast.index,1);s.fast.feedback=null;ui={};}else next(s.fast);});
  };
 }else{
  const key=c.id+f.mode;if(ui.key!==key){const field=f.mode==='recall'?'en':'ja';const used=new Set([c[field]]);const candidates=shuffle(cards.filter(x=>x.id!==c.id&&x.kind===c.kind));const wrong=candidates.filter(x=>{if(used.has(x[field]))return false;used.add(x[field]);return true;}).slice(0,3);ui={key,options:shuffle([c,...wrong])};}
  const feedback=f.feedback;
  content.innerHTML=`<section class="flash-face quiz-face"><small>${e(c.theme)}</small>${f.mode==='listen'?'<button id="fast-play" class="listen-big">▶ 聞く</button><button id="fast-slow">ゆっくり</button>':`<h1 class="flash-word" lang="${f.mode==='recall'?'ja':'en-US'}">${e(f.mode==='recall'?c.ja:c.en)}</h1>`}<div class="fast-options">${ui.options.map((x,i)=>`<button data-fast-answer="${x.id}" ${feedback?'disabled':''} ${feedback&&x.id===c.id?'class="right-answer"':''}>${i+1}. ${e(f.mode==='recall'?x.en:x.ja)}</button>`).join('')}</div>${feedback?`<div class="fast-feedback" role="status">${feedback.ok?effects.correctMark(ui.freshCorrect):''}<strong>${feedback.recovered?'🌼 前は迷ったことば、自分でできた！':feedback.ok?'✓ 正解':'もう一度覚えよう'}</strong><p lang="en-US">${e(c.en)} <span lang="ja">＝ ${e(c.ja)}</span></p><button id="fast-next" class="primary">次へ →</button></div>`:''}</section>`;
  ui.freshCorrect=false;
  app.querySelectorAll('[data-fast-answer]').forEach(b=>b.onclick=()=>judge(c,b.dataset.fastAnswer));
  if(feedback){$('#fast-next').onclick=()=>mutate(s=>next(s.fast));}
 }
 if($('#fast-play'))$('#fast-play').onclick=()=>{effects.stop();audio.play(c).catch(context.tell);};
 if($('#fast-slow'))$('#fast-slow').onclick=()=>{effects.stop();audio.play(c,{slow:true}).catch(context.tell);};
}
function renderMatch(content,f,byId,mutate){
 const group=f.ids.slice(f.index,f.index+4).map(id=>byId.get(id)).filter(Boolean);
 // Ambiguous duplicate labels cannot make a solvable matching board.
 const unique=group.filter((c,i)=>group.findIndex(x=>x.ja===c.ja||x.en===c.en)===i);
 const key='match'+f.index;if(ui.key!==key)ui={key,left:shuffle(unique),right:shuffle(unique),done:[],selected:null,message:''};
 content.innerHTML=`<section class="panel"><h2>英語と意味を組み合わせよう</h2><div class="match-board"><div>${ui.left.map(c=>`<button data-left="${c.id}" ${ui.done.includes(c.id)?'disabled':''} aria-pressed="${ui.selected===c.id}" lang="en-US">${e(c.en)}</button>`).join('')}</div><div>${ui.right.map(c=>`<button data-right="${c.id}" ${ui.done.includes(c.id)?'disabled':''}>${e(c.ja)}</button>`).join('')}</div></div><p role="status">${e(ui.message)}</p>${ui.done.length===unique.length?'<button id="match-next" class="primary">次の組へ →</button>':''}</section>`;
 content.querySelectorAll('[data-left]').forEach(b=>b.onclick=()=>{ui.selected=b.dataset.left;draw();});
 content.querySelectorAll('[data-right]').forEach(b=>b.onclick=async()=>{if(!ui.selected||ctx.state.fast.feedback)return;const c=byId.get(ui.selected),ok=c.id===b.dataset.right;ui.message=ok?'✓ '+c.en+' ＝ '+c.ja:'もう一度。英語を選んでから意味を選ぼう。';if(ok){effects.play('correct',ctx.state.settings.sound);ui.done.push(c.id);}ui.selected=null;await mutate(s=>{record(s,c,'read',ok?'correct':'wrong');s.fast.checked++;if(ok)s.fast.correct++;});});
 if(content.querySelector('#match-next'))content.querySelector('#match-next').onclick=()=>mutate(s=>{s.fast.index+=group.length;ui={};});
}
document.addEventListener('keydown',ev=>{if(location.hash!=='#fast'||ev.repeat||/INPUT|SELECT|TEXTAREA|BUTTON|A/.test(ev.target.tagName))return;const ids={' ':'#fast-flip, #fast-next',ArrowRight:'#fast-known',ArrowLeft:'#fast-later','1':'[data-fast-answer]:nth-child(1)','2':'[data-fast-answer]:nth-child(2)','3':'[data-fast-answer]:nth-child(3)','4':'[data-fast-answer]:nth-child(4)'};const b=document.querySelector(ids[ev.key]||'none');if(b){ev.preventDefault();b.click();}});
