import fs from 'node:fs';
import assert from 'node:assert/strict';
const adopted=JSON.parse(fs.readFileSync(new URL('../reports/eiken-image-audit-20261107/adopted-assets.json',import.meta.url),'utf8'));
const byId=new Map(adopted.map(a=>[a.id,a]));
export function hasReviewedImageUpdate(card){
 const asset=byId.get(card.id);
 if(!asset)return false;
 assert.equal(card.en,asset.en);assert.equal(card.ja,asset.ja);
 assert.equal(card.image.url,asset.file);assert.equal(asset.status,'accepted-context-illustration');
 return true;
}
