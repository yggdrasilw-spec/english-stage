// Build-time only. Credentials and Google API calls never go into the browser app.
import fs from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import crypto from 'node:crypto';
const exec=promisify(execFile),root=new URL('../',import.meta.url);
const args=process.argv.slice(2),value=k=>args[args.indexOf(k)+1];
const execute=args.includes('--generate'),sample=args.includes('--sample');
const project=args.includes('--project')?value('--project'):process.env.GOOGLE_CLOUD_PROJECT;
const voice=args.includes('--voice')?value('--voice'):'en-US-Neural2-F';
if(!/^en-US-Neural2-[A-J]$/.test(voice))throw Error('Specify a supported en-US-Neural2 voice.');
let cards=JSON.parse(await fs.readFile(new URL('dist/data/grade5.json',root),'utf8'));if(sample)cards=cards.slice(0,3);
const overrides=JSON.parse(await fs.readFile(new URL('audio-voice-overrides.json',root),'utf8'));
const jobs=[];
for(const c of cards)for(const [part,text] of [['word',c.audioText||c.en],['example',c.example]])for(const [speed,speakingRate] of [['normal',.95],['slow',.75]]){
 const jobVoice=voice===overrides.baseVoice?(overrides.entries.find(o=>o.id===c.id&&o.part===part)?.voice||voice):voice;
 const body={input:{text},voice:{languageCode:'en-US',name:jobVoice},audioConfig:{audioEncoding:'MP3',speakingRate}};
 const hash=crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex').slice(0,16);
 jobs.push({id:c.id,part,speed,text,body,hash,path:`assets/audio/${c.id}-${part}-${speed}-${hash}.mp3`});
}
const count=jobs.reduce((n,j)=>n+j.text.length,0);
console.log(JSON.stringify({mode:execute?'generate':'dry-run',voice,project:project||'not selected',files:jobs.length,characters:count,estimatedUSDWithoutFreeTier:Number((count*16/1e6).toFixed(4)),note:'Estimate excludes other usage and retries; free-tier balance is not known.'},null,2));
if(!execute){console.log('No API calls made. Use --project ID --sample --generate for a sample.');process.exit(0);}
if(!project||!/^[a-z][a-z0-9-]{4,61}[a-z0-9]$/.test(project))throw Error('A valid --project is required.');
const maxChars=Number(args.includes('--max-chars')?value('--max-chars'):45000);
if(!Number.isFinite(maxChars)||count>maxChars)throw Error('Character budget exceeded; generation stopped before API use.');
const tokenFromGcloud=async()=>{
 const cmd=process.platform==='win32'?'powershell.exe':'gcloud';
 const argv=process.platform==='win32'?['-NoProfile','-Command','gcloud auth print-access-token']:['auth','print-access-token'];
 const {stdout}=await exec(cmd,argv,{windowsHide:true,maxBuffer:1024*1024});return stdout.trim();
};
const token=process.env.GOOGLE_OAUTH_ACCESS_TOKEN||await tokenFromGcloud();
// Check that this exact voice exists before producing any audio.
const headers={Authorization:`Bearer ${token}`,'x-goog-user-project':project,'Content-Type':'application/json'};
const list=await fetch('https://texttospeech.googleapis.com/v1/voices?languageCode=en-US',{headers});
if(!list.ok){const problem=await list.json().catch(()=>({}));console.error(JSON.stringify({http:list.status,message:problem.error?.message,reasons:problem.error?.details?.map(d=>d.reason).filter(Boolean)},null,2));process.exit(1);}
if(!(await list.json()).voices?.some(v=>v.name===voice))throw Error('Requested voice unavailable.');
await fs.mkdir(new URL('dist/assets/audio/',root),{recursive:true});
let manifest={provider:'Google Cloud Text-to-Speech',voice,languageCode:'en-US',generatedAt:new Date().toISOString(),review:'未試聴',terms:'https://cloud.google.com/terms/',files:[]};
let nextJob=0;
async function worker(){while(nextJob<jobs.length){const job=jobs[nextJob++];
 const out=new URL('dist/'+job.path,root);let cached=false;
 try{const stat=await fs.stat(out);cached=stat.size>100;}catch{}
 if(!cached){
  const response=await fetch('https://texttospeech.googleapis.com/v1/text:synthesize',{method:'POST',headers,body:JSON.stringify(job.body)});
  if(!response.ok)throw Error(`Synthesis stopped at ${job.id}/${job.part}/${job.speed}: HTTP ${response.status}. Existing files are retained.`);
  const data=await response.json();if(typeof data.audioContent!=='string')throw Error('Audio missing in API response.');
  const bytes=Buffer.from(data.audioContent,'base64');if(bytes.length<100)throw Error('Audio too short.');await fs.writeFile(out,bytes);
 }
 manifest.files.push({id:job.id,part:job.part,speed:job.speed,text:job.text,path:job.path,hash:job.hash,...(job.body.voice.name!==voice?{voice:job.body.voice.name}:{})});
 console.log(`${job.id}/${job.part}/${job.speed}: ${cached?'cached':'created'}`);
 // Publish the complete credential-free manifest only after all workers succeed.
}}
const results=await Promise.allSettled(Array.from({length:4},worker));
const failed=results.find(r=>r.status==='rejected');if(failed)throw failed.reason;
const order=new Map(jobs.map((j,i)=>[j.path,i]));manifest.files.sort((a,b)=>order.get(a.path)-order.get(b.path));
await fs.writeFile(new URL(sample?'dist/data/audio-sample.json':'dist/data/audio-manifest.json',root),JSON.stringify(manifest,null,2));
console.log('Generation complete. Listen and review before publishing.');
