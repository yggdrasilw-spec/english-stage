// Build-time only. No account information is written into output.
import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {buildExamAudio} from './exam-audio-plan.mjs';
const exec=promisify(execFile),root=new URL('../',import.meta.url);
const data=JSON.parse(await fs.readFile(new URL('dist/data/mock-exams.json',root),'utf8'));
const jobs=data.exams.flatMap(ex=>ex.questions.filter(q=>q.script).map(q=>{
 const plan=buildExamAudio(q);q.audio=plan.path;return {q,body:plan.body};
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
console.log('Saved all '+jobs.length+' question audio references.');
