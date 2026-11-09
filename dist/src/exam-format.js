export const readingSections = {
  r1:'短文の空所補充', r2:'会話文の空所補充', r3:'語句の並べ替え', r4:'長文の内容'
};

export const examFormats = {
  4:{minutes:{r:35, l:30}, counts:{r1:15,r2:5,r3:5,r4:10,l1:10,l2:10,l3:10}},
  5:{minutes:{r:25, l:20}, counts:{r1:15,r2:5,r3:5,l1:10,l2:5,l3:10}}
};

export function score(exam, run) {
  return Object.fromEntries(['r', 'l'].map(phase => {
    const questions = exam.questions.filter(question => question.section.startsWith(phase));
    return [phase, {
      correct:questions.filter(question => run.answers[question.id] === question.answer).length,
      total:questions.length,
      answered:questions.filter(question => Number.isInteger(run.answers[question.id])).length
    }];
  }));
}
