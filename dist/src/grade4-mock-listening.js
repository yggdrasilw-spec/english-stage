const speakers = {
  A:{voice:'en-US-Neural2-D',gender:'male'},
  B:{voice:'en-US-Neural2-F',gender:'female'}
};
const narratorVoice = 'en-US-Neural2-H';

function dialogue(section, lines, prompt, options, answer, explanation, scene) {
  const turns = lines.map((text, index) => ({speaker:index % 2 ? 'B' : 'A', text}));
  const listening = {kind:'dialogue', speakers, turns};
  let ending;
  if (section === 'l1') {
    listening.responseSpeaker = turns.length % 2 ? 'B' : 'A';
    ending = options.map((option, index) => (index + 1) + '. ' + option).join('\n');
  } else {
    Object.assign(listening, {narratorVoice, question:{text:prompt, subjectSpeaker:null}});
    ending = prompt;
  }
  return {section, prompt, options, answer, explanation, scene, listening,
    script:turns.map(turn => turn.speaker + ': ' + turn.text).join(' ') + '\n' + ending};
}

function response(scene, lines, options, answer, explanation) {
  return dialogue('l1', lines, '会話に続く返事を選びましょう。', options, answer, explanation, scene);
}

function conversation(lines, prompt, options, answer, explanation) {
  return dialogue('l2', lines, prompt, options, answer, explanation);
}

function passage(text, prompt, options, answer, explanation) {
  return {section:'l3', prompt, options, answer, explanation, script:text + '\n' + prompt,
    listening:{kind:'passage', voice:'en-US-Neural2-F', narratorVoice, text, question:prompt}};
}

const responses = [
  response(['gym','体育館'], ["Are you ready to play?", "Almost. Do you have a ball?"],
    ["Yes, it's in my bag.", "No, I don't play the piano.", "Yes, the gym is far away."], 0, "ボールを持っているか聞かれています。「うん、かばんの中にあるよ」が合います。"),
  response(['library','図書館'], ["I'd like to read this book at home. Can I take it with me?", "Yes. May I see your library card?"],
    ["No, I don't know her.", "Sure. Here it is.", "I read it yesterday."], 1, "図書カードを見せてほしいと頼まれているので、「はい、どうぞ」が合います。"),
  response(['cafeteria','食堂'], ["Would you like some soup?", "No, thank you. Could I have some water?"],
    ["It's a bowl of soup.", "I didn't cook it.", "Of course. I'll bring you a glass."], 2, "水を頼まれたので「もちろん。コップに入れて持ってくるね」が合います。"),
  response(['hall','学校の廊下'], ["Excuse me. Is this your bag?", "No, mine is green. Where did you find it?"],
    ["Under that chair.", "With my sister.", "Because it was cold."], 0, "Where で場所を聞いているので「そのいすの下」が合います。"),
  response(['party','誕生日会の準備'], ["Let's put these plates on the table.", "OK. How many do we need?"],
    ["After six.", "Eight should be enough.", "They're made of paper."], 1, "How many で皿の枚数を聞いています。「8枚で足りるよ」が合います。"),
  response(['door','玄関'], ["It looks like rain. Did you bring an umbrella?", "No. Can I use yours?"],
    ["I like sunny days.", "It rained this morning.", "Sure. I'll get it for you."], 2, "傘を借りたいというお願いなので、貸してくれる返事が合います。"),
  response(['music','音楽室'], ["Did you practice this song yesterday?", "Yes, but the last part is hard. Can you show me how to play it?"],
    ["Sure. Watch my left hand.", "It starts at three.", "No, yesterday was Monday."], 0, "弾き方を教えてほしいので、手本を見せる返事が合います。"),
  response(['bus','バス停'], ["Does this bus go to City Hall?", "No. You need the number six bus.", "Thanks. Where does it stop?"],
    ["You can pay on the bus.", "It's usually crowded.", "Across the street, by the bank."], 2, "バスが停まる場所を聞いています。「道の反対側の銀行のそば」です。"),
  response(['park','公園'], ["Is there a place to sit in the shade?", "There's a bench under that tree. Shall we eat there?"],
    ["We walked there yesterday.", "Yes, let's go.", "I don't have a tree."], 1, "Shall we ...? は提案です。「うん、行こう」が合います。"),
  response(['shop','服屋'], ["These shirts are nice. Do you have one in blue?", "Yes. What size do you need?"],
    ["Medium, please.", "It's on sale today.", "Blue is my favorite color."], 0, "色に続いてサイズを聞いているので、Medium が合います。")
];

const conversations = [
  conversation(["Will you go to the pool this morning, Emma?", "No. I have to help Dad first. I'll go after lunch."],
    "When will Emma go to the pool?", ["Before breakfast.", "In the morning.", "After lunch.", "In the evening."], 2, "Emma は先にお父さんを手伝い、昼食後に行きます。"),
  conversation(["Where should we meet before the movie?", "I wanted to meet at the café, but it's closed today.", "Then let's meet at the station.", "Good idea."],
    "Where will they meet?", ["At the station.", "At the café.", "Inside the movie theater.", "At school."], 0, "カフェは閉まっているので、駅で会うことに決めました。"),
  conversation(["What did you buy at the market, Amy?", "I wanted some peaches, but they were too expensive. I bought some pears instead."],
    "What did Amy buy?", ["Peaches.", "Pears.", "Apples.", "Bananas."], 1, "桃は高かったので、その代わりに梨を買いました。"),
  conversation(["Can Ben come to our picnic on Saturday?", "Yes, but he'll come late. He has a music lesson in the morning.", "Should we save some lunch for him?", "Yes, please."],
    "Why will Ben come late?", ["He has to make lunch.", "He will visit his friend.", "He will play soccer.", "He has a music lesson."], 3, "午前に音楽のレッスンがあるため遅れて来ます。"),
  conversation(["Where is my notebook? It wasn't on my desk.", "I saw it on the sofa. Oh, wait. Dad put it on the shelf when he cleaned the room."],
    "Where is the notebook now?", ["On the sofa.", "On the shelf.", "Under the desk.", "In a bag."], 1, "ソファにあったものを、お父さんが棚に移しました。"),
  conversation(["How long does it take you to get to school, Lily?", "Twenty minutes on foot. It only takes ten minutes by bike, but today I'm walking with my sister."],
    "How is Lily going to school today?", ["By bike.", "By bus.", "On foot.", "By car."], 2, "いつもの手段や所要時間に惑わされず、today I'm walking を聞き取ります。"),
  conversation(["Did you like the science show, Rina?", "Yes. I liked the part about the moon best. My brother liked the robots."],
    "What did Rina like best?", ["The part about the moon.", "The robots.", "The part about the ocean.", "The pictures of plants."], 0, "月が好きだったのはRina、ロボットが好きだったのは弟です。"),
  conversation(["Would you like to help us at the school festival, Mia?", "Sure. I can make signs on Friday, but I have a game on Saturday.", "That's fine. We need the signs before Saturday."],
    "What will Mia do for the festival?", ["Play in a game.", "Buy some food.", "Open the school gate.", "Make signs."], 3, "Mia は金曜に看板を作ると申し出ています。"),
  conversation(["Is the next train at nine thirty?", "That train doesn't run on Sundays. Today the next one is at ten.", "Then we have time for breakfast."],
    "When is the next train today?", ["At nine.", "At ten.", "At nine thirty.", "At ten thirty."], 1, "9時半の列車は日曜に運行しないので、次は10時です。"),
  conversation(["I found two tickets for the baseball game. Do you want to go?", "Yes! Can we take the bus?", "The bus takes too long. My mom can drive us there.", "Great."],
    "How will they get to the game?", ["By bus.", "By train.", "By car.", "On foot."], 2, "母親が車で送ってくれるという申し出に同意しています。")
];

const passages = [
  passage("Tom joined a cooking club last month. At the first meeting, he learned to make rice balls. This week, he will learn to make a vegetable soup. He wants to make it for his family on Sunday.",
    "What will Tom learn to make this week?", ["Rice balls.", "Bread.", "A salad.", "Vegetable soup."], 3, "最初の活動はおにぎりでした。今週は野菜スープを作ります。"),
  passage("Every Friday, Nina takes the bus to her guitar lesson. Last Friday, the bus didn't come, so she walked. It took her thirty minutes, but she got there before the lesson began.",
    "How did Nina get to her lesson last Friday?", ["She walked.", "She rode her bike.", "She took the bus.", "She took a taxi."], 0, "普段はバスですが、その日は来なかったので歩きました。"),
  passage("Thank you for visiting the Greenhill Zoo. The bird show will begin at two in the afternoon. Today it will be inside the visitor center because of the rain. Please come ten minutes early.",
    "Where will the bird show be today?", ["Near the ticket gate.", "By the lake.", "Inside the visitor center.", "Next to the bird cage."], 2, "雨のため、今日は案内所の中で行います。"),
  passage("Luca has a small garden. In spring, he wanted to grow carrots, but his sister gave him some flower seeds. He planted the seeds by the door. The flowers are now yellow, and his neighbors stop to look at them.",
    "What did Luca plant by the door?", ["Carrots.", "Flowers.", "Tomatoes.", "A tree."], 1, "妹からもらった花の種をドアのそばに植えました。"),
  passage("Maya usually reads before bed. Last night, she wanted to finish a book about animals, but the lights went out. Her father found a small lamp. Maya put it next to her bed and finished the book.",
    "Why did Maya need a small lamp?", ["She wanted to go outside.", "Her father was reading.", "She lost her book.", "The lights went out."], 3, "部屋の明かりが消えたため、小さなランプを使いました。"),
  passage("The school shop used to sell notebooks only on Mondays. This month, it will also open on Thursdays. Students can buy pencils and rulers there now. It will close at four on both days.",
    "On which day will the school shop also open this month?", ["On Thursdays.", "On Tuesdays.", "On Fridays.", "On Wednesdays."], 0, "これまでの月曜に加え、今月は木曜も開きます。"),
  passage("Sam is making a map for his new friend. He drew the school and the station first. Then he added a park behind the school. He will put a star on the park because they will play there after lunch.",
    "Where will Sam put a star?", ["On the station.", "On the school.", "On the park.", "On his house."], 2, "昼食後に遊ぶ場所である公園に星をつけます。"),
  passage("Last year, Yuna ran in the town race with her uncle. This year, he can't run because his leg hurts. Yuna will run with her cousin. Her uncle will wait near the finish line and take pictures.",
    "Who will run with Yuna this year?", ["Her uncle.", "Her cousin.", "Her mother.", "Her friend."], 1, "今年一緒に走るのはいとこです。おじさんは写真を撮ります。"),
  passage("Mr. Lee teaches an art class at the library. Last week, the children used paint. Next week, he will show them how to make animals with colored paper. Each child should bring a pair of scissors.",
    "What should the children bring next week?", ["Some paint.", "A picture of an animal.", "Colored pencils.", "A pair of scissors."], 3, "色紙で動物を作るために、はさみを持ってきます。"),
  passage("A shop near the park sells ice cream. In summer, it stays open until seven. In winter, it closes at five. On Fridays in winter, it stays open one hour longer because many people go to the park after school.",
    "When does the shop close on Fridays in winter?", ["At six.", "At four.", "At five.", "At seven."], 0, "冬は普通5時で、金曜はそこから1時間長く開きます。")
];

export const mockListening = [...responses, ...conversations, ...passages].map((q, index) =>
  ({...q, id:'g4-m1-' + (36 + index)}));

export const listeningPractice = [
  conversation(["Let's meet outside the museum at two.", "I won't be there until three. Can we meet then?", "Yes, three is fine."],
    "When will they meet?", ["At one.", "At two.", "At three.", "At four."], 2, "Aは最初に2時を提案し、Bは3時を提案しました。最後にAが3時に同意しています。"),
  conversation(["Is the red lunch box yours, Eva?", "No, that's Mina's. Mine is next to the red one. It's blue."],
    "What color is Eva's lunch box?", ["Red.", "Blue.", "Green.", "Yellow."], 1, "BのEvaが Mine is ... It's blue. と、自分の弁当箱について言っています。"),
  conversation(["Are you going to the beach on Sunday?", "I wanted to, but it's going to rain. I'll go to the science museum instead."],
    "Where will the second speaker go on Sunday?", ["To the library.", "To the beach.", "To the pool.", "To the science museum."], 3, "Bは海へ行く予定を変え、代わりに科学館に行きます。"),
  conversation(["Can you help me make a poster today?", "I can help tomorrow. Today I need to look after my little brother.", "Tomorrow is fine."],
    "Why can't the second speaker help today?", ["They need to look after their brother.", "They need to buy a poster.", "They have a piano lesson.", "They have to go to the library."], 0, "Bは今日、弟の世話をする必要があると言っています。"),
  conversation(["I left my gloves in the classroom.", "Did you check the lost and found box by the office?", "Yes. They were there, so I have them now."],
    "Where did the first speaker find the gloves?", ["In the classroom.", "At home.", "In the lost and found box.", "On the bus."], 2, "Aが最初に話す教室は置き忘れた場所です。見つけた場所はBが話す忘れ物箱です。"),
  conversation(["What did you do at your aunt's house, Anna?", "I helped her make apple juice. My brother picked apples in the garden."],
    "What did Anna do at her aunt's house?", ["She picked apples.", "She made apple juice with her aunt.", "She bought apples at a shop.", "She baked a cake."], 1, "BのAnnaはおばさんとジュースを作りました。りんごを採ったのは兄弟です。")
].map((q, index) => ({...q, id:'g4-listen-' + (index + 1)}));
