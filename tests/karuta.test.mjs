import {test} from 'node:test';
import assert from 'node:assert/strict';
import {karutaPool,createKaruta,takeKaruta,validKaruta} from '../dist/src/karuta-session.js';
import {initial,validateBackup} from '../dist/src/storage.js';
const cards=Array.from({length:50},(_,i)=>({id:'w'+i,en:'word'+i,ja:'意味'+i,theme:i<10?'動物':'食べ物'}));
test('category, configurable count and unique shuffled board/order',()=>{
 for(const n of [4,12,20,40]){const k=createKaruta(cards,'all',n);assert.equal(k.ids.length,n);assert.equal(new Set(k.ids).size,n);assert.deepEqual([...k.ids].sort(),[...k.order].sort());}
 assert.equal(createKaruta(cards,'動物',20).ids.length,10);
 assert.equal(createKaruta(cards,'なし',20).ids.length,0);
 assert.equal(createKaruta(cards,'all',999).ids.length,40);
});
test('ambiguous meanings and identical spoken English never compete',()=>{
 const d=[cards[0],{...cards[1],en:cards[0].en},{...cards[2],ja:cards[0].ja}];
 assert.equal(karutaPool(d).length,1);assert.equal(karutaPool(d,'all','english').length,2);
});
test('wrong taps keep the target; collected positions and duplicate taps are stable',()=>{
 const k=createKaruta(cards,'動物',4),board=[...k.ids],first=k.order[0];
 assert.equal(takeKaruta(k,k.order[1]),false);assert.equal(k.index,0);assert.equal(k.mistakes,1);assert.deepEqual(k.missed,[first]);
 assert.equal(takeKaruta(k,first),true);assert.equal(takeKaruta(k,first),false);assert.equal(k.index,1);assert.equal(k.mistakes,1);
 for(const id of k.order.slice(1))assert.equal(takeKaruta(k,id),true);
 assert.equal(takeKaruta(k,first),false);assert.deepEqual(k.ids,board);
});
test('backup resumes a valid game and rejects malformed or foreign IDs',()=>{
 const ids=new Set(cards.map(c=>c.id)),state=initial();state.karuta=createKaruta(cards);takeKaruta(state.karuta,state.karuta.order[0]);
 const backup=()=>({app:'english-stage',version:1,state:structuredClone(state)});
 assert.equal(validateBackup(backup(),ids).karuta.index,1);
 for(const change of [k=>k.order.reverse().push('foreign'),k=>k.ids.push(k.ids[0]),k=>k.index=-1,k=>k.mistakes=Infinity,k=>k.face='bad']){const b=backup();change(b.state.karuta);assert.equal(validKaruta(b.state.karuta,ids),false);assert.throws(()=>validateBackup(b,ids));}
 assert(validateBackup({app:'english-stage',version:1,state:initial()},ids));
});
