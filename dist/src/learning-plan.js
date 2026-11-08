import {goalPlan,wordStatus} from './evidence.js';
import {dueTasks,dayKey,DAY,skills} from './scheduler.js';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function automaticTasks(cards,s,now=Date.now()){
 const due=dueTasks(cards,s,now),out=[],keys=new Set();
 const add=t=>{const key=t.id+':'+t.skill;if(!keys.has(key)){keys.add(key);out.push(t);}};
 due.forEach(add);
 const g=goalPlan(cards,s,now);
 // Continue today's quota on reload. A new visit cannot create another quota.
 for(const c of cards.filter(c=>s.seen[c.id]))for(const skill of skills)if(!s.progress[c.id]?.[skill]&&wordStatus(s,c.id).key!=='settled')add({id:c.id,skill,due:now});
 for(const c of cards.filter(c=>c.level!=='extension'&&!s.seen[c.id]).slice(0,g.available))add({id:c.id,skill:'read',due:now});
 return out.slice(0,60);
}
export function renderGoal({app,cards,state,mutate,tell},startFast){
 const g=goalPlan(cards,state),goal=state.goal||{},min=dayKey(Date.now()+DAY),date=goal.date||dayKey(Date.now()+60*DAY);
 app.innerHTML=`<div class="narrow"><a href="#home">← ホーム</a><div class="eyebrow">MY LEARNING ADVENTURE</div><h1>いつまでに、どこまで？</h1><section class="panel goal-garden"><h2>🌳 ことばの森を育てよう</h2><p>まず5級の単語・表現をしっかり。4級への土台をつくろう。</p><form id="goal-form"><label>目標の日 <input id="goal-date" type="date" min="${min}" value="${date}" required></label><label>1日に新しく出会う上限 <input id="goal-limit" type="number" min="1" max="50" value="${goal.dailyLimit||10}" required>こ</label><button class="primary">計画を保存する</button></form><p>目標まで <strong>${g.days}日</strong> · まだ出会っていない ${g.fresh}こ</p><p>新しいことばは1日 <strong>${g.newCount}こ</strong>が目安。今日はあと${g.available}こ。復習を先に出します。</p>${g.overloaded?'<p role="status">今の期間だと1日の上限を超えます。目標日を延ばすか、上限を見直そう。</p>':''}<p class="muted">最後の14日は復習の余白。長期定着は最短でも約115日かけて確認するため、目標日だけで「忘れない」とは判定しません。4級の教材全体・合格判定はまだ含みません。</p><button id="goal-start" class="primary">今日のおすすめを自動で出す →</button><p id="goal-empty" role="status"></p></section><section class="panel"><h2>思い出すほど、根が強くなる</h2><p>1日 → 3日 → 7日 → 14日 → 30日 → 60日と間隔をあけて確認。早めの練習は間隔を進めません。ヒントの後や自己申告は、自力正解と分けて記録します。</p><p>読む・聞く・英語にするの3つで60日後の確認までできたら、自動出題をお休み。ことば帳からいつでも練習でき、まちがえた技能は復習へ戻ります。</p></section></div>`;
 app.querySelector('#goal-form').onsubmit=e=>{e.preventDefault();const date=app.querySelector('#goal-date').value,dailyLimit=Number(app.querySelector('#goal-limit').value);if(date<min||!Number.isInteger(dailyLimit)||dailyLimit<1||dailyLimit>50)return;tell('目標を保存しました。今日の量は記録に合わせて調整します。');mutate(s=>{s.goal={date,dailyLimit};});};
 app.querySelector('#goal-start').onclick=async()=>{const tasks=automaticTasks(cards,state);if(!tasks.length){app.querySelector('#goal-empty').textContent='今日の分はできたよ！ 次の復習まで、好きな遊びを楽しもう。';return;}await mutate(s=>{startFast(s,cards,'read');s.fast.ids=tasks.map(t=>t.id);s.fast.tasks=tasks;s.fast.planned=true;s.fast.auto=false;});location.hash='fast';};
}
