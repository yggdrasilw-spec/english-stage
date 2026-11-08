import * as storage from './storage.js';
import {recordEvidence} from './evidence.js';
let ready,catalog,snapshot;
async function init(){snapshot=await storage.open();const r=await fetch(new URL('../data/game-catalog.json',import.meta.url));if(!r.ok)throw Error('ことば帳を読み込めません');catalog=await r.json();}
export const loadGameLearning=()=>ready||=init().catch(e=>{ready=null;throw e;});
export function sharedPriority(en,ja,skill){
 const c=catalog?.find(c=>c.en.toLowerCase()===String(en).toLowerCase()&&c.ja===ja);if(!c)return 1;
 const ps=snapshot?.progress?.[c.id]||{},p=ps[skill];
 if(['read','listen','recall'].every(k=>ps[k]?.retired&&ps[k].policy===2)||p?.retired&&p.policy===2)return Infinity;
 return p?.due<=Date.now()||['wrong','guess'].includes(p?.lastQuality)?0:!p?1:2;
}
export async function saveGameEvidence(event){
 await (ready||=init().catch(e=>{ready=null;throw e;}));
 const matches=catalog.filter(c=>event.id?c.id===event.id:c.en.toLowerCase()===String(event.en).toLowerCase()&&c.ja===event.ja);
 if(matches.length!==1)throw Error('語義を確認できないため学習記録を保存できません');
 const run=async()=>{const s=await storage.read();recordEvidence(s,{...event,id:matches[0].id});await storage.write(s);snapshot=s;const ch=typeof BroadcastChannel==='function'?new BroadcastChannel('english-stage'):null;ch?.postMessage('saved');ch?.close();};
 if(navigator.locks)await navigator.locks.request('english-stage-write',run);else await run();
}
