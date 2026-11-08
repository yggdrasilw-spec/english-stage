import {expansionArea,isOpenGround} from './forest-expansion.js';
import {nearPath,rockGroups} from './forest-landscape.js';

export const FOREST_CELL=45,FLOWERS_PER_WATER=12;
export const fogProgress=local=>Math.floor(Math.max(0,Math.min(20,local))/4)*20;
export const woodland=[
 [700,860,'tree_pine_01',270,370],[850,650,'tree_birch_01',260,350],
 [1120,560,'tree_pine_01',230,330],[1470,610,'tree_oak_01',310,340],
 [1740,790,'tree_birch_01',260,360],[1980,1000,'tree_pine_01',280,390],
 [2170,1260,'tree_oak_01',300,340],[2030,1590,'tree_birch_01',260,360],
 [1710,1790,'tree_pine_01',250,350],[1300,1830,'tree_oak_01',300,340],
 [980,1660,'tree_birch_01',270,370],[670,1390,'tree_oak_01',310,350],
 [490,1080,'tree_pine_01',250,360],[2110,700,'tree_birch_01',270,360]
];
const cache=new Map();
export function forestFlowers(local,area=0){
 local=Math.max(0,Math.min(20,Math.floor(local*4)/4));const key=local+':'+area%997;
 if(cache.has(key))return cache.get(key);
 const result=[];
 for(let i=0;i<Math.floor(local*FLOWERS_PER_WATER);i++){
  // Each seed has a stable location in the grass already open before that watering.
  const percent=fogProgress(Math.floor(i/FLOWERS_PER_WATER)),a=expansionArea(percent,FOREST_CELL);
  let point;
  for(let attempt=0;attempt<4000;attempt++){
   const angle=(i*137.508+(area%997)*17+attempt*73.13)*Math.PI/180;
   const r=.26+.5*Math.sqrt(((i+1)*.61803398875+attempt*.217)%1);
   const x=a.x+Math.cos(angle)*a.rx*r,y=a.y+Math.sin(angle)*a.ry*r;
   if(!isOpenGround(x,y,percent,[],FOREST_CELL)||nearPath(x-55,y-5,43))continue;
   if(Math.abs(x-1305)<100&&y>720&&y<1090)continue;
   if(((x-1730)/180)**2+((y-1250)/110)**2<1)continue;
   if(rockGroups.some(o=>Math.hypot(x-o.x-55,y-o.y-5)<o.w*.4))continue;
   if(result.some(o=>Math.hypot(x-o.x,y-o.y)<48))continue;
   point={x,y,variant:i%3,water:(Math.floor(i/3)+1)/4};break;
  }
  if(!point)throw Error('花を咲かせる草地が見つかりません。');
  result.push(Object.freeze(point));
 }
 if(cache.size>=64)cache.delete(cache.keys().next().value);
 cache.set(key,Object.freeze(result));return result;
}
