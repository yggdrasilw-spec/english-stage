import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import {
  advanceListening, completeRepeat, examScore, finishPhase, format, listeningPractice,
  mockListening, mockReading, startListening, startMock, validGrade4Exam
} from '../dist/src/grade4-mock.js';
import {audioFiles} from '../dist/src/grade4-mock-audio.js';
import {buildExamAudio} from '../scripts/exam-audio-plan.mjs';
import {initial, validateBackup} from '../dist/src/storage.js';

test('Grade 4 mock matches section counts, and uses separate numbered questions and real audio', async () => {
  const questions = [...mockReading, ...mockListening];
  assert.equal(new Set([...questions, ...listeningPractice].map(q => q.id)).size, 71);
  for (const [section, count] of Object.entries(format.counts)) {
    const items = questions.filter(q => q.section === section);
    assert.equal(items.length, count);
    for (const q of items) {
      assert.equal(q.options.length, section === 'l1' ? 3 : 4);
      assert.equal(new Set(q.options).size, q.options.length);
      assert.ok(q.options[q.answer] && q.explanation);
    }
  }
  assert.deepEqual(mockReading.filter(q => q.passage).map(q => q.passage.title).reduce((counts, title) => {
    counts[title] = (counts[title] || 0) + 1;
    return counts;
  }, {}), {'Riverside Book Swap':2, 'An email from Leo to Hana':3, 'Water for the School Garden':5});
  for (const q of mockReading.filter(q => q.tiles)) {
    const [second, fourth] = q.options[q.answer].split(' と ').map(mark => q.tiles['①②③④⑤'.indexOf(mark)]);
    assert.ok(q.explanation.toLowerCase().includes(' ' + second + ' '));
    assert.ok(q.explanation.toLowerCase().includes(' ' + fourth + ' '));
  }
  for (const q of [...mockListening, ...listeningPractice]) {
    const {path} = buildExamAudio(q);
    assert.equal(audioFiles[q.id], path);
    const data = await readFile(new URL('../dist/' + path, import.meta.url));
    assert.ok(data.length > 1000, q.id);
    assert.ok(data.toString('ascii', 0, 3) === 'ID3' || data[0] === 255, q.id);
  }
});

test('Mock saves valid reading, listening and completed states, with two complete plays and a timed answer window', () => {
  const state = initial();
  const id = 'b64a7dc9-b84e-48d4-98a7-81ef9f16a515';
  const now = 1_000_000;
  const backup = () => validateBackup(JSON.parse(JSON.stringify({app:'english-stage', version:1, state})), new Set());
  startMock(state, id, now);
  startMock(state, 'unwanted', now);
  const run = state.grade4Exam.active;
  assert.equal(run.id, id);
  assert.equal(run.deadline, now + 35 * 60000);
  run.answers[mockReading[0].id] = mockReading[0].answer;
  assert.deepEqual(backup().grade4Exam.active, run);
  finishPhase(state, 'r', now + 1);
  assert.equal(run.phase, 'break');
  startListening(run, now + 2);
  assert.equal(run.deadline, now + 2 + 30 * 60000);
  completeRepeat(run, now + 3);
  assert.equal(run.repeats, 1);
  assert.equal(run.replyUntil, 0);
  advanceListening(state, now + 4);
  assert.equal(run.index, 0);
  completeRepeat(run, now + 5);
  completeRepeat(run, now + 6);
  assert.equal(run.repeats, 2);
  assert.equal(run.replyUntil, now + 10005);
  assert.deepEqual(backup().grade4Exam.active, run);
  run.answers[mockListening[0].id] = mockListening[0].answer;
  advanceListening(state, run.replyUntil);
  assert.equal(run.index, 1);
  assert.equal(run.repeats, 0);
  assert.equal(run.replyUntil, 0);
  const malformed = structuredClone(state.grade4Exam);
  malformed.active.answers[mockListening[2].id] = 3;
  assert.equal(validGrade4Exam(malformed), false);
  advanceListening(state, run.deadline);
  assert.equal(state.grade4Exam.active, null);
  assert.deepEqual(examScore(backup().grade4Exam.latest),
    {r:{correct:1, total:35, answered:1}, l:{correct:1, total:30, answered:1}});
  state.grade4Exam.practice = {index:1, answers:[0,1]};
  assert.deepEqual(backup().grade4Exam.practice, state.grade4Exam.practice);
  state.grade4Exam.practice.answers[1] = 4;
  assert.throws(backup, /4級の模試記録/);
});
