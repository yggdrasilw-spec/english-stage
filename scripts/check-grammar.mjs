import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {featureBanners} from '../dist/src/home-banners.js';
import {releaseFiles} from '../grammar/scripts/build.mjs';
const dist=new URL('../dist/grammar/',import.meta.url);
for(const [file,expected]of await releaseFiles())assert.equal((await readFile(new URL(file,dist),'utf8')).replace(/\r\n/g,'\n'),expected,`${file}: run npm run grammar:build`);
const home=await readFile(new URL('../dist/src/app.js',import.meta.url),'utf8');assert(home.includes('${featureBanners(cards)}') && featureBanners([]).includes('href="./grammar/"'),'English Stage home must link to grammar/');
console.log('PASS grammar release: source, all module/CSS versions and home link match');
