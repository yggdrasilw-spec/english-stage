const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../accent.html'),'utf8');
const code=source.slice(source.indexOf('// Shared media element'),source.indexOf('function playQ('));
function setup(){
 let timers=[],mocks=[],classes=new Set(),els=[{classList:{add(){},remove(){}}}];
 class Audio{constructor(){this.currentTime=0;this.paused=true}setAttribute(){}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}}
 const c=vm.createContext({Audio,document:{body:{appendChild(){}}},CLIPS:{'0a_u':{file:'u.mp3',T:[100],dur:1000},'0a_d':{file:'d.mp3',T:[100],dur:1000}},
  URL:{revokeObjectURL(){},createObjectURL(){return 'blob:test'}},fetch:async()=>({ok:true,blob:async()=>({size:1})}),ctx:null,
  setTimeout:(f,ms)=>{const t={f,ms};timers.push(t);return t},clearTimeout:t=>{t.cancelled=true},tms:[],sync:true,answered:false,
  $$:s=>s==='.sent i'?els:[{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}],
  voiceMock:(...args)=>mocks.push(args),vo:null,cbCount:0});
 vm.runInContext(code,c);
 return {c,timers,mocks,classes,run:x=>vm.runInContext(x,c)};
}
test('missing clip uses mock; first-play choice stays paired when preload finishes later',()=>{
 const t=setup();t.run("voice({id:'0a',s:'Really?'},'u',1,null,0)");
 t.run("questionBlobs.set('0a_u','blob:u');questionBlobs.set('0a_d','blob:d');voice({id:'0a',s:'Really?'},'d',1,null,1)");
 assert.equal(t.mocks.length,2);
});
test('real playback scales highlights, preserves pitch and finishes once',()=>{
 const t=setup();t.run("questionBlobs.set('0a_u','blob:u');questionBlobs.set('0a_d','blob:d');voice({id:'0a'},'u',.55,()=>cbCount++,0);questionAudio.onplaying()");
 assert.equal(t.run('questionAudio.playbackRate'),.55);assert.equal(t.run('questionAudio.preservesPitch'),true);
 assert.ok(t.timers.some(x=>Math.abs(x.ms-100/.55)<.01));assert.ok(t.classes.has('on'));
 const ended=t.run('questionAudio.onended');ended();ended();assert.equal(t.run('cbCount'),1);
});
test('stop cancels media, timers and callback; stale errors cannot restart mock',()=>{
 const t=setup();t.run("questionBlobs.set('0a_u','blob:u');questionBlobs.set('0a_d','blob:d');voice({id:'0a'},'u',1,()=>cbCount++,0);questionAudio.onplaying()");
 const error=t.run('questionAudio.onerror'),ended=t.run('questionAudio.onended');t.run('vo.stop()');error();ended();
 assert.equal(t.run('questionAudio.currentTime'),0);assert.equal(t.run('questionAudio.paused'),true);assert.equal(t.run('cbCount'),0);
 assert.equal(t.mocks.length,0);assert.ok(t.timers.every(x=>x.cancelled));
});
test('decode/play error invalidates both halves and falls back',()=>{
 const t=setup();t.run("questionBlobs.set('0a_u','blob:u');questionBlobs.set('0a_d','blob:d');voice({id:'0a'},'u',1,null,0);questionAudio.onerror();voice({id:'0a'},'d',1,null,1)");
 assert.equal(t.mocks.length,2);
});
test('pending preload waits for both clips instead of choosing mock on a slow network',async()=>{
 const t=setup();let release;const pending=new Promise(resolve=>release=resolve);t.c.pending=pending;
 t.run("questionLoads.set('0a',pending);voice({id:'0a'},'u',1,null,0)");
 assert.equal(t.mocks.length,0);
 t.run("questionBlobs.set('0a_u','blob:u');questionBlobs.set('0a_d','blob:d');questionLoads.delete('0a')");
 release();await pending;await Promise.resolve();assert.equal(t.mocks.length,0);assert.equal(t.run('questionAudio.src'),'blob:u');
});
test('stopping during preload prevents stale playback after the clips arrive',async()=>{
 const t=setup();let release;const pending=new Promise(resolve=>release=resolve);t.c.pending=pending;
 t.run("questionLoads.set('0a',pending);voice({id:'0a'},'u',1,null,0);vo.stop();questionLoads.delete('0a')");
 release();await pending;await Promise.resolve();assert.equal(t.mocks.length,0);assert.equal(t.run('questionAudio.paused'),true);
});
