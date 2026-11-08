// Each picture moves once when it enters view. Navigation tears down observers/timers.
export function mountStoryPlayer(root,{stories,onViewed=()=>{},narrate=()=>{},motion=true,onMotion=()=>{},host=window}={}){
 const cards=[...root.querySelectorAll('[data-motion-card]')],timers=new Set(),played=new WeakSet(),pending=new WeakMap(),generation=new WeakMap();let dead=false,guideReady=!host.Image,guidePromise;
 if(host.Image){const image=new host.Image();image.src='./assets/guide.png';guidePromise=image.decode().catch(()=>{}).then(()=>{guideReady=true;});}
 const osReduce=host.matchMedia?.('(prefers-reduced-motion: reduce)'),reduce=()=>!motion||!!osReduce?.matches;
 let observer;
 function later(fn,ms){const id=host.setTimeout(()=>{timers.delete(id);if(!dead)fn();},ms);timers.add(id);return id;}
 function cancelCard(card){generation.set(card,(generation.get(card)||0)+1);const id=pending.get(card);if(id!==undefined){host.clearTimeout(id);timers.delete(id);pending.delete(card);}}
 function waitingFor(card){if(card.dataset.core&&!guideReady)return guidePromise;const images=[...(card.querySelectorAll?.('.generated-pair img')||[])].filter(i=>!i.complete);return images.length?Promise.all(images.map(i=>i.decode().catch(()=>{}))):null;}
 function label(card,text){const el=card.querySelector('.story-stage-label');if(el)el.textContent=text;}
 function apply(card,animate=true){if(dead||card.hasAttribute('data-hidden-transfer'))return;const waiting=waitingFor(card);if(waiting){const token=generation.get(card)||0;label(card,'絵を用意しています');waiting.then(()=>{if(!dead&&card.isConnected&&(generation.get(card)||0)===token)apply(card,animate);});return;}observer?.unobserve(card);pending.delete(card);card.classList.remove('show-before');card.classList.toggle('run-motion',animate&&!reduce());card.classList.add('is-applied');played.add(card);label(card,'変化したあと');card.querySelector('[data-story-action="before"]')?.setAttribute('aria-pressed','false');if(card.dataset.core)onViewed(card.dataset.core);}
 function replay(card){if(!card)return;cancelCard(card);observer?.unobserve(card);card.classList.remove('run-motion','is-applied','show-before');label(card,'動きを見てみよう');if(reduce())apply(card,false);else pending.set(card,later(()=>apply(card,true),100));}
 function syncMotion(){root.classList.toggle('story-reduce-motion',reduce());const input=root.querySelector('#story-motion');if(input)input.checked=reduce();}
 syncMotion();
 if(host.IntersectionObserver){observer=new host.IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting){cancelCard(e.target);continue;}if(!played.has(e.target)&&!pending.has(e.target)&&!e.target.hasAttribute('data-hidden-transfer')){pending.set(e.target,later(()=>{pending.delete(e.target);if(e.target.isConnected)apply(e.target);},650));}}},{threshold:.5});cards.filter(c=>!c.hasAttribute('data-hidden-transfer')).forEach(c=>observer.observe(c));}
 else cards.filter(c=>!c.hasAttribute('data-hidden-transfer')).forEach(c=>apply(c,false));
 function click(e){const b=e.target.closest('button[data-story-action]');if(!b||!root.contains(b))return;const action=b.dataset.storyAction,card=b.closest('[data-motion-card]');
  if(action==='replay')replay(card);
  if(action==='before'&&card){cancelCard(card);observer?.unobserve(card);played.add(card);card.classList.remove('run-motion','is-applied');card.classList.add('show-before');label(card,'元の場面');b.setAttribute('aria-pressed','true');}
  if(action==='narrate'){const s=stories.find(s=>s.prefix_id===b.dataset.prefix);if(s)narrate(s.narration_ja);}
  if(action==='reveal'){const block=b.closest('[data-transfer]'),picture=block?.querySelector('[data-hidden-transfer]');if(picture){picture.removeAttribute('data-hidden-transfer');block.classList.add('is-revealed');block.querySelector('.picture-stage').removeAttribute('aria-hidden');block.querySelector('.transfer-answer').hidden=false;b.textContent='もう一度、絵でたしかめる';replay(picture);}}
 }
 function change(e){if(e.target.id==='story-motion'){motion=!e.target.checked;syncMotion();cards.forEach(c=>c.classList.remove('run-motion'));onMotion(motion);}}
 function mediaChange(){syncMotion();cards.forEach(c=>c.classList.remove('run-motion'));}
 root.addEventListener('click',click);root.addEventListener('change',change);osReduce?.addEventListener?.('change',mediaChange);
 return ()=>{dead=true;observer?.disconnect();timers.forEach(id=>host.clearTimeout(id));root.removeEventListener('click',click);root.removeEventListener('change',change);osReduce?.removeEventListener?.('change',mediaChange);};
}
