import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>JSON.parse(fs.readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const cards=read('dist/data/grade5.json');
const assets=read('reports/eiken-image-audit-20261107/adopted-assets.json');
test('phrases and audited vocabulary use their reviewed exact image bytes',()=>{
 assert.equal(assets.length,216);
 assert.equal(assets.filter(a=>a.kind==='word').length,61);
 assert.equal(assets.filter(a=>a.kind==='phrase').length,155);
 for(const asset of assets){
  const c=cards.find(c=>c.id===asset.id);
  assert.equal(c.en,asset.en);assert.equal(c.ja,asset.ja);
  assert.equal(c.image.url,asset.file);
  const data=fs.readFileSync(new URL('../dist/'+asset.file,import.meta.url));
  assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256);
 }
 assert.ok(cards.every(c=>c.image?.url));
});
test('singular objects and distinct actions no longer share misleading pictures',()=>{
 const image=en=>cards.find(c=>c.en===en).image.url;
 for(const [a,b] of [['shoe','shoes'],['sock','shoe'],['watch','look'],['fly','jump'],['finger','hand'],['child','children'],['take a bath','swim'],['go to bed','sleep'],['up','down'],['sugar','salt']])assert.notEqual(image(a),image(b),a+' / '+b);
});
