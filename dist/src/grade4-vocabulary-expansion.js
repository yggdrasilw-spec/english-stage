// Original contexts. The target is stored separately so its inflected form
// can be highlighted without changing the card's headword.
export const additionalVocabularySets = [
  {
    id: 'events-and-plans', title: '行事と参加', entries: [
      {id: 'look-around', en: 'look around', ja: '見て回る', note: '場所の中を見て回ること。look for は「探す」。', wrong: ['探す', '振り返る'], examples: [
        ['We have time to ', 'look around', ' the museum before lunch.', '昼食の前に博物館を見て回る時間があります。'],
        ['We ', 'looked around', ' the market and saw many kinds of fruit.', '市場を見て回って、いろいろな果物を見ました。']
      ]},
      {id: 'take-part-in', en: 'take part in', ja: '〜に参加する', relatedId: 'g5-w-take', note: 'in のあとに行事や活動を置く。take → took。', wrong: ['〜を延期する', '〜を見学する'], examples: [
        ['Our class will ', 'take part in', ' the school festival.', '私たちのクラスは学校祭に参加します。'],
        ['Lisa ', 'took part in', ' a race at the park last Sunday.', 'リサは先週の日曜日、公園のレースに参加しました。']
      ]},
      {id: 'sign-up', en: 'sign up', ja: '申し込む', note: 'sign up for ＋行事などで「〜に申し込む」。', wrong: ['取り消す', '見送る'], examples: [
        ['You can ', 'sign up', ' for the art class at the library.', '図書館で絵の教室に申し込めます。'],
        ['I ', 'signed up', ' for a cooking class with my sister.', '姉と一緒に料理教室に申し込みました。']
      ]},
      {id: 'be-interested-in', en: 'be interested in', ja: '〜に興味がある', note: 'in のあとに物や活動を置く。主語に合わせて be が変わる。', wrong: ['〜をよく知っている', '〜をこわがっている'], examples: [
        ['I ', 'am interested in', ' space, so I often read books about it.', '宇宙に興味があるので、よく宇宙の本を読みます。'],
        ['My friends ', 'are interested in', ' making short movies.', '友達は短い映画を作ることに興味があります。']
      ]},
      {id: 'decide-to', en: 'decide to', ja: '〜することに決める', note: 'to のあとに動詞の原形を置く。decide → decided。', wrong: ['〜するのをやめる', '〜するのを忘れる'], examples: [
        ['After lunch, we ', 'decided to', ' walk to the lake.', '昼食のあと、私たちは湖まで歩くことに決めました。'],
        ['If you ', 'decide to', ' come, please call me.', '来ることに決めたら、私に電話してください。']
      ]},
      {id: 'be-good-at', en: 'be good at', ja: '〜が得意だ', sharedId: 'g5-w-be-good-at', note: 'at のあとに教科や活動を置く。動作を続けるときは cooking などの -ing 形。', wrong: ['〜に興味がある', '〜を始めたばかりだ'], examples: [
        ['My brother ', 'is good at', ' cooking. His soup is always delicious.', '兄は料理が得意です。兄のスープはいつもおいしいです。'],
        ['I ', 'am good at', ' math, so I sometimes help my friend.', '算数が得意なので、ときどき友達を手伝います。']
      ]}
    ]
  },
  {
    id: 'places-and-directions', title: '道案内と移動', entries: [
      {id: 'across-from', en: 'across from', ja: '〜の向かいに', note: '道などをはさんだ反対側の場所を表す。', wrong: ['〜のとなりに', '〜の後ろに'], examples: [
        ['The bus stop is ', 'across from', ' the school. Cross the street to get there.', 'バス停は学校の向かいです。そこへ行くには道を渡ってください。'],
        ['I live ', 'across from', ' the park, on the other side of this road.', '私はこの道の反対側、公園の向かいに住んでいます。']
      ]},
      {id: 'in-front-of', en: 'in front of', ja: '〜の前に', sharedId: 'g5-w-in-front-of', note: '場所の前を表す。時刻の「〜より前」は before を使う。', wrong: ['〜の中に', '〜の向かいに'], examples: [
        ['Let’s meet ', 'in front of', ' the station, by the main door.', '駅の前、正面の出入口のそばで会いましょう。'],
        ['I put my bike ', 'in front of', ' the house, next to the door.', '家の前、ドアのそばに自転車を置きました。']
      ]},
      {id: 'on-the-way', en: 'on the way', ja: '途中で', note: 'on the way to school は「学校へ行く途中」。home の前には to を付けない。', wrong: ['着いたあとで', '出かける前に'], examples: [
        ['Let’s buy some water ', 'on the way', ' to the park.', '公園に行く途中で水を買いましょう。'],
        ['I saw a rainbow ', 'on my way', ' home yesterday.', '昨日、家に帰る途中で虹を見ました。']
      ]},
      {id: 'on-foot', en: 'on foot', ja: '歩いて', sharedId: 'g5-w-on-foot', note: '乗り物に乗らずに歩いて行くときに使う。foot は単数形のまま。', wrong: ['自転車で', '走って'], examples: [
        ['It’s close. We can go there ', 'on foot', '.', '近いです。そこまで歩いて行けます。'],
        ['We went to the beach ', 'on foot', ' because there was no bus.', 'バスがなかったので、海岸まで歩いて行きました。']
      ]},
      {id: 'leave-item', en: 'leave', ja: '（物を）置いていく', relatedId: 'g5-w-leave', note: 'leave ＋物＋場所で「物をその場所に置いていく」。leave → left。', wrong: ['持ってくる', '拾う'], examples: [
        ['It might rain, so don’t ', 'leave', ' your umbrella at home.', '雨が降るかもしれないので、傘を家に置いていかないでください。'],
        ['I ', 'left', ' my notebook in the classroom and came home without it.', 'ノートを教室に置いたまま、家に帰ってきました。']
      ]},
      {id: 'pick-up-person', en: 'pick up', ja: '（人を）迎えに行く', note: '車などで人を迎えに行く用法。代名詞は pick you up のように間に置く。', wrong: ['見送る', '待たせる'], examples: [
        ['My dad will ', 'pick me up', ' at the station in his car.', '父が車で駅まで迎えに来てくれます。'],
        ['Can you ', 'pick up', ' your sister from school today?', '今日は妹を学校まで迎えに行けますか。']
      ]}
    ]
  },
  {
    id: 'time-and-reasons', title: '時刻・理由・変更', entries: [
      {id: 'because-of', en: 'because of', ja: '〜のために・〜が理由で', note: 'because of のあとには名詞などが来る。because it rained のように文が続く形と比べよう。', wrong: ['〜にもかかわらず', '〜の代わりに'], examples: [
        ['The game stopped ', 'because of', ' the rain.', '雨のため試合が止まりました。'],
        ['I was late ', 'because of', ' a problem with the train.', '電車のトラブルのため遅れました。']
      ]},
      {id: 'instead-of', en: 'instead of', ja: '〜の代わりに', note: 'instead of のあとに、選ばなかった物や行動を置く。', wrong: ['〜といっしょに', '〜より前に'], examples: [
        ['We played inside ', 'instead of', ' outside because of the rain.', '雨だったので、外の代わりに中で遊びました。'],
        ['Let’s walk ', 'instead of', ' taking the bus.', 'バスに乗る代わりに歩きましょう。']
      ]},
      {id: 'as-soon-as', en: 'as soon as', ja: '〜するとすぐに', note: '一つのことが起きた直後に次のことが起きるときに使う。', wrong: ['〜するまでずっと', '〜するよりかなり前に'], examples: [
        ['I’ll call you ', 'as soon as', ' I get home.', '家に着いたらすぐに電話します。'],
        ['The children went outside ', 'as soon as', ' the rain stopped.', '雨がやむとすぐ、子どもたちは外に出ました。']
      ]},
      {id: 'at-least', en: 'at least', ja: '少なくとも', note: '数の前に置くと、その数以上でよいことを表す。', wrong: ['多くても', 'ちょうど'], examples: [
        ['This game needs ', 'at least', ' four players. Five is OK, too.', 'このゲームには少なくとも4人が必要です。5人でも大丈夫です。'],
        ['Please bring ', 'at least', ' two pencils. You can bring more.', '鉛筆を少なくとも2本持ってきてください。もっと持ってきても構いません。']
      ]},
      {id: 'spend-time', en: 'spend', ja: '（時間を）過ごす・使う', note: '時間について、何に時間を使うかを表す。spend → spent。', wrong: ['数える', '節約する'], examples: [
        ['We will ', 'spend', ' the afternoon at the library.', '午後は図書館で過ごします。'],
        ['I ', 'spent', ' an hour making a birthday card.', '誕生日カードを作るのに1時間使いました。']
      ]},
      {id: 'take-time', en: 'take', ja: '（時間が）かかる', relatedId: 'g5-w-take', note: 'It takes ＋時間＋to ... で「〜するのにその時間がかかる」。take → took。', wrong: ['（時間を）測る', '（時間を）短くする'], examples: [
        ['It will ', 'take', ' ten minutes to walk there.', 'そこまで歩くのに10分かかります。'],
        ['It ', 'took', ' me an hour to clean my room.', '部屋を掃除するのに1時間かかりました。']
      ]}
    ]
  },
  {
    id: 'shopping-and-help', title: '買い物・食事・お願い', entries: [
      {id: 'order-food', en: 'order', ja: '（料理などを）注文する', note: '店で欲しい品を伝えて頼むこと。order → ordered。', wrong: ['受け取る', '料理する'], examples: [
        ['Are you ready to ', 'order', ' lunch? I want the vegetable soup.', 'お昼を注文する準備はできた？ 私は野菜スープがいいな。'],
        ['I ', 'ordered', ' a salad at the café, and it came with bread.', 'カフェでサラダを注文したら、パンが付いてきました。']
      ]},
      {id: 'try-on', en: 'try on', ja: '試着する', note: '買う前に服や靴を身につけて確かめる。代名詞は try it on のように間に置く。', wrong: ['着替える', '取り替える'], examples: [
        ['These shoes look nice. Can I ', 'try them on', '?', 'この靴、すてきです。試しにはいてもいいですか。'],
        ['I ', 'tried on', ' the jacket, but it was too small.', '上着を試着しましたが、小さすぎました。']
      ]},
      {id: 'pay-for', en: 'pay for', ja: '〜の代金を払う', note: 'for のあとに、代金を払う物やサービスを置く。pay → paid。', wrong: ['〜を借りる', '〜を無料でもらう'], examples: [
        ['Can I ', 'pay for', ' these apples here?', 'このリンゴの代金はここで払えますか。'],
        ['My uncle ', 'paid for', ' our lunch yesterday.', '昨日はおじが昼食代を払ってくれました。']
      ]},
      {id: 'too-adjective', en: 'too', ja: '〜すぎる', sharedId: 'g5-w-too', note: 'too ＋形容詞は「〜すぎる」。文の最後の I like it, too. では「私も」です。', wrong: ['〜もまた', '十分に〜だ'], examples: [
        ['This bag is ', 'too', ' heavy for me to carry.', 'このかばんは私が運ぶには重すぎます。'],
        ['The soup was ', 'too', ' hot to eat right away.', 'スープは熱すぎて、すぐには食べられませんでした。']
      ]},
      {id: 'enough-adjective', en: 'enough', ja: '十分に', note: '形容詞のあとに置いて big enough のように言う。enough chairs なら名詞の前。', wrong: ['〜すぎる', '少しだけ'], examples: [
        ['Is the box big ', 'enough', ' for all the books?', 'その箱は本を全部入れられるほど十分大きいですか。'],
        ['It’s warm ', 'enough', ' to eat outside today.', '今日は外で食べられるくらい十分暖かいです。']
      ]},
      {id: 'show-person', en: 'show', ja: '見せる', note: 'show ＋人＋物 で「人に物を見せる」。show → showed。', wrong: ['渡す', '隠す'], examples: [
        ['Please ', 'show', ' me your ticket at the door.', '出入口でチケットを見せてください。'],
        ['Mia ', 'showed', ' us a picture of her new dog.', 'ミアは新しく飼い始めた犬の写真を私たちに見せてくれました。']
      ]}
    ]
  },
  {
    id: 'at-home-and-together', title: '家での用事と友達', entries: [
      {id: 'turn-on', en: 'turn on', ja: '（電気などを）つける', note: '照明や機器を動く状態にする。消すときは turn off。', wrong: ['消す', '修理する'], examples: [
        ['It’s dark in here. Can you ', 'turn on', ' the light?', 'ここは暗いです。電気をつけてくれますか。'],
        ['I ', 'turned on', ' the radio to hear the news.', 'ニュースを聞くためにラジオをつけました。']
      ]},
      {id: 'turn-off', en: 'turn off', ja: '（電気などを）消す', note: '照明や機器を止める。代名詞は turn it off のように間に置く。', wrong: ['つける', '音を大きくする'], examples: [
        ['Please ', 'turn off', ' the lights when you leave the room.', '部屋を出るときは電気を消してください。'],
        ['Nobody was watching TV, so I ', 'turned it off', '.', 'だれもテレビを見ていなかったので消しました。']
      ]},
      {id: 'put-away', en: 'put away', ja: '（物を）片づける', note: '使った物を決まった場所に戻すこと。put の過去形も put。', wrong: ['取り出す', '捨てる'], examples: [
        ['Please ', 'put away', ' your toys before dinner.', '夕食の前におもちゃを片づけてください。'],
        ['I washed the cups and ', 'put them away', ' in the cupboard.', 'コップを洗って、戸棚に片づけました。']
      ]},
      {id: 'be-late-for', en: 'be late for', ja: '〜に遅れる', note: 'for のあとに、遅れる授業や行事などを置く。', wrong: ['〜に間に合う', '〜を早退する'], examples: [
        ['Hurry, or you’ll ', 'be late for', ' school.', '急がないと学校に遅れるよ。'],
        ['I ', 'was late for', ' soccer practice because I missed the bus.', 'バスに乗り遅れて、サッカーの練習に遅れました。']
      ]},
      {id: 'each-other', en: 'each other', ja: 'お互い（に）', note: '二人以上がお互いに何かをすることを表す。', wrong: ['自分だけ（で）', '順番に'], examples: [
        ['Good teammates help ', 'each other', '.', 'よいチームメートはお互いに助け合います。'],
        ['We write to ', 'each other', ' every month.', '私たちは毎月お互いに手紙を書きます。']
      ]},
      {id: 'look-forward-to', en: 'look forward to', ja: '〜を楽しみにする', note: 'to のあとには行事の名前や seeing のような -ing 形が来る。', wrong: ['〜を思い出す', '〜を心配する'], examples: [
        ['I always ', 'look forward to', ' the school festival.', '私はいつも学校祭を楽しみにしています。'],
        ['I’m ', 'looking forward to', ' seeing you next week.', '来週あなたに会うのを楽しみにしています。']
      ]}
    ]
  }
];
