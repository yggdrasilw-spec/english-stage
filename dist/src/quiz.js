export const spokenWord=card=>(card.audioText||card.en).trim().toLowerCase();
// Fisher-Yates: shuffle a copy, including ties before priority sorting.
export function shuffle(items,random=Math.random){
 const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;
}
const groups=[
 'january february march april may june july august september october november december',
 'monday tuesday wednesday thursday friday saturday sunday',
 'spring summer autumn fall winter',
 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand',
 'first second third fourth fifth sixth seventh eighth ninth tenth eleventh twelfth',
 'red blue green yellow black white pink purple brown gray grey orange',
 'father mother brother sister grandfather grandmother uncle aunt cousin son daughter parent parents',
 'sunny rainy cloudy snowy windy foggy hot cold warm cool',
 'cat dog rabbit bird fish horse cow pig sheep goat chicken duck lion tiger elephant monkey bear',
 'apple banana orange grape peach pear melon watermelon strawberry pineapple lemon cherry',
 'big small large little tall short long high low wide narrow heavy light thick thin',
 'eye ear nose mouth head face hand arm leg foot feet finger tooth teeth hair',
 'breakfast lunch dinner supper',
 'morning afternoon evening night today tomorrow yesterday',
 'baseball soccer basketball tennis volleyball badminton swimming running football',
];
const families=groups.map(g=>new Set(g.split(' ')));
// These interchangeable answers must never be marked wrong in an isolated-word quiz.
const synonyms=[['big','large'],['small','little'],['fall','autumn'],['phone','telephone'],['bike','bicycle'],['tv','television'],['shop','store'],['start','begin'],['plate','dish'],['hello','hi'],['bye','goodbye'],['supper','dinner']];
const norm=s=>s.normalize('NFKC').trim().toLowerCase();
const meanings=c=>c.ja.split(/[・、,;；/／]/).map(norm);
const ambiguous=(a,b)=>norm(a.en)===norm(b.en)||meanings(a).some(x=>meanings(b).includes(x))||synonyms.some(g=>g.includes(norm(a.en))&&g.includes(norm(b.en)));
function similarity(a,b){
 a=spokenWord(a);b=spokenWord(b);const pairs=s=>new Set(Array.from({length:Math.max(0,s.length-1)},(_,i)=>s.slice(i,i+2)));
 const x=pairs(a),y=pairs(b);return 2*[...x].filter(p=>y.has(p)).length/(x.size+y.size||1);
}
export function choiceCards(card,cards,skill,random=Math.random){
 const key=skill==='recall'?'en':'ja',word=spokenWord(card);
 const family=families.filter(g=>g.has(word));
 const score=c=>family.some(g=>g.has(spokenWord(c)))?100:(c.theme===card.theme?10:0)+similarity(card,c);
 const pool=shuffle(cards.filter(c=>c.id!==card.id&&c.kind===card.kind&&!ambiguous(card,c)&&(skill!=='listen'||spokenWord(c)!==word)),random).map(c=>({c,score:score(c)})).sort((a,b)=>b.score-a.score).map(x=>x.c);
 const selected=[card],used=new Set([norm(card[key])]);
 for(const c of pool){if(used.has(norm(c[key]))||selected.some(x=>ambiguous(x,c)))continue;used.add(norm(c[key]));selected.push(c);if(selected.length===4)break;}
 return shuffle(selected,random);
}
export function choices(card,cards,skill,attempts=0){return choiceCards(card,cards,skill).map(c=>({id:c.id,label:c[skill==='recall'?'en':'ja']}));}
export function enqueueRetry(s,task){
 const key=task.id+':'+task.skill;
 if((s.tries[key]||0)>=3||s.tasks.slice(s.index+1).some(t=>t.id===task.id&&t.skill===task.skill))return;
 let insert=s.tasks.length,otherQuestions=0;
 for(let i=s.index+1;i<s.tasks.length;i++)if(!s.tasks[i].intro&&s.tasks[i].id!==task.id&&++otherQuestions===2){insert=i+1;break;}
 s.tasks.splice(insert,0,{id:task.id,skill:task.skill});
}
