const question = (prompt, options, answer, explanation) => ({prompt, options, answer, explanation});

const short = [
  question("We have no bread. Can you (　) some on your way home?", ["close", "buy", "teach", "wash"], 1, "パンがないので、帰り道に買ってきてほしいと頼んでいます。"),
  question("My shoes are wet, so I need a (　) pair.", ["dry", "slow", "young", "dark"], 0, "ぬれた靴の代わりなので dry（乾いた）が合います。"),
  question("The road is busy. Look both ways before you (　) it.", ["carry", "build", "catch", "cross"], 3, "道路を渡る前に左右を確認するので cross（渡る）が合います。"),
  question("I know her face, but I can't (　) her name.", ["invite", "borrow", "remember", "finish"], 2, "顔は分かるけれど名前を思い出せない、という文です。"),
  question("We (　) a small boat on the lake yesterday.", ["row", "are rowing", "rowed", "will row"], 2, "yesterday があるので過去形 rowed を選びます。"),
  question("The movie starts (　) ten minutes. Let's hurry.", ["for", "in", "from", "during"], 1, "in ten minutes は「10分後に」です。"),
  question("Yuki was tired, (　) she went to bed early.", ["before", "if", "because", "so"], 3, "疲れたことが原因で早く寝たので、結果をつなぐ so が合います。"),
  question("My brother is (　) than I am, but I can run faster.", ["tall", "taller", "tallest", "as tall"], 1, "than があるので比較級 taller を使います。"),
  question("This box is heavy. Could you help me (　) it upstairs?", ["carry", "turn", "meet", "open"], 0, "重い箱を二階へ運ぶ場面です。carry は「運ぶ」です。"),
  question("We enjoyed (　) stars from the roof last night.", ["watch", "watched", "watching", "to watch"], 2, "enjoy の後ろで「見ること」を表す watching が合います。"),
  question("Mika wants (　) how to make soup.", ["learning", "learns", "learned", "to learn"], 3, "want to ＋ 動詞の原形で「〜したい」です。"),
  question("The museum is free today. You don't (　) pay.", ["like to", "have to", "look for", "wait for"], 1, "don't have to は「〜する必要がない」です。"),
  question("Please (　) off your shoes before you come in.", ["take", "look", "get", "put"], 0, "take off で「脱ぐ」です。"),
  question("After dinner, I (　) the dishes and my sister dried them.", ["set", "sold", "washed", "built"], 2, "妹が乾かした皿を、先に洗ったという場面です。"),
  question("Let's (　) for the bus here. The stop is right behind us.", ["ask", "leave", "send", "wait"], 3, "バス停にいるので、ここでバスを待つ wait for が合います。")
];

const dialogues = [
  question("A: How was your first piano lesson?\nB: (　) I want to play that song again.", ["On the second floor.", "At four o'clock.", "It was a lot of fun.", "I have two pencils."], 2, "レッスンの感想を聞かれ、また弾きたいと言っているので「楽しかった」が合います。"),
  question("A: Can I use your ruler for a minute?\nB: (　) Here you are.", ["Sure.", "No, I can't.", "I don't know where it is.", "For two days."], 0, "Here you are と渡しているので、許可する Sure が合います。"),
  question("A: (　)\nB: At the library. It has a blue cover.", ["How many pages did you read?", "Why are you here?", "When will you go there?", "Where did you find this book?"], 3, "At the library は場所の答えなので Where で始まる質問が合います。"),
  question("A: There is a new bakery by the station.\nB: Really? (　)\nA: Yes. I bought a cake there on Sunday.", ["Will it snow tomorrow?", "Did you go there?", "Can you bake a cake?", "Is the station far from here?"], 1, "日曜日にそこでケーキを買ったと答えているので、行ったかを聞いています。"),
  question("A: I'm looking for a birthday gift for my dad.\nB: (　)\nA: He likes cooking. A new apron might be nice.", ["What does he like to do?", "Who gave you this apron?", "When did you make it?", "Which one did he buy for you?"], 0, "料理が好きだと答えているので、お父さんが好きなことを尋ねています。")
];

const orders = [
  ["あなたは昨日どこで昼食を食べましたか。", ["Where", "did", "you", "eat lunch", "yesterday"]],
  ["私の兄はこの中でいちばん速く泳げます。", ["My brother", "can", "swim", "the fastest", "in this group"]],
  ["私は今夜読む本が欲しいです。", ["I", "want", "a book", "to read", "tonight"]],
  ["家に帰ったら電話します。", ["I", "will call", "you", "when", "I get home"]],
  ["明日早く来る必要はありません。", ["You", "don't", "have to", "come early", "tomorrow"]]
].map(([prompt, words], index) => {
  const order = [[3,1,4,0,2], [1,0,2,4,3], [2,3,0,4,1], [4,0,2,3,1], [3,2,1,0,4]][index];
  const pair = (first, second) => [first, second].map(word => '①②③④⑤'[order.indexOf(word)]).join(' と ');
  const answer = [1, 3, 0, 2, 1][index];
  const options = [pair(0, 3), pair(1, 4), pair(3, 1)];
  options.splice(answer, 0, pair(1, 3));
  return {
    ...question(prompt, options, answer, words.join(' ') + (index === 0 ? '?' : '.')),
    tiles: order.map(word => words[word].toLowerCase())
  };
});

const passages = [
  {
    title: "Riverside Book Swap",
    paragraphs: [
      "Sunday, May 18 · 10:00 a.m.–1:00 p.m. · Riverside Community Center",
      "Bring up to three books that you have finished reading. Write your name on a card at the front desk, but please do not write it in the books. For each book you bring, you can take one book home.",
      "At noon, a local writer will read a story in Room B. Anyone can listen to the story, even without a book. Please leave drinks outside Room B."
    ],
    questions: [
      question("How many books can visitors take if they bring two?", ["One.", "Two.", "Three.", "Four."], 1, "持ってきた本1冊につき1冊持ち帰れるので、2冊です。"),
      question("Who can listen to the story?", ["Only local writers.", "Only people who bring three books.", "Only people with drinks.", "People who come without a book, too."], 3, "Anyone can listen ... even without a book が根拠です。")
    ]
  },
  {
    title: "An email from Leo to Hana",
    paragraphs: [
      "Hi Hana,\nThank you for inviting me to your school concert. I can come on Saturday. The concert begins at three, but my bus arrives at the station at two. I will walk from there because the school is close.",
      "After the concert, my aunt is going to meet me at the school gate. She will take me to a restaurant for my birthday. Would you like to eat with us? Please tell me by Thursday. My aunt needs to call the restaurant on Friday morning.",
      "You said that your class will sell cookies before the concert. I would like to buy some for my little brother. He can't come because he has a soccer game that day. See you on Saturday!\nLeo"
    ],
    questions: [
      question("How will Leo go from the station to the school?", ["On foot.", "By bus.", "By car.", "By bike."], 0, "駅まではバスで、駅から学校までは歩きます。"),
      question("Why does Leo need Hana's answer by Thursday?", ["His aunt will meet Hana on Thursday.", "Hana will buy cookies on Friday.", "His aunt needs to call the restaurant on Friday morning.", "The concert starts early on Friday."], 2, "おばさんが金曜の朝にレストランへ電話するためです。"),
      question("What will Leo's brother do on Saturday?", ["Sell cookies.", "Play soccer.", "Meet Leo at the gate.", "Go to the concert."], 1, "弟はその日にサッカーの試合があります。")
    ]
  },
  {
    title: "Water for the School Garden",
    paragraphs: [
      "Last spring, students at Lake School started a garden behind the gym. They planted tomatoes and beans there. At first, the students carried water from the kitchen every morning. It was a long walk, and the small cans did not hold much water.",
      "One day, their teacher showed them a large barrel. The students put it near a pipe that took rainwater down from the roof of the gym. When it rained, water went into the barrel. They used this water for the garden, so they did not need to carry as much from the kitchen.",
      "In July, it did not rain for two weeks. The barrel became empty. The students put dry leaves on the ground around the plants. The ground under the leaves stayed wet longer. The students still used water from the kitchen, but they used less of it.",
      "The class is now making a sign to explain these ideas to younger students. Next spring, they want to try the same ideas in front of the school. They will grow flowers there."
    ],
    questions: [
      question("Where was the first garden?", ["Near the school gate.", "Beside the kitchen door.", "In front of the school.", "Behind the gym."], 3, "第1段落の behind the gym が根拠です。"),
      question("Why was watering the garden hard at first?", ["The kitchen was far from the garden.", "The gym was closed.", "There was too much rain.", "No one knew how to grow beans."], 0, "台所から庭まで遠く、水を運ぶのが大変でした。"),
      question("What went into the barrel?", ["Dry leaves.", "Small cans.", "Rainwater from the roof.", "Water from the kitchen."], 2, "屋根から管を通った雨水をためました。"),
      question("How did the leaves help the plants?", ["They brought more rain.", "They helped keep the ground wet longer.", "They made the barrel bigger.", "They stopped the plants from growing."], 1, "葉の下の土が長く湿ったままになりました。"),
      question("What will the class grow next spring?", ["Beans behind the gym.", "Tomatoes in the kitchen.", "Flowers near the barrel behind the gym.", "Flowers in front of the school."], 3, "最後の段落で、来春は学校の前に花を育てると述べています。")
    ]
  }
];

export const mockReading = [
  ...short.map(q => ({...q, section:'r1'})),
  ...dialogues.map(q => ({...q, section:'r2'})),
  ...orders.map(q => ({...q, section:'r3'})),
  ...passages.flatMap(({title, paragraphs, questions}) =>
    questions.map(q => ({...q, passage:{title, paragraphs}, section:'r4'})))
].map((q, index) => ({...q, id:'g4-m1-' + String(index + 1).padStart(2, '0')}));
