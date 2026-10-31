import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initial,validateBackup} from '../dist/src/storage.js';
import {journey,claimVisit,settleQuests,daysBefore} from '../dist/src/motivation.js';
const t=new Date(2026,9,31,12).getTime();
const answer=(s,id,skill='read',at=t,quality='wrong')=>s.history.push({id,skill,at,quality});
test('XP rewards distinct daily practice, including mistakes; self reports and visits stay separate',()=>{
 const s=initial();claimVisit(s,t);answer(s,'w');answer(s,'w');answer(s,'w','self',t,'self');
 assert.equal(journey(s,t).xp,10);answer(s,'w','listen');assert.equal(journey(s,t).xp,20);
 answer(s,'w','read',t+86400000);assert.equal(journey(s,t+86400000).xp,30);
});
test('level boundary is exact and attempts keep XP after guess correction',()=>{
 const s=initial();for(let i=0;i<9;i++)answer(s,'w'+i);
 assert.equal(journey(s,t).level,1);assert.equal(journey(s,t).next,10);
 answer(s,'w9','read',t,'guess');assert.equal(journey(s,t).level,2);assert.equal(journey(s,t).inLevel,0);
});
test('visit claim is idempotent, seven visits award ten stars, skipped days do not erase stamps',()=>{
 const s=initial();for(let i=0;i<7;i++){const at=t+i*2*86400000;assert.equal(claimVisit(s,at),i===6?10:3);assert.equal(claimVisit(s,at),0);}
 assert.equal(s.stars,28);assert.equal(journey(s,t).xp,0);assert.equal(journey(s,t).days.size,0);
});
test('quests award once across reloads; repeat answers do not complete five-task quest',()=>{
 const s=initial();for(let i=0;i<5;i++)answer(s,'w');settleQuests(s,t);settleQuests(s,t);
 assert.equal(s.stars,2);for(let i=1;i<5;i++)answer(s,'w'+i);answer(s,'w','listen');answer(s,'w','recall');
 settleQuests(s,t);assert.equal(s.stars,10);settleQuests(structuredClone(s),t);assert.equal(s.stars,10);
});
test('streak allows today pending, resets after a gap, keeps historical badge',()=>{
 const s=initial();for(let i=1;i<=3;i++)answer(s,'w','read',t-i*86400000);
 assert.equal(journey(s,t).streak,3);assert.equal(journey(s,t).week.at(-1).done,false);
 assert.equal(journey(s,t+86400000).streak,0);assert.equal(journey(s,t+86400000).badges[1].unlocked,true);
 assert.equal(daysBefore(new Date(2026,10,1,0,1),1),'2026-10-31');
});
test('reward tokens survive backup and old backups derive progress without migration',()=>{
 const s=initial();answer(s,'w');claimVisit(s,t);settleQuests(s,t);
 const restored=validateBackup({app:'english-stage',version:1,state:s},new Set(['w']));
 assert.equal(claimVisit(restored,t),0);settleQuests(restored,t);assert.equal(restored.stars,5);
 assert.equal(journey(restored,t).xp,10);assert.equal(journey(initial(),t).level,1);
});
