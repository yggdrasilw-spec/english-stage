import {forestFlowers,fogProgress,FOREST_CELL} from './forest-geometry.js';
import {isOpenGround} from './forest-expansion.js';
import {nearPath,rockGroups} from './forest-landscape.js';

const resident=(key,id,name,at,x,y,w,h,kind='ground',extra={})=>({key,id,name,at,x,y,w,h,kind,...extra});
// Landmarks, flower visitors, pond life, and a little resting place form a coherent forest.
const residents=[
 resident('acorn','acorn_01','どんぐり',1,1100,1060,80,85),
 resident('leaf','leaf_01','葉っぱ',1,1460,1090,80,75),
 resident('mushrooms','mushroom_patch_01','きのこ',2,1110,1180,135,145),
 resident('pinecone','pinecone_01','まつぼっくり',2,1450,1010,80,90),
 resident('bee','bee_01','ミツバチ',3,0,0,100,105,'air',{flower:4}),
 resident('stump','stump_01','切り株',4,1765,1190,200,180),
 resident('berries','berry_01','赤い木の実',5,1100,1300,110,115),
 resident('acorn-trail','acorn_01','どんぐり',5,1520,1330,65,70),
 resident('butterfly','butterfly_01','チョウ',6,1480,1000,95,100,'air',{cls:'forest-butterfly',fixed:true}),
 resident('leaf-path','leaf_01','葉っぱ',6,1640,1260,75,70),
 resident('bench','bench_01','ベンチ',7,1470,1370,280,220),
 resident('lantern','lantern_01','ランタン',8,0,0,100,165,'ground',{relative:'bench',dx:170,dy:15}),
 resident('lantern-glow','glow_01','灯り',8,0,0,155,155,'ambience',{relative:'lantern',dx:0,dy:-40,layer:4}),
 resident('fish','fish_small_01','魚',9,1730,1165,100,78,'water',{fixed:true}),
 resident('dragonfly','dragonfly_01','トンボ',10,1770,1080,115,100,'air',{fixed:true}),
 resident('frog','frog_01','カエル',11,1850,1240,120,130,'shore',{fixed:true}),
 resident('rabbit','rabbit_01','ウサギ',12,1130,1250,125,150,'ground',{cls:'forest-animal',fixed:true}),
 resident('rabbit-acorn','acorn_01','どんぐり',12,1040,1390,65,70),
 resident('mushroom-grove','mushroom_patch_01','きのこ',13,1870,1410,150,160),
 resident('berry-grove','berry_01','赤い木の実',13,1850,950,110,115),
 resident('bird','bird_small_01','小鳥',14,1390,820,115,115,'air',{cls:'forest-bird',fixed:true}),
 resident('leaf-grove','leaf_01','葉っぱ',14,1890,1030,90,80),
 resident('rest-stump','stump_01','切り株',15,1880,1510,180,160),
 resident('squirrel','squirrel_01','リス',16,1540,1440,135,150,'ground',{cls:'forest-squirrel',fixed:true}),
 resident('squirrel-pinecone','pinecone_01','まつぼっくり',16,1630,1540,85,95),
 resident('camp-lantern','lantern_01','ランタン',17,0,0,105,170,'ground',{relative:'rest-stump',dx:155,dy:0}),
 resident('camp-glow','glow_01','灯り',17,0,0,165,165,'ambience',{relative:'camp-lantern',dx:0,dy:-45,layer:4}),
 resident('campfire','campfire_01','たき火',18,1970,1590,190,205),
 resident('fire-glow','glow_01','灯り',18,0,0,220,200,'ambience',{relative:'campfire',dx:0,dy:-25,layer:4}),
 resident('bee-friend','bee_01','ミツバチ',19,0,0,95,100,'air',{flower:45}),
 resident('bird-friend','bird_small_01','小鳥',19,1930,1000,105,110,'air',{fixed:true}),
 resident('rainbow','rainbow_01','虹',20,1430,770,1180,450,'sky',{fixed:true,layer:1}),
 resident('rainbow-spark','sparkle_small_01','きらめき',20,1020,680,90,90,'ambience',{fixed:true,layer:4}),
 resident('rainbow-spark-two','sparkle_small_01','きらめき',20,1830,720,80,80,'ambience',{fixed:true,layer:4})
];

const messages={
 1:'どんぐりと葉っぱが増えたよ！',2:'きのことまつぼっくりを発見！',
 3:'ミツバチが遊びに来たよ！',4:'霧の先に切り株を発見！',
 5:'赤い木の実を見つけたよ！',6:'チョウも遊びに来たよ！',
 7:'小道のそばにベンチができたよ！',8:'池にランタンが灯ったよ！',
 9:'池に魚がやって来たよ！',10:'池の上をトンボが飛んでいるよ！',
 11:'池のほとりにカエルが来たよ！',12:'ウサギが遊びに来たよ！',
 13:'きのこと木の実が増えたよ！',14:'小鳥が遊びに来たよ！',
 15:'もうひとつ休み場所ができたよ！',16:'リスが遊びに来たよ！',
 17:'休み場所にランタンが灯ったよ！',18:'たき火のある休み場所ができたよ！',
 19:'ミツバチと小鳥の仲間が増えたよ！',20:'森が完成！虹がかかったよ！'
};
export const forestArrival=local=>messages[local]||'';

const layouts=new Map();
const footprint=o=>Math.max(20,o.w*.28);
function layout(area){
 const seed=area%997;if(layouts.has(seed))return layouts.get(seed);
 const flowers=forestFlowers(20,area),placed=[];
 for(const definition of residents){
  let o={...definition};if(seed&&['rabbit','squirrel'].includes(o.key))o.fixed=false;if(seed&&['bird','bird-friend','butterfly'].includes(o.key)){o.x+=Math.sin(seed*.73+o.at)*100;o.y+=Math.cos(seed*.41+o.at)*60;}
  if(o.relative){const anchor=placed.find(p=>p.key===o.relative);o.x=anchor.x+o.dx;o.y=anchor.y+o.dy;}
  if(o.flower!==undefined){const flower=flowers[o.flower];o.x=flower.x+30;o.y=flower.y-45;}
  if(o.kind==='ground'&&!o.fixed){
   const origin={x:o.x,y:o.y},r=footprint(o);let found=false;
   for(let attempt=0;attempt<2800;attempt++){
    const angle=attempt*2.399963+seed*.37,distance=attempt||seed?35+15*Math.sqrt(attempt+seed%17):0;
    const x=origin.x+Math.cos(angle)*distance,y=origin.y+Math.sin(angle)*distance;
    if(!isOpenGround(x,y,fogProgress(o.at),[],FOREST_CELL)||nearPath(x-55,y-5,r+20))continue;
    if(Math.abs(x-1305)<120&&y>710&&y<1090)continue;
    if(((x-1730)/230)**2+((y-1210)/160)**2<1)continue;
    if(rockGroups.some(p=>Math.hypot(x-p.x-55,y-p.y-5)<r+p.w*.32))continue;
    if(flowers.some(p=>Math.abs(x-p.x)<r+26&&Math.abs(y-p.y)<34))continue;
    if(placed.some(p=>p.kind==='ground'&&Math.hypot(x-p.x,y-p.y)<r+footprint(p)+14))continue;
    o.x=x;o.y=y;found=true;break;
   }
   if(!found)throw Error('森の小物を置く草地が見つかりません。');
  }
  placed.push(Object.freeze(o));
 }
 const result=Object.freeze(placed);layouts.set(seed,result);return result;
}

export function forestResidents(local,area=0){
 local=Math.max(0,Math.min(20,Math.floor(local)));if(!local)return [];
 return layout(area).filter(o=>o.at<=local);
}
export function forestResidentSummary(local,area=0){
 const items=forestResidents(local,area).filter(o=>o.kind!=='ambience');
 const animals=new Set(items.filter(o=>['air','water','shore'].includes(o.kind)||['rabbit','squirrel'].includes(o.key)).map(o=>o.name));
 const objects=new Set(items.filter(o=>!animals.has(o.name)).map(o=>o.name));
 return {animals:animals.size,objects:objects.size,names:[...new Set(items.map(o=>o.name))]};
}
