import {addDays, grade4Plan, validGrade4Goal} from './grade4-plan.js';
import {createGrade4Session} from './grade4-core.js';

export function renderGrade4Plan({app, state, mutate, tell}) {
  const plan = grade4Plan(state);
  const goal = validGrade4Goal(state.grade4Goal) ? state.grade4Goal : null;
  const min = addDays(plan.today, 1);
  const date = goal?.date >= min ? goal.date : addDays(plan.today, 30);
  const picks = plan.todayTasks?.length ? plan.todayTasks : plan.review ? [plan.review] : [];
  const activeMock = state.grade4Exam?.active;
  app.innerHTML = `<div class="narrow g4-wrap">
    <a href="#home">← 4級ホーム</a>
    <div class="eyebrow">GRADE 4 · STUDY PLAN</div><h1>受験日までの学習計画</h1>
    <section class="panel">
      <form id="g4-goal-form" class="g4-plan-form">
        <label>受験日 <input name="date" type="date" min="${min}" max="9999-12-31" value="${date}" required></label>
        <label>1日に使える時間（分） <input name="minutes" type="number" min="5" max="90" value="${goal?.minutes ?? 15}" required></label>
        <button class="primary">計画を保存する</button>
      </form>
      <p class="muted">単元・ことば・長文を、まず各1回解き終える計画です。受験当日は予定に入れません。</p>
    </section>
    <section class="panel"><h2>今日の練習</h2>
      <p>ひと通り解いた練習 <strong>${plan.total - plan.remaining.length} / ${plan.total}</strong></p>
      ${goal ? `<p>受験日 <time datetime="${goal.date}">${goal.date}</time> · 学習に使える日 あと${plan.days}日</p>
        ${plan.days ? `<p>今日終えた練習は約${plan.spent}分。残りの目安は <strong>${plan.todayMinutes}分</strong>。</p>` : '<p>設定した受験日以降です。次の計画を立てるときは受験日を更新しましょう。</p>'}
        ${plan.days && plan.unscheduled ? `<p role="status">この時間配分では、受験日までに${plan.unscheduled}件が入りきらない見込みです。単元の目安は12分、長文は8分、ことばは5分です。</p>` : ''}
      ` : '<p>受験日と時間を保存すると、今日の練習を提案します。</p>'}
      ${plan.pending ? '<a class="button-link primary" href="#grade4">途中の練習をつづける →</a>' : ''}
      ${picks.length ? `<ul class="g4-plan-tasks">${picks.map(task => `<li><button data-g4-plan-task="${task.id}" ${plan.pending ? 'disabled' : ''}>${plan.review ? '復習' : task.kind} · ${task.title}（約${task.minutes}分） →</button></li>`).join('')}</ul>` : ''}
      ${goal && plan.days && !picks.length && !plan.pending ? '<p>今日の枠に入る練習はありません。4級ホームから好きな練習も選べます。</p>' : ''}
    </section>
    <section class="panel"><h2>別の時間に取り組める練習</h2>
      <p><a href="#grade4-dialogue">会話の聞き取り（6問）</a> · <a href="#grade4-speaking">スピーキング（任意）</a></p>
      <p>模試の目安は、読む35分・聞く最大30分です。読む問題が終わったあと、聞く問題の開始前に休憩できます。</p>
      <a class="button-link" href="#grade4-mock">${activeMock ? '模試のつづきへ' : '実戦模試を開く'} →</a>
    </section>
  </div>`;
  app.querySelector('#g4-goal-form').onsubmit = async event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = {date: data.get('date'), minutes: Number(data.get('minutes'))};
    if (!validGrade4Goal(next) || next.date <= grade4Plan(state).today) {
      tell('明日以降の日付と、5〜90分の時間を入力してください。');
      return;
    }
    await mutate(saved => { saved.grade4Goal = next; }, {queue: true});
  };
  app.querySelectorAll('[data-g4-plan-task]').forEach(button => {
    button.onclick = async () => {
      const id = button.dataset.g4PlanTask;
      let started = false;
      await mutate(saved => {
        const current = grade4Plan(saved);
        const task = current.todayTasks?.find(item => item.id === id) ||
          (current.review?.id === id ? current.review : null);
        if (!task && !current.pending) return;
        saved.course = 4;
        if (!current.pending) createGrade4Session(saved, task.id, task.mode);
        started = true;
      }, {queue: true});
      if (started && location.hash === '#grade4-plan') location.hash = 'grade4';
    };
  });
}
