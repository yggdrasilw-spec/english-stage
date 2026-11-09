import {units, questions} from './grade4-content.js';
import {readingSets, questionsForReadingSet} from './grade4-long-reading.js';
import {vocabularySets, questionsForVocabularySet} from './grade4-vocabulary.js';
import {tokyoDay, unitStatus} from './grade4-core.js';

const dayMs = 86400000;
const dayNumber = date => Date.parse(date + 'T00:00:00Z') / dayMs;
export const addDays = (date, days) => new Date((dayNumber(date) + days) * dayMs).toISOString().slice(0, 10);

export function validGrade4Goal(goal) {
  if (!goal || typeof goal.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(goal.date)) return false;
  return Number.isFinite(dayNumber(goal.date)) && addDays(goal.date, 0) === goal.date &&
    Number.isInteger(goal.minutes) && goal.minutes >= 5 && goal.minutes <= 90;
}

const unitTasks = units.map(unit => ({
  id: unit.id, title: unit.title, mode: 'learn', kind: '単元', minutes: 12,
  versions: ['a', 'b'].map(variant => questions.filter(q => q.unit === unit.id && q.variant === variant).map(q => q.id))
}));
const vocabTasks = vocabularySets.map(set => ({
  id: set.id, title: set.title, mode: 'vocabulary', kind: 'ことば', minutes: 5,
  versions: ['a', 'b'].map(variant => questionsForVocabularySet(set.id, variant).map(q => q.id))
}));
const readingTasks = readingSets.map(set => ({
  id: set.id, title: set.title, mode: 'reading', kind: '読解', minutes: 8,
  versions: [questionsForReadingSet(set.id).map(q => q.id)]
}));
// Give the learner different types of work as they move through the list.
const tasks = unitTasks.flatMap((unit, index) => [
  unit, ...vocabTasks.slice(index, index + 1), ...readingTasks.slice(index, index + 1)
]);
const questionTasks = new Map(tasks.flatMap(task => task.versions.flat().map(id => [id, task])));

function completionDates(attempts) {
  const sessions = new Map();
  for (const answer of attempts) {
    const task = questionTasks.get(answer.qid);
    if (!task) continue;
    const key = answer.sid + ':' + task.id;
    if (!sessions.has(key)) sessions.set(key, {task, answers: new Set(), last: 0});
    const session = sessions.get(key);
    session.answers.add(answer.qid);
    session.last = Math.max(session.last, answer.at);
  }
  const dates = new Map();
  for (const {task, answers, last} of sessions.values()) {
    if (!task.versions.some(ids => ids.every(id => answers.has(id)))) continue;
    if (!dates.has(task.id)) dates.set(task.id, new Set());
    dates.get(task.id).add(tokyoDay(last));
  }
  return dates;
}

function fitsToday(queue, budget) {
  const selected = [];
  for (const task of queue) {
    if (task.minutes > budget) continue;
    selected.push(task);
    budget -= task.minutes;
  }
  return selected;
}

export function grade4Plan(state, now = Date.now()) {
  const today = tokyoDay(now);
  const goal = state.grade4Goal;
  const dates = completionDates(state.grade4?.attempts || []);
  const remaining = tasks.filter(task => !dates.has(task.id));
  const run = state.grade4?.session;
  const pending = run && run.index < run.queue.length ? run : null;
  const base = {today, remaining, total: tasks.length, pending};
  if (!validGrade4Goal(goal)) return base;
  // Calendar days in Japan, including today, with the test day reserved.
  const days = Math.max(0, dayNumber(goal.date) - dayNumber(today));
  const spent = tasks.filter(task => dates.get(task.id)?.has(today)).reduce((sum, task) => sum + task.minutes, 0);
  const todayMinutes = days ? Math.max(0, goal.minutes - spent) : 0;
  const todayTasks = fitsToday(remaining, todayMinutes);
  let later = remaining.filter(task => !todayTasks.includes(task));
  for (let day = 1; day < days && later.length; day++) {
    const next = fitsToday(later, goal.minutes);
    if (!next.length) break;
    later = later.filter(task => !next.includes(task));
  }
  const review = !remaining.length && unitTasks.find(task =>
    task.minutes <= todayMinutes && !dates.get(task.id)?.has(today) && unitStatus(state, task.id, now).due
  );
  return {...base, days, spent, todayMinutes, todayTasks, unscheduled: later.length, review};
}
