// Build-time only. No account information is written into output.
import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import crypto from 'node:crypto';
const exec=promisify(execFile),root=new URL('../',import.meta.url);
const data=JSON.parse(await fs.readFile(new URL('dist/data/mock-exams.json',root),'utf8'));
const escape=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const jobs=data.exams.flatMap(ex=>ex.questions.filter(q=>q.script).map(q=>{
 const parts=q.script.split(/([AB]:)/);let voice='en-US-Neural2-F';
 const ssml='<speak>'+parts.map(p=>{if(p==='A:'){voice='en-US-Neural2-D';return '';}if(p==='B:'){voice='en-US-Neural2-F';return '';}if(!p.trim())return '';return '<voice name="'+voice+'">'+escape(p.trim()).replace(/\n/g,'<break time="900ms"/>')+'</voice><break time="600ms"/>';}).join('')+'<break time="3000ms"/></speak>';
 const body={input:{ssml},voice:{languageCode:'en-US',name:'en-US-Neural2-F'},audioConfig:{audioEncoding:'MP3',speakingRate:.88}};
 const hash=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0,16);
 q.audio=`assets/audio/exam-${q.id}-${hash}.mp3`;
 return {q,body};
}));
const count=jobs.reduce((n,x)=>n+x.q.script.length,0);if(count>18000)throw Error('Character budget exceeded');
console.log(JSON.stringify({questions:jobs.length,characters:count}));
if(!process.argv.includes('--generate'))process.exit(0);
const project='tts-test-513311';
const {stdout}=await exec('powershell.exe',['-NoProfile','-Command','gcloud.cmd auth print-access-token'],{windowsHide:true,maxBuffer:1024*1024});
const headers={Authorization:'Bearer '+stdout.trim(),'x-goog-user-project':project,'Content-Type':'application/json'};
let index=0;
async function worker(){while(index<jobs.length){const {q,body}=jobs[index++],path=new URL('dist/'+q.audio,root);try{if((await fs.stat(path)).size>100)continue;}catch{}
 const r=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{method:'POST',headers,body:JSON.stringify(body)});
 if(!r.ok){const err=await r.json();throw Error('Audio generation failed: HTTP '+r.status+' '+q.id+' '+err.error?.message);}
 const d=await r.json();if(!d.audioContent)throw Error('No audio');await fs.writeFile(path,Buffer.from(d.audioContent,'base64'));console.log('Created '+q.id);
}}
const results=await Promise.allSettled([worker(),worker(),worker()]);const failed=results.find(x=>x.status==='rejected');if(failed)throw failed.reason;
await fs.writeFile(new URL('dist/data/mock-exams.json',root),JSON.stringify(data,null,2)+'\n');
console.log('Saved all 75 question audio references.');
