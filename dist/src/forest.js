import {forestArrival} from './forest-life.js';
const dayKey=t=>new Date(t).toLocaleDateString('sv-SE',{timeZone:'Asia/Tokyo'});
export const ROUND_SIZE=5,AREA_ROUNDS=20;
export const decorations=[{id:'flower_small_01',name:'小さな花',rounds:1},{id:'mushroom_small_01',name:'きのこ',rounds:3},{id:'lantern_01',name:'ランタン',rounds:6}];
export function forestState(s){
 const f=s.forest||={version:1,total:0,watered:0,flowers:0,day:'',today:0,skills:[],decor:{}};
 // Older saves already grew automatically. Preserve that growth without granting old water again.
 f.watered??=Math.floor(f.total/ROUND_SIZE);return f;
}
export function recordForest(s,{skill='read',recovered=false}={},now=Date.now()){
 const f=forestState(s),day=dayKey(now);
 if(f.day!==day){f.day=day;f.today=0;f.skills=[];}
 f.total++;f.today++;if(!f.skills.includes(skill))f.skills.push(skill);if(recovered)f.flowers++;if(f.skills.length>=2)f.variety=true;
}
export function forestJourney(s,now=Date.now()){
 const f=s.forest||{total:0,watered:0,flowers:0,day:'',today:0,skills:[],decor:{}},rounds=Math.floor(f.total/ROUND_SIZE),watered=f.watered??rounds,area=Math.floor(watered/AREA_ROUNDS),local=watered%AREA_ROUNDS;
 return {...f,rounds,watered,pending:rounds-watered,area,local,stage:Math.min(4,Math.floor(local/4)),water:f.total%5,untilWater:5-f.total%5,untilTree:4-local%4,today:f.day===dayKey(now)?f.today:0,skills:f.day===dayKey(now)?f.skills:[]};
}
export function waterForest(s,expected){
 const j=forestJourney(s);if(j.pending<1||j.watered!==expected)return null;
 forestState(s).watered++;const local=j.local+1;
 const milestone=({4:'芽が苗木に育ったよ！',6:'チョウが遊びに来たよ！',8:'若木に育って、池ができたよ！',10:'池に橋がかかったよ！',12:'木が大きくなって、ウサギが遊びに来たよ！',14:'小鳥が遊びに来たよ！',16:'木に花が咲いて、リスが遊びに来たよ！',20:'この森が完成！ 隣に新しい森が広がったよ！'})[local]||'';
 const fogExpanded=local%4===0,change='3か所に花が咲いたよ！'+(fogExpanded?' 霧が晴れて、森が広がったよ。':'')+(milestone?' '+milestone:'');
 return {watered:j.watered+1,area:j.area,fromLocal:j.local,flowersAdded:3,fogExpanded,change,arrival:forestArrival(local)};
}
export function validForest(f){return !!f&&f.version===1&&['total','flowers','today'].every(k=>Number.isSafeInteger(f[k])&&f[k]>=0)&&(f.watered===undefined||Number.isSafeInteger(f.watered)&&f.watered>=0&&f.watered<=Math.floor(f.total/5))&&(f.variety===undefined||typeof f.variety==='boolean')&&f.today<=f.total&&f.flowers<=f.total&&typeof f.day==='string'&&(f.day===''||/^\d{4}-\d{2}-\d{2}$/.test(f.day))&&Array.isArray(f.skills)&&f.skills.length<=6&&f.skills.every(k=>['read','listen','recall','card','match','exam'].includes(k))&&f.decor&&typeof f.decor==='object'&&!Array.isArray(f.decor)&&Object.entries(f.decor).length<=1000&&Object.entries(f.decor).every(([key,id])=>/^\d+:\d$/.test(key)&&Number(key.split(':')[1])<6&&Number(key.split(':')[0])<=Math.floor((f.watered??Math.floor(f.total/5))/20)&&decorations.some(d=>d.id===id&&d.rounds<=Math.floor(f.total/5)));}
export function decorateForest(s,area,slot,id){const f=forestState(s),j=forestJourney(s);if(!Number.isInteger(area)||area<0||area>j.area||!Number.isInteger(slot)||slot<0||slot>=6||!decorations.some(d=>d.id===id&&d.rounds<=j.rounds))return false;f.decor[`${area}:${slot}`]=id;return true;}
