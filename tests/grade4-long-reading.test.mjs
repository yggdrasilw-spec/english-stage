import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readingSets, questionsForReadingSet} from '../dist/src/grade4-long-reading.js';
import {initial} from '../dist/src/storage.js';
import {createGrade4Session, currentQuestion, submitGrade4, nextGrade4, courseStats, validGrade4} from '../dist/src/grade4-core.js';

test('long reading resumes without an evidence draft and records help separately from bridge reading', () => {
  const state = initial();
  const session = createGrade4Session(state, readingSets[0].id, 'reading');
  assert.equal(session.queue.length, 4);
  assert.throws(() => submitGrade4(state, {choice: 0, evidence: 0}), /Invalid evidence/);
  assert(submitGrade4(state, {choice: currentQuestion(state).answer}));
  assert.equal(submitGrade4(state, {choice: 0}), false);
  const resumed = structuredClone(state);
  assert(validGrade4(resumed.grade4));
  assert.deepEqual(createGrade4Session(resumed, 'future'), session);
  assert(nextGrade4(resumed));
  resumed.grade4.session.supported = [...session.queue];
  assert(submitGrade4(resumed, {choice: currentQuestion(resumed).answer}));
  assert.deepEqual(resumed.grade4.attempts.map(attempt => [attempt.evidence, attempt.guided]), [[null, false], [null, true]]);
  assert.equal(resumed.forest.total, 2);
  assert.equal(courseStats(resumed).reading.answered, 0);
  assert(validGrade4(resumed.grade4));
});

test('long reading backups reject mixed passage queues and evidence that was never selected', () => {
  const state = initial();
  createGrade4Session(state, readingSets[0].id, 'reading');
  submitGrade4(state, {choice: 0});
  const corruptEvidence = structuredClone(state.grade4);
  corruptEvidence.attempts[0].evidence = 0;
  assert.equal(validGrade4(corruptEvidence), false);
  const wrongQueue = structuredClone(state.grade4);
  const other = questionsForReadingSet(readingSets[1].id)[0].id;
  wrongQueue.session.orders[other] = wrongQueue.session.orders[wrongQueue.session.queue[0]];
  wrongQueue.session.queue[0] = other;
  assert.equal(validGrade4(wrongQueue), false);
});
