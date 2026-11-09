import {additionalVocabularySets} from './grade4-vocabulary-expansion.js';

// One entry per meaning or expression. sharedId refers to the same meaning
// in the existing word collection. relatedId refers to a different use.
export const vocabularySets = [
  {
    id: 'library-club', title: '図書館とクラブ', entries: [
      {id: 'borrow', en: 'borrow', ja: '借りる', note: '借りる人が主語。borrow A from B で「BからAを借りる」。', wrong: ['貸す', '返す'],
        examples: [
          ['Can I ', 'borrow', ' this book from the library?', 'この本を図書館から借りてもいいですか。'],
          ['I forgot my pen. Can I ', 'borrow', ' yours?', 'ペンを忘れました。あなたのペンを借りてもいいですか。']
        ]},
      {id: 'lend', en: 'lend', ja: '貸す', note: '貸す人が主語。lend 人 物 の順で言える。lend → lent。', wrong: ['借りる', '持ってくる'],
        examples: [
          ['I can ', 'lend', ' you my umbrella. I have two.', '私の傘を貸せるよ。2本持っているんだ。'],
          ['Could you ', 'lend', ' me a ruler? I left mine at home.', '定規を貸してくれますか。家に置いてきたんです。']
        ]},
      {id: 'return-item', en: 'return', ja: '返す', relatedId: 'g5-w-return', note: 'return a book は「本を返す」。return home は「家に戻る」。後ろに何が続くかを見よう。', wrong: ['借りる', '戻る'],
        examples: [
          ['Please ', 'return', ' the book to the library by Friday.', '金曜日までに本を図書館へ返してください。'],
          ['I need to ', 'return', ' this DVD to my friend tomorrow.', '明日、このDVDを友達に返さなくてはいけません。']
        ]},
      {id: 'join', en: 'join', ja: '加わる・合流する', note: 'join the club は「クラブに入る」。join us は「私たちに加わる」。', wrong: ['待つ', '見送る'],
        examples: [
          ['We are playing a game. Would you like to ', 'join', ' us?', '私たちはゲームをしています。一緒にやりませんか。'],
          ['I want to ', 'join', ' the music club next month.', '来月、音楽クラブに入りたいです。']
        ]},
      {id: 'snack', en: 'snack', ja: 'おやつ・軽い食べ物', sharedId: 'game-w-120', note: 'bring a snack は「おやつを持ってくる」。ここでの snack は食べ物の名前。', wrong: ['夕食', '飲み物'],
        examples: [
          ['Lunch is at one. You can have a ', 'snack', ' now if you are hungry.', 'お昼は1時です。おなかがすいていたら、今おやつを食べてもいいですよ。'],
          ['I ate an apple for a ', 'snack', ' after school.', '放課後、おやつにリンゴを食べました。']
        ]},
      {id: 'bring', en: 'bring', ja: '持ってくる', sharedId: 'g5-w-bring', note: 'bring は、話している場所や待ち合わせ先などに持ってくること。bring → brought。', wrong: ['借りる', '置いていく'],
        examples: [
          ['Our picnic is tomorrow. Please ', 'bring', ' a bottle of water.', '明日はピクニックです。水を1本持ってきてください。'],
          ['I have paper. Can you ', 'bring', ' some pencils to my house?', '紙はあるよ。私の家に鉛筆を何本か持ってきてくれる？']
        ]}
    ]
  },
  {
    id: 'getting-around', title: '待ち合わせと乗り物', entries: [
      {id: 'take-a-bus', en: 'take a bus', ja: 'バスで行く', relatedId: 'g5-w-take', note: 'take a bus は交通手段を表す。take → took。', wrong: ['バスを待つ', 'バスを降りる'],
        examples: [
          ['The museum is far from here. Let’s ', 'take a bus', ' there.', '博物館はここから遠いです。バスで行きましょう。'],
          ['We ', 'took a bus', ' to the lake because it was raining.', '雨が降っていたので、私たちはバスで湖に行きました。']
        ]},
      {id: 'get-on', en: 'get on', ja: '（バスなどに）乗る', note: 'get on the bus はバスに乗り込むこと。get off と対にして覚えよう。get → got。', wrong: ['降りる', '乗り遅れる'],
        examples: [
          ['Please wait here. We will ', 'get on', ' the bus at nine.', 'ここで待ってください。9時にバスに乗ります。'],
          ['We ', 'got on', ' the train at the first station and sat by the window.', '最初の駅で電車に乗り、窓のそばに座りました。']
        ]},
      {id: 'get-off', en: 'get off', ja: '（バスなどを）降りる', note: 'get off the bus はバスから外へ出ること。get → got。', wrong: ['乗る', '見送る'],
        examples: [
          ['The next stop is the museum. We need to ', 'get off', ' here.', '次の停留所は博物館です。ここで降りなくてはいけません。'],
          ['I ', 'got off', ' the train at Central Station and walked home.', '中央駅で電車を降りて、歩いて家に帰りました。']
        ]},
      {id: 'get-to', en: 'get to', ja: '（場所に）着く', note: 'get to ＋場所で「〜に着く」。home は get home のように to を付けずに言う。get → got。', wrong: ['出発する', '道に迷う'],
        examples: [
          ['The train leaves at nine. We should ', 'get to', ' the station by eight thirty.', '電車は9時に出ます。8時半までに駅に着いたほうがいいです。'],
          ['We ', 'got to', ' the park at noon and ate lunch there.', '正午に公園に着いて、そこで昼ごはんを食べました。']
        ]},
      {id: 'miss-transport', en: 'miss', ja: '（乗り物に）乗り遅れる', note: 'miss the bus はバスが出てしまって乗れないこと。miss → missed。', wrong: ['降りる', '間に合う'],
        examples: [
          ['Hurry, or we’ll ', 'miss', ' the bus!', '急がないとバスに乗り遅れるよ。'],
          ['I ', 'missed', ' the last train, so I called my dad for a ride.', '終電に乗り遅れたので、父に電話して迎えに来てもらいました。']
        ]},
      {id: 'wait-for', en: 'wait for', ja: '〜を待つ', relatedId: 'g5-w-wait', note: '待つ相手や物を言うときは wait for ＋人・物。wait here の here の前には for を付けない。', wrong: ['見つける', '迎えに行く'],
        examples: [
          ['Ken isn’t here yet. Let’s ', 'wait for', ' him at the gate.', 'ケンはまだ来ていません。門で彼を待ちましょう。'],
          ['The next bus comes at ten. We can ', 'wait for', ' it inside.', '次のバスは10時に来ます。中で待てます。']
        ]}
    ]
  },
  {
    id: 'notices', title: 'お知らせと予定の変更', entries: [
      {id: 'on-time', en: 'on time', ja: '時間どおりに', note: '予定や約束の時刻から遅れないこと。The train left on time. なら予定どおりに出たという意味。', wrong: ['時間を過ぎて', '時間があるときに'],
        examples: [
          ['The show starts at two. Please be ', 'on time', '.', '公演は2時に始まります。時間に遅れず来てください。'],
          ['The train left ', 'on time', ' at eight, just as the schedule said.', '電車は時刻表どおりに8時に出ました。']
        ]},
      {id: 'until', en: 'until', ja: '〜までずっと', note: 'until はその時まで続くこと。by は「その時までに」という締め切り。', wrong: ['〜までに', '〜から'],
        examples: [
          ['The shop is open ', 'until', ' six today.', 'その店は今日は6時まで開いています。'],
          ['We played outside ', 'until', ' it got dark.', '暗くなるまで外で遊びました。']
        ]},
      {id: 'free-cost', en: 'free', ja: '無料の', sharedId: 'g5-w-free', note: 'free tickets は「無料のチケット」。Are you free? なら「時間は空いていますか」。', wrong: ['暇な', '売り切れた'],
        examples: [
          ['The museum is ', 'free', ' today. You don’t need to pay.', '今日は博物館が無料です。お金を払う必要はありません。'],
          ['Children can get ', 'free', ' tickets at the library.', '子どもたちは図書館で無料のチケットをもらえます。']
        ]},
      {id: 'closed', en: 'closed', ja: '閉まっている・休みの', note: 'The library is closed. の closed は、利用できない状態を表す。反対は open。', wrong: ['開いている', '混んでいる'],
        examples: [
          ['The library is ', 'closed', ' on Mondays. Come back on Tuesday.', '図書館は月曜日が休みです。火曜日にまた来てください。'],
          ['This door is ', 'closed', '. Please use the other door.', 'このドアは閉まっています。別のドアを使ってください。']
        ]},
      {id: 'change-schedule', en: 'change', ja: '変更する', note: 'change the time は「時刻を変更する」。from A to B で変更前と変更後を示せる。', wrong: ['確認する', '元に戻す'],
        examples: [
          ['Can we ', 'change', ' the meeting time from three to four?', '集合時刻を3時から4時に変えられますか。'],
          ['We ', 'changed', ' the date of the picnic because of the rain.', '雨のため、ピクニックの日を変更しました。']
        ]},
      {id: 'have-to', en: 'have to', ja: '〜しなくてはいけない', note: 'have to の後ろに動詞の原形。don’t have to は「〜する必要がない」。', wrong: ['〜してもよい', '〜してはいけない'],
        examples: [
          ['We ', 'have to', ' wear helmets when we ride our bikes here.', 'ここで自転車に乗るときは、ヘルメットをかぶらなくてはいけません。'],
          ['You ', 'have to', ' sign your name before you go in.', '入る前に名前を書かなくてはいけません。']
        ]}
    ]
  },
  {
    id: 'daily-scenes', title: '毎日の出来事', entries: [
      {id: 'take-pictures', en: 'take pictures', ja: '写真を撮る', relatedId: 'g5-w-take', note: '1枚なら take a picture。take → took。of の後ろに撮ったものを言える。', wrong: ['写真を持っていく', '写真を見る'],
        examples: [
          ['You can ', 'take pictures', ' of the flowers in this garden.', 'この庭の花の写真を撮ってもいいです。'],
          ['We ', 'took a picture', ' of our class with my new camera.', '私たちは私の新しいカメラでクラスの写真を1枚撮りました。']
        ]},
      {id: 'look-for', en: 'look for', ja: '探す', note: 'look for はまだ探している動き。find は見つけた・見つかること。', wrong: ['見つける', '世話をする'],
        examples: [
          ['I can’t find my keys. Will you help me ', 'look for', ' them?', '鍵が見つかりません。探すのを手伝ってくれますか。'],
          ['We ', 'looked for', ' my bag in the gym, but it wasn’t there.', '体育館でかばんを探しましたが、そこにはありませんでした。']
        ]},
      {id: 'find', en: 'find', ja: '見つける', sharedId: 'g5-w-find', note: 'find は探している物などが見つかること。find → found。', wrong: ['探す', 'なくす'],
        examples: [
          ['I looked in my desk and ', 'found', ' the key under a book.', '机の中を見て、本の下に鍵を見つけました。'],
          ['Did you ', 'find', ' your glasses? — Yes, they were by the window.', '眼鏡は見つかりましたか。― はい、窓のそばにありました。']
        ]},
      {id: 'look-after', en: 'look after', ja: '世話をする・面倒を見る', note: 'look after ＋人・動物で「世話をする」。look for と後ろの語が違う。', wrong: ['探す', '後ろを見る'],
        examples: [
          ['Could you ', 'look after', ' my cat while I’m away?', '私が留守の間、猫の世話をしてくれますか。'],
          ['Mia ', 'looked after', ' her little brother while their mom was at work.', 'お母さんが仕事をしている間、ミアは弟の面倒を見ました。']
        ]},
      {id: 'one-of', en: 'one of', ja: '〜のうちの一つ・一人', note: 'one of の後ろには、複数のものや人のまとまりが来る。', wrong: ['〜の全部', '〜以外のもの'],
        examples: [
          ['This is ', 'one of', ' my favorite books.', 'これは私のお気に入りの本のうちの一冊です。'],
          ['I went to the park with ', 'one of', ' my classmates.', 'クラスメートの一人と公園に行きました。']
        ]},
      {id: 'for-example', en: 'for example', ja: '例えば', note: '説明のあとに具体的な例を出すときに使う。', wrong: ['そのため', '最初は'],
        examples: [
          ['I like fruit. ', 'For example', ', I often eat apples and oranges.', '果物が好きです。例えば、リンゴやオレンジをよく食べます。'],
          ['You can help in many ways. ', 'For example', ', you can clean the tables.', 'いろいろな方法で手伝えます。例えば、テーブルをきれいにできます。']
        ]}
    ]
  },
  ...additionalVocabularySets
];

export const vocabularyQuestions = vocabularySets.flatMap(set =>
  ['a', 'b'].flatMap((variant, index) => set.entries.map(entry => ({
    id: `g4-vocab-${entry.id}-${variant}`, unit: set.id, variant, skill: 'vocab',
    vocabularySetId: set.id, entry, example: entry.examples[index],
    choices: [entry.ja, ...entry.wrong], answer: 0
  })))
);

export const vocabularySetById = id => vocabularySets.find(set => set.id === id);
export const questionsForVocabularySet = (id, variant) =>
  vocabularyQuestions.filter(question => question.vocabularySetId === id && question.variant === variant);
