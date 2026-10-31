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
export function bindFlash(button,flip,move,locked){
 let pointer=null,suppressUntil=0;
 button.onclick=()=>{
  if(locked()||performance.now()<suppressUntil)return;
  const back=flip();button.classList.toggle('is-flipped',back);
  button.setAttribute('aria-pressed',String(back));
  button.setAttribute('aria-label',back?'英語の面に戻す':'意味を確かめる');
  for(const [face,hidden] of [[button.querySelector('.flash-front'),back],[button.querySelector('.flash-back'),!back]]){
   face.inert=hidden;face.setAttribute('aria-hidden',String(hidden));
  }
 };
 button.onpointerdown=e=>{
  if(locked()||!e.isPrimary||e.button!==0)return;
  pointer={id:e.pointerId,x:e.clientX,y:e.clientY};button.setPointerCapture(e.pointerId);
 };
 button.onpointerup=e=>{
  if(!pointer||pointer.id!==e.pointerId)return;
  const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer=null;
  if(Math.abs(dx)>Math.max(48,button.clientWidth*.15)&&Math.abs(dx)>Math.abs(dy)*1.4){
   suppressUntil=performance.now()+400;move(dx<0?1:-1);
  }else if(Math.hypot(dx,dy)>16)suppressUntil=performance.now()+400;
 };
 button.onpointercancel=()=>{pointer=null;suppressUntil=performance.now()+400;};
 button.onlostpointercapture=()=>{pointer=null;};
 button.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();move(e.key==='ArrowLeft'?-1:1);}};
}
export async function animateCard(element,kind,motion){
 if(!motion||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 element.classList.add('leaving-'+kind);
 // A detached element or a background tab must not leave the controls locked.
 await Promise.race([
  Promise.allSettled(element.getAnimations({subtree:true}).map(a=>a.finished)),
  new Promise(resolve=>setTimeout(resolve,550))
 ]);
}
