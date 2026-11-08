// Build-time only; uses the existing English Stage TTS project, never browser credentials.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {passages} from '../dist/src/grade4-content.js';
const root=new URL('../',import.meta.url),jobs=[];
for(const p of passages.filter(p=>p.skill==='listening'))for(const [speed,speakingRate]of [['normal',.95],['slow',.75]]){
 const text=p.sentences.join(' '),body={input:{text},voice:{languageCode:'en-US',name:'en-US-Neural2-F'},audioConfig:{audioEncoding:'MP3',speakingRate}};
 const hash=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0,16);
 jobs.push({passageId:p.id,speed,text,hash,path:`assets/audio/${p.id}-${speed}-${hash}.mp3`,body});
}
const pending=[];
for(const j of jobs){try{if((await fs.stat(new URL('dist/'+j.path,root))).size>100)continue;}catch{}pending.push(j);}
const chars=pending.reduce((n,j)=>n+j.text.length,0);if(chars>5000)throw Error('Character budget exceeded');
console.log(JSON.stringify({files:jobs.length,newFiles:pending.length,characters:chars,mode:process.argv.includes('--generate')?'generate':'dry-run'}));
if(!process.argv.includes('--generate'))process.exit(0);
const {stdout}=await promisify(execFile)('powershell.exe',['-NoProfile','-Command','gcloud.cmd auth print-access-token'],{windowsHide:true,maxBuffer:1024*1024});
const headers={Authorization:'Bearer '+stdout.trim(),'x-goog-user-project':'tts-test-513311','Content-Type':'application/json'};
await fs.mkdir(new URL('dist/assets/audio/',root),{recursive:true});
for(const j of jobs){const out=new URL('dist/'+j.path,root);try{if((await fs.stat(out)).size>100)continue;}catch{}
 const r=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{method:'POST',headers,body:JSON.stringify(j.body)});
 if(!r.ok)throw Error('TTS failed: '+r.status+' '+j.passageId);
 const d=await r.json();if(!d.audioContent)throw Error('Missing audio');await fs.writeFile(out,Buffer.from(d.audioContent,'base64'));console.log('Created '+j.passageId+'/'+j.speed);
}
await fs.writeFile(new URL('dist/data/grade4-audio.json',root),JSON.stringify({version:1,provider:'Google Cloud Text-to-Speech',voice:'en-US-Neural2-F',review:'合成音声・全件の人による試聴は未実施',files:jobs.map(({body,...j})=>j)},null,2)+'\n');
