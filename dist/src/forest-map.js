import {Camera} from './forest-camera.js';
import {createExpandingForest} from './forest-expansion.js';
import {fogProgress,FOREST_CELL} from './forest-geometry.js';

const mounted=new Map(),views=new Map();
export function cleanupForestMaps(){
 for(const dispose of mounted.values())dispose();mounted.clear();
}

function mount(root,motion){
 const world=root.querySelector('.forest-world'),local=Number(root.dataset.local),from=Number(root.dataset.from),area=Number(root.dataset.area);
 const interactive=root.dataset.interactive==='true',key=(interactive?'map:':'home:')+area;
 const camera=new Camera({cellSize:FOREST_CELL,mapWidth:58,mapHeight:46,minZoom:.06,maxZoom:1.1,zoom:.24});
 let progress=fogProgress(from),disposed=false,delay=0,dimensions=null;
 const media=matchMedia('(prefers-reduced-motion: reduce)'),calm=()=>!motion||media.matches;
 const core={getState:()=>({settings:{calmMode:calm()},placedAssets:[]}),getProgressPercent:()=>progress};
 const expansion=createExpandingForest({world,camera,core,map:{width:58,height:46}});
 const apply=()=>{world.style.transform=camera.getTransform();root.dataset.zoom=camera.zoom.toFixed(4);};
 const size=()=>{
  const rect=root.getBoundingClientRect();
  if(dimensions&&dimensions.width===rect.width&&dimensions.height===rect.height)return;
  dimensions={width:rect.width,height:rect.height};camera.setViewport(rect.width,rect.height);
  if(!root.dataset.initialized){
   const saved=interactive?views.get(key):null;
   if(saved){camera.zoom=saved.zoom;camera.x=saved.x;camera.y=saved.y;}
   else{
    expansion.fit();
    // Keep a little fog in view: its retreat must be visible, without moving the scenery.
    camera.zoom=camera.clampZoom(camera.zoom*.88);camera.centerOnCell(29.4,23.5);
   }
   root.dataset.initialized='true';
  }else camera.clampToBounds();
  apply();
 };
 const observer=new ResizeObserver(size);observer.observe(root);size();
 const finish=()=>{if(disposed)return;const fixed={x:camera.x,y:camera.y,zoom:camera.zoom};progress=fogProgress(local);expansion.update();Object.assign(camera,fixed);root.dataset.fogProgress=String(progress);apply();};
 root.dataset.fogProgress=String(progress);
 if(local>from&&fogProgress(local)>fogProgress(from)&&!calm()){
  root.classList.add('will-clear-fog');
  delay=setTimeout(()=>{if(disposed)return;root.classList.add('clearing-fog');finish();},650);
 }else finish();
 const changedMotion=()=>{if(calm()){clearTimeout(delay);progress=fogProgress(local);expansion.settle();root.dataset.fogProgress=String(progress);apply();}};
 media.addEventListener('change',changedMotion);
 let drag=null;
 const down=e=>{if(!interactive||e.target.closest('button')||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};root.setPointerCapture(e.pointerId);};
 const move=e=>{if(!drag||drag.id!==e.pointerId)return;camera.panBy(e.clientX-drag.x,e.clientY-drag.y);drag.x=e.clientX;drag.y=e.clientY;apply();};
 const up=()=>{drag=null;};
 const zoom=(factor,anchor)=>{camera.setZoom(camera.zoom*factor,anchor||{x:camera.viewportWidth/2,y:camera.viewportHeight/2});apply();};
 const wheel=e=>{if(!interactive||!e.ctrlKey)return;e.preventDefault();const r=root.getBoundingClientRect();zoom(e.deltaY<0?1.12:1/1.12,{x:e.clientX-r.left,y:e.clientY-r.top});};
 const keydown=e=>{
  if(e.target!==root)return;
  const delta={ArrowLeft:[70,0],ArrowRight:[-70,0],ArrowUp:[0,70],ArrowDown:[0,-70]}[e.key];
  if(delta){e.preventDefault();camera.panBy(...delta);apply();}
  else if(e.key==='+'||e.key==='='){e.preventDefault();zoom(1.25);}
  else if(e.key==='-'){e.preventDefault();zoom(.8);}
 };
 root.addEventListener('pointerdown',down);root.addEventListener('pointermove',move);root.addEventListener('pointerup',up);root.addEventListener('pointercancel',up);root.addEventListener('lostpointercapture',up);root.addEventListener('wheel',wheel,{passive:false});root.addEventListener('keydown',keydown);
 const controls=root.querySelector('.forest-map-controls');
 if(controls)controls.onclick=e=>{
  const action=e.target.closest('[data-map-action]')?.dataset.mapAction;if(!action)return;
  if(action==='in')zoom(1.25);if(action==='out')zoom(.8);
  if(action==='fit'){expansion.fit();camera.zoom=camera.clampZoom(camera.zoom*.9);camera.centerOnCell(29.5,24);apply();}
  if(action==='tree'){camera.zoom=camera.clampZoom(Math.min(camera.viewportWidth/1100,camera.viewportHeight/900));camera.centerOnCell(29,22);apply();}
 };
 const images=[...root.querySelectorAll('img')];let pending=images.length;
 const loaded=()=>{if(--pending<=0&&!disposed)root.dataset.ready='true';};
 if(!pending)root.dataset.ready='true';
 images.forEach(img=>{if(img.complete)loaded();else{img.addEventListener('load',loaded,{once:true});img.addEventListener('error',loaded,{once:true});}});
 // Only the source fog interpolation uses animation frames. No perpetual rendering loop.
 return ()=>{
  if(disposed)return;disposed=true;clearTimeout(delay);observer.disconnect();media.removeEventListener('change',changedMotion);
  if(interactive){if(views.size>12)views.delete(views.keys().next().value);views.set(key,{x:camera.x,y:camera.y,zoom:camera.zoom});}
  expansion.dispose();
  root.removeEventListener('pointerdown',down);root.removeEventListener('pointermove',move);root.removeEventListener('pointerup',up);root.removeEventListener('pointercancel',up);root.removeEventListener('lostpointercapture',up);root.removeEventListener('wheel',wheel);root.removeEventListener('keydown',keydown);
  if(controls)controls.onclick=null;
 };
}

export function mountForestMaps(app,state){
 for(const root of app.querySelectorAll('[data-forest-map]')){
  if(!mounted.has(root))mounted.set(root,mount(root,state.settings.motion));
 }
}
