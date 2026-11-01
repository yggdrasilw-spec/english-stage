import {forestJourney,decorations,decorateForest,waterForest} from './forest.js';
import {forestFlowers,woodland,fogProgress,FLOWERS_PER_WATER} from './forest-geometry.js';
import {mountForestMaps,cleanupForestMaps} from './forest-map.js';

const asset=(id,cls='',style='')=>`<img src="assets/forest/${id}.webp" class="${cls}" style="${style}" alt="" loading="eager" draggable="false">`;
export function forestScene(s,area=forestJourney(s).area,highlight=false,fromLocal=null,interactive=false){
 const j=forestJourney(s),past=area<j.area,local=past?20:j.local,stage=past?4:j.stage,from=fromLocal??local;
 const trees=['tree_symbol_stage_01','tree_symbol_stage_02','tree_symbol_stage_03','tree_symbol_stage_04','tree_symbol_01'];
 const objects=woodland.map(([x,y,id,w,h])=>({x,y,id,w,h,cls:'forest-wood'}));
 objects.push({x:1305,y:1035,id:trees[stage],w:280,h:340,cls:'forest-tree'});
 if(from<local&&Math.floor(from/4)!==stage)objects.push({x:1305,y:1035,id:trees[Math.min(4,Math.floor(from/4))],w:280,h:340,cls:'forest-old-tree'});
 if(local>=8)objects.push({x:1730,y:1250,id:'pond_medium_01',w:360,h:230,cls:'forest-pond'});
 if(local>=10)objects.push({x:1620,y:1220,id:'bridge_medium_01',w:200,h:140,cls:'forest-bridge'});
 if(local>=6)objects.push({x:1480,y:1000,id:'butterfly_01',w:65,h:65,cls:'forest-butterfly'});
 if(local>=12)objects.push({x:1130,y:1250,id:'rabbit_01',w:90,h:115,cls:'forest-animal'});
 if(local>=14)objects.push({x:1390,y:820,id:'bird_small_01',w:80,h:80,cls:'forest-bird'});
 if(local>=16)objects.push({x:1540,y:1440,id:'squirrel_01',w:100,h:115,cls:'forest-squirrel'});
 for(const flower of forestFlowers(local,area))objects.push({...flower,id:flower.variant===2?'flower_patch_01':'flower_small_01',w:flower.variant===2?90:70,h:flower.variant===2?65:82,cls:'forest-bloom'+(highlight&&flower.water===local?' forest-new':'')});
 for(let i=0;i<6;i++){const id=j.decor[`${area}:${i}`];if(id)objects.push({x:1090+(i%3)*210,y:1140+Math.floor(i/3)*100,id,w:100,h:100,cls:'forest-decoration'});}
 objects.sort((a,b)=>a.y-b.y);
 const sprites=objects.map(o=>asset(o.id,'forest-sprite '+o.cls,`left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;`)).join('');
 const label=`${area+1}番目の森。${['芽','苗木','若木','大きな木','花咲く木'][stage]}。水やりで花が咲いた場所${local*FLOWERS_PER_WATER}か所。霧が晴れた段階${fogProgress(local)/20}、全5段階${local>=8?'。池が見える':''}${local>=12?'。動物が遊びに来た':''}`;
 return `<div class="forest-scene forest-map-scene ${from<local?'is-growing':''}" data-forest-map data-local="${local}" data-from="${from}" data-area="${area}" data-interactive="${interactive}" role="${interactive?'group':'img'}" aria-label="${label}" ${interactive?'tabindex="0"':''}><div class="forest-world" aria-hidden="true">${sprites}</div><span class="forest-map-caption" aria-hidden="true">${fogProgress(local)===0?'小さな広場から':fogProgress(local)===100?'ひろびろ、花咲く森':'霧の先まで、少しずつ'}</span>${interactive?'<div class="forest-map-controls" aria-label="森の表示"><button data-map-action="out" aria-label="森を縮小">−</button><button data-map-action="in" aria-label="森を拡大">＋</button><button data-map-action="tree">木のそば</button><button data-map-action="fit">森全体</button></div>':''}</div>`;
}
export function forestSummary(s){const j=forestJourney(s);return `<div class="forest-summary"><strong>使える水 ${j.pending}回分</strong><span>あと${j.untilWater}問で、水をもう1回分ゲット</span><progress value="${j.water}" max="5" aria-label="次の水まで ${j.water}/5問"></progress><small>今日 ${j.today}問に挑戦 · 水やり ${j.watered}回 · 完成した森 ${j.area}こ</small></div>`;}
export function forestHome(s){const j=forestJourney(s);return `<section class="panel forest-home"><div class="section-head"><div><small class="eyebrow">YOUR ENGLISH FOREST</small><h2>学んで、水をやろう。</h2></div><a class="pill" href="#forest">森へ →</a></div>${j.pending?`<a class="button-link primary forest-water-entry" href="#forest">水 ${j.pending}回分 · 森で水をやる →</a>`:`<button class="primary start" data-forest-start="read" ${s.fast?.round&&s.fast.index<s.fast.ids.length?'data-forest-resume':''}>${s.fast?.round&&s.fast.index<s.fast.ids.length?'5問のつづき':'森を育てる5問'} →</button>`}${forestScene(s)}${forestSummary(s)}<small>水をやると、この森が変わるよ。水は何度でも集められるよ。</small></section>`;}
export function bindForestStarts({app,cards,state,mutate}){if(state)mountForestMaps(app,state);app.querySelectorAll('[data-forest-start]').forEach(b=>b.onclick=async()=>{if(b.hasAttribute('data-forest-resume')){location.hash='fast';return;}const {startForestRound}=await import('./fast.js');await mutate(s=>startForestRound(s,cards,b.dataset.forestStart));location.hash='fast';});}
export function forestReward(s){const j=forestJourney(s);return `<section class="forest-reward"><h2>${j.pending?'水を持って、森へ行こう！':'次の水まで、あと'+j.untilWater+'問'}</h2>${j.pending?`<p>使える水が${j.pending}回分あるよ。森の「水をやる」を押すと、変化が見えるよ。</p><a class="button-link primary" href="#forest">森で水をやる →</a>`:'<p>確かめた分は残っているよ。続きはいつでも大丈夫。</p>'}</section>`;}

let viewingArea=null,chosenDecoration=null,reveal=null,revealTimer;
export function cleanupForest(){clearTimeout(revealTimer);reveal=null;viewingArea=null;}
export {cleanupForestMaps};
export function renderForest(ctx){
 const {app,state,mutate,tell}=ctx,j=forestJourney(state);
 if(reveal&&reveal.watered!==j.watered)reveal=null;
 let area=Math.min(viewingArea??j.area,j.area),selected=chosenDecoration||decorations.find(d=>d.rounds<=j.rounds)?.id;
 const draw=()=>{
  clearTimeout(revealTimer);cleanupForestMaps();
  const showing=reveal&&reveal.area===area,animating=showing&&performance.now()<reveal.until;
  app.innerHTML=`<div class="narrow forest-page"><a href="#home">← 学習にもどる</a><div class="section-head"><h1>わたしの英語の森</h1><span class="pill">水 ${j.pending}回分</span></div><p class="forest-instruction">${area<j.area?'この森は完成！ いつでも見に来られるよ。':j.pending?'霧の先まで、水やりあと'+(4-j.local%4)+'回。':'5問を確かめて、水を集めよう。'}</p><div class="forest-watering-stage ${animating?'is-watering':''}" id="forest-landscape">${forestScene(state,area,!!showing,animating?reveal.fromLocal:null,true)}${animating?`<span class="forest-water-drops" aria-hidden="true">💧 💧 💧</span>`:''}</div><div class="forest-water-result" role="status" aria-live="polite" tabindex="-1">${showing?`<strong>${reveal.change}</strong><span>水やり ${j.watered-1}回 → ${j.watered}回 · 花 ${((area<j.area?20:j.local)-1)*FLOWERS_PER_WATER}か所 → ${(area<j.area?20:j.local)*FLOWERS_PER_WATER}か所</span>`:'<span>水やりで3か所に花が咲くよ。4回ごとに、霧が晴れて森が広がるよ。</span>'}</div><div class="forest-water-actions">${area<j.area?'<button id="forest-current" class="primary">いま育てている森へ →</button>':!j.pending&&!animating?(state.fast?.round&&state.fast.index<state.fast.ids.length?'<a class="button-link primary" href="#fast">5問のつづきへ →</a>':'<button id="forest-practice" class="primary" data-forest-start="read">'+(showing?'次の5問へ →':'5問で水を集める →')+'</button>'):`<button id="forest-water" class="primary" ${j.pending<1||animating?'disabled':''}>${animating?'水をやっているよ…':j.pending?'水をやる · 1回分':'使える水は0回分'}</button>`}<small>${j.pending?'水は1回分ずつ使えるよ。残りはあとで使っても大丈夫。':'水は何度でも集められるよ。休んでも森はそのまま。'}</small></div><div class="forest-area-nav"><button id="forest-prev" ${area===0?'disabled':''}>← 前の森</button><strong>${area+1}番目の森${area<j.area?' · 完成！':''}</strong><button id="forest-next" ${area===j.area?'disabled':''}>次の森 →</button></div><div class="actions forest-continue">${state.fast?.round&&state.fast.index<state.fast.ids.length?'<a class="button-link primary" href="#fast">5問のつづきへ →</a>':'<button class="primary" data-forest-start="read">次の5問へ →</button>'}<a href="#home">今日はここまで</a></div>${forestSummary(state)}<details class="panel"><summary>森をかざる・ほかの練習</summary><div class="actions"><button data-forest-start="listen">聞く5問</button><button data-forest-start="weak">苦手の5問</button><a href="#karuta">音声かるたへ</a></div><h2>森をかざろう</h2><p>${j.rounds?'飾りを選んで、置く場所をタップ。何度でも置きかえられるよ。':'5問チャレンジすると、小さな花が使えるよ。'}</p><div class="forest-palette">${decorations.map(d=>`<button data-decoration="${d.id}" aria-pressed="${selected===d.id}" ${d.rounds>j.rounds?'disabled':''}>${asset(d.id)}${d.name}<small>${d.rounds>j.rounds?'水をあと'+(d.rounds-j.rounds)+'回分集める':'使えるよ'}</small></button>`).join('')}</div><div class="forest-slots">${Array.from({length:6},(_,i)=>`<button data-slot="${i}" ${selected?'':'disabled'}>${state.forest?.decor[`${area}:${i}`]?asset(state.forest.decor[`${area}:${i}`]):'＋'}<small>場所${i+1}</small></button>`).join('')}</div><a href="#companion">ともだちの着せ替え →</a></details><details class="panel"><summary>森の育ち方</summary><p>5問ごとに水を1回分ゲット。水をやるたび、あちこちの3か所に花が咲くよ。4回育てると霧が後退して、新しい草地や小道が見えてきます。8回で池、10回で橋、12回でウサギ、16回でリス。20回で森が完成し、隣の森も育てられるよ。</p><p>カードの確認・問題・かるた・実戦テストで水が集まるよ。「飛ばす」だけでは増えません。水と森は保存され、休んでも減りません。</p><small>水は挑戦の記録。XP・準備度とは別です。スターは訪問スタンプで1日1回もらえるよ。</small></details></div>`;
  bindForestStarts(ctx);
  app.querySelector('#forest-prev').onclick=()=>{viewingArea=--area;reveal=null;draw();};
  app.querySelector('#forest-next').onclick=()=>{viewingArea=++area;reveal=null;draw();};
  const current=app.querySelector('#forest-current');if(current)current.onclick=()=>{viewingArea=area=j.area;reveal=null;draw();};
  const water=app.querySelector('#forest-water');if(water)water.onclick=async()=>{
   if(water.disabled)return;water.disabled=true;
   const expected=j.watered;
   await mutate(s=>{const result=waterForest(s,expected);if(!result){tell('森の記録が更新されたよ。残りの水を確かめてね。');return;}const motion=s.settings.motion&&!matchMedia('(prefers-reduced-motion: reduce)').matches;reveal={...result,until:performance.now()+(motion?(result.fogExpanded?1850:1000):0)};viewingArea=result.area;});
   if(location.hash==='#forest'&&reveal&&performance.now()>=reveal.until)app.querySelector('.forest-water-result')?.focus({preventScroll:true});
  };
  app.querySelectorAll('[data-decoration]').forEach(b=>b.onclick=()=>{selected=b.dataset.decoration;chosenDecoration=selected;draw();});
  app.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>mutate(s=>decorateForest(s,area,+b.dataset.slot,selected)));
  if(animating)revealTimer=setTimeout(()=>{if(location.hash==='#forest'){draw();app.querySelector('.forest-water-result')?.focus({preventScroll:true});}},Math.max(0,reveal.until-performance.now()));
 };
 draw();
}
