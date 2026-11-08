import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
const root=new URL('../',import.meta.url),links=JSON.parse(await readFile(new URL('scripts/game-image-links.json',root),'utf8'));
const entries=Object.entries(links),results=[];let next=0;
await Promise.all(Array.from({length:6},async()=>{while(next<entries.length){const [id,link]=entries[next++];try{if(link.url.startsWith('https:')){const r=await fetch(link.url,{method:'HEAD',signal:AbortSignal.timeout(15000)});if(!r.ok||!r.headers.get('content-type')?.startsWith('image/'))throw Error('HTTP '+r.status);results.push({id,url:link.url,status:r.status,type:r.headers.get('content-type')});}else{await access(new URL('dist/'+link.url,root));results.push({id,url:link.url,status:'local'});}}catch(e){results.push({id,url:link.url,error:e.message});}}}));
results.sort((a,b)=>Number(a.id)-Number(b.id));await mkdir(new URL('reports/improvements/',root),{recursive:true});await writeFile(new URL('reports/improvements/image-readback.json',root),JSON.stringify(results,null,2)+'\n');
if(results.some(r=>r.error))throw Error('Image failures: '+JSON.stringify(results.filter(r=>r.error)));
console.log('PASS',results.length,'new image links:',results.filter(r=>r.status===200).length,'public image responses,',results.filter(r=>r.status==='local').length,'local illustrations');
