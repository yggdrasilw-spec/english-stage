let token=0,current=null,manifest=null;
export async function init(){try{const r=await fetch('data/audio-manifest.json');if(r.ok){const m=await r.json();if(m.provider==='Google Cloud Text-to-Speech'&&m.files?.length)manifest=m;}}catch{}}
export function stop(){token++;if(current){current.pause();current=null;}window.speechSynthesis?.cancel();}
export function availableVoices(){return window.speechSynthesis?.getVoices().filter(v=>v.lang.replace('_','-').toLowerCase()==='en-us')||[];}
async function ready(){
 if(!window.speechSynthesis||!window.SpeechSynthesisUtterance)throw Error('このブラウザは読み上げに対応していません。英語と例文を見て練習できます。');
 if(availableVoices().length)return;
 await new Promise(resolve=>{const finish=()=>{clearTimeout(timer);speechSynthesis.removeEventListener('voiceschanged',finish);resolve();};const timer=setTimeout(finish,1500);speechSynthesis.addEventListener('voiceschanged',finish);});
}
export async function play(card,{example=false,slow=false}={}){
 stop();const mine=token;
 const file=manifest?.files.find(f=>f.id===card.id&&f.part===(example?'example':'word')&&f.speed===(slow?'slow':'normal'));
 if(file&&/^assets\/audio\/[a-z0-9-]+\.mp3$/.test(file.path)){
  current=new Audio(file.path);try{await current.play();return true;}catch{if(mine!==token)return false;throw Error('音声ファイルを再生できません。「もう一度」で再試行してください。');}
 }
 await ready();if(mine!==token)return false;
 const voices=availableVoices();const voice=voices.find(v=>v.localService)||voices[0];
 if(!voice)throw Error('米国英語（en-US）の音声が見つかりません。端末の英語音声を追加し、ページを開き直してください。聞く問題は「読んで練習に切り替える」を使えます。');
 const utterance=new SpeechSynthesisUtterance(example?card.example:card.en);utterance.voice=voice;utterance.lang='en-US';utterance.rate=slow?.7:.9;
 utterance.onerror=e=>{if(mine===token&&!['canceled','interrupted'].includes(e.error))document.dispatchEvent(new CustomEvent('audio-error',{detail:'音声を再生できません。「もう一度」で再試行するか、読んで練習に切り替えてください。'}));};
 speechSynthesis.speak(utterance);return true;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
