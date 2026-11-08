import {readFile,writeFile} from 'node:fs/promises';
import vm from 'node:vm';
import {questionBank} from '../grammar/content.js';
const root=new URL('../',import.meta.url),check=process.argv.includes('--check');
const read=async p=>readFile(new URL(p,root),'utf8'),cards=JSON.parse(await read('dist/data/grade5.json'));
const {D,GN,GI,audioFiles}=vm.runInNewContext(await read('dist/hunter-data.js')+';({D,GN,GI,audioFiles})');
const links=JSON.parse(await read('scripts/game-image-links.json')),supplement=[],catalog=cards.map(c=>({id:c.id,en:c.en,ja:c.ja})),hunterIds=[];
const cardFor=(en,ja,audio)=>{const same=cards.filter(c=>c.en.toLowerCase()===en.toLowerCase());return same.find(c=>audio?.startsWith(c.id+'-word-'))||same.find(c=>c.ja===ja)||(same.length===1?same[0]:null);};
function add(id,en,ja,theme,kind='word',image=null,audioPath=null){const old=supplement.find(c=>c.id===id);if(!old)supplement.push({id,en,ja,theme,kind,level:'extension',example:en,exampleJa:ja,explanation:'遊びの中で出会ったことば・表現です。',...(image?{image}:{}),...(audioPath?{audioPath}:{})});return id;}
const gameThemes=GN.map(([name],g)=>{const counts=new Map();for(const [i,d] of D.entries())if(GI[i]===g){const c=cardFor(d[0],d[2],audioFiles[i]);if(c)counts.set(c.theme,(counts.get(c.theme)||0)+1);}return [...counts].sort((a,b)=>b[1]-a[1])[0]?.[0]||name;});
for(const [i,d] of D.entries()){
 let c=cardFor(d[0],d[2],audioFiles[i]),id=c?.id;
 if(!id)id=add('game-w-'+i,d[0],d[2],gameThemes[GI[i]],'word',links[i]||null,'assets/audio/'+audioFiles[i]+'.mp3');
 hunterIds[i]=id;catalog.push({id,en:d[0],ja:d[2]});
 if(!c?.image&&!links[i]&&!d[3])throw Error('No image for '+d[0]);
}
const accent=await read('dist/accent.html'),W=vm.runInNewContext('('+accent.match(/const W=(\[[\s\S]*?\n\]);/)[1]+')'),QD=JSON.parse(accent.match(/const QD=(\[[\s\S]*?\]);/)[1]);
for(const w of W){const id=cardFor(w.w,w.jp)?.id||add('accent-w-'+w.w,w.w,w.jp,'音とリズム');catalog.push({id,en:w.w,ja:w.jp});}
for(const w of QD){const id=cardFor(w.s,w.jp)?.id||add('intonation-'+w.id,w.s,w.jp,'声の上がり下がり','phrase');catalog.push({id,en:w.s,ja:w.jp});}
const exams=JSON.parse(await read('dist/data/mock-exams.json')),examLinks={};
for(const exam of exams.exams)for(const q of exam.questions){
 const en=q.section.startsWith('l')?q.script||q.prompt:q.prompt.replace(/\(\s*\)/,q.options[q.answer]),ja=q.explanation;
 const id=add('expression-'+q.id,en,ja,'実戦テストの表現','phrase');
 const assessed=q.section==='r1'?cards.filter(c=>c.en.toLowerCase()===q.options[q.answer].toLowerCase()):[];
 examLinks[q.id]=[id,...(assessed.length===1?[assessed[0].id]:[])];
}
for(const q of questionBank){const id=add('grammar-'+q.id,q.sentence.replace(/[\[\]]/g,''),q.ja||q.hint,'ぶんぽうラボの表現','phrase');catalog.push({id,en:q.sentence.replace(/[\[\]]/g,''),ja:q.ja||q.hint});}
for(const c of supplement)catalog.push({id:c.id,en:c.en,ja:c.ja});
const unique=[...new Map(catalog.map(c=>[c.en+'\0'+c.ja+'\0'+c.id,c])).values()];
for(const [p,data] of Object.entries({'dist/data/game-supplement.json':supplement,'dist/data/game-catalog.json':unique,'dist/data/exam-evidence.json':examLinks,'dist/data/hunter-card-ids.json':hunterIds})){
 const expected=JSON.stringify(data,null,2)+'\n';if(check){if(await read(p)!==expected)throw Error(p+' is stale');}else await writeFile(new URL(p,root),expected);
}
console.log('PASS shared word catalog:',cards.length,'core +',supplement.length,'game/expression entries;',hunterIds.length,'Hunter/ABC identities');
