// Star economy and wardrobe adapted from Kazunome Lab. No effect on learning scores.
export const COLORS=[
 {id:'blue',name:'そらいろ',price:0},{id:'mint',name:'わかば',price:6},
 {id:'pink',name:'さくら',price:6},{id:'yellow',name:'ひだまり',price:6},
 {id:'violet',name:'すみれ',price:9},{id:'snow',name:'ゆき',price:12},
 {id:'gold',name:'きんいろ',price:21}];
export const OUTFITS=[
 {id:'none',name:'いつもの姿',price:0},{id:'cap',name:'おでかけキャップ',price:6},
 {id:'glasses',name:'ものしりメガネ',price:6},{id:'ribbon',name:'おめかしリボン',price:9},
 {id:'headphones',name:'リスニング名人',price:9},{id:'hachimaki',name:'チャレンジはちまき',price:9},
 {id:'cape',name:'ヒーローマント',price:12},{id:'wizard',name:'ことばの魔法使い',price:18},
 {id:'crown',name:'きらきらクラウン',price:21}];
export const catalog={color:COLORS,outfit:OUTFITS};
export const defaultCompanion=()=>({color:'blue',outfit:'none',owned:['color:blue','outfit:none']});
export const look=s=>s.companion||defaultCompanion();
export function validCompanion(c){
 return !!c&&typeof c==='object'&&Array.isArray(c.owned)&&c.owned.length<=COLORS.length+OUTFITS.length&&
 new Set(c.owned).size===c.owned.length&&c.owned.every(key=>Object.entries(catalog).some(([kind,items])=>items.some(i=>key===kind+':'+i.id)))&&
 ['color:blue','outfit:none','color:'+c.color,'outfit:'+c.outfit].every(k=>c.owned.includes(k));
}
export function dress(s,kind,id){
 const item=Object.hasOwn(catalog,kind)?catalog[kind].find(i=>i.id===id):null;if(!item)return 'そのアイテムは見つかりません。';
 const c=look(s),key=kind+':'+id,owned=c.owned.includes(key);
 if(!owned&&s.stars<item.price)return 'スターがあと'+(item.price-s.stars)+'こ必要です。';
 s.companion||=defaultCompanion();
 if(!owned){s.stars-=item.price;s.companion.owned.push(key);}
 s.companion[kind]=id;
 return item.name+'に着せ替えたよ！';
}
