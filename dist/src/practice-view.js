// Keep phone practice at the start of each question or answer, including after scrolling details.
export function showPracticeStep(element,stickyHeader=null){
 if(!matchMedia('(max-width:700px)').matches)return;
 requestAnimationFrame(()=>{
  if(!element.isConnected)return;
  const target=element.querySelector('[data-practice-focus]')||element;
  target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
  const offset=stickyHeader?.getBoundingClientRect().height||0;
  const top=element.getBoundingClientRect().top+window.scrollY-offset-8;
  window.scrollTo({top:Math.max(0,top),behavior:'instant'});
 });
}
export function practiceDetails(inside,wrong=false){
 return `<details class="practice-details" ${wrong||matchMedia('(min-width:701px)').matches?'open':''}><summary>例文・解説を見る</summary>${inside}</details>`;
}
