// Compare complete recognized words, never substrings or fuzzy spelling.
export function normalizeAnswer(value){
 const numbers=['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
 return String(value??'').normalize('NFKC').toLowerCase().trim().replace(/[’‘]/g,"'").replace(/[.!?,;:。！？]+$/g,'').replace(/-/g,' ').trim().replace(/\s+/g,' ').replace(/\b\d+\b/g,n=>numbers[Number(n)]??n);
}
export const matchesAnswer=(card,transcript)=>normalizeAnswer(card.en)===normalizeAnswer(transcript);
export function speakingPool(cards,theme='all'){
 // Teaching diagrams can print the English answer inside the bitmap/SVG.
 // Keep the two reviewed, count-only tooth diagrams; omit other teaching diagrams.
 return cards.filter(c=>c.kind==='word'&&c.image?.url&&
  (['g5-w-tooth','g5-w-teeth'].includes(c.id)||
   !/diagram|assets\/vocabulary\/|図/.test(c.image.url+' '+(c.image.sourceSheet||'')+' '+(c.image.credit||'')))&&
  (theme==='all'||c.theme===theme));
}
export function shuffledCards(cards,random=Math.random){
 const result=[...cards];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}return result;
}
