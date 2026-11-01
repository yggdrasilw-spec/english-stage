import {priorityData} from './vocabulary-priority-data.js';

export const priorityNote='参考教材のA/B分類です。英検公式の順位ではありません。同じランク内はPDFの掲載順です。';
export function vocabularyPriority(card){return priorityData[card.id]||null;}
export function priorityLabel(card){return ({A:'A · 先に覚える',B:'B · さらに広げる'})[vocabularyPriority(card)?.rank]||'その他の収録語';}
export function sortVocabulary(cards,order='importance'){
 const list=[...cards];
 if(order==='alphabetical')return list.sort((a,b)=>a.en.localeCompare(b.en,'en',{sensitivity:'base'})||a.id.localeCompare(b.id));
 if(order!=='importance')return list;
 return list.sort((a,b)=>{
  const x=vocabularyPriority(a),y=vocabularyPriority(b);
  return ({A:0,B:1}[x?.rank]??2)-({A:0,B:1}[y?.rank]??2)||(x?.page??999)-(y?.page??999)||(x?.number??999)-(y?.number??999);
 });
}
