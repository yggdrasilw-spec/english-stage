const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const seconds=ms=>(ms/1000).toFixed(1)+'秒';
export function karutaGrowth(result){
 if(!result)return {notes:['比べる記録はこれから'],improved:false};
 const {previous:p,current:c,first}=result,notes=[];
 if(first)notes.push('はじめて取れた！');
 if(p){
  if(c.mistakes<p.mistakes)notes.push(`おてつきが${p.mistakes-c.mistakes}回へった！`);
  if(c.comparable&&p.comparable&&c.plays<p.plays)notes.push(`聞き直しが${p.plays-c.plays}回へった！`);
  const same=c.comparable&&p.comparable&&c.choices===p.choices&&c.slow===p.slow&&c.plays===p.plays&&c.mistakes===p.mistakes;
  if(same&&c.ms!==null&&p.ms!==null&&p.ms-c.ms>=100)notes.push(`${((Math.round(p.ms/100)-Math.round(c.ms/100))/10).toFixed(1)}秒速く取れた！`);
 }
 return {notes:notes.length?notes:[p?'今回も取れた！':'比べる記録はこれから'],improved:!!p&&notes.length>0};
}
export function renderKarutaResults(run,byId){
 const rows=run.ids.map(id=>({id,result:run.results?.[id],growth:karutaGrowth(run.results?.[id])}));
 rows.sort((a,b)=>Number(b.growth.improved)-Number(a.growth.improved)||Number(b.result?.first||false)-Number(a.result?.first||false));
 const improved=rows.filter(r=>r.growth.improved).length,fresh=rows.filter(r=>r.result?.first).length;
 const summary=[improved?`${improved}語で、前よりできたことがふえたよ！`:'',fresh?`${fresh}語を、はじめて取れたよ！`:''].filter(Boolean).join(' ')||'今日もことばを練習できたね。';
 const metric=(c,key)=>!c?'—':key==='ms'?(c.ms===null?'—':seconds(c.ms)):key==='plays'?c.comparable?Math.max(0,c.plays-1)+'回':'—':c.mistakes+'回';
 const comparison=(p,c)=>[['時間','ms'],['おてつき','mistakes'],['聞き直し','plays']].map(([label,key])=>`<span><small>${label}</small>${metric(p,key)} → ${metric(c,key)}</span>`).join('');
 const table=items=>`<table class="karuta-growth-table"><caption class="sr-only">同じことばの前回と今回、できたことの比較</caption><thead><tr><th scope="col">ことば</th><th scope="col">前回 → 今回</th><th scope="col">できたこと</th></tr></thead><tbody>${items.map(({id,result:r,growth:g})=>{const c=byId.get(id);return `<tr><th scope="row"><span lang="en">${esc(c.en)}</span><small>${esc(c.ja)}</small></th><td><div class="karuta-growth-pair">${comparison(r?.previous,r?.current)}</div></td><td class="${g.improved||r?.first?'karuta-growth-good':''}">${g.notes.map(n=>`<span>${esc(n)}</span>`).join('')}</td></tr>`;}).join('')}</tbody></table>`;
 return `<section class="karuta-growth" aria-labelledby="karuta-growth-title"><h3 id="karuta-growth-title">今日のできた！</h3><p class="karuta-growth-summary">${summary}</p><p class="muted">同じことば・同じ札の表示で、前に取ったときと比べています。</p>${table(rows.slice(0,3))}${rows.length>3?`<details><summary>のこり${rows.length-3}語の記録を見る</summary>${table(rows.slice(3))}</details>`:''}<small class="muted">速さは残り枚数・再生方法・聞いた回数・おてつきが同じときだけ比べます。途中で休んだときの聞き直しは「—」。ゆっくり確かめて取るのも大切だよ。</small></section>`;
}
