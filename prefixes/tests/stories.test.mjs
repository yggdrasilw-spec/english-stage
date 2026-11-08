import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coreArt,wordArt,coreKinds,sceneKinds,generatedPairs} from '../story-art.mjs';
import {storyPage,storyShelf,getStoryWord} from '../story-view.mjs';
import {normalize,unlocked} from '../core.mjs';
import {mountStoryPlayer} from '../story-player.mjs';
import {createSpeech} from '../audio.mjs';
const data=Object.fromEntries(['words','prefixes','editorial','stories','mvp','image-assets'].map(n=>[n,JSON.parse(readFileSync(new URL(`../data/${n}.json`,import.meta.url),'utf8'))]));
const stories=data.stories.stories;
test('14 distinct, authored mental images; every example/transfer is an approved original word',()=>{
 assert.equal(stories.length,14);assert.deepEqual(new Set(stories.map(s=>s.prefix_id)),new Set(data.mvp.prefix_ids));assert.equal(new Set(stories.map(s=>s.image)).size,14);
 for(const s of stories){assert(coreKinds.includes(s.image));assert(s.scope_ja&&s.narration_ja);const p=data.prefixes.find(p=>p.id===s.prefix_id);assert.equal(s.form,p.form);for(const e of [...s.examples,...(s.transfer?[s.transfer]:[])]){const w=getStoryWord(data,e.word);assert.equal(w.prefix_id,s.prefix_id);assert(sceneKinds.includes(e.scene));assert.equal(s.form.replace(/-$/,'')+w.base,w.word);}}
 assert.notEqual(stories[0].image,stories[1].image);assert.equal(stories.find(s=>s.prefix_id==='bi_two').transfer,null);
});
test('all story pages and pictures render; no made-up words or held cards in transfer',()=>{
 for(const s of stories){const html=storyPage(s,data);assert(html.includes('data-story-reader'));assert(html.includes('data-motion-card'));assert(!html.includes('undefined'));assert(!html.includes('NaN'));assert(html.includes(s.scope_ja));assert(html.includes('確認問題は、ためしたいときに'));assert(html.includes('説明カード・要レビュー')===data.words.filter(w=>w.prefix_id===s.prefix_id).some(w=>data.editorial.words[w.word]?.use==='card'));}
 assert.equal((storyShelf(stories).match(/class="image-book"/g)||[]).length,14);
 coreKinds.forEach(k=>assert(coreArt(k,'part-',k).includes('role="img"')));sceneKinds.forEach(k=>assert(wordArt(k,k).includes('role="img"')));
 assert.throws(()=>getStoryWord(data,'unbig'));assert.throws(()=>getStoryWord(data,'bicycle'));
});
test('generated assets exist, have valid dimensions and provenance; image references remain local',()=>{
 const assets=data['image-assets'].assets;assert.equal(assets.length,5);for(const a of assets){const b=readFileSync(new URL('../assets/'+a.file,import.meta.url));assert.equal(b.subarray(1,4).toString(),'PNG');assert.equal(b.readUInt32BE(16),a.width);assert.equal(b.readUInt32BE(20),a.height);assert(a.prompt.length>100);assert.equal(a.tool,'built-in image_gen');assert.equal(a.review,'visual_review_pass');}
 assert.equal(assets.find(a=>a.file==='guide.png').alpha,true);for(const f of Object.values(generatedPairs))assert(assets.some(a=>a.file===f));
});
test('old schema-1 histories survive; seeing images grants no quiz mastery; basic/intermediate reading is open',()=>{
 const old={schemaVersion:1,sound:false,attempts:[{id:'old',item:'W_UN_NOT_01',prefix:'un_not',correct:true,at:1700000000000,mode:'infer',stage:1}]};const state=normalize(old);assert.deepEqual(state.attempts,old.attempts);assert.deepEqual(state.seen,[]);assert(state.motion);state.seen=stories.map(s=>s.prefix_id);assert.equal(state.attempts.length,1);assert(unlocked(2,[],data.prefixes));assert(!unlocked(3,state.attempts,data.prefixes.filter(p=>p.mvp)));
});
test('teacher narration chooses Japanese; English pronunciation keeps its own language',()=>{
 const spoken=[],ja={lang:'ja-JP'},en={lang:'en-US'};const speech=createSpeech({host:{SpeechSynthesisUtterance:class{},speechSynthesis:{cancel(){},getVoices:()=>[en,ja],speak:x=>spoken.push(x)}},enabled:()=>true,status(){}});speech.speak('もう一度',{lang:'ja-JP',rate:.95});speech.speak('reread');assert.equal(spoken[0].voice,ja);assert.equal(spoken[1].voice,en);assert.equal(spoken[0].rate,.95);
});
function fixture({slowImage=false}={}){
 const element=()=>{const classes=new Set(),attrs=new Set();return {dataset:{},isConnected:true,classes,attrs,classList:{toggle(k,v){v?classes.add(k):classes.delete(k);},add(...ks){ks.forEach(k=>classes.add(k));},remove(...ks){ks.forEach(k=>classes.delete(k));}},setAttribute(k){attrs.add(k);},hasAttribute:k=>attrs.has(k),removeAttribute:k=>attrs.delete(k)};};
 const card=element();card.dataset.core='over_too_much';const label={textContent:''},input={checked:false},before=element();before.dataset.storyAction='before';card.querySelector=s=>s==='.story-stage-label'?label:s==='[data-story-action="before"]'?before:null;
 const replay=element();replay.dataset.storyAction='replay';for(const b of [before,replay]){b.closest=s=>s==='button[data-story-action]'?b:s==='[data-motion-card]'?card:null;}
 const root=element(),handlers={};root.querySelectorAll=()=>[card];root.querySelector=()=>input;root.addEventListener=(k,f)=>handlers[k]=f;root.removeEventListener=k=>delete handlers[k];root.contains=()=>true;
 let observer,serial=0;const queue=new Map(),viewed=[];const host={matchMedia:()=>({matches:false,addEventListener(){},removeEventListener(){}}),setTimeout:fn=>{queue.set(++serial,fn);return serial;},clearTimeout:id=>queue.delete(id),IntersectionObserver:class{constructor(cb){this.cb=cb;observer=this;}observe(){}unobserve(){}disconnect(){this.disconnected=true;}}};
 let resolveGuide;if(slowImage)host.Image=class{decode(){return new Promise(resolve=>resolveGuide=resolve);}};
 const cleanup=mountStoryPlayer(root,{stories,onViewed:id=>viewed.push(id),host});const enter=v=>observer.cb([{target:card,isIntersecting:v}]);const click=b=>handlers.click({target:{closest:()=>b}});const flush=()=>{for(const [id,fn]of [...queue]){queue.delete(id);fn();}};
 return {root,card,queue,viewed,cleanup,enter,click,before,replay,flush,resolveGuide:()=>resolveGuide(),getObserver:()=>observer};
}
test('leaving viewport cancels pending autoplay; before button wins over timers; replay still works',()=>{
 const f=fixture();f.enter(true);assert.equal(f.queue.size,1);f.enter(false);assert.equal(f.queue.size,0);f.enter(true);f.click(f.before);f.flush();assert(!f.card.classes.has('is-applied'));assert.equal(f.viewed.length,0);f.click(f.replay);f.flush();assert(f.card.classes.has('is-applied'));assert.deepEqual(f.viewed,['over_too_much']);f.cleanup();
});
test('navigating away tears down all pending animation callbacks and observation',()=>{
 const f=fixture();f.enter(true);f.cleanup();f.flush();assert.equal(f.viewed.length,0);assert.equal(f.queue.size,0);assert(f.getObserver().disconnected);
});

test('slow image loading waits before motion and cannot override a later before selection',async()=>{
 const f=fixture({slowImage:true});f.enter(true);f.flush();assert(!f.card.classes.has('is-applied'));f.click(f.before);f.resolveGuide();await Promise.resolve();await Promise.resolve();await Promise.resolve();assert(!f.card.classes.has('is-applied'));assert.equal(f.viewed.length,0);f.cleanup();
});
