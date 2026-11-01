import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const cards=read('dist/data/grade5.json');
const {links}=read('scripts/shiritori-image-links.json');
test('reviewed image links cover the published cards with matching senses and provenance',()=>{
 const adoptions=read('IMAGE_ADOPTIONS.json');
 assert.equal(adoptions.length,Object.keys(links).length);
 for(const [id,link] of Object.entries(links)){
  const c=cards.find(c=>c.id===id);
  assert.equal(c.en,link.english);assert.equal(c.ja,link.japanese);
  assert.equal(c.image.url,link.localFile||'https://shiritori-images.yggdrasil-learning.workers.dev/assets/shiritori/'+link.file);
  assert.ok(c.image.sourceReview);assert.equal(c.image.sourceMeaning,link.sourceMeaning);
  assert.equal(adoptions.find(a=>a.id===id).url,c.image.url);
 }
});
test('homographs do not leak a different meaning into vocabulary cards',()=>{
 const expected={orange:'オレンジ',dress:'ワンピース',yes:'肯定',give:'渡す',month:'月',yen:'円',grape:'ぶどうの粒'};
 for(const [en,word] of Object.entries(expected)){const c=cards.find(c=>c.en===en);assert.equal(c.image.sourceWord,word);assert.ok(c.image.url.includes('eiken-20261101'));}
 const wrong=['wave7-word-970.png','wave10-word-3616.png'];
 for(const en of ['orange','corner'])assert.ok(!wrong.some(file=>cards.find(c=>c.en===en).image.url.endsWith(file)));
 for(const [en,word] of [['frog','カエル'],['bee','ハチ'],['onion','タマネギ'],['moon','月']]) assert.equal(cards.find(c=>c.en===en).image.sourceWord,word);
});
test('every unillustrated word has a dictionary and image follow-up entry',()=>{
 const missing=read('reports/shiritori-image-missing.json');
 const ids=cards.filter(c=>c.kind==='word'&&!c.image).map(c=>c.id).sort();
 assert.deepEqual(missing.map(c=>c.id).sort(),ids);
 for(const c of missing){assert.ok(c.reason);assert.ok(c.action);assert.ok(Array.isArray(c.dictionaryCandidates));}
});
