import test from 'node:test';
import assert from 'node:assert/strict';
import {createSpeech} from '../audio.mjs';
test('missing and blocked speech leave text learning available',()=>{
 let message='';const a=createSpeech({host:{},enabled:()=>true,status:s=>message=s});assert.doesNotThrow(()=>a.speak('happy'));assert.match(message,/文字で学習/);
 const b=createSpeech({host:{SpeechSynthesisUtterance:class{},speechSynthesis:{cancel(){},getVoices(){throw Error('blocked');}}},enabled:()=>true,status:s=>message=s});assert.doesNotThrow(()=>b.speak('happy'));assert.match(message,/文字で学習/);
});
test('OFF blocks manual speech, en-US preferred, canceled callbacks cannot report a false failure',()=>{
 let on=false,message='',spoken=[];
 const voices=[{lang:'ja-JP'},{lang:'en-GB'},{lang:'en-US'}];const a=createSpeech({host:{SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},speechSynthesis:{cancel(){},getVoices:()=>voices,speak:u=>spoken.push(u)}},enabled:()=>on,status:s=>message=s});
 a.speak('happy');assert.equal(spoken.length,0);on=true;a.speak('happy');assert.equal(spoken[0].voice,voices[2]);assert.equal(spoken[0].lang,'en-US');assert.equal(spoken[0].text,'happy');spoken[0].onstart();assert.match(message,/読み上げ/);on=false;a.stop();spoken[0].onerror({error:'canceled'});assert.equal(message,'');
});
test('speech failure is reported and a later request can still work',()=>{
 let u,message;const a=createSpeech({host:{SpeechSynthesisUtterance:class{},speechSynthesis:{cancel(){},getVoices:()=>[],speak:x=>u=x}},enabled:()=>true,status:s=>message=s});a.speak('unhappy');u.onerror({error:'not-allowed'});assert.match(message,/文字で学習/);a.speak('happy');u.onend();assert.equal(message,'');
});
