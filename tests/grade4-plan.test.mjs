import {test} from 'node:test';
import assert from 'node:assert/strict';
import {grade4Plan, validGrade4Goal} from '../dist/src/grade4-plan.js';
import {createGrade4Session, currentQuestion, nextGrade4, submitGrade4} from '../dist/src/grade4-core.js';
import {initial, validateBackup} from '../dist/src/storage.js';

// One minute before midnight in Tokyo.
const now = Date.parse('2026-11-09T14:59:00Z');
const goal = {date: '2026-11-10', minutes: 10};
const stateWithGoal = () => ({...initial(), grade4Goal: {...goal}});

test('the Grade 4 plan uses Tokyo dates and chooses sessions that fit the budget', () => {
  const state = stateWithGoal();
  const plan = grade4Plan(state, now);
  assert.equal(plan.total, 22);
  assert.equal(plan.days, 1);
  assert.deepEqual(plan.todayTasks.map(task => task.mode), ['vocabulary', 'vocabulary']);
  assert.equal(plan.unscheduled, 20);
  assert.equal(grade4Plan(state, now + 60000).days, 0);
  assert.deepEqual(grade4Plan(state, now + 60000).todayTasks, []);
  assert.equal(grade4Plan({...state, grade4Goal: {date: '2026-12-01', minutes: 15}}, now).unscheduled, 0);
  assert.equal(grade4Plan({...state, grade4Goal: {date: '2026-12-01', minutes: 5}}, now).unscheduled, 13);
});

test('partial work can be resumed, and completing a set updates today’s remaining time', () => {
  const state = stateWithGoal();
  const run = createGrade4Session(state, 'library-club', 'vocabulary', now);
  submitGrade4(state, {choice: 0}, now);
  nextGrade4(state);
  assert.equal(grade4Plan(state, now).pending, run);
  assert.equal(grade4Plan(state, now).spent, 0);
  while (currentQuestion(state)) {
    submitGrade4(state, {choice: 0}, now);
    nextGrade4(state);
  }
  const plan = grade4Plan(state, now);
  assert.equal(plan.pending, null);
  assert.equal(plan.spent, 5);
  assert.equal(plan.todayMinutes, 5);
  assert.deepEqual(plan.todayTasks.map(task => task.id), ['getting-around']);
  assert(!plan.remaining.some(task => task.id === 'library-club'));
});

test('Grade 4 goals are optional in backups and invalid calendar dates are rejected', () => {
  const backup = state => ({app: 'english-stage', version: 1, state});
  assert.equal(validateBackup(backup(initial()), new Set()).grade4Goal, undefined);
  assert.deepEqual(validateBackup(backup(stateWithGoal()), new Set()).grade4Goal, goal);
  for (const bad of [{date: '2026-02-29', minutes: 10}, {date: '2026-11-31', minutes: 10}, {...goal, minutes: 4}, {...goal, minutes: 10.5}]) {
    assert(!validGrade4Goal(bad));
    assert.throws(() => validateBackup(backup({...initial(), grade4Goal: bad}), new Set()));
  }
});
