// Keep decoded images alive; preload a small look-ahead rather than the whole deck.
const images=new Map();
export function warmImages(cards){
 for(const card of cards){
  const url=card?.image?.url;if(!url||images.has(url))continue;
  const img=new Image();img.referrerPolicy='no-referrer';img.decoding='async';img.src=url;
  images.set(url,img);img.decode().catch(()=>{images.delete(url);});
  if(images.size>32)images.delete(images.keys().next().value);
 }
}
const reduced=()=>document.body.classList.contains('reduce-motion')||matchMedia('(prefers-reduced-motion: reduce)').matches;
export function bindFlash(button,flip,move,locked,canMove=()=>true){
 let pointer=null,suppressUntil=0,returning=null;
 const reset=()=>{
  button.classList.remove('is-dragging');
  const from=getComputedStyle(button).transform;button.style.transform='';
  returning?.cancel();
  if(!reduced()&&from!=='none'){
   returning=button.animate([{transform:from},{transform:'translateX(0px)'}],{duration:140,easing:'ease-out'});
  }
 };
 button.onclick=()=>{
  if(locked()||pointer||performance.now()<suppressUntil)return;
  const back=flip();button.classList.toggle('is-flipped',back);
  button.setAttribute('aria-pressed',String(back));
  button.setAttribute('aria-label',back?'英語の面に戻す':'意味を確かめる');
  for(const [face,hidden] of [[button.querySelector('.flash-front'),back],[button.querySelector('.flash-back'),!back]]){
   face.inert=hidden;face.setAttribute('aria-hidden',String(hidden));
  }
 };
 button.onpointerdown=e=>{
  if(locked()||pointer||!e.isPrimary||e.button!==0)return;
  returning?.cancel();for(const animation of button.getAnimations())animation.cancel();button.style.transform='';
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY,axis:null};button.setPointerCapture(e.pointerId);
 };
 button.onpointermove=e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
  if(!pointer.axis&&Math.hypot(dx,dy)>8)pointer.axis=Math.abs(dx)>Math.abs(dy)*1.2?'x':'y';
  if(pointer.axis!=='x')return;
  const offset=canMove(dx<0?1:-1)?dx:dx*.22;
  button.classList.add('is-dragging');button.style.transform=`translateX(${offset}px)`;
 };
 button.onpointerup=async e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y,axis=pointer.axis;pointer=null;
  button.classList.remove('is-dragging');
  if(axis==='x'&&Math.abs(dx)>Math.max(48,button.clientWidth*.15)&&Math.abs(dx)>Math.abs(dy)*1.4){
   suppressUntil=performance.now()+400;
   if(canMove(dx<0?1:-1)){const result=await move(dx<0?1:-1);if(result!==false)return;}
   reset();
  }else if(axis||Math.hypot(dx,dy)>16){suppressUntil=performance.now()+400;reset();}
 };
 const cancel=()=>{if(!pointer)return;pointer=null;suppressUntil=performance.now()+400;reset();};
 button.onpointercancel=cancel;button.onlostpointercapture=cancel;
 button.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}};
}
export async function animateCard(element,kind,motion){
 const card=element.querySelector('.flash-card');
 if(!motion||reduced()){if(card)card.style.transform='';return;}
 let animations;
 if(kind==='next'||kind==='previous'){
  // Continue directly from the held position, without tilt, shrink, or sparkle.
  const offset=(kind==='next'?-1:1)*(element.clientWidth+24);
  animations=[card.animate([{transform:getComputedStyle(card).transform},{transform:`translateX(${offset}px)`}],{duration:150,easing:'ease-out',fill:'forwards'})];
 }else{
  element.classList.add('leaving-'+kind);animations=element.getAnimations({subtree:true});
 }
 await Promise.race([Promise.allSettled(animations.map(a=>a.finished)),new Promise(resolve=>setTimeout(resolve,550))]);
}
export function enterCard(element,direction,motion){
 if(!element||!motion||reduced())return;
 const card=element.querySelector('.flash-card');
 card?.animate([{transform:`translateX(${direction*(element.clientWidth+24)}px)`},{transform:'translateX(0px)'}],{duration:170,easing:'ease-out'});
}
