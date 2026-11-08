// Inject the browser host so unsupported/blocked speech can be tested without audio hardware.
export function createSpeech({host,enabled,status}){
 let generation=0;
 function stop(){generation++;try{host.speechSynthesis?.cancel();}catch{}status('');}
 function speak(text,{lang='en-US',rate=.8}={}){
  if(!enabled())return;stop();
  if(!host.speechSynthesis||typeof host.SpeechSynthesisUtterance!=='function'){status('この端末では音声が使えません。文字で学習できます。');return;}
  const token=generation;
  try{const u=new host.SpeechSynthesisUtterance(text);u.lang=lang;u.rate=rate;
   const voices=host.speechSynthesis.getVoices();const voice=voices.find(v=>v.lang===lang)||voices.find(v=>v.lang.startsWith(lang.split('-')[0]));if(voice)u.voice=voice;
   u.onstart=()=>{if(token===generation)status(lang.startsWith('ja')?'先生のお話を読み上げています。':'英単語を読み上げています。');};
   u.onend=()=>{if(token===generation)status('');};
   u.onerror=e=>{if(token===generation&&!['canceled','interrupted'].includes(e.error))status('音声を再生できませんでした。文字で学習を続けられます。');};
   host.speechSynthesis.speak(u);
  }catch{status('音声を再生できませんでした。文字で学習を続けられます。');}
 }
 return {stop,speak};
}
