import test from 'node:test';
import {karutaContrast} from '../dist/src/karuta-contrast.js';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const cards=read('dist/data/grade5.json'),by=new Map(cards.map(c=>[c.en,c]));

test('noun examples teach contexts, questions, negation, requests and grammar without a repeated placeholder',()=>{
 const reviewed=fs.readFileSync(new URL('../scripts/reviewed-examples.txt',import.meta.url),'utf8').trim().split(/\r?\n/).map(row=>row.split('|')[0]),examples=reviewed.map(en=>by.get(en).example);
 assert.equal(reviewed.length,153);assert.equal(new Set(examples).size,153);
 assert(!examples.some(s=>/^Look at the /i.test(s)));
 for(const pattern of [/^Do you /,/^Does /,/^Is /,/^Whose /,/^Where /,/^Who /,/^What time /,/^How many /,/^How much /,/^Can /,/^Let's /,/^Please /,/don't /,/doesn't /,/ is \w+ing /,/ has /,/^There are /,/^There is /])assert(examples.some(s=>pattern.test(s)),String(pattern));
 for(const en of reviewed){const c=by.get(en);assert.equal(c.exampleAudioText,c.example);assert(c.exampleJa);assert(c.grammarPoints.length);}
});
test('tooth and teeth remain different selectable meanings with distinct counted diagrams',()=>{
 const a=by.get('tooth'),b=by.get('teeth');assert.equal(a.ja,'歯（1本）');assert.equal(b.ja,'歯（2本以上）');
 assert.match(a.example,/one tooth/);assert.match(b.example,/my teeth/);
 for(const c of [a,b]){assert.match(c.explanation,/tooth/);assert.match(c.explanation,/teeth/);assert.match(c.image.url,/\.svg$/);}
 assert.notEqual(a.image.url,b.image.url);
 assert.match(karutaContrast(a,b).note,/形が変わる/);
 const svg=c=>fs.readFileSync(new URL('../dist/'+c.image.url,import.meta.url),'utf8');
 assert.equal((svg(a).match(/<path /g)||[]).length,1);assert.equal((svg(b).match(/<path /g)||[]).length,3);
});
