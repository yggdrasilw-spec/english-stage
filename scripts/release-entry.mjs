import './sync-game-catalog.mjs';
import './sync-abc-hand-images.mjs';
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../dist/',import.meta.url);
const imports={};
for(const name of (await readdir(new URL('src/',root))).filter(n=>n.endsWith('.js')).sort()){
 const digest=createHash('sha256').update((await readFile(new URL('src/'+name,root),'utf8')).replace(/\r\n/g,'\n')).digest('hex').slice(0,16);
 imports['./src/'+name]='./src/'+name+'?v='+digest;
}
// Standalone games share the same content-versioned modules as the main app.
const bridgeHash=createHash('sha256').update((await readFile(new URL('game-bridge.js',root),'utf8')).replace(/\r\n/g,'\n')).digest('hex').slice(0,16);
for(const name of ['abc-hand.html','hunter.html','word-nova.html','accent.html']){
 const url=new URL(name,root),original=(await readFile(url,'utf8')).replace(/\r\n/g,'\n'),prefix=name.startsWith('grammar/')?'../':'./';
 const gameImports=Object.fromEntries(Object.entries(imports).map(([key,value])=>[prefix+key.slice(2),prefix+value.slice(2)]));
 const tag=`<script data-game-importmap type="importmap">${JSON.stringify({imports:gameImports})}</script><script src="${prefix}game-bridge.js?v=${bridgeHash}"></script>`;
 let next=original.replace(/<script data-game-importmap type="importmap">[\s\S]*?<\/script>/,'').replace(/<script src="(?:\.\.\/|\.\/)?game-bridge\.js(?:\?v=[^"]+)?"><\/script>/,tag);
 if(next===original&&!original.includes(tag))throw Error('Game bridge missing: '+name);
 if(process.argv.includes('--check')){if(next!==original)throw Error('Game entry stale: '+name);}else await writeFile(url,next);
}
for(const name of ['content.js','core.js']){
 const digest=createHash('sha256').update((await readFile(new URL('grammar/'+name,root),'utf8')).replace(/\r\n/g,'\n')).digest('hex').slice(0,16);
 imports['./grammar/'+name]='./grammar/'+name+'?v='+digest;
}
const css=createHash('sha256').update((await readFile(new URL('styles.css',root),'utf8')).replace(/\r\n/g,'\n')).digest('hex').slice(0,16);
const url=new URL('index.html',root);let html=(await readFile(url,'utf8')).replace(/\r\n/g,'\n');
html=html.replace(/<script type="importmap">[\s\S]*?<\/script>/g,'').replace(/<script data-bootstrap>[\s\S]*?<\/script>/g,'<script type="module"></script>');
html=html.replace(/styles\.css\?v=[^" ]+/,'styles.css?v='+css);
html=html.replace(/<script type="module"[^>]*>[\s\S]*?<\/script>/,`<script type="importmap">${JSON.stringify({imports})}</script><script data-bootstrap>
(()=>{
 const app=document.querySelector('#app');let complete=false;
 const retry=()=>{if(complete)return;app.innerHTML='<h1>教材の読み込みをやり直そう</h1><p>通信を確認して、もう一度開いてください。学習記録はそのままです。</p><button id="retry-start">もう一度読み込む</button>';document.querySelector('#retry-start').onclick=()=>location.reload();};
 window.addEventListener('error',e=>{if(e.target?.tagName==='SCRIPT')retry();},true);
 window.__englishReady=()=>{complete=true;clearTimeout(timer);};
 const timer=setTimeout(retry,15000);
 import('./src/app.js').then(()=>{complete=true;clearTimeout(timer);}).catch(retry);
})();
</script>`);
if(process.argv.includes('--check')){
 if(html!==(await readFile(url,'utf8')).replace(/\r\n/g,'\n'))throw Error('Release entry is stale. Run npm run release:entry');
 console.log('PASS release entry: all JavaScript imports and CSS have content versions');
}else{await writeFile(url,html);console.log('Updated',fileURLToPath(url));}
