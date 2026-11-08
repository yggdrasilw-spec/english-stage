import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const source=new URL('../prefixes/',import.meta.url),dist=new URL('../dist/prefixes/',import.meta.url);
export async function releaseFiles(){
 const files=new Map();
 for(const n of ['index.html','app.js','audio.mjs','core.mjs','style.css','sw.js'])files.set(n,(await readFile(new URL(n,source),'utf8')).replace(/\r\n/g,'\n'));
 for(const dir of ['data','docs'])for(const n of (await readdir(new URL(dir+'/',source))).sort())if(/\.(json|md)$/.test(n))files.set(dir+'/'+n,(await readFile(new URL(dir+'/'+n,source),'utf8')).replace(/\r\n/g,'\n'));
 // A changed asset always produces a new cache, including future data-only edits.
 const digest=createHash('sha256');for(const [name,text]of files)digest.update(name).update(text);
 files.set('sw.js',files.get('sw.js').replace(/const CACHE='[^']+'/,`const CACHE='english-prefix-lab-${digest.digest('hex').slice(0,16)}'`));
 return files;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 for(const [name,text]of await releaseFiles()){const target=new URL(name,dist);await mkdir(new URL('./',target),{recursive:true});await writeFile(target,text);}
 console.log('Built prefix release: '+fileURLToPath(dist));
}
