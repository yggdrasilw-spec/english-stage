import {dayKey} from './scheduler.js';
export const ROUND_SIZE=5,AREA_ROUNDS=20;
export const decorations=[{id:'flower_small_01',name:'小さな花',rounds:1},{id:'mushroom_small_01',name:'きのこ',rounds:3},{id:'lantern_01',name:'ランタン',rounds:6}];
export function forestState(s){return s.forest||={version:1,total:0,flowers:0,day:'',today:0,skills:[],decor:{}};}
export function recordForest(s,{skill='read',recovered=false}={},now=Date.now()){
 const f=forestState(s),before=Math.floor(f.total/5),day=dayKey(now);
 if(f.day!==day){f.day=day;f.today=0;f.skills=[];}
 f.total++;f.today++;if(!f.skills.includes(skill))f.skills.push(skill);if(recovered)f.flowers++;if(f.skills.length>=2)f.variety=true;
 const gained=Math.floor(f.total/5)-before;s.stars+=gained*3;
}
export function forestJourney(s,now=Date.now()){
 const f=s.forest||{total:0,flowers:0,day:'',today:0,skills:[],decor:{}},rounds=Math.floor(f.total/5),area=Math.floor(rounds/20),local=rounds%20;
 return {...f,rounds,area,local,stage:Math.min(4,Math.floor(local/4)),water:f.total%5,untilWater:5-f.total%5,untilTree:(4-local%4)*5-f.total%5,today:f.day===dayKey(now)?f.today:0,skills:f.day===dayKey(now)?f.skills:[]};
}
export function validForest(f){return !!f&&f.version===1&&['total','flowers','today'].every(k=>Number.isSafeInteger(f[k])&&f[k]>=0)&&(f.variety===undefined||typeof f.variety==='boolean')&&f.today<=f.total&&f.flowers<=f.total&&typeof f.day==='string'&&(f.day===''||/^\d{4}-\d{2}-\d{2}$/.test(f.day))&&Array.isArray(f.skills)&&f.skills.length<=6&&f.skills.every(k=>['read','listen','recall','card','match','exam'].includes(k))&&f.decor&&typeof f.decor==='object'&&!Array.isArray(f.decor)&&Object.entries(f.decor).length<=1000&&Object.entries(f.decor).every(([key,id])=>/^\d+:\d$/.test(key)&&Number(key.split(':')[1])<6&&Number(key.split(':')[0])<=Math.floor(f.total/100)&&decorations.some(d=>d.id===id&&d.rounds<=Math.floor(f.total/5)));}
export function decorateForest(s,area,slot,id){const f=forestState(s),j=forestJourney(s);if(!Number.isInteger(area)||area<0||area>j.area||!Number.isInteger(slot)||slot<0||slot>=6||!decorations.some(d=>d.id===id&&d.rounds<=j.rounds))return false;f.decor[`${area}:${slot}`]=id;return true;}
