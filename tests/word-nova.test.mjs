import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url);
const context={window:{}};
vm.runInNewContext(readFileSync(new URL('word-nova-data.js',root),'utf8'),context);
const data=context.window.WORD_NOVA_DATA;
const cards=JSON.parse(readFileSync(new URL('data/grade5.json',root),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('data/audio-manifest.json',root),'utf8'));
test('WORD NOVA covers every existing vocabulary word using its own published MP3',()=>{
 const words=cards.filter(c=>c.kind==='word');
 assert.equal(data.words.length,words.length);
 for(const c of words){const w=data.words.find(w=>w.en===c.en);assert(w,c.en);assert.equal(w.ja,c.ja);const f=manifest.files.find(f=>f.id===c.id&&f.part==='word'&&f.speed==='normal');assert.equal(w.audio,f.path);assert(existsSync(new URL(w.audio,root)));}
});
test('listening contrasts have distinct recordings and preserve all choices in the focused pool',()=>{
 assert.equal(data.groups.length,21);
 for(const group of data.groups){assert(group.length>=2);const paths=new Set();for(const en of group){const w=data.words.find(w=>w.en.toLowerCase()===en);assert(w,en);assert.equal(w.cat,'near');paths.add(w.audio)}assert.equal(paths.size,group.length);}
 const html=readFileSync(new URL('word-nova.html',root),'utf8');
 assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(html));
 assert.match(html,/聞き分け · にた発音のことば/);
 assert.match(readFileSync(new URL('src/app.js',root),'utf8'),/href="\.\/word-nova.html"/);
 new vm.Script(html.match(/<script>([\s\S]*?)<\/script>/)[1]);
});
