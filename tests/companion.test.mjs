import {test} from 'node:test';
import assert from 'node:assert/strict';
import {look,dress,validCompanion} from '../dist/src/companion.js';
import {initial,validateBackup} from '../dist/src/storage.js';
import {claimVisit,journey,settleQuests} from '../dist/src/motivation.js';
const backup=s=>validateBackup({app:'english-stage',version:1,state:structuredClone(s)},new Set(['apple']));
test('legacy saves get a free default without altering history or stars',()=>{
 const s=backup(initial());assert.equal(look(s).color,'blue');assert.equal(look(s).outfit,'none');assert.equal(s.stars,0);assert.equal(s.companion,undefined);
 dress(s,'outfit','none');assert(validCompanion(s.companion));assert.equal(s.stars,0);
});
test('insufficient stars and unknown items never spend or equip; repeated purchases only spend once',()=>{
 const s=initial();s.stars=5;dress(s,'outfit','cap');assert.equal(s.companion,undefined);assert.equal(s.stars,5);
 dress(s,'__proto__','cap');dress(s,'color','unknown');assert.equal(s.stars,5);
 s.stars=12;dress(s,'outfit','cap');dress(s,'outfit','cap');assert.equal(s.stars,6);assert.equal(s.companion.outfit,'cap');
 dress(s,'color','pink');assert.equal(s.stars,0);assert.equal(s.companion.color,'pink');
 dress(s,'outfit','none');dress(s,'outfit','cap');assert.equal(s.stars,0);assert.equal(journey(s).xp,0);assert.deepEqual(s.history,[]);
});
test('inventory persists in backups and foreign, duplicate or unowned equipped items are rejected',()=>{
 const s=initial();s.stars=12;dress(s,'color','mint');dress(s,'outfit','glasses');assert.deepEqual(backup(s).companion,s.companion);
 for(const change of [c=>c.outfit='wizard',c=>c.owned.push('outfit:unknown'),c=>c.owned.push('color:blue'),c=>c.owned=null,c=>c.color='<script>']){
  const bad=structuredClone(s);change(bad.companion);assert.throws(()=>backup(bad),/着せ替え/);
 }
});
test('visits cross month boundaries, survive gaps and backup reload, and never create study XP',()=>{
 let s=initial();for(let i=0;i<8;i++){
  const at=new Date(2026,9,30+i*3,23,59).getTime();
  assert.equal(claimVisit(s,at),i===6?10:3);s=backup(s);assert.equal(claimVisit(s,at),0);
 }
 assert.equal(s.stars,31);assert.equal(journey(s).xp,0);assert.deepEqual(s.history,[]);
});
test('practice and visit stars share wallet but spending cannot re-award a quest',()=>{
 const s=initial(),at=Date.now();claimVisit(s,at);s.history.push({id:'apple',skill:'read',quality:'wrong',at});settleQuests(s,at);
 assert.equal(s.stars,5);claimVisit(s,at+86400000);dress(s,'outfit','glasses');assert.equal(s.stars,2);
 settleQuests(s,at);assert.equal(s.stars,2);assert.equal(journey(s,at).xp,10);
});
