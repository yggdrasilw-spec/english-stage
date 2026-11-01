import {KazunomeMascot,mascotSVG} from './mascot.js';
import {COLORS,OUTFITS,look,dress} from './companion.js';
import {journey,claimVisit} from './motivation.js';
let dispose=()=>{},preview=null,cheerUntil=0;
export function celebrateCompanion(){cheerUntil=performance.now()+1000;}
export function cleanupCompanion(){dispose();dispose=()=>{};}
const illustration=(c)=>mascotSVG(c.color,c.outfit==='none'?null:c.outfit);
export function companionMilestone(state){return `<div class="companion-milestone"><span aria-hidden="true">${illustration(look(state))}</span><p>チャレンジ、すてきだね！</p><a href="#companion">ともだちに会う · ✦ ${state.stars} スター →</a></div>`;}
function stamps(state){
 const j=journey(state),count=new Set(state.rewards.filter(r=>/^visit:\d{4}-\d{2}-\d{2}$/.test(r))).size;
 const filled=count===0?0:j.visited?(count-1)%7+1:count%7;
 return `<div class="stamp-strip" aria-label="7回の訪問スタンプ。${filled}回受け取り済み">${Array.from({length:7},(_,i)=>`<div class="visit-stamp ${i<filled?'received':''}"><small>${i+1}回目</small><b aria-hidden="true">${i<filled?'✓':i===6?'♛':'✦'}</b><small>✦ ${i===6?10:3}</small></div>`).join('')}</div>`;
}
export function companionHome(state){
 const j=journey(state);
 return `<section class="panel companion-home" aria-label="英語のともだち"><button class="companion-touch" id="companion-touch" aria-label="ともだちにタッチ"><svg id="companion-stage" viewBox="-100 -235 200 255" aria-hidden="true"></svg></button><div><small class="eyebrow">YOUR ENGLISH BUDDY</small><h2>今日も、いっしょに。</h2><p id="companion-message">${j.tasks?'今日もチャレンジできたね！':'まずは1枚、めくってみよう。'}</p><a class="pill" href="#companion">着せ替え・スタンプ <span>✦ ${state.stars}</span> →</a>${j.visited?'':'<button id="home-visit" class="visit-button">今日のボーナスを受け取る</button>'}</div></section>`;
}
export function bindCompanionHome(ctx){
 mount(ctx.state,look(ctx.state));
 const b=document.querySelector('#home-visit');if(b)b.onclick=()=>ctx.mutate(s=>{const n=claimVisit(s);ctx.tell(n?'スタンプ獲得！ ✦ '+n+'スター':'今日は受け取り済みです。');});
}
export function renderCompanion(ctx){
 const {app,state,mutate,tell}=ctx,c=look(state),j=journey(state);
 // Preview survives purchases, but always starts with the equipped appearance on entry.
 preview||={...c};
 app.innerHTML=`<div class="narrow wardrobe"><a href="#home">← 学習にもどる</a><div class="section-head"><h1>ともだちルーム</h1><span class="pill">✦ ${state.stars} スター</span></div><section class="panel wardrobe-hero"><button class="companion-touch" id="companion-touch" aria-label="ともだちにタッチ"><svg id="companion-stage" viewBox="-100 -235 200 255" aria-hidden="true"></svg></button><div><h2>きみにぴったりの姿に。</h2><p id="companion-message">タッチすると手をふるよ。</p><p class="muted">スターは訪問と学習ミッションでもらえるよ。</p><button id="reset-preview">いまの着せ替えに戻す</button></div></section><section class="panel"><div class="section-head"><h2>おかえりスタンプ</h2><span>${new Set(state.rewards.filter(r=>r.startsWith('visit:'))).size}回訪問</span></div><p>1日1回、3スター。7回目は10スター！ 休んでもスタンプは消えないよ。</p>${stamps(state)}<button id="claim-visit" class="primary" ${j.visited?'disabled':''}>${j.visited?'今日は受け取り済み ✓':'今日のスタンプを受け取る'}</button></section>${[['color','いろ',COLORS],['outfit','きせかえ',OUTFITS]].map(([kind,title,items])=>`<section class="panel"><h2>${title}</h2><div class="wardrobe-grid">${items.map(i=>{const owned=c.owned.includes(kind+':'+i.id),equipped=c[kind]===i.id,selected=preview[kind]===i.id;const sample={...preview,[kind]:i.id};return `<article class="wardrobe-item ${selected?'previewed':''}"><button class="item-preview" data-preview="${kind}:${i.id}" aria-label="${i.name}を試着" aria-pressed="${selected}"><span aria-hidden="true">${illustration(sample)}</span><strong>${i.name}</strong></button><small>${equipped?'着用中 ✓':owned?'もっている':'✦ '+i.price+' スター'}</small><button data-dress="${kind}:${i.id}" ${equipped||(!owned&&state.stars<i.price)?'disabled':''}>${equipped?'着用中':owned?'着せる':state.stars<i.price?'あと '+(i.price-state.stars)+' ✦':i.price+' ✦で交換して着せる'}</button></article>`;}).join('')}</div></section>`).join('')}<section class="panel"><h2>学んでスターを集めよう</h2>${j.quests.map(q=>`<p>${q.value>=q.goal?'✓':'○'} ${q.title} · ${q.value}/${q.goal} · ✦ ${q.stars}</p>`).join('')}<p class="muted">まちがえても挑戦にカウント。着せ替えでXPや学習の記録は変わりません。</p><a class="primary pill" href="#home">カードをはじめよう →</a></section></div>`;
 mount(state,preview);
 document.querySelector('#claim-visit').onclick=()=>mutate(s=>{const n=claimVisit(s);tell(n?'スタンプ獲得！ ✦ '+n+'スター':'今日は受け取り済みです。');});
 document.querySelector('#reset-preview').onclick=()=>{preview={...look(state)};cleanupCompanion();renderCompanion(ctx);};
 app.querySelectorAll('[data-preview]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.preview.split(':');preview={...preview,[kind]:id};cleanupCompanion();renderCompanion(ctx);tell('試着中です。「着せる」か「交換して着せる」で保存できます。');});
 app.querySelectorAll('[data-dress]').forEach(b=>b.onclick=()=>{const [kind,id]=b.dataset.dress.split(':');mutate(s=>{tell(dress(s,kind,id));celebrateCompanion();preview={...look(s)};});});
}
export function leaveCompanion(){preview=null;}
function mount(state,c){
 cleanupCompanion();const svg=document.querySelector('#companion-stage');if(!svg)return;
 const actor=new KazunomeMascot(svg,{scale:1,palette:c.color});actor.setCostume(c.outfit==='none'?null:c.outfit);actor.place(0,0);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let frame=0,last=0,waveUntil=cheerUntil;
 const moving=()=>state.settings.motion&&!media.matches;
 function paint(t){
  if(!document.hidden){const motion=moving(),wave=waveUntil>t;
   actor.hands.forEach((h,i)=>h.raise=wave&&i===1?(motion ? 0.85+0.15*Math.sin(t/70) : 1):0);
   actor.lift=wave&&motion?Math.abs(Math.sin((waveUntil-t)/200))*8:0;
   const eyes=wave?'happy':motion&&t%4800<130?'closed':'open',mouth=wave?'grin':'smile';
   if(actor.eyeKind!==eyes||actor.mouthKind!==mouth)actor.setFace(eyes,mouth);
   actor.update(motion?Math.min(.05,(t-last)/1000):0,motion?t:0);last=t;
  }
  if(moving())frame=requestAnimationFrame(paint);
 }
 function restart(){cancelAnimationFrame(frame);last=performance.now();paint(last);}
 const button=document.querySelector('#companion-touch');button.onclick=()=>{waveUntil=performance.now()+900;actor.leafL.kick(-18);actor.leafR.kick(18);document.querySelector('#companion-message').textContent=journey(state).tasks?'チャレンジ、すてきだね！':'Hello! いっしょに英語を楽しもう。';if(!moving())actor.setFace('happy','grin');};
 media.addEventListener('change',restart);restart();
 dispose=()=>{cancelAnimationFrame(frame);media.removeEventListener('change',restart);actor.destroy();};
}
