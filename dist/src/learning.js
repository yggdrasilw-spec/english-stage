export const screeningResult=(s,id)=>s.screening?.results?.[id]?.status;
export const isKnown=(s,id)=>screeningResult(s,id)==='known';
export function verifyScreening(s,id,quality,at=Date.now()){
 if(isKnown(s,id)&&['wrong','guess'].includes(quality))setScreening(s,id,'unsure',at);
}
export function scanStats(cards,s){
 const checked=cards.filter(c=>screeningResult(s,c.id));
 return {total:cards.length,checked:checked.length,known:checked.filter(c=>isKnown(s,c.id)).length,remaining:cards.length-checked.length};
}
export function setScreening(s,id,status,at=Date.now()){
 s.screening||={results:{},undo:[]};s.screening.results||={};s.screening.undo||=[];
 s.screening.undo.push({id,before:s.screening.results[id]||null});s.screening.undo=s.screening.undo.slice(-30);
 s.screening.results[id]={status,at};
}
export function undoScreening(s){const prev=s.screening?.undo?.pop();if(prev){if(prev.before)s.screening.results[prev.id]=prev.before;else delete s.screening.results[prev.id];}return prev?.id;}
export function readiness(cards,s,now=Date.now()){
 const eligible=s.history.filter(h=>['read','listen'].includes(h.skill)&&h.at>=now-30*86400000);
 const latest=new Map();for(const h of eligible){const key=h.id+':'+h.skill;if(!latest.has(key)||latest.get(key).at<=h.at)latest.set(key,h);}
 const counts={read:0,listen:0},tested={read:0,listen:0};let credit=0;
 for(const c of cards)for(const skill of ['read','listen']){
  const h=latest.get(c.id+':'+skill);if(!h)continue;tested[skill]++;
  if(h.quality==='correct'){counts[skill]++;const p=s.progress[c.id]?.[skill];credit+=p?.mastered?1:p?.days?.length>=2?.75:.5;}
 }
 return {percent:Math.round(100*credit/(cards.length*2||1)),counts,tested,total:cards.length,assessed:latest.size};
}
export function conversationPrompt(cards,s,topic='学校と好きなもの',turns=5){
 const known=cards.filter(c=>isKnown(s,c.id)||['read','listen','recall'].some(k=>s.progress[c.id]?.[k]?.lastQuality==='correct'));
 const weak=cards.filter(c=>!isKnown(s,c.id)&&(['unsure','unknown'].includes(screeningResult(s,c.id))||['read','listen','recall'].some(k=>['wrong','guess'].includes(s.progress[c.id]?.[k]?.lastQuality))));
 const sortWeak=c=>Object.values(s.progress[c.id]||{}).reduce((n,p)=>n+(p.lastQuality==='wrong'?3:p.lastQuality==='guess'?2:0),0);
 weak.sort((a,b)=>sortWeak(b)-sortWeak(a));
 const samples=list=>list.map(c=>`${c.en}（${c.ja}）`).join('、')||'まだ記録がありません。最初に簡単な語で様子を確かめてください。';
 const r=readiness(cards,s);const n=[3,5,8].includes(+turns)?+turns:5;
 return `あなたは、日本語を話す小学生のための、やさしい英語の会話相手です。目標は英検5級。これから音声会話で練習します。\n【今の学習記録】\nアプリの準備度：${r.percent}%（語彙・表現の確認範囲であり合格確率ではありません）。\n読んで最近正解：${r.counts.read}/${cards.length}、聞いて最近正解：${r.counts.listen}/${cards.length}。会話力は未測定です。\n理解済み候補（自己申告を含みます）：${samples(known.filter(c=>c.kind==='word').slice(0,35))}\n使えそうな表現：${samples(known.filter(c=>c.kind==='phrase').slice(0,8))}\n今回優先したい苦手：${samples(weak.slice(0,8))}\n【会話の進め方】\n話題は「${topic}」。${n}往復だけ、約2〜3分で小さな成功体験を作ってください。米国英語をゆっくり、1回に短い1文・質問1つだけ話し、必ず私の返事を待ってください。簡単な現在形、be動詞、can、身近な単語を中心にしてください。\n最初の2問で難しさを調整し、苦手語のうち2〜3語を自然に使ってください。知らない語は短い日本語と簡単な例を添えます。「わからない」「もう一度」と言ったり返答に困ったりしたら、日本語のヒント→英語2択→短いお手本の順で助け、繰り返せたらほめてください。答えを急がせないでください。\n誤りは毎回1点まで、意味を受け止めてから自然な短い文に言い換え、もう1回言う機会をください。発音を聞き取れないときは推測で採点せず聞き返してください。氏名・学校名・住所・連絡先などの個人情報は尋ねず、架空の人物や場所で練習してください。\n${n}往復が終わったら、日本語で「できたこと」2つ、「次の一歩」1つ、練習した英語3つを伝えて終了してください。合格確率は出さないでください。\nまず日本語で「短い会話を${n}回やってみよう」と言い、やさしい英語の質問を1つだけしてください。`;
}
