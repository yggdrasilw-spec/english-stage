import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {karutaContrast} from '../dist/src/karuta-contrast.js';
const cards=JSON.parse(readFileSync(new URL('../dist/data/grade5.json',import.meta.url)));
const find=en=>cards.find(c=>c.en.toLowerCase()===en);
test('every pair sharing an image has a reviewed, symmetric contrast and usable examples',()=>{
 const groups=Map.groupBy(cards.filter(c=>c.image),c=>c.image.url);let pairs=0;
 for(const group of groups.values())for(let i=0;i<group.length;i++)for(let j=i+1;j<group.length;j++){
  const a=group[i],b=group[j],ab=karutaContrast(a,b),ba=karutaContrast(b,a);pairs++;
  assert.equal(ab.reviewed,true,`${a.en} / ${b.en} needs a written explanation`);assert.equal(ab.sharedImage,true);
  assert.equal(ab.note,ba.note);assert.equal(ab.targetNote,ba.chosenNote);assert.equal(ab.chosenNote,ba.targetNote);
  for(const c of [a,b])assert(c.example&&c.exampleJa);
 }assert(pairs>0);assert.equal(find('bicycle').image.url,find('bike').image.url);
});
test('weather, plural and synonym explanations distinguish the deck senses without inventing differences',()=>{
 assert.match(karutaContrast(find('snow'),find('snowy')).note,/雪そのもの/);
 assert.match(karutaContrast(find('shoe'),find('shoes')).note,/２つ以上/);
 assert.match(karutaContrast(find('bicycle'),find('bike')).note,/どちらも「自転車」/);
 assert.match(karutaContrast(find('fall'),find('autumn')).note,/どちらも季節の「秋」/);
 assert(karutaContrast(find('cloud'),find('cloudy')));assert(karutaContrast(find('sun'),find('sunny')));
});
test('unrelated errors and identical cards do not trigger comparisons; new shared images have a fallback',()=>{
 assert.equal(karutaContrast(find('snow'),find('apple')),null);
 assert.equal(karutaContrast(find('snow'),find('snow')),null);assert.equal(karutaContrast(find('snow'),null),null);
 const a={id:'a',en:'future-a',ja:'意味A',image:{url:'shared'}},b={id:'b',en:'future-b',ja:'意味B',image:{url:'shared'}};
 const result=karutaContrast(a,b);assert.equal(result.reviewed,false);assert.match(result.targetNote,/意味A/);assert.match(result.chosenNote,/意味B/);
});
