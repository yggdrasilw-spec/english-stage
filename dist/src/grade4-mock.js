import {examFormats, readingSections, score} from './exam-format.js';
import {mockReading} from './grade4-mock-reading.js';
import {mockListening, listeningPractice} from './grade4-mock-listening.js';

export {mockReading, mockListening, listeningPractice};
export const format = examFormats[4];
export const sections = {...readingSections, l1:'会話への応答', l2:'会話の内容', l3:'短い英文の内容'};
export const answerSeconds = 10;
const exam = {questions:[...mockReading, ...mockListening]};
const questionsById = new Map(exam.questions.map(q => [q.id, q]));
const phaseQuestions = {r:mockReading, l:mockListening};
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const time = value => Number.isSafeInteger(value) && value >= 0;
export const examScore = run => score(exam, run);
export const phaseDeadline = (phase, now) => now + format.minutes[phase] * 60000;

export function startMock(state, id, now = Date.now()) {
  const examState = state.grade4Exam ||= {active:null, latest:null};
  if (examState.active) return;
  examState.active = {id, phase:'r', index:0, answers:{}, startedAt:now, deadline:phaseDeadline('r', now), repeats:0, replyUntil:0};
}

export function finishPhase(state, phase, now = Date.now()) {
  const examState = state.grade4Exam;
  const run = examState?.active;
  if (!run || run.phase !== phase) return;
  if (phase === 'r') {
    Object.assign(run, {phase:'break', index:0, deadline:0});
  } else if (phase === 'l') {
    examState.latest = {id:run.id, startedAt:run.startedAt, finishedAt:now, answers:run.answers};
    examState.active = null;
  }
}

export function startListening(run, now = Date.now()) {
  if (run.phase === 'break') Object.assign(run, {phase:'l', deadline:phaseDeadline('l', now)});
}

export function completeRepeat(run, now = Date.now()) {
  if (run.phase !== 'l' || now >= run.deadline || run.repeats >= 2) return;
  run.repeats++;
  if (run.repeats === 2) run.replyUntil = now + answerSeconds * 1000;
}

export function advanceListening(state, now = Date.now()) {
  const run = state.grade4Exam?.active;
  if (run?.phase !== 'l') return;
  if (now >= run.deadline) {
    finishPhase(state, 'l', now);
  } else if (run.replyUntil && now >= run.replyUntil) {
    if (run.index + 1 === mockListening.length) finishPhase(state, 'l', now);
    else Object.assign(run, {index:run.index + 1, repeats:0, replyUntil:0});
  }
}

function validAnswers(answers, allow) {
  return object(answers) && Object.entries(answers).every(([id, choice]) => {
    const q = questionsById.get(id);
    return q && allow(q) && Number.isInteger(choice) && choice >= 0 && choice < q.options.length;
  });
}

function validRun(run) {
  if (!object(run) || typeof run.id !== 'string' || !/^[a-f\d-]{36}$/.test(run.id) || !time(run.startedAt)) return false;
  return true;
}

export function validGrade4Exam(record) {
  if (!object(record)) return false;
  const {active, latest, practice} = record;
  if (practice !== undefined && (!object(practice) || !Number.isInteger(practice.index) ||
      practice.index < 0 || practice.index > listeningPractice.length || !Array.isArray(practice.answers) ||
      practice.answers.length < practice.index || practice.answers.length > Math.min(practice.index + 1, listeningPractice.length) ||
      practice.answers.some((choice, index) => !Number.isInteger(choice) || choice < 0 || choice >= listeningPractice[index].options.length))) return false;
  if (latest !== null && (!validRun(latest) || !time(latest.finishedAt) ||
      latest.finishedAt < latest.startedAt || !validAnswers(latest.answers, () => true))) return false;
  if (active === null) return true;
  if (!validRun(active) || !['r', 'break', 'l'].includes(active.phase) ||
      !Number.isInteger(active.index) || !time(active.deadline) || !time(active.replyUntil) ||
      !Number.isInteger(active.repeats) || active.repeats < 0 || active.repeats > 2) return false;
  const {phase, index, deadline, repeats, replyUntil, startedAt} = active;
  if (phase === 'break' && (index !== 0 || deadline !== 0)) return false;
  if (phase !== 'break' && (deadline <= startedAt || index < 0 || index >= phaseQuestions[phase].length)) return false;
  if (phase !== 'l' && repeats !== 0) return false;
  if (repeats < 2 ? replyUntil !== 0 : replyUntil <= startedAt || replyUntil > deadline + answerSeconds * 1000) return false;
  return validAnswers(active.answers, q => q.section.startsWith('r') ||
    (phase === 'l' && mockListening.indexOf(q) <= index));
}
