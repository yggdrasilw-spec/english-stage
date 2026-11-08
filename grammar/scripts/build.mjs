import {mkdir,readFile,writeFile,readdir} from 'node:fs/promises';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
const source=new URL('../',import.meta.url);
export async function releaseFiles(){
 const files=new Map(),imports={},modules=['app.js','content.js','core.js','ai-prompt.js','ai-view.js'];
 for(const file of ['index.html','style.css',...modules])files.set(file,(await readFile(new URL(file,source),'utf8')).replace(/\r\n/g,'\n'));
 const digest=text=>createHash('sha256').update(text).digest('hex').slice(0,16);
 const shared=new URL('../dist/',source);
 for(const file of (await readdir(new URL('src/',shared))).filter(n=>n.endsWith('.js')))imports['../src/'+file]='../src/'+file+'?v='+digest((await readFile(new URL('src/'+file,shared),'utf8')).replace(/\r\n/g,'\n'));
 const bridgeHash=digest(await readFile(new URL('game-bridge.js',shared),'utf8'));
 files.set('index.html',files.get('index.html').replace('../game-bridge.js','../game-bridge.js?v='+bridgeHash));
 for(const file of modules)imports['./'+file]='./'+file+'?v='+digest(files.get(file));
 files.set('index.html',files.get('index.html').replace(/style\.css\?v=[^" ]+/,`style.css?v=${digest(files.get('style.css'))}`).replace(/<script type="module" src="app\.js[^\"]*"><\/script>/,`<script type="importmap">${JSON.stringify({imports})}</script><script type="module">import './app.js';</script>`));
 return files;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const dist=process.argv[2]?pathToFileURL(resolve(process.argv[2])+sep):new URL('dist/',source);await mkdir(dist,{recursive:true});
 for(const [file,text]of await releaseFiles())await writeFile(new URL(file,dist),text);
 console.log(`Built cache-versioned grammar release: ${fileURLToPath(dist)}`);
}
