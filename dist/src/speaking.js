import * as audio from './audio.js';
import * as effects from './effects.js';
import {recordForest,forestJourney} from './forest.js';
import {matchesAnswer,speakingPool,shuffledCards} from './speaking-answer.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let session=null,recognition=null,generation=0,timeout=null,autoRequested=false;
export function startSpeaking(cards,{theme='all',count=5}={}){
 const selected=shuffledCards(speakingPool(cards,theme)).slice(0,count);
 if(!selected.length)return false;
 session={theme,cards:selected,index:0,firstCorrect:0,missed:[],credited:[],hinted:false,attempted:false,solved:false,feedback:''};
 autoRequested=true;return true;
}
export function cleanupSpeaking(){
 generation++;clearTimeout(timeout);const old=recognition;recognition=null;
 if(old){old.onresult=old.onerror=old.onend=null;try{old.abort();}catch{}}
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)cleanupSpeaking();});
window.addEventListener('pagehide',cleanupSpeaking);

export function renderSpeaking({app,cards,state,tell,mutate}){
 cleanupSpeaking();
 const $=s=>app.querySelector(s),Constructor=window.SpeechRecognition||window.webkitSpeechRecognition;
 const pool=speakingPool(cards),themes=[...new Set(pool.map(c=>c.theme))];
 const water=forestJourney(state);
 app.innerHTML=`<div class="narrow speaking-wrap"><div class="section-head"><h1>声でこたえる</h1><a href="#home">ホームへ</a></div><p>絵と日本語を見て、英単語を言ってみよう。</p><p class="muted">認識する言語：米国英語（en-US）固定</p><div class="forest-live" role="status">次の水まで、あと${water.untilWater}問${water.pending?' · 使える水 '+water.pending+'回分':''}<a href="#forest">森で水をやる →</a><small>正解を5問集めると水1回分。言い直し・お手本のあとでもOK！</small></div><div id="speaking-game"></div><details class="panel"><summary>音声入力について</summary><p>はじめる・次の問題へを押すと、自動でマイクが待機します。マイクの使用を許可してね。音声はブラウザの認識サービスに送信される場合があります。通信できる場所で使ってください。</p><p>単語が一致したかを確かめる練習です。発音の点数ではありません。聞き違いもあるので、うまく認識されないときは言い直そう。</p><p>問題の途中経過はページを開いている間だけ保持します。獲得した水は保存します。通常の復習・準備度・XPには加算しません。</p></details></div>`;
 const game=$('#speaking-game');
 if(!Constructor||!window.isSecureContext){game.innerHTML='<section class="panel"><h2>この環境では音声入力を使えません</h2><p>HTTPSのページを、音声認識に対応したChromeやSafariなどで開いてください。</p><a href="#karuta">音声かるたで練習する →</a></section>';return;}
 function config(){
  cleanupSpeaking();audio.stop();
  game.innerHTML=`<form id="speaking-config" class="panel speaking-config"><label>カテゴリ<select id="speaking-theme"><option value="all">すべて</option>${themes.map(t=>`<option value="${esc(t)}" ${t===session?.theme?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>問題数<select id="speaking-count">${[5,10,20].map(n=>`<option value="${n}">${n}問</option>`).join('')}</select></label><p id="speaking-pool" class="muted"></p><button class="primary" type="submit">はじめる →</button>${session?'<button id="speaking-resume" type="button">今の練習にもどる</button>':''}</form>`;
  const update=()=>{$('#speaking-pool').textContent=`画像のある単語 ${speakingPool(cards,$('#speaking-theme').value).length}語からランダムに出題します。`;};update();$('#speaking-theme').onchange=update;
  $('#speaking-config').onsubmit=e=>{e.preventDefault();effects.prepare(state.settings.sound);if(!startSpeaking(cards,{theme:$('#speaking-theme').value,count:Number($('#speaking-count').value)}))return;autoRequested=false;question(true);};
  if($('#speaking-resume'))$('#speaking-resume').onclick=question;
 }
 function question(autoStart=false){
  cleanupSpeaking();audio.stop();if(autoStart)effects.stop();
  const run=session;if(!run)return config();
  if(run.index>=run.cards.length){
   game.innerHTML=`<section class="panel card"><h2>${run.cards.length}問、おつかれさま！</h2><p>お手本なし・一度目で一致：${run.firstCorrect} / ${run.cards.length}問</p><p>言い直しやお手本で練習した単語：${run.missed.length}語</p><p>森の水に向けて ${run.credited.length}問分たまったよ！</p><a class="button-link primary" href="#forest">森へ · 水をやる →</a><div class="actions">${run.missed.length?'<button class="primary" id="speaking-retry">練習した単語をもう一度</button>':''}<button id="speaking-new">カテゴリを選ぶ</button><a href="#home">今日はここまで</a></div></section>`;
   $('#speaking-new').onclick=config;
   if($('#speaking-retry'))$('#speaking-retry').onclick=()=>{effects.prepare(state.settings.sound);session={...run,cards:shuffledCards(run.missed),index:0,firstCorrect:0,missed:[],credited:[],hinted:false,attempted:false,solved:false,feedback:''};question(true);};return;
  }
  const card=run.cards[run.index];
  game.innerHTML=`<section class="panel card speaking-card"><div class="section-head"><strong>${run.index+1} / ${run.cards.length}問</strong><button id="speaking-settings">カテゴリ・問題数</button></div><progress value="${run.index}" max="${run.cards.length}" aria-label="終わった問題"></progress><img class="speaking-picture" src="${esc(card.image.url)}" alt="${esc(card.ja)}" referrerpolicy="no-referrer"><small class="image-credit">${esc(card.image.credit||'')}</small><h2>${esc(card.ja)}</h2><p id="speaking-status" role="status" aria-live="polite">${esc(run.feedback||'マイクを押して、英単語をひとつ言おう。')}</p><p id="speaking-heard" lang="en-US"></p><div class="speaking-actions"><button id="speaking-mic" class="primary" ${run.solved?'disabled':''}>🎤 ${run.attempted?'もう一度言う':'英語でこたえる'}</button><button id="speaking-stop" hidden>■ 入力をやめる</button><button id="speaking-hint">答え・お手本を確認</button><button id="speaking-next" ${run.solved?'class="primary"':''}>${run.solved?'次の問題へ →':'今回はパス →'}</button></div><div id="speaking-answer" ${run.hinted?'':'hidden'}><p class="card-en" lang="en-US">${esc(card.en)}</p><p>${esc(card.explanation)}</p><p lang="en-US">${esc(card.example)}</p><p>${esc(card.exampleJa)}</p><button id="speaking-model">▶ お手本を聞く</button><button id="speaking-slow">ゆっくり</button></div></section>`;
  const status=$('#speaking-status'),mic=$('#speaking-mic'),stop=$('#speaking-stop');
  if(run.transcript)$('#speaking-heard').textContent=`聞こえた英語：${run.transcript}`;
  const mark=document.createElement('div');mark.id='speaking-correct';mark.setAttribute('role','status');mark.hidden=!run.solved;
  if(run.solved)mark.innerHTML=effects.correctMark(!!run.freshCorrect&&state.settings.motion)+'<strong>○ 正解！</strong>';
  run.freshCorrect=false;status.before(mark);
  const markMissed=()=>{if(!run.missed.some(c=>c.id===card.id))run.missed.push(card);};
  const idle=()=>{mic.disabled=run.solved;stop.hidden=true;};
  const cancel=()=>{cleanupSpeaking();idle();};
  $('#speaking-settings').onclick=config;
  $('.speaking-picture').onerror=e=>{e.target.hidden=true;status.textContent='画像を読み込めません。日本語を手がかりにこたえよう。';};
  $('#speaking-next').onclick=()=>{if(run.saving)return;if(!run.solved)markMissed();effects.prepare(state.settings.sound);cancel();audio.stop();run.index++;run.hinted=false;run.attempted=false;run.solved=false;run.feedback='';run.transcript='';question(true);};
  const showHint=()=>{cleanupSpeaking();idle();audio.stop();run.hinted=true;markMissed();$('#speaking-answer').hidden=false;status.textContent='答えと音を確かめたら、もう一度言ってみよう。';};
  $('#speaking-hint').onclick=()=>{showHint();question();};
  const model=slow=>{showHint();if(!state.settings.sound){tell('上の「音声 OFF」を押して ON にすると、お手本を聞けます。');return;}audio.play(card,{slow}).catch(e=>tell(e.message));};
  $('#speaking-model').onclick=()=>model(false);$('#speaking-slow').onclick=()=>model(true);
  // Each listening attempt captures its own generation, including retries after cancellation.
  mic.onclick=()=>{
   if(run.solved||document.hidden)return;
   cleanupSpeaking();audio.stop();effects.prepare(state.settings.sound);const attempt=generation;
   const current=()=>generation===attempt&&session===run&&app.contains(status)&&!document.hidden;
   let rec;try{rec=new Constructor();}catch{status.textContent='音声入力を開始できません。対応ブラウザで開き直してください。';return;}
   recognition=rec;rec.lang='en-US';rec.continuous=false;rec.interimResults=false;rec.maxAlternatives=1;
   mic.disabled=true;stop.hidden=false;status.textContent='マイクを準備中… 英語をひとつ言ってね。';$('#speaking-heard').textContent='';
   const finish=message=>{if(!current())return;cleanupSpeaking();idle();if(message)status.textContent=message;};
   rec.onstart=()=>{if(current())status.textContent='聞いています… 英単語を言ってね。';};
   rec.onresult=async e=>{
    if(!current())return;const result=e.results[e.resultIndex??0];if(!result?.isFinal)return;
    const transcript=result[0]?.transcript?.trim()||'';if(!transcript){finish('聞き取れませんでした。もう一度言ってみよう。');return;}
    run.transcript=transcript;$('#speaking-heard').textContent=`聞こえた英語：${transcript}`;
    const correct=matchesAnswer(card,transcript),first=!run.attempted&&!run.hinted;run.attempted=true;
    if(correct){run.solved=true;if(first)run.firstCorrect++;run.feedback=run.hinted?'一致したよ！ お手本のあとも言えたね。':'一致したよ！ 次の問題へ進もう。';}
    else{markMissed();run.feedback='この単語とは一致しませんでした。聞き違いのこともあります。もう一度言うか、お手本を確認しよう。';}
    finish(run.feedback);mic.textContent='🎤 もう一度言う';if(correct){
     mark.hidden=false;mark.innerHTML=effects.correctMark(state.settings.motion)+'<strong>○ 正解！</strong>';
     effects.play('correct',state.settings.sound);$('#speaking-next').textContent='次の問題へ →';$('#speaking-next').classList.add('primary');$('#speaking-next').focus();
     const index=run.index;run.freshCorrect=true;run.saving=true;$('#speaking-next').disabled=true;
     // mutate uses the app's storage lock; guard inside it so duplicated service results cannot grant extra water.
     try{
      for(let tries=0;tries<40&&!run.credited.includes(index);tries++){
       await mutate(s=>{if(run.credited.includes(index))return;recordForest(s,{skill:'recall',recovered:!first});run.credited.push(index);run.saving=false;});
       if(!run.credited.includes(index))await new Promise(resolve=>setTimeout(resolve,50));
      }
      if(!run.credited.includes(index))tell('水の記録を保存できませんでした。少し待ってから、もう一度練習してください。');
     }finally{run.saving=false;if(app.contains(status))$('#speaking-next').disabled=false;}
    }
   };
   rec.onerror=e=>finish(({'not-allowed':'マイクが許可されていません。ブラウザの設定で許可してから、もう一度押してね。','service-not-allowed':'この環境では音声認識サービスを利用できません。対応ブラウザで試してください。','audio-capture':'マイクが見つかりません。接続や端末の設定を確かめてね。','no-speech':'声が聞こえませんでした。マイクを押して、もう一度言ってね。',network:'通信できませんでした。接続を確かめて、もう一度試してね。','language-not-supported':'この環境は米国英語の認識に対応していません。対応ブラウザで試してください。',aborted:'音声入力を止めました。'})[e.error]||'音声入力を使えませんでした。もう一度試してね。');
   rec.onend=()=>finish('聞き取れませんでした。マイクを押して、もう一度言ってね。');
   timeout=setTimeout(()=>finish('音声入力を止めました。マイクを押して、もう一度試してね。'),15000);
   try{rec.start();}catch{finish('マイクを開始できませんでした。少し待って、もう一度押してね。');}
  };
  stop.onclick=()=>{cancel();status.textContent='音声入力を止めました。マイクを押すと再開できます。';};
  if(autoStart&&!run.solved&&!document.hidden)mic.click();
 }
 const auto=autoRequested;autoRequested=false;
 if(session)question(auto);else config();
}
