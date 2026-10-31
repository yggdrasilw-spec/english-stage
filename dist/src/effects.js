// Tiny synthesized sounds: no downloads, and no dependency on speech playback.
let context=null,generation=0;
const active=new Set();
export function prepare(enabled){
 if(!enabled)return;
 try{const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return;
  context ||= new AudioContext();if(context.state==='suspended')context.resume().catch(()=>{});
 }catch{} // Effects are optional; learning must work without Web Audio.
}
export function stop(){
 generation++;
 for(const node of active){try{node.stop();}catch{}}
 active.clear();
}
export function play(kind,enabled){
 if(!enabled)return;
 prepare(true);if(!context)return;
 stop();const mine=generation;
 const sound=()=>{
  if(mine!==generation||context.state!=='running'||document.hidden)return;
  const notes={flip:[[740,0,.055]],move:[[520,0,.055]],known:[[880,0,.10],[1175,.065,.12],[1568,.13,.13]],correct:[[1047,0,.10],[1319,.06,.12],[1568,.12,.14]]}[kind];
  if(!notes)return;
  for(const [hz,delay,duration] of notes){
   const oscillator=context.createOscillator(),gain=context.createGain(),at=context.currentTime+delay;
   oscillator.type='sine';oscillator.frequency.setValueAtTime(hz,at);
   gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(.045,at+.008);gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
   oscillator.connect(gain);gain.connect(context.destination);active.add(oscillator);
   oscillator.onended=()=>{active.delete(oscillator);oscillator.disconnect();gain.disconnect();};
   oscillator.start(at);oscillator.stop(at+duration+.01);
  }
 };
 if(context.state==='running')sound();else context.resume().then(sound).catch(()=>{});
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});

export const correctMark=animated=>`<div class="correct-mark ${animated?'just-correct':''}" aria-hidden="true"><svg viewBox="0 0 120 100"><circle class="correct-halo" cx="60" cy="50" r="32"/><circle class="correct-ring" cx="60" cy="50" r="27" pathLength="1"/><g class="correct-glints"><path d="M17 16v14m-7-7h14M99 65v14m-7-7h14M100 15v10m-5-5h10"/><circle cx="22" cy="78" r="2"/><circle cx="88" cy="9" r="2"/></g></svg></div>`;
