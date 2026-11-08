// Original, code-drawn teaching pictures. No external images or copied dictionary art.
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const p=(d,cls='',fill='none')=>`<path d="${d}" class="${cls}" fill="${fill}"/>`;
const r=(x,y,w,h,cls='paper',rad=9)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rad}" class="${cls}"/>`;
const c=(x,y,rad,cls='accent-fill')=>`<circle cx="${x}" cy="${y}" r="${rad}" class="${cls}"/>`;
const t=(x,y,s,cls='art-label',anchor='middle')=>`<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(s)}</text>`;
const g=(s,cls)=>`<g class="${cls}">${s}</g>`;
const arrow=(x,y,dir='right')=>`<g transform="translate(${x} ${y}) ${dir==='left'?'rotate(180)':dir==='up'?'rotate(-90)':dir==='down'?'rotate(90)':''}">${p('M-26 0H26M14-12L27 0 14 12','arrow')}</g>`;
const person=(x,y,cls='',cape=false)=>`<g transform="translate(${x} ${y})" class="${cls}">${cape?p('M-22 3L-55 68H12Z','cape','var(--art-pink-soft)'):''}${c(0,-28,17,'skin')}${r(-23,-7,46,62,'mint',15)}${p('M-14 55L-18 83M14 55L18 83M-21 7L-39 33M21 7L39 33','ink-stroke')}${c(-6,-30,2,'ink-fill')}${c(6,-30,2,'ink-fill')}${p('M-6-21Q0-16 6-21','ink-stroke')}</g>`;
const face=(x,y,emotion='happy')=>`<g transform="translate(${x} ${y})">${c(0,0,51,'skin')}${c(-17,-6,4,'ink-fill')}${c(17,-6,4,'ink-fill')}${p(emotion==='happy'?'M-20 14Q0 40 20 14':emotion==='sad'?'M-17 27Q0 9 17 27':'M-16 22H16','ink-stroke')}</g>`;
const book=(x,y)=>`<g transform="translate(${x} ${y})">${p('M0 0Q-39-19-76-8V77Q-35 65 0 85Q35 65 76 77V-8Q39-19 0 0Z','outlined','var(--art-paper)')}${p('M0 0V85M-61 15L-16 20M-61 32L-16 37M16 20L61 15M16 37L61 32','muted-stroke')}</g>`;
const coins=(x,y,n=3)=>Array.from({length:n},(_,i)=>c(x+i*20,y-(i%2)*12,12,'gold')).join('');
const bubbles=(n,x,y,cls='accent-fill',gap=31)=>Array.from({length:n},(_,i)=>c(x+i*gap,y,11,cls)).join('');
const heart=(x,y)=>`<g transform="translate(${x} ${y})">${p('M0 12C-60-25-12-47 0-25C12-47 60-25 0 12Z','heart','var(--art-pink)')}</g>`;
const words=(before,after)=>g(before,'before')+g(after,'after');
export const coreKinds=['deny','reverse','again','apart','before','wrong','over','under','outside','two','three','many','below','beyond'];
export const sceneKinds=['face','sharing','bridge','lock','knot','gift','book','paint','video','plug','agreement','liking','oven','preview','payment','count','key','hearing','cup','pan','bed','eating','bread','wage','price','robot','bus','nonfiction','biplane','triangle','colors3','colors','players','tasks','zero','soil','hero','strong','celebrity'];
function coreDrawing(kind,form){
 const token=(x,y,cls='')=>`<g transform="translate(${x} ${y})"><g class="core-token ${cls}"><image href="./assets/guide.png" x="-40" y="-56" width="80" height="72" preserveAspectRatio="xMidYMid meet"/></g></g>`;
 const baseline=p('M65 166H573','track');
 switch(kind){
 case 'over':return `${r(380,35,210,167,'pink-area')}${baseline}${p('M380 42V190','limit')}${t(380,226,'ちょうど')}${token(125,150)}${g(arrow(485,149),'after')}${t(540,226,'その先へ','art-small')}`;
 case 'under':return `${baseline}${p('M490 42V190','limit')}${t(490,226,'必要なところ')}${token(100,150)}${g(p('M319 150H471','gap-line')+t(373,101,'まだ届かない'),'after')}`;
 case 'again':return `${baseline}${c(125,150,30,'start-ring')}${t(125,219,'はじめ')}${t(510,219,'終わり')}${p('M513 134C513 28 125 28 125 125','loop-track')}${arrow(133,96,'down')}${token(125,150)}${g(t(320,77,'もう一度'),'after')}`;
 case 'reverse':return `${baseline}${t(125,219,'もとの状態')}${t(510,219,'したあと')}${token(510,150)}${g(arrow(310,108,'left'),'after')}`;
 case 'before':return `${baseline}${p('M440 46V190','limit')}${t(440,225,'本番')}${token(125,150)}${g(c(215,150,34,'start-ring')+t(215,75,'ひと足さきに'),'after')}${arrow(535,150)}`;
 case 'wrong':return `${p('M85 151H485','track')}${c(510,151,40,'start-ring')}${c(510,151,10,'gold')}${t(510,227,'ねらい')}${token(105,151)}${g(arrow(347,176)+t(315,80,'ずれる'),'after')}`;
 case 'apart':return `${g(r(220,102,200,10,'mint',3),'before')}${g(p('M250 108H390','gap-line'),'after')}<g class="separate-left">${c(220,108,39,'mint')}${t(220,116,'A')}</g><g class="separate-right">${c(420,108,39,'gold')}${t(420,116,'B')}</g>${t(320,218,'合わない・はなれる')}${g(arrow(122,108,'left')+arrow(520,108),'after')}`;
 case 'deny':return `${r(198,61,245,100,'mint',22)}${t(320,121,'〜な')}${g(p('M220 72L422 152','deny-line')+r(278,146,220,54,'pink-area',13)+t(388,182,'〜ではない'),'after')}${t(320,223,'性質を打ち消す')}`;
 case 'outside':return `${r(68,55,305,133,'group-area',24)}${t(220,96,'ある仲間')}${c(135,145,16,'mint')}${c(205,145,16,'mint')}${token(285,145)}${g(t(517,214,'入らない'),'after')}${t(218,226,'良い・悪いを決める札ではない','art-small')}`;
 case 'two':case 'three':case 'many':{const n=kind==='two'?2:kind==='three'?3:6;const xs=n<=3?Array.from({length:n},(_,i)=>320+(i-(n-1)/2)*110):[200,320,440,200,320,440];return `${g(c(320,126,28,'mint'),'before')}${g(xs.map((x,i)=>c(x,n===6?(i<3?90:163):125,29,i%2?'gold':'mint')).join(''),'count-result after')}${t(320,229,kind==='two'?'2つ':kind==='three'?'3つ':'いくつも・複数')}`;}
 case 'below':return `${p('M65 86H575','limit')}${t(490,61,'基準')}${r(65,87,510,112,'earth-area',0)}${token(320,60)}${g(arrow(402,142,'down'),'after')}${t(500,222,'下の段へ')}`;
 case 'beyond':return `${r(70,129,500,77,'mint-area',0)}${p('M70 128H570','limit')}${t(482,163,'ふつうの水準')}${token(225,161)}${g(arrow(400,77,'up')+t(507,53,'ぐっとこえる'),'after')}`;
 default:throw Error('Unknown core image: '+kind);
 }
}
export function coreArt(kind,form,label){if(!coreKinds.includes(kind))throw Error('Unknown core image');return `<svg class="story-svg core-svg core-${kind}" viewBox="0 0 640 250" role="img" aria-label="${esc(label)}">${t(70,31,form,'prefix-label','start')}${coreDrawing(kind,form)}</svg>`;}
function drawing(kind){
 switch(kind){
 case 'face':return words(face(200,112),face(200,112,'sad'));
 case 'sharing':return `${person(90,120)}${person(310,120)}${words(bubbles(2,60,63,'gold')+bubbles(2,280,63,'gold'),bubbles(4,45,63,'gold')+t(307,68,'0'))}`;
 case 'bridge':return `${p('M35 170H365','track')}${r(45,80,36,90,'earth')}${r(320,80,36,90,'earth')}${words(p('M79 120H322M79 125V90M322 125V90M79 90H322','ink-stroke'),p('M79 120H160M235 120H322M160 120L182 149M235 120L216 150','ink-stroke'))}${person(112,44)}`;
 case 'lock':return `${r(137,104,126,95,'gold',17)}<g class="lock-shackle">${p('M158 111V75A42 42 0 0 1 84 0V111','outlined')}</g>${c(200,143,9,'ink-fill')}${r(196,143,8,23,'ink-fill',2)}`;
 case 'knot':return `${p('M45 119H160M240 119H355','ink-stroke')}${words(p('M161 119C155 56 241 57 223 122C206 170 154 149 181 111C214 59 247 159 182 137','accent-stroke'),p('M156 119L194 88M244 119L206 149','accent-stroke')+arrow(103,91,'left')+arrow(301,147))}`;
 case 'gift':return `${r(112,91,178,107,'mint')}${r(106,77,190,25,'mint')}${words(r(188,77,26,121,'pink-area',0)+p('M201 77C129 32 124 91 201 77C277 32 281 91 201 77','accent-stroke'),g(p('M83 76Q67 30 44 56M318 76Q336 30 360 56','accent-stroke'),'loose-ribbon')+r(160,110,80,58,'gold'))}`;
 case 'book':return `${book(200,76)}<g class="reading-dot">${c(142,91,7,'accent-fill')}</g>${g(arrow(200,207,'left'),'after')}`;
 case 'paint':return `${r(75,43,250,145,'paper')}${p('M90 85H308M90 134H308M158 43V188M240 43V188','muted-stroke')}${g(r(81,50,238,133,'mint',4),'after')}<g class="paint-brush">${r(103,60,49,21,'gold',3)}${r(121,81,12,49,'earth',2)}</g>`;
 case 'video':return `${r(55,36,290,164,'ink-fill',16)}${r(66,47,268,138,'mint',8)}${p('M82 159H319','track')}<g class="replay-ball">${c(97,135,18,'gold')}</g>${r(179,198,43,12,'metal',3)}${g(arrow(199,224,'left'),'after')}`;
 case 'plug':return `${p('M15 126H130M268 126H386','ink-stroke')}<g class="plug-left">${r(113,93,77,68,'mint')}${p('M190 110H212M190 143H212','ink-stroke')}</g><g class="plug-right">${r(213,90,69,74,'gold')}</g>`;
 case 'agreement':return `${person(97,132)}${person(305,132)}${r(40,29,108,48,'paper',20)}${r(253,29,108,48,'paper',20)}${arrow(94,53)}${words(arrow(306,53),arrow(306,53,'left'))}`;
 case 'liking':return `${words(face(133,117),face(133,117,'neutral'))}${heart(281,117)}${g(p('M247 66L314 139','deny-line'),'after')}`;
 case 'oven':return `${r(85,69,230,133,'metal',12)}${r(103,109,194,75,'paper',5)}${r(110,81,19,14,'gold')}${r(144,81,19,14,'gold')}${g(p('M151 161Q139 146 151 133M200 161Q188 146 200 133M249 161Q237 146 249 133','warm-stroke'),'after')}${t(200,232,'食べ物を入れる前')}`;
 case 'preview':return `${r(87,55,225,140,'mint')}${r(110,75,179,83,'paper')}${p('M170 95L232 116 170 140Z','gold','var(--art-gold)')}${g(r(255,90,99,72,'paper')+p('M270 125Q300 96 339 125Q300 154 270 125Z','outlined')+c(305,125,8,'accent-fill'),'after')}${t(186,225,'本編より前に見る')}`;
 case 'payment':return `${r(59,64,96,118,'mint')}${p('M79 65V45Q106 18 136 45V65','ink-stroke')}${t(107,216,'品物')}${coins(252,118)}${t(281,216,'代金')}${g(arrow(204,83,'left')+t(212,39,'先に払う'),'after')}`;
 case 'count':return `${bubbles(3,115,133,'gold',84)}${words(t(200,77,'3'),t(200,77,'4')+p('M177 82L226 39','deny-line'))}${t(200,209,'3つあるのに…')}`;
 case 'key':return `${r(64,39,269,156,'paper')}${p('M118 64V88Q118 104 103 104','ink-stroke')}${r(171,108,148,76,'mint',20)}${words(g(c(108,110,14,'key-ring')+p('M108 124V158H125M108 147H119','gold-stroke'),'key-right'),g(c(270,192,14,'key-ring')+p('M283 192H315V181M305 192V181','gold-stroke'),'key-lost'))}${t(200,229,'いつもの場所と違う')}`;
 case 'hearing':return `${person(81,134)}${person(321,134)}${r(40,26,80,49,'paper',18)}${r(280,26,80,49,'paper',18)}${t(80,61,'2')}${words(t(320,61,'2'),t(320,61,'3'))}${p('M153 84Q175 114 153 144M188 70Q222 114 188 158','muted-stroke')}`;
 case 'cup':return `${r(136,42,126,158,'paper',15)}<g class="cup-water">${r(141,82,116,113,'water',8)}</g>${p('M141 81H257','limit')}${g(p('M263 55V195','water-stroke')+r(108,194,188,13,'water',10),'after')}${p('M136 42V181Q136 200 156 200H241Q262 200 262 181V42','outlined')}`;
 case 'pan':return `${p('M85 143H298Q291 185 190 184Q94 183 85 143Z','outlined','var(--art-metal)')}${p('M297 149L353 132','ink-stroke')}${[133,190,245].map(x=>`<ellipse cx="${x}" cy="141" rx="22" ry="11" class="pan-food"/>`).join('')}${g(p('M153 118Q138 96 153 74M204 110Q190 88 204 65M251 118Q237 96 251 74','smoke'),'after')}${r(119,195,150,6,'pink-area',3)}`;
 case 'bed':return `${r(65,126,278,67,'mint')}${r(72,114,69,38,'paper',14)}${r(148,112,185,66,'mint-area',22)}${c(110,124,18,'skin')}${p('M103 125H115M64 112V210M341 147V210','ink-stroke')}${r(148,29,113,46,'paper')}${words(t(204,61,'7:00'),t(204,61,'8:00','accent-label'))}${t(204,105,'起きる予定 7:00','art-small')}`;
 case 'eating':return `${person(200,94)}${r(79,153,245,14,'earth',4)}<ellipse cx="200" cy="163" rx="54" ry="16" class="paper"/>${g(t(200,226,'おなかいっぱい'),'before')}${g(g(c(270,145,11,'gold'),'extra-bite')+t(200,226,'さらに食べる'),'after')}`;
 case 'bread':return `${r(75,81,250,102,'gold',40)}${p('M130 107L145 141M185 107L200 141M240 107L255 141','earth-stroke')}${g(r(159,103,130,63,'dough',25)+t(224,143,'中がまだ…','art-small'),'after')}${g(p('M144 62Q132 44 144 23M224 62Q212 44 224 23','warm-stroke'),'before')}`;
 case 'wage':case 'price':{const price=kind==='price';return `${price?r(67,82,95,110,'mint')+p('M84 83V60Q114 29 146 60V83','ink-stroke'):person(111,111)}${t(268,49,price?'本来の料金':'働いた分の賃金','art-small')}${r(211,66,121,103,'paper')}${t(271,102,'100円')}${p('M220 116H322','limit')}${words(t(271,151,'100円'),t(271,151,'50円','accent-label'))}${g(t(200,224,price?'少なく請求する':'十分に払わない'),'after')}`;}
 case 'robot':return words(`${r(152,164,95,51,'earth')}${p('M200 166V65','mint-stroke')}${p('M200 118Q124 116 143 67Q199 72 200 118ZM201 91Q275 90 259 40Q207 45 201 91Z','mint','var(--art-mint)')}`,`${r(124,54,152,108,'metal',23)}${r(149,84,26,21,'paper')}${r(225,84,26,21,'paper')}${p('M171 134H231M147 164L132 205M253 164L268 205M124 108L89 144M276 108L311 144','ink-stroke')}${p('M200 54V32','ink-stroke')}${c(200,24,8,'gold')}${t(200,235,'動いても、生き物ではない','art-small')}`);
 case 'bus':return `${r(74,75,251,99,'mint',17)}${r(92,89,48,34,'paper',4)}${r(154,89,48,34,'paper',4)}${r(216,89,48,34,'paper',4)}${c(120,176,21,'ink-fill')}${c(280,176,21,'ink-fill')}${p('M36 207H363','track')}${g(arrow(200,45)+p('M24 110H57M17 140H49','accent-stroke'),'after')}${g(t(200,239,'止まらずに'),'after')}`;
 case 'nonfiction':return `${book(200,85)}${g(p('M141 142L167 102 188 142Z','mint','var(--art-mint)')+c(147,99,10,'gold')+p('M220 99H258M220 118H258M220 137H245','muted-stroke')+t(200,226,'事実をもとにした本'),'after')}${g(t(200,226,'fiction は作り話'),'before')}`;
 case 'biplane':return `${r(79,106,238,30,'mint',15)}${p('M101 106L84 63H104L139 106Z','outlined','var(--art-mint)')}${p('M319 97V145','ink-stroke')}${words(p('M157 114H282','wing'),p('M157 71H282M149 158H285','wing')+p('M177 76V151M261 76V151','muted-stroke')+t(311,77,'1')+t(311,166,'2')+t(200,224,'主翼が上下2組'))}`;
 case 'triangle':return words(p('M91 193L200 45L309 193','outlined')+c(200,45,10,'accent-fill'),`${p('M200 45L309 193H91Z','outlined','var(--art-mint)')}${[c(200,45,10,'accent-fill'),c(309,193,10,'accent-fill'),c(91,193,10,'accent-fill'),t(200,31,'1'),t(335,209,'2'),t(65,209,'3')].join('')}`);
 case 'colors3':case 'colors':{const n=kind==='colors3'?3:5;return `${g(r(161,69,78,118,'mint'),'before')}${g(Array.from({length:n},(_,i)=>r(50+i*(300/n),69,300/n-6,118,['mint','gold','pink-area','water','metal'][i],9)).join('')+t(200,227,n===3?'3色':'たくさんの色'),'after')}`;}
 case 'players':return `${person(200,106)}${g(person(82,112)+person(318,112),'after')}${r(167,198,66,24,'gold',8)}${t(200,237,'一緒に遊ぶ人')}`;
 case 'tasks':return `${book(110,91)}${g(r(231,50,101,75,'mint')+r(219,142,60,51,'paper')+p('M280 153Q314 144 307 174H280','ink-stroke'),'after')}${t(200,229,'複数の作業')}`;
 case 'zero':return `${p('M200 37V197','ink-stroke')}${p('M113 100H286','limit')}${t(310,108,'0℃')}${r(188,46,23,141,'paper',12)}<g class="thermo-water">${r(192,51,15,132,'water',6)}</g>${c(200,186,23,'water')}${g(t(102,172,'−5℃','accent-label'),'after')}`;
 case 'soil':return `${r(48,44,304,72,'earth',0)}${r(48,116,304,91,'earth-area',0)}${p('M48 44H352','mint-stroke')}${t(200,86,'表面の土')}${g(t(200,166,'その下の土')+arrow(324,160,'down'),'after')}`;
 case 'hero':return `${words(person(200,98),person(200,98,'',true)+p('M183 104L199 80 217 104 200 133Z','gold','var(--art-gold)'))}${g(t(200,232,'特別な力のヒーロー'),'after')}`;
 case 'strong':return `${person(200,109)}<g class="heavy-block">${r(129,148,143,63,'earth',11)}${t(200,188,'重い','art-small')}</g>${g(p('M100 111L78 79M302 111L324 79','accent-stroke'),'after')}`;
 case 'celebrity':return `${person(200,99)}${g(p('M38 28L165 181 86 181ZM363 28L234 181 314 181Z','gold','var(--art-gold)')+bubbles(4,110,216,'mint',60),'after')}${g(t(200,235,'大人気のスター'),'after')}`;
 default:throw Error('Unknown word scene: '+kind);
 }
}
export const generatedPairs={face:'happy-pair.png',lock:'lock-pair.png',book:'reread-pair.png',cup:'overfill-pair.png'};
export function wordArt(kind,label){if(!sceneKinds.includes(kind))throw Error('Unknown word scene: '+kind);if(generatedPairs[kind]){const file=generatedPairs[kind];return `<div class="generated-pair scene-${kind}" role="img" aria-label="${esc(label)}"><img class="pair-before before" src="./assets/${file}" alt="" loading="lazy" decoding="async" width="1199" height="1312"><img class="pair-after after" src="./assets/${file}" alt="" loading="lazy" decoding="async" width="1199" height="1312"></div>`;}return `<svg class="story-svg word-svg scene-${kind}" viewBox="0 0 400 250" role="img" aria-label="${esc(label)}">${drawing(kind)}</svg>`;}
