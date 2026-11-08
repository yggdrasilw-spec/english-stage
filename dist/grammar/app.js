import {lessons,basic,questionBank,clean} from './content.js';
import {buildHandoff,normalizeDraft,recommendedTopics} from './ai-prompt.js';
import {aiPage,aiOutput,selectedTopicsLabel} from './ai-view.js';
import {shuffle,byId,lessonById,grade,mergeAttempts,statusFor,practiceQueue,diagnosticQueue,makeSession,validSession} from './core.js';
const $=s=>document.querySelector(s),app=$('#app'),KEY='eiken-grammar-v1',SESSION=KEY+'-session';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const marked=s=>esc(s).replace(/\[([^\]]+)\]/g,'<mark>$1</mark>');
let storageError=false,filter='all',exampleIndex=0,focusQuestion=null,lastRoute='',audioGeneration=0,audioTimer;
function read(kind,key,fallback){try{const raw=window[kind].getItem(key);return raw?JSON.parse(raw):fallback;}catch{storageError=true;return fallback;}}
let saved=read('localStorage',KEY,{}),attempts=mergeAttempts(Array.isArray(saved?.attempts)?saved.attempts:[]),settings={auto:!!saved?.settings?.auto,voice:typeof saved?.settings?.voice==='string'?saved.settings.voice:''};
let session=read('sessionStorage',SESSION,null);if(!validSession(session))session=null;
let result=read('sessionStorage',SESSION+'-result',null);if(!result||!Array.isArray(result.answers)||!result.answers.every(a=>byId(a.qid)&&typeof a.correct==='boolean'&&typeof a.chosen==='string'))result=null;
let aiDraft=normalizeDraft(read('sessionStorage',KEY+'-ai',{}));
function persist(){try{const disk=read('localStorage',KEY,{});attempts=mergeAttempts(attempts,Array.isArray(disk?.attempts)?disk.attempts:[]);localStorage.setItem(KEY,JSON.stringify({version:1,attempts,settings}));}catch{storageError=true;}}
function saveSession(){try{sessionStorage.setItem(SESSION,JSON.stringify(session));sessionStorage.setItem(SESSION+'-result',JSON.stringify(result));}catch{storageError=true;}}
function note(){return storageError?'<p class="storage-note" role="status">この環境では学習記録を保存できません。今の画面では学習を続けられます。</p>':'';}
function audioStatus(s){$('#audio-status').textContent=s;clearTimeout(audioTimer);if(s)audioTimer=setTimeout(()=>$('#audio-status').textContent='',6500);}
function stopAudio(){audioGeneration++;if(window.speechSynthesis)speechSynthesis.cancel();document.querySelectorAll('.speaking').forEach(e=>e.classList.remove('speaking'));audioStatus('');}
function speak(items,{lang='en-US',rate=1,element=null}={}){
 stopAudio();if(!window.speechSynthesis||typeof window.SpeechSynthesisUtterance!=='function'){audioStatus('この端末では読み上げを使えません。英文と解説を見て学習できます。');return;}
 const token=audioGeneration,queue=Array.isArray(items)?items:[items];
 const voices=speechSynthesis.getVoices(),voice=(lang.startsWith('en')?voices.find(v=>v.voiceURI===settings.voice&&v.lang.startsWith('en')):null)||voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.slice(0,2)));
 function next(index){if(token!==audioGeneration)return;if(index>=queue.length){element?.classList.remove('speaking');audioStatus('');return;}
 const u=new SpeechSynthesisUtterance(clean(queue[index]));u.lang=lang;u.rate=rate;if(voice)u.voice=voice;
 u.onstart=()=>{if(token===audioGeneration){element?.classList.add('speaking');audioStatus(lang.startsWith('ja')?'解説を読み上げています':'英文を読み上げています');}};
 u.onend=()=>{if(token===audioGeneration)next(index+1);};u.onerror=e=>{if(token!==audioGeneration)return;element?.classList.remove('speaking');if(e.error!=='canceled'&&e.error!=='interrupted')audioStatus('音声を再生できませんでした。端末の音量と読み上げ音声を確認し、もう一度押してください。');};
 speechSynthesis.speak(u);}
 next(0);
}
function openAudio(){const v=$('#voice');v.replaceChildren();const voices=window.speechSynthesis?speechSynthesis.getVoices().filter(v=>v.lang.startsWith('en')):[];
 const defaultOption=new Option(voices.length?'端末の標準英語音声':'端末の標準音声（利用できる場合）','');v.add(defaultOption);for(const voice of voices)v.add(new Option(`${voice.name} (${voice.lang})`,voice.voiceURI));v.value=settings.voice;$('#auto-audio').checked=settings.auto;$('#settings').showModal();}
$('#audio-settings').addEventListener('click',openAudio);$('#voice').addEventListener('change',e=>{settings.voice=e.target.value;persist();});$('#auto-audio').addEventListener('change',e=>{settings.auto=e.target.checked;persist();});$('#stop-audio').addEventListener('click',stopAudio);
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopAudio();});
window.addEventListener('storage',e=>{if(e.key===KEY){const data=read('localStorage',KEY,{});attempts=mergeAttempts(attempts,Array.isArray(data?.attempts)?data.attempts:[]);if(location.hash==='#home'||location.hash==='#progress')render(false);}});
const button=(action,label,cls='secondary',extra='')=>`<button class="${cls}" data-action="${action}" ${extra}>${label}</button>`;
function go(hash){if(location.hash===hash)render();else location.hash=hash;}
function breadcrumb(text){return `${new URLSearchParams(location.search).get('course')==='4'?'<a class="breadcrumb" href="../#grade4">← 4級の練習につづける</a>':''}<div class="breadcrumb">${button('home','← ホーム')}<span>${esc(text)}</span></div>`;}
function badge(l){const s=statusFor(l.id,attempts);return `<span class="badge ${s.key==='weak'?'weak':s.key==='mastered'?'done':''}">${s.label}</span>`;}
function card(l){return `<button class="lesson-card" data-lesson="${l.id}"><span class="num">${l.extension?'STEP UP':`LESSON ${String(l.number).padStart(2,'0')}`}</span><strong>${esc(l.title)}</strong><span class="subtitle">${esc(l.subtitle)}</span>${badge(l)}</button>`;}
function home(){
 const mastered=basic.filter(l=>statusFor(l.id,attempts).key==='mastered').length,checked=basic.filter(l=>statusFor(l.id,attempts).count>=3).length,weak=basic.filter(l=>statusFor(l.id,attempts).key==='weak');
 const visible=lessons.filter(l=>filter==='extra'?l.extension:!l.extension&&(filter!=='weak'||statusFor(l.id,attempts).key==='weak'));
 app.innerHTML=`<section class="hero"><div><span class="eyebrow">えいけん 5級 / 見て・聞いて・ためす</span><h1>英語の「きまり」が、<br>見えてくる。</h1><p>図を動かして、声で聞いて。<br>わからないところから、一つずつわかるように。</p><div class="actions">${button('diagnostic','まずは8問でチェック →','primary')}${button('first','図解から学ぶ')}</div></div><div class="hero-art" aria-label="同じ文でも主語に合わせて動詞が変わります"><div class="speech">I <mark>play</mark> tennis.</div><div class="symbols" aria-hidden="true">🧒 🎾</div><div class="speech">She <mark>plays</mark> tennis.</div><span class="caption">主語が変わると、どこが変わる？</span></div></section>${note()}
 ${session?`<div class="resume"><span>「${esc(session.title)}」の続きがあります（${session.index+1} / ${session.queue.length}問）</span>${button('resume','続きから →','primary')}</div>`:''}
 <div class="summary"><div><strong>${checked}<small> / 20</small></strong><small>3問以上確認した項目</small></div><div><strong>${weak.length}</strong><small>復習したい項目</small></div><div><strong>${mastered}</strong><small>別の日にもできた項目</small></div></div>
 <section class="ai-home-card"><div><span class="eyebrow">AI CONVERSATION</span><h2>理由まで、対話で確かめる。</h2><p>文法を選ぶ、誤答を振り返る。音声対話に使えるプロンプトを作れます。</p></div>${button('ai-open','AIとの学習を準備 →','primary')}</section><div class="section-head"><div><span class="eyebrow">YOUR LEARNING MAP</span><h2>きまりを見つけにいこう</h2></div>${button('progress','学習記録','icon-button')}</div><div class="filters" aria-label="レッスンの種類">${[['all','5級の基本 20'],['weak',`ここを復習 ${weak.length}`],['extra',`4級へのステップ ${lessons.filter(l=>l.extension).length}`]].map(([key,label])=>button('filter',label,'',`data-filter="${key}" aria-pressed="${filter===key}"`)).join('')}</div>
 ${filter==='extra'?'<p class="course-note">過去形や未来の表現も学びたい人へ。5級の基本を学んだ後の追加コースです。</p>':''}<section class="lesson-grid" aria-label="レッスン一覧">${visible.map(card).join('')}</section>${!visible.length?'<p class="empty">復習項目はまだありません。チェックを進めると、ここに表示されます。</p>':''}
 <div class="course-note"><strong>チェックは「できるところ」を探す時間。</strong><br>8問で全項目の理解度は決まりません。未確認のきまりは、次のチェックや各レッスンで確かめよう。<div class="actions">${button('full-diagnostic','20項目を1問ずつ確かめる')}</div></div>${footer()}`;
}
function footer(){return `<footer class="footer">学習記録はこのブラウザーに保存されます。音声は端末の読み上げ機能を使います。<br>英検5級を目安にした独自教材です。公式の出題範囲一覧や合格判定ではありません。<a href="https://www.eiken.or.jp/eiken/exam/grade_5/solutions.html" target="_blank" rel="noopener">英検公式の試験内容</a></footer>`;}
function diagram(l,e){
 let special='';
 if(l.diagram==='be')special=`<div class="switcher" aria-label="主語を切り替える">${[['I',0],['She',1],['They',2]].map(([label,i])=>button('example',label,'',`data-index="${i}" aria-pressed="${exampleIndex===i}"`)).join('')}</div>`;
 if(l.diagram==='future')special='<div class="timeline"><span>現在 / 今日</span><span>未来 / 明日 →</span></div>';
 if(l.diagram==='past')special=`<div class="timeline"><span>← 過去 / 昨日</span><span>現在 / 今日 →</span></div>`;
 if(l.diagram==='plurals')special=`<div class="switcher">${button('example','1匹 →','',`data-index="0" aria-pressed="${exampleIndex===0}"`)}${button('example','2匹 →','',`data-index="1" aria-pressed="${exampleIndex===1}"`)}</div>`;
 return `<div class="diagram"><div class="diagram-title">図でくらべる / ${esc(e.label)}</div>${special}<div class="scene" aria-hidden="true" style="white-space:pre-line">${esc(e.scene)}</div><div class="sentence-parts">${e.parts.map(([word,label])=>`<span class="part">${esc(word)}<small>${esc(label)}</small></span>`).join('')}</div><div class="sentence" id="example-sentence" lang="en">${marked(e.en)}</div><p class="translation">${esc(e.ja)}</p><div class="audio-buttons">${button('example-audio','▶ 英文を聞く')}${button('example-slow','▷ ゆっくり')}${button('compare-audio','⇄ 例文を聞きくらべる')}</div></div>`;
}
function lessonView(id){const l=lessonById(id);if(!l){go('#home');return;}exampleIndex=Math.min(exampleIndex,l.examples.length-1);const e=l.examples[exampleIndex],focus=focusQuestion?.lessonId===l.id?focusQuestion:null;
 app.innerHTML=`${breadcrumb(l.extension?'4級へのステップ':'5級の基本')}<div class="lesson-layout"><nav class="sidebar" aria-label="レッスンを選ぶ"><span class="eyebrow">LEARNING MAP</span>${lessons.map(x=>`<button data-lesson="${x.id}" class="${x.id===id?'current':''}" ${x.id===id?'aria-current="page"':''}>${x.extension?'＋':String(x.number).padStart(2,'0')} ${esc(x.title)}</button>`).join('')}</nav><section class="paper"><span class="eyebrow">${l.extension?'STEP UP':`LESSON ${String(l.number).padStart(2,'0')}`}</span><h1 style="font-size:30px">${esc(l.title)}</h1><p class="lead">${esc(l.explain)}</p>${focus?`<aside class="focus-box"><h3>ここを確かめよう：${esc(focus.focus||l.title)}</h3><p>${esc(focus.hint)}</p><div class="sentence" lang="en">${esc(focus.sentence)}</div><p class="translation">${esc(focus.ja)}</p>${button('focus-audio','▶ この例文を聞く')}</aside>`:''}
 <div class="example-tabs" aria-label="例文を切り替える">${l.examples.map((e,i)=>button('example',`${i+1}. ${esc(e.label)}`,'',`data-index="${i}" aria-pressed="${i===exampleIndex}"`)).join('')}</div>${diagram(l,e)}<div class="point"><b>ここがポイント</b>${esc(e.point)}</div>
 ${l.table?`<table class="rule-table">${l.table.map((row,i)=>`<tr>${row.map(c=>`<${i?'td':'th'} ${i?'':'scope="col"'}>${esc(c)}</${i?'td':'th'}>`).join('')}</tr>`).join('')}</table>`:''}
 <div class="audio-buttons">${button('explanation-audio','▶ 日本語の解説を聞く')}</div><div class="actions">${button('practice',focus?'別の問題で確かめる →':'4問で確かめる →','primary',`data-id="${id}"`)}${button('next-lesson','次のきまりへ', 'secondary',`data-id="${id}"`)}${button('ai-lesson','この文法をAIと対話', 'secondary',`data-id="${id}"`)}</div>${note()}<p class="muted" style="font-size:12px;margin-top:18px">同じ問題を覚えただけにならないよう、別の例文でも確かめよう。</p></section></div>`;
}
function start(queue,mode,title,source=null){session=makeSession(queue,mode,title,source);saveSession();go('#test');}
function startPractice(id){const l=lessonById(id);if(!l)return;const avoid=focusQuestion?.lessonId===id?[focusQuestion.id]:[];start(practiceQueue(id,attempts,4,avoid),'practice',l.title,id);}
function testView(){if(!session){go(result?'#results':'#home');return;}const q=byId(session.queue[session.index]),l=lessonById(q.lessonId),answer=session.answers.find(a=>a.qid===q.id),answered=!!answer;
 if(!Array.isArray(session.draft))session.draft=[];
 const draft=session.draft.filter(i=>Number.isInteger(i)&&i>=0&&i<(q.tokens?.length||0));session.draft=[...new Set(draft)];
 const options=session.options[q.id];
 app.innerHTML=`${breadcrumb(session.title)}<section class="test-container"><div class="progress-head"><span>${session.mode==='diagnostic'?'理解度チェック':'自分でためす'} / ${esc(l.title)}</span><span>${session.index+1} / ${session.queue.length} 問</span></div><div class="progress" role="progressbar" aria-label="問題の進み具合" aria-valuenow="${session.index+1}" aria-valuemin="0" aria-valuemax="${session.queue.length}"><span style="width:${100*(session.index+1)/session.queue.length}%"></span></div><div class="paper"><span class="eyebrow">${q.mode==='listen'?'LISTEN & CHOOSE':q.mode==='order'?'BUILD A SENTENCE':'CHOOSE THE ANSWER'}</span>
 ${q.mode==='listen'?`<div class="listening-scene" aria-hidden="true">🎧</div><h2>${esc(q.prompt)}</h2><p class="muted">何度でも聞けます。合う日本語を選ぼう。</p><div class="audio-buttons">${button('question-audio','▶ 問題の音声を聞く','primary')}${button('question-slow','▷ ゆっくり聞く')}</div>`:`<p class="question" ${q.mode==='order'?'':'lang="en"'}>${esc(q.prompt)}</p>${q.mode==='order'?'<p class="muted">単語を順番に押そう。上の単語を押すと戻せます。</p>':''}`}
 ${q.mode==='order'?`<div class="order-answer" aria-label="作った文">${session.draft.map((i,pos)=>`<button data-action="remove-token" data-pos="${pos}" ${answered?'disabled':''}>${esc(q.tokens[i])}</button>`).join('')}</div><div class="order-bank" aria-label="使える単語">${options.map(i=>`<button data-action="add-token" data-index="${i}" ${answered||session.draft.includes(i)?'disabled':''}>${esc(q.tokens[i])}</button>`).join('')}</div>${button('submit-order','こたえあわせ','primary',`${answered||session.draft.length!==q.tokens.length?'disabled':''}`)}`:
 `<div class="choices" style="margin-top:22px">${options.map((c,i)=>`<button class="choice ${answered&&c===q.answer?'correct':answered&&c===answer.chosen?'wrong':''}" data-action="answer" data-option="${i}" ${answered?'disabled':''}><span class="letter">${i+1}</span><span>${esc(c)}${answered&&c===q.answer?' ✓ 正解':answered&&c===answer.chosen?' × 選んだ答え':''}</span></button>`).join('')}</div>`}
 ${answered?feedback(q,answer):''}${note()}</div><div class="actions">${button('pause','ホームでひと休み')}</div><p class="muted" style="font-size:12px;margin-top:16px">途中の問題は、このタブを再読み込みしても続けられます。</p></section>`;
}
function feedback(q,a){return `<section class="feedback ${a.correct?'':'incorrect'}" tabindex="-1" role="region" aria-label="答えと解説"><h3>${a.correct?'✓ 正解。理由も確認しよう。':'考えた理由と、規則を確かめよう。'}</h3><p><strong>正解：${esc(q.answer)}</strong></p><p>${esc(q.hint)}</p><div class="sentence" lang="en" style="font-size:23px">${esc(q.sentence)}</div>${q.ja?`<p class="translation">${esc(q.ja)}</p>`:''}<div class="audio-buttons">${button('question-audio','▶ 正しい英文を聞く')}${button('hint-audio','▶ 解説を聞く')}</div><div class="actions">${a.correct?'':button('remediate','この部分を図で見る','secondary',`data-qid="${q.id}"`)}${button('ai-question','この問題をAIと考える','secondary',`data-qid="${q.id}"`)}${button('next-question',session.index+1===session.queue.length?'結果を見る →':'次の問題 →','primary')}</div></section>`;}
function submit(chosen){if(!session)return;const q=byId(session.queue[session.index]);if(session.answers.some(a=>a.qid===q.id))return;
 const correct=grade(q,chosen),at=Date.now();window.recordWordEvidence?.({id:'grammar-'+q.id,skill:q.mode==='listen'?'listen':'grammar',quality:correct?'correct':'wrong',source:'grammar'});session.answers.push({qid:q.id,correct,chosen,at});attempts=mergeAttempts(attempts,[{id:`${session.sid}:${q.id}`,sid:session.sid,qid:q.id,correct,at,chosen,guided:false}]);persist();saveSession();render(false);$('.feedback')?.focus();}
function nextQuestion(){if(!session)return;const qid=session.queue[session.index];if(!session.answers.some(a=>a.qid===qid))return;stopAudio();if(session.index+1<session.queue.length){session.index++;session.draft=[];saveSession();render();}else{result={...session,completed:Date.now()};session=null;saveSession();go('#results');}}
function resultsView(){if(!result){go('#home');return;}const correct=result.answers.filter(a=>a.correct).length,ids=[...new Set(result.answers.map(a=>byId(a.qid).lessonId))],wrong=result.answers.filter(a=>!a.correct);
 app.innerHTML=`${breadcrumb('チェックの結果')}<section class="test-container paper"><span class="eyebrow">YOUR NEXT STEP</span><h1 style="font-size:30px">${wrong.length?'次にわかることが、見つかった。':'今回の問題はすべて正解。'}</h1><div class="result-number">${correct}<span style="font-size:25px"> / ${result.answers.length}</span></div><p>${result.mode==='diagnostic'?'これは今回出た問題の結果です。':'別の文でも使えるか、また確かめよう。'} 一度のチェックだけでは、項目全体の理解度は決まりません。</p><div class="result-list">${ids.map(id=>{const l=lessonById(id),answers=result.answers.filter(a=>byId(a.qid).lessonId===id),miss=answers.find(a=>!a.correct);return `<div class="result-item"><div><strong>${esc(l.title)}</strong><p>${answers.filter(a=>a.correct).length} / ${answers.length}問 正解 ${badge(l)}</p>${miss?`<p>確かめたいこと：${esc(byId(miss.qid).focus||l.title)}</p>`:''}</div>${miss?button('remediate','ピンポイント解説 →','secondary',`data-qid="${miss.qid}"`):button('open-lesson','図解を見る','secondary',`data-id="${id}"`)}</div>`;}).join('')}</div><div class="actions">${wrong.length?button('retry-weak','苦手を別の問題で確認 →','primary'):button('diagnostic','ほかのきまりも確認 →','primary')}${button('ai-results','結果をAIに引き継ぐ')}${button('home','ホームへ')}</div>${note()}<p class="muted" style="font-size:12px;margin-top:20px">「身についた」は、複数の問題と別の時間の結果を見て表示します。5級の合否を表すものではありません。</p></section>`;
}
function progressView(){const rows=lessons.map(l=>{const s=statusFor(l.id,attempts);return `<div class="result-item"><div><strong>${esc(l.title)} ${l.extension?'＋4級へのステップ':''}</strong><p>${s.count?`${s.count}問を確認 / 最近${Math.min(s.count,6)}問の正答率 ${Math.round(s.accuracy*100)}%`:'まだ確認していません'} ${badge(l)}</p></div>${button('open-lesson','学ぶ →','secondary',`data-id="${l.id}"`)}</div>`;});app.innerHTML=`${breadcrumb('学習記録')}<section class="test-container"><span class="eyebrow">MY PROGRESS</span><h1 style="font-size:30px">一つずつ、できるように。</h1><p>「確認中」はまだ判断材料が少ない項目。「別の日に確認」は今の練習ができた項目。「身についた」は、12時間以上あけた複数回の学習で、最近の問題もよくできた項目です。</p>${note()}<div class="result-list">${rows.join('')}</div><div class="actions">${button('ai-weak','苦手をAIと確かめる')}${button('export','学習記録を保存')}${button('home','ホームへ','primary')}</div></section>`;}
function render(focus=true){stopAudio();const hash=location.hash||'#home',route=hash.split('/');if(hash!==lastRoute){exampleIndex=0;lastRoute=hash;}if(route[0]==='#lesson')lessonView(route[1]);else if(hash==='#test')testView();else if(hash==='#results')resultsView();else if(hash==='#progress')progressView();else if(hash==='#ai')app.innerHTML=breadcrumb('AIとの対話学習')+aiPage(aiDraft,aiContext())+note();else home();if(focus){app.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}}
function currentQuestion(){return session?byId(session.queue[session.index]):null;}
function aiContext(){return {attempts,contexts:[session,result].filter(Boolean)};}
function saveAI(){aiDraft=normalizeDraft(aiDraft);try{sessionStorage.setItem(KEY+'-ai',JSON.stringify(aiDraft));}catch{storageError=true;}}
function openAI(ids=null,focusQids=[],goal=null){
 if(ids!==null)aiDraft.selectedIds=ids;
 else if(!aiDraft.selectedIds.length&&!aiDraft.customTopic.trim()){const recommended=recommendedTopics(attempts);aiDraft.selectedIds=recommended.length?recommended:['be'];}
 if(ids!==null)aiDraft.customTopic='';aiDraft.focusQids=focusQids;if(goal)aiDraft.goal=goal;saveAI();go('#ai');
}
function updateAI(){const form=$('#ai-options');if(!form)return;aiDraft=normalizeDraft({...aiDraft,selectedIds:[...form.querySelectorAll('[name="topic"]:checked')].map(e=>e.value),customTopic:form.elements.customTopic.value,note:form.elements.note.value,goal:form.elements.goal.value,mode:form.elements.mode.value,minutes:Number(form.elements.minutes.value),includeHistory:form.elements.includeHistory.checked});saveAI();$('#ai-selected-summary').textContent=selectedTopicsLabel(aiDraft);$('#ai-output').innerHTML=aiOutput(buildHandoff(aiDraft,aiContext()));}
function selectPrompt(){const field=$('#ai-prompt-text');if(!field)return;field.focus();field.select();field.setSelectionRange(0,field.value.length);}
function aiMessage(message){const status=$('#ai-copy-status');if(status)status.textContent=message;}
async function copyPrompt(){const h=buildHandoff(aiDraft,aiContext());if(!h.valid)return;try{if(!navigator.clipboard?.writeText)throw Error('clipboard unavailable');await navigator.clipboard.writeText(h.text);aiMessage('コピーしました。利用するAIのチャットに貼り付けてください。');}catch{selectPrompt();aiMessage('自動コピーを利用できません。全文を選択しました。端末のコピー操作を使うか「テキスト保存」を押してください。');}}
function downloadPrompt(){const h=buildHandoff(aiDraft,aiContext());if(!h.valid)return;const blob=new Blob(['\uFEFF'+h.text],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='grammar-ai-dialogue.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);aiMessage('プロンプトをテキストファイルとして保存します。');}
app.addEventListener('input',e=>{if(e.target.matches('#ai-custom,#ai-request'))updateAI();});
app.addEventListener('change',e=>{if(e.target.closest('#ai-options')&&!e.target.matches('#ai-custom,#ai-request'))updateAI();});
app.addEventListener('submit',e=>{if(e.target.id==='ai-options')e.preventDefault();});
app.addEventListener('click',event=>{const target=event.target.closest('button');if(!target||target.disabled)return;if(target.dataset.lesson){focusQuestion=null;go(`#lesson/${target.dataset.lesson}`);return;}
 const action=target.dataset.action,l=lessonById(location.hash.split('/')[1]),q=currentQuestion();
 switch(action){case'home':case'pause':go('#home');break;case'first':focusQuestion=null;go('#lesson/word-order');break;case'progress':go('#progress');break;case'filter':filter=target.dataset.filter;render(false);break;
 case'diagnostic':case'full-diagnostic':if(session){go('#test');break;}start(diagnosticQueue(attempts,action==='full-diagnostic'),'diagnostic',action==='full-diagnostic'?'20項目チェック':'8問チェック');break;
 case'resume':go('#test');break;
 case'open-lesson':focusQuestion=null;go(`#lesson/${target.dataset.id}`);break;
 case'example':{if(!l)return;exampleIndex=Number(target.dataset.index);render(false);if(settings.auto)speak(l.examples[exampleIndex].en,{element:$('#example-sentence')});break;}
 case'example-audio':if(l)speak(l.examples[exampleIndex].en,{element:$('#example-sentence')});break;
 case'example-slow':if(l)speak(l.examples[exampleIndex].en,{rate:.72,element:$('#example-sentence')});break;
 case'compare-audio':if(l)speak(l.examples.map(e=>e.en));break;
 case'explanation-audio':if(l)speak(l.explain+' '+l.examples[exampleIndex].point,{lang:'ja-JP'});break;
 case'focus-audio':if(focusQuestion)speak(focusQuestion.sentence);break;
 case'practice':{if(session){if(focusQuestion&&q?.id===focusQuestion.id&&session.answers.some(a=>a.qid===q.id)){const next=practiceQueue(focusQuestion.lessonId,attempts,lessonById(focusQuestion.lessonId).questions.length,session.queue).find(id=>!session.queue.includes(id));if(next){const fresh=byId(next);session.queue.splice(session.index+1,0,next);session.options[next]=fresh.mode==='order'?shuffle(fresh.tokens.map((_,i)=>i)):shuffle(fresh.choices);session.index++;session.draft=[];saveSession();}}go('#test');break;}startPractice(target.dataset.id);break;}
 case'next-lesson':{const at=lessons.findIndex(l=>l.id===target.dataset.id);focusQuestion=null;go(at+1<lessons.length?`#lesson/${lessons[at+1].id}`:'#home');break;}
 case'answer':if(q&&q.mode!=='order')submit(session.options[q.id][Number(target.dataset.option)]);break;
 case'add-token':if(q?.mode==='order'&&!session.answers.some(a=>a.qid===q.id)){const i=Number(target.dataset.index);if(!session.draft.includes(i)){session.draft.push(i);saveSession();render(false);$('.order-answer button:last-child')?.focus();}}break;
 case'remove-token':if(q?.mode==='order'&&!session.answers.some(a=>a.qid===q.id)){session.draft.splice(Number(target.dataset.pos),1);saveSession();render(false);}break;
 case'submit-order':if(q?.mode==='order'&&session.draft.length===q.tokens.length)submit(session.draft.map(i=>q.tokens[i]).join(' '));break;
 case'question-audio':case'question-slow':if(q)speak(q.sentence,{rate:action==='question-slow'?.72:1});break;
 case'hint-audio':if(q)speak(q.hint,{lang:'ja-JP'});break;
 case'next-question':nextQuestion();break;
 case'ai-open':openAI();break;
 case'ai-lesson':openAI([target.dataset.id]);break;
 case'ai-question':{const f=byId(target.dataset.qid);if(f){aiDraft.includeHistory=true;openAI([f.lessonId],[f.id],session?.answers.find(a=>a.qid===f.id)?.correct?'verify':'repair');}break;}
 case'ai-results':{if(!result)break;const wrong=result.answers.filter(a=>!a.correct),items=wrong.length?wrong:result.answers;aiDraft.includeHistory=true;openAI([...new Set(items.map(a=>byId(a.qid).lessonId))],wrong.map(a=>a.qid),wrong.length?'repair':'verify');break;}
 case'ai-weak':aiDraft.includeHistory=true;openAI(recommendedTopics(attempts),[],'repair');break;
 case'ai-recommend':{const ids=recommendedTopics(attempts);if(ids.length){aiDraft.selectedIds=ids;aiDraft.includeHistory=true;saveAI();render(false);}else aiMessage('まだ苦手を特定できる記録がありません。確かめたい文法を選んで対話できます。');break;}
 case'ai-clear':aiDraft.selectedIds=[];aiDraft.focusQids=[];saveAI();render(false);break;
 case'ai-preview':$('#ai-output').focus({preventScroll:true});$('#ai-output').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});break;
 case'ai-copy':void copyPrompt();break;
 case'ai-download':downloadPrompt();break;
 case'ai-select-text':selectPrompt();aiMessage('全文を選択しました。端末のコピー操作を使ってください。');break;
 case'remediate':{const f=byId(target.dataset.qid);if(!f)break;focusQuestion=f;go(`#lesson/${f.lessonId}`);break;}
 case'retry-weak':{const wrong=result?.answers.filter(a=>!a.correct)||[],ids=[...new Set(wrong.map(a=>byId(a.qid).lessonId))];if(!ids.length)break;const avoid=result.answers.map(a=>a.qid);const queue=ids.flatMap(id=>practiceQueue(id,attempts,2,avoid));start(shuffle(queue),'retry','苦手をもう一度');break;}
 case'export':{const blob=new Blob([JSON.stringify({version:1,exported:new Date().toISOString(),attempts},null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='grammar-learning-record.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);break;}}
});
window.addEventListener('hashchange',()=>render());
render();
