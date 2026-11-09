// Original reading practice. Paragraphs stay visible while answers are recorded.
export const readingSets = [
  {
    id: 'g4-reading-notice',
    kind: '掲示',
    title: '図書館のブックフェア',
    heading: 'Book Fair at West Library',
    paragraphs: [
      'West Library will have a book fair this Saturday from ten to three. The fair was going to be in the garden, but it will be in the meeting room because it may rain.',
      'You can bring one book from home and take a different book. Please write your name on a small card when you give your book to a library worker. You do not have to bring a book if you only want to look around.',
      'At one, a library worker will read a story for children in the reading room. This is a different room from the book fair. You can listen to the story even if you do not visit the fair.'
    ],
    translations: [
      '西図書館では、今週土曜日の10時から3時までブックフェアを開きます。庭で開く予定でしたが、雨が降るかもしれないので会議室で開きます。',
      '家から本を1冊持ってきて、別の本を1冊持ち帰ることができます。図書館の人に本を渡すときに、小さなカードに名前を書いてください。見て回るだけなら本を持ってくる必要はありません。',
      '1時には、読書室で図書館の人が子ども向けに物語を読みます。ブックフェアとは別の部屋です。フェアに行かなくても物語を聞けます。'
    ],
    hint: '会場・時刻・持ち物を分けて探そう。予定が変わった場所にも注意。fair はここでは催し、look around は見て回ること。',
    items: [
      ['Where will the book fair be?', 'In the meeting room.', ['In the garden.', 'In the reading room.', 'In front of the library.'], '庭は初めの予定。but の後ろが実際の会場です。', 0],
      ['What should you do when you give your book to a worker?', 'Write your name on a card.', ['Write the name of the book.', 'Read a story to a child.', 'Pay for the book.'], '本を渡すときにすることは第2段落の write your name on a small card です。', 1],
      ['Does someone have to bring a book just to look around?', 'No, they do not.', ['Yes, everyone must bring one.', 'Yes, they must bring two.', 'Yes, but only after one.'], 'do not have to は「する必要がない」。見て回るだけなら本は不要です。', 1],
      ['Which is true about the story at one?', 'People can listen without visiting the fair.', ['It is in the meeting room.', 'It starts when the fair opens.', 'People must bring a book to listen.'], '最後の文に、フェアに行かなくても聞けるとあります。', 2]
    ]
  },
  {
    id: 'g4-reading-email',
    kind: 'メール',
    title: '土曜日の工作クラブ',
    heading: 'Subject: Our club this Saturday',
    paragraphs: [
      'Hi Maya, I am going to the art club this Saturday. I wanted to make a paper house last week, but I did not finish it. This time I want to make a paper garden for the house.',
      'My brother Leo is coming, too. He enjoys drawing pictures, but he does not want to make a garden. He is going to draw a picture of our town for his teacher. I will bring two large sheets of paper, so you do not have to bring paper for us.',
      'Can we meet by the school gate at nine thirty? The club starts at ten, but I want to ask Ms. Green for help before it starts. After the club, Leo and I will eat lunch at home. See you, Nora'
    ],
    translations: [
      'マヤへ。今週土曜日に工作クラブに行きます。先週は紙の家を作りたかったのですが、完成しませんでした。今回は、その家のために紙の庭を作りたいです。',
      '弟のレオも来ます。絵を描くのが好きですが、庭を作りたいわけではありません。先生のために私たちの町の絵を描く予定です。私が大きな紙を2枚持っていくので、私たちの分の紙を持ってくる必要はありません。',
      '9時半に校門のそばで会えますか。クラブは10時に始まりますが、その前にグリーン先生に助けを頼みたいです。クラブの後、レオと私は家で昼食を食べます。それでは、ノラ。'
    ],
    hint: 'ノラ・レオ・マヤのうち、だれの予定か確かめよう。sheets of paper は「紙を何枚」の sheets。',
    items: [
      ['What does Nora want to make this Saturday?', 'A paper garden.', ['A paper house.', 'A picture of the town.', 'A card for Maya.'], '紙の家は先週。This time の後ろに今回作りたいものがあります。', 0],
      ['Who is Leo going to draw a picture for?', 'His teacher.', ['Nora.', 'Maya.', 'His father.'], '第2段落の for his teacher が絵を渡す相手です。', 1],
      ['Why does Nora want to meet at nine thirty?', 'She wants to ask Ms. Green for help before the club starts.', ['She wants to eat lunch at school.', 'The club starts at nine thirty.', 'She wants to buy some paper before school.'], 'クラブは10時からですが、始まる前に先生に頼みたいとあります。', 2],
      ['Which is true about the paper?', 'Nora will bring two large sheets.', ['Maya has to bring paper for both of them.', 'Leo will buy all the paper.', 'Nora does not need any paper.'], '第2段落の終わりに、ノラが大きな紙を2枚持っていくとあります。', 1]
    ]
  },
  {
    id: 'g4-reading-description',
    kind: '説明文',
    title: '学校の二つの庭',
    heading: 'Two Gardens at Our School',
    paragraphs: [
      'Our school has two small gardens. The flower garden is near the school gate. The vegetable garden is behind the gym. It is smaller than the flower garden, but students can grow many kinds of vegetables there.',
      'Last spring, Class 2 planted tomatoes and carrots in the vegetable garden. They watered the plants before class. When the tomatoes were ready, the students took them to the school kitchen. The cooks used the tomatoes to make soup for lunch.',
      'This spring, Class 2 is going to put signs by the plants. The signs will show the names of the vegetables. Younger students can read the signs to learn about the plants when they visit the garden.'
    ],
    translations: [
      '私たちの学校には小さな庭が二つあります。花の庭は校門の近くです。野菜の庭は体育館の裏です。花の庭より小さいですが、そこで何種類もの野菜を育てられます。',
      '去年の春、2組は野菜の庭にトマトとニンジンを植えました。授業前に植物に水をやりました。トマトが採れるようになると、学校の調理室に持っていきました。調理員はトマトで給食のスープを作りました。',
      '今年の春、2組は植物のそばに札を立てる予定です。札には野菜の名前を書きます。下級生は庭を訪れたとき、札を読んで植物について学べます。'
    ],
    hint: '二つの庭と、去年・今年の活動を分けて読もう。behind は裏、plants は植物、signs はここでは名前を書いた札。',
    items: [
      ['Which garden is smaller?', 'The vegetable garden.', ['The flower garden.', 'There is only one garden.', 'Both gardens are the same size.'], '第1段落の It は直前の vegetable garden を指し、花の庭より小さいとあります。', 0],
      ['When did Class 2 water the plants last spring?', 'Before class.', ['After class.', 'At lunch.', 'After dinner.'], '第2段落の before class が水をやった時です。', 1],
      ['What did the cooks do with the tomatoes?', 'They made soup.', ['They planted them again.', 'They put them by the school gate.', 'They made sandwiches.'], '第2段落の to make soup がトマトを使った目的です。', 1],
      ['What will the signs show?', 'The names of the vegetables.', ['The times of the classes.', 'The names of the cooks.', 'The rules of the gym.'], '最後の段落に、札が示すのは野菜の名前だとあります。', 2]
    ]
  }
];

export const longReadingQuestions = readingSets.flatMap(set =>
  set.items.map(([prompt, correct, distractors, explanation, paragraph], index) => ({
    id: `${set.id}-${index + 1}`,
    readingSetId: set.id,
    skill: 'reading',
    prompt,
    choices: [correct, ...distractors],
    answer: 0,
    explanation,
    paragraph
  }))
);

export const readingSetById = id => readingSets.find(set => set.id === id);
export const questionsForReadingSet = id => longReadingQuestions.filter(question => question.readingSetId === id);
