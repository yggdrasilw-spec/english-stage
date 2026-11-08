import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {releaseFiles} from './build-prefixes.mjs';
import {featureBanners} from '../dist/src/home-banners.js';
for(const [name,expected]of await releaseFiles())assert.equal((await readFile(new URL('../dist/prefixes/'+name,import.meta.url),'utf8')).replace(/\r\n/g,'\n'),expected,`${name}: run npm run prefixes:build`);
const home=await readFile(new URL('../dist/src/app.js',import.meta.url),'utf8');assert(home.includes('${featureBanners(cards)}'));const banners=featureBanners([]);assert.equal((banners.match(/href="\.\/prefixes\/"/g)||[]).length,1);assert(banners.includes('ことばのパーツ研究所'));
const html=await readFile(new URL('../dist/prefixes/index.html',import.meta.url),'utf8');assert(!html.includes('app_links_portfolio'));assert(html.includes('href="../#home"'));assert(html.includes('← 英検5級'));
const sw=await readFile(new URL('../dist/prefixes/sw.js',import.meta.url),'utf8');assert(sw.includes("startsWith('english-prefix-lab-')"));assert(sw.includes('audio.mjs'));assert(sw.includes("k.endsWith('@'+self.registration.scope)"));
console.log('PASS prefix release: source, content-derived offline cache, home banner and return link match');
