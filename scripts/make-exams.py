"""Original practice items. Official material supplies format, never question text."""
import json, random
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sets = [
[
('My brother plays the ( ) every evening.','piano','station garden kitchen','楽器のpianoをplay theと組み合わせます。'),
('We eat lunch in the school ( ).','cafeteria','pencil morning tennis','食べる場所なのでcafeteria（食堂）。'),
('My aunt is a ( ). She works at a hospital.','nurse','pilot farmer singer','病院で働くnurse（看護師）。'),
('Please open the ( ). This room is hot.','window','milk shoe music','暑い部屋で開けるのはwindow（窓）。'),
('I have a red bag. ( ) bag is blue.','Your','You Yours He','名詞bagの前は所有を表すYour。'),
('There ( ) two cats in the room.','are','is am be','two catsは複数なのでare。'),
('Mina ( ) to school by bus.','goes','go going to-go','主語Minaは三人称単数なのでgoes。'),
('My father can ( ) very well.','swim','swims swimming to-swim','canのあとは動詞の原形。'),
('We do not ( ) TV before school.','watch','watches watching watched','do notのあとは動詞の原形watch。'),
('The class starts ( ) nine.','at','on under from','時刻の前はat。'),
('I am ( ) a book now.','reading','read reads to-read','amと動詞のing形で「今〜している」。'),
('A: ( ) is your birthday? B: In May.','When','Who Where What','月で答えているので、いつを尋ねるWhen。'),
('This is ( ) orange.','an','a two these','母音で始まるorangeの前はan。'),
('I get up early ( ) Sunday, too.','on','in at under','曜日の前はon。'),
('A: How ( ) pencils do you have? B: Six.','many','much old long','数えられるpencilsの数はHow many。'),
],
[
('I want some ( ). I am thirsty.','water','paper tennis shoes','のどが渇いたとき飲むwater。'),
('My mother teaches at a school. She is a ( ).','teacher','doctor driver cook','学校で教えるteacher。'),
('Please write your name with a ( ).','pencil','table river door','名前を書く道具はpencil。'),
('We play baseball in the ( ).','park','bread milk chair','野球をする場所はpark。'),
('A: Is this ( ) umbrella? B: Yes, it is mine.','your','you yours I','名詞umbrellaの前はyour。'),
('My sister ( ) a new bike.','has','have having to-have','三人称単数の主語にはhas。'),
('Ken and I ( ) good friends.','are','is am be','Ken and Iは複数なのでare。'),
('Do you ( ) music?','like','likes liking to-like','Doで尋ねる文では動詞は原形like。'),
('My dog is ( ) the table. I cannot see it.','under','happy seven hungry','位置を表すunder（下に）。'),
('A: ( ) is that woman? B: My aunt.','Who','When How Where','人が誰かを尋ねるWho。'),
('Look! The children are ( ).','running','run runs to-run','areとing形で進行中の動作。'),
('I have music class ( ) Monday.','on','at in to','曜日にはon。'),
('A: ( ) you play the guitar? B: Yes, I can.','Can','Are Is Does','Yes, I can.に対応するCan。'),
('My brother does not ( ) coffee.','drink','drinks drinking to-drink','does notの後は原形drink。'),
('A: How ( ) is this hat? B: Ten dollars.','much','many old tall','値段を尋ねるHow much。'),
],
[
('We buy bread at the ( ).','bakery','library station bedroom','パンを買うbakery（パン屋）。'),
('It is cold. Please put on your ( ).','coat','juice pencil apple','寒いとき着るcoat。'),
('My uncle drives a bus. He is a bus ( ).','driver','student singer nurse','バスを運転するdriver。'),
('I like ( ). My favorite animal is a rabbit.','animals','desks buses shoes','rabbitを含むanimals。'),
('This is my sister. ( ) name is Yui.','Her','She Hers He','名詞nameの前はHer。'),
('Tom ( ) English every day.','studies','study studying to-study','三人称単数なのでstudyをstudiesに。'),
('There ( ) a ball in the box.','is','are am be','a ballは単数なのでis。'),
('A: ( ) does your brother live? B: In Kobe.','Where','Who When What','住む場所を尋ねるWhere。'),
('We ( ) not hungry now.','are','do does can','hungryは形容詞。主語Weにはare。'),
('Please ( ) quiet in the library.','be','are is am','命令文のbeは原形。'),
('The boy is ( ) a picture.','drawing','draw draws to-draw','isとing形で「描いている」。'),
('A: ( ) is your favorite color? B: Green.','What','Where When Who','何色かを尋ねるWhat。'),
('I go to bed ( ) ten every night.','at','on in under','時刻tenの前はat。'),
('A: Does Emi ( ) cats? B: Yes, she does.','like','likes liking to-like','Doesのあとの動詞は原形。'),
('A: ( ) old is your brother? B: He is nine.','How','What Who When','年齢を尋ねるHow old。'),
]]
dialogs = [
[
('A: Thank you for your help.\nB: ( )',"You're welcome.",['Good night.','I am eleven.','It is sunny.'],'感謝への応答は「どういたしまして」。'),
('A: What time is it?\nB: ( )',"It is three o\u0027clock.",['It is my bag.','I like dogs.','At the park.'],'時刻を尋ねています。'),
('A: Would you like some tea?\nB: ( )','Yes, please.',['Yes, I am.','It is mine.','She is ten.'],'飲み物の申し出に「はい、お願いします」。'),
('A: Where is my cap?\nB: ( )','On the chair.',['It is red.','I am fine.','She can sing.'],'Whereへの答えは場所。'),
('A: Let us play soccer after school.\nB: ( )','That sounds fun.',['I am a teacher.','It is a pen.','At seven.'],'誘いに「楽しそうだね」。'),
],
[
('A: How are you today?\nB: ( )','Fine, thank you.',['On the desk.','I have two.','It is Friday.'],'調子を尋ねる表現に応答します。'),
('A: May I use your pen?\nB: ( )','Sure. Here you are.',['It is Monday.','She is tall.','I am twelve.'],'貸してよいときの「もちろん。どうぞ」。'),
('A: What day is it today?\nB: ( )','It is Thursday.',['It is yellow.','In the kitchen.','She likes apples.'],'曜日を答えます。'),
('A: I am sorry I am late.\nB: ( )','That is OK.',['Yes, I can.','It is my dog.','Three books.'],'謝る人に「大丈夫だよ」。'),
('A: Do you have any brothers?\nB: ( )','Yes, I have one.',['Yes, she is.','On Sunday.','It is cold.'],'兄弟がいるかという質問に答えます。'),
],
[
('A: Nice to meet you.\nB: ( )','Nice to meet you, too.',['I am hungry.','It is a chair.','At eight.'],'初対面の挨拶を返します。'),
('A: Whose bag is this?\nB: ( )','It is mine.',['It is hot.','I can swim.','Yes, he does.'],'Whoseは持ち主を尋ねます。'),
('A: How is the weather?\nB: ( )','It is rainy.',['She is my aunt.','I have five.','At the station.'],'天気を答えます。'),
('A: See you tomorrow.\nB: ( )','See you.',['I am ten.','Yes, please.','Under the bed.'],'別れの挨拶を返します。'),
('A: What subject do you like?\nB: ( )','I like science.',['I am at home.','It is seven.','Yes, she can.'],'好きな教科を答えます。'),
]]
orders = [
 [('わたしは毎日英語を勉強します。','I study English every day'),('あなたはピアノを弾けますか。','Can you play the piano'),('彼女はわたしの新しい先生です。','She is my new teacher'),('これはあなたの赤いかばんですか。','Is this your red bag'),('わたしの弟はネコが大好きです。','My brother likes cats very much')],
 [('わたしたちは公園でテニスをします。','We play tennis in the park'),('あなたは何冊の本を持っていますか。','How many books do you have'),('彼は今朝食を食べています。','He is eating breakfast now'),('これはわたしの姉の自転車です。',"This is my sister\u0027s bike"),('あなたはいつサッカーをしますか。','When do you play soccer')],
 [('わたしの父は上手に泳げます。','My father can swim well'),('あの大きなイヌを見てください。','Please look at that big dog'),('彼女は毎日牛乳を飲みます。','She drinks milk every day'),('あなたはどこに住んでいますか。','Where do you live now'),('彼はわたしたちの英語の先生です。','He is our English teacher')]
]
responses = [
 [('What sport do you like?','I like tennis.','At the library.','It is nine.','好きなスポーツなのでtennis。','sport'),('Can you ride a bike?','Yes, I can.','It is red.','On Friday.','Canへの応答。','bike'),('How many sisters do you have?','I have two.','She is fine.','It is sunny.','姉妹の人数を答えます。','family'),('Where is the library?','Next to the school.','I read books.','It is my bag.','場所を答えます。','town'),('Do you like milk?','Yes, I do.','Yes, she is.','Yes, he can.','Do youへの応答。','food'),('What time do you get up?','At six thirty.','It is blue.','In the park.','起床時刻を答えます。','clock'),('Who is that boy?','He is my brother.','On the table.','It is small.','誰かを答えます。','family'),('How much is this notebook?','Two dollars.','Three cats.','She is kind.','値段を答えます。','shop'),('Are you hungry?','Yes, I am.','Yes, I do.','Yes, she does.','Are youへの応答。','food'),('Let us go to the park.','Good idea.','It is mine.','I am ten.','誘いを受ける応答。','town')],
 [('What animal do you like?','I like horses.','It is Monday.','At eight.','好きな動物を答えます。','animal'),('Is this your pencil?','Yes, it is.','Yes, I do.','Yes, she can.','Is thisへの応答。','school'),('When is your birthday?','In September.','In my bag.','It is green.','誕生月を答えます。','calendar'),('Where do you play soccer?','In the park.','I like apples.','It is seven.','場所を答えます。','sport'),('Does your father cook?','Yes, he does.','Yes, I am.','Yes, it is.','Does heへの応答。','food'),('What are you doing?','I am reading.','I am twelve.','I have a cat.','今していることを答えます。','book'),('How old is your sister?','She is eight.','She is at home.','She likes music.','年齢を答えます。','family'),('Would you like some juice?','No, thank you.','No, she is not.','No, I cannot.','飲み物の申し出を断る表現。','food'),('What color is your bike?','It is white.','It is Sunday.','It is in May.','色を答えます。','bike'),('May I open the window?','Yes, please.','I have three.','She is my aunt.','許可を求める問いへの応答。','home')],
 [('What subject do you like?','I like math.','On the chair.','I have two.','好きな教科を答えます。','school'),('Can your sister sing?','Yes, she can.','Yes, he does.','Yes, I am.','Can your sisterへの応答。','music'),('Where is your dog?','Under the table.','It is Friday.','I am fine.','場所を答えます。','animal'),('What day is it today?','It is Tuesday.','It is hot.','It is my pen.','曜日を答えます。','calendar'),('How many books do you have?','I have four.','It is red.','I am a student.','本の数を答えます。','book'),('Do you walk to school?','Yes, I do.','Yes, she is.','Yes, he can.','Do youへの応答。','school'),('Whose cap is this?','It is my cap.','It is windy.','At nine.','持ち主を答えます。','shop'),('How is the weather there?','It is cloudy.','I am ten.','It is mine.','天気を答えます。','weather'),('What do you want for lunch?','A sandwich, please.','It is Saturday.','At the station.','昼食にほしい物を答えます。','food'),('Thank you for the present.','You are welcome.','Good morning.','I am hungry.','お礼への応答。','gift')]
]
convos = [
 [('A: Do you play tennis on Monday? B: No, I play on Saturday.','When does the girl play tennis?','On Saturday.',['On Monday.','On Tuesday.','On Friday.'],'MondayではなくSaturdayと言っています。'),('A: Is that your dog? B: No. My dog is white. That dog is black.','What color is the boy\u0027s dog?','White.',['Black.','Brown.','Gray.'],'自分のイヌはwhite。'),('A: What do you want for lunch? B: A sandwich, please.','What does the girl want?','A sandwich.',['Rice.','An apple.','A banana.'],'昼食にsandwichを希望しています。'),('A: How do you go to school? B: I walk with my sister.','How does the boy go to school?','He walks.',['By bus.','By bike.','By train.'],'walkは歩いて行くこと。'),('A: Where is your mother? B: She is in the kitchen.','Where is the girl\u0027s mother?','In the kitchen.',['In the park.','In the garden.','In the library.'],'kitchenを聞き取ります。')],
 [('A: Do you have three cats? B: No, I have two cats and one dog.','How many cats does the boy have?','Two.',['One.','Three.','Four.'],'ネコはtwo。'),('A: What time do you eat dinner? B: At seven.','What time does the girl eat dinner?','At seven.',['At five.','At six.','At eight.'],'夕食時刻はseven。'),('A: Do you like soccer? B: Yes, but my favorite sport is basketball.','What is the boy\u0027s favorite sport?','Basketball.',['Soccer.','Tennis.','Baseball.'],'favoriteとして挙げたbasketball。'),('A: Where is my bag? B: It is on the chair, next to your coat.','Where is the bag?','On the chair.',['Under the bed.','On the table.','In the box.'],'かばんの位置はon the chair。'),('A: Can your sister swim? B: No, but she can skate.','What can the girl\u0027s sister do?','She can skate.',['She can swim.','She can sing.','She can dance.'],'できるのはskate。')],
 [('A: Is your birthday in June? B: No, it is in July.','When is the boy\u0027s birthday?','In July.',['In May.','In June.','In August.'],'Juneを否定してJulyと答えています。'),('A: What do you drink at breakfast? B: I drink milk.','What does the girl drink?','Milk.',['Tea.','Water.','Juice.'],'朝食で飲むmilk。'),('A: Is your father a doctor? B: No. He is a teacher.','What does the boy\u0027s father do?','He is a teacher.',['He is a doctor.','He is a cook.','He is a driver.'],'父の職業はteacher。'),('A: Let us go to the park. B: Sorry. It is raining. Let us read books at home.','What does the girl want to do?','Read books.',['Play soccer.','Go shopping.','Ride a bike.'],'雨なので家で読書を提案しています。'),('A: How much is this blue pen? B: Three dollars. The red one is two dollars.','How much is the blue pen?','Three dollars.',['One dollar.','Two dollars.','Four dollars.'],'尋ねられた青いペンはthree。')]
]

# Each SVG is an original, deterministic illustration of precisely one proposition.
def scene(kind, variant=0):
    base='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 220" role="img" aria-label="問題のイラスト"><rect width="360" height="220" rx="20" fill="#edf2e8"/>'
    person='<circle cx="180" cy="45" r="20" fill="#ecc5a0"/><path d="M180 65V130M180 85L135 110M180 85L225 110M180 130L150 185M180 130L210 185" stroke="#315d57" stroke-width="12" fill="none" stroke-linecap="round"/>'
    drawings={
      'reading':person+'<path d="M130 95L180 105L230 95V140L180 150L130 140Z" fill="#e4b451" stroke="#785c29" stroke-width="3"/>',
      'tennis':person+'<ellipse cx="255" cy="90" rx="20" ry="28" fill="none" stroke="#b66b4a" stroke-width="5"/><path d="M225 110L247 110" stroke="#b66b4a" stroke-width="6"/><circle cx="292" cy="78" r="9" fill="#dcc74d"/>',
      'soccer':person+'<circle cx="243" cy="181" r="20" fill="white" stroke="#315d57" stroke-width="3"/><path d="M243 168L255 177L250 191H236L231 177Z" fill="#315d57"/>',
      'sleeping':'<rect x="70" y="100" width="230" height="60" rx="10" fill="#e5bf67"/><circle cx="108" cy="92" r="22" fill="#ecc5a0"/><path d="M100 90H113" stroke="#315d57" stroke-width="3"/><rect x="135" y="73" width="150" height="64" rx="16" fill="#91b4bd"/><path d="M75 160V190M295 160V190" stroke="#315d57" stroke-width="8"/>',
      'running':person+'<path d="M70 65H125M60 95H112M70 125H120" stroke="#c18645" stroke-width="4"/>',
      'rain':'<path d="M95 85Q75 40 120 45Q140 10 180 43Q230 22 245 65Q295 65 270 100H105Z" fill="#93aeb4"/>'+''.join(f'<path d="M{x} 125L{x-14} 158" stroke="#468da4" stroke-width="6"/>' for x in [110,155,200,245]),
      'sun':'<circle cx="180" cy="105" r="42" fill="#eabc43"/>'+''.join(f'<path d="M180 35V15" transform="rotate({a} 180 105)" stroke="#eabc43" stroke-width="7"/>' for a in range(0,360,45)),
      'apples':''.join(f'<circle cx="{100+i*75}" cy="112" r="27" fill="#cf6652"/><path d="M{100+i*75} 85V70" stroke="#547248" stroke-width="5"/>' for i in range(variant+1)),
      'ball-under':'<path d="M75 90H285M100 90V195M260 90V195" stroke="#8b6842" stroke-width="12"/><circle cx="180" cy="166" r="22" fill="#e5b449"/>',
      'ball-on':'<path d="M75 115H285M100 115V200M260 115V200" stroke="#8b6842" stroke-width="12"/><circle cx="180" cy="86" r="22" fill="#e5b449"/>',
      'cat-box':'<rect x="90" y="90" width="180" height="105" fill="#cda578"/><path d="M140 90V45L165 60Q180 52 195 60L220 45V90Z" fill="#e9dbbd" stroke="#776c51" stroke-width="3"/><circle cx="166" cy="76" r="3"/><circle cx="198" cy="76" r="3"/>',
      'music':person+'<text x="240" y="80" font-size="55" fill="#bc7b42">♪</text>',
      'bike':person+'<circle cx="100" cy="160" r="32" fill="none" stroke="#315d57" stroke-width="5"/><circle cx="260" cy="160" r="32" fill="none" stroke="#315d57" stroke-width="5"/><path d="M100 160L145 110L180 160H100L130 95M180 160L235 100L260 160M225 100H250" stroke="#b77a40" stroke-width="5" fill="none"/>',
    }
    # Context sketches are supplementary, with no answer-bearing language.
    return base+drawings.get(kind,person+'<path d="M65 195H295" stroke="#b8c9b5" stroke-width="4"/>')+'</svg>'

pictures=[
 [('reading','The boy is reading a book.','The boy is cooking.','The boy is swimming.','本を開いて読んでいる絵。'),('tennis','The girl is playing tennis.','The girl is sleeping.','The girl is eating.','ラケットでテニスをしている絵。'),('soccer','The boy is playing soccer.','The boy is singing.','The boy is reading.','足元にサッカーボール。'),('sleeping','The girl is sleeping.','The girl is running.','The girl is playing tennis.','ベッドで眠っている絵。'),('rain','It is raining.','It is sunny.','It is snowing.','雲から雨が降っています。'),('sun','It is sunny.','It is raining.','It is snowing.','太陽が出ています。'),('apples','There are three apples.','There is one apple.','There are two apples.','りんごは3個。'),('ball-under','The ball is under the table.','The ball is on the table.','The ball is in the box.','ボールは机の下。'),('ball-on','The ball is on the table.','The ball is under the table.','The ball is in the bag.','ボールは机の上。'),('cat-box','The cat is in the box.','The cat is under the chair.','The cat is on the bed.','ネコは箱の中。')],
 [('music','The boy is singing.','The boy is sleeping.','The boy is reading.','音符があり歌っている絵。'),('bike','The girl is riding a bike.','The girl is swimming.','The girl is cooking.','自転車に乗っている絵。'),('reading','The girl is reading.','The girl is dancing.','The girl is running.','本を読んでいます。'),('sleeping','The boy is sleeping.','The boy is singing.','The boy is eating.','ベッドで眠っています。'),('apples','There is one apple.','There are two apples.','There are three apples.','りんごは1個。'),('sun','It is sunny today.','It is raining today.','It is snowing today.','太陽の出た天気。'),('ball-on','There is a ball on the table.','There is a ball under the table.','There is a cat on the table.','机の上にボール。'),('cat-box','There is a cat in the box.','There is a dog in the box.','There is a cat under the box.','箱の中にネコ。'),('rain','It is rainy today.','It is sunny today.','It is snowy today.','雨の天気。'),('tennis','The boy is playing tennis.','The boy is playing soccer.','The boy is reading a book.','ラケットでテニス。')],
 [('soccer','The girl is playing soccer.','The girl is playing tennis.','The girl is cooking.','足元のサッカーボール。'),('reading','The boy has an open book.','The boy has a guitar.','The boy has a ball.','開いた本を持っています。'),('apples','There are two apples.','There is one apple.','There are three apples.','りんごは2個。'),('ball-under','There is a ball under the table.','There is a ball on the table.','There is a book under the table.','机の下のボール。'),('cat-box','A cat is in a box.','A dog is in a box.','A cat is on a chair.','箱の中のネコ。'),('music','The girl is singing.','The girl is reading.','The girl is sleeping.','歌っている絵。'),('bike','The boy is riding a bike.','The boy is playing baseball.','The boy is swimming.','自転車に乗っています。'),('rain','It is raining now.','It is sunny now.','It is snowing now.','雨が降っています。'),('sleeping','The girl is in bed.','The girl is in the park.','The girl is in the kitchen.','ベッドの中にいます。'),('tennis','The girl has a tennis racket.','The girl has a book.','The girl has a cup.','テニスラケットを持っています。')]
]

exams=[]
for s in range(3):
    rng=random.Random(51+s)
    qs=[]
    def add(section,prompt,correct,wrong,explanation,**extra):
        opts=[correct,*wrong];rng.shuffle(opts)
        q=dict(id=f'g5-m{s+1}-{len(qs)+1:02}',section=section,prompt=prompt,options=opts,answer=opts.index(correct),explanation=explanation,**extra)
        qs.append(q);return q
    for p,c,w,e in sets[s]:add('r1',p,c,[x.replace('-',' ') for x in w.split()],e)
    for p,c,w,e in dialogs[s]:add('r2',p,c,w,e)
    for ja,sentence in orders[s]:
        words=sentence.split();prefix=[]
        while len(words)>5:prefix.append(words.pop(0))
        scrambled=words.copy();rng.shuffle(scrambled)
        # The official task is a four-choice combination of the 2nd and 4th positions.
        pair=f'{words[1]} / {words[3]}'
        distract=[]
        for a,b in [(0,2),(2,1),(3,0)]:distract.append(f'{words[a]} / {words[b]}')
        add('r3',ja+'\n'+(' '.join(prefix)+' ' if prefix else '')+'( 1 ) ( 2 ) ( 3 ) ( 4 ) ( 5 )\n'+ ' / '.join(scrambled)+'\n空欄の2番目 / 4番目に入る語の組み合わせは？',pair,distract,sentence+'.',sentence=sentence)
    for p,c,w1,w2,e,kind in responses[s]:
        q=add('l1','イラストを参考に、最後の問いへの返事を選ぼう。',c,[w1,w2],e,scene=scene(kind))
        q['script']='A: Hello. B: Hello. A: '+p+'\n'+ '\n'.join(f'{i+1}. {o}' for i,o in enumerate(q['options']))
    for dialog,p,c,w,e in convos[s]:
        q=add('l2','会話を聞いて質問に答えよう。',c,w,e)
        q['script']=dialog+'\n'+p
    for kind,c,w1,w2,e in pictures[s]:
        q=add('l3','絵に合う英文を選ぼう。',c,[w1,w2],e,scene=scene(kind,[2,0,1][s]))
        q['script']='\n'.join(f'{i+1}. {o}' for i,o in enumerate(q['options']))
    exams.append(dict(id=f'g5-m{s+1}',title=f'実戦テスト {s+1}',questions=qs))

out={'version':1,'checkedAt':'2026-10-31','notice':'公式の出題構成を参考にした独自問題。公式過去問の転載ではありません。','sources':[{'title':'英検5級の試験内容','url':'https://www.eiken.or.jp/eiken/exam/grade_5/solutions.html'},{'title':'公式過去問・音源','url':'https://www.eiken.or.jp/eiken/exam/grade_5/'},{'title':'公式の過去問ひもとき講座','url':'https://eigojoho.eiken.or.jp/study/2943/'}],'exams':exams}
target=root/'dist/data/mock-exams.json'
if target.exists():
    previous=json.loads(target.read_text(encoding='utf-8'))
    audio={q['id']:(q.get('script'),q.get('audio')) for ex in previous['exams'] for q in ex['questions'] if q.get('audio')}
    for ex in exams:
        for q in ex['questions']:
            old=audio.get(q['id'])
            if old and old[0]==q.get('script'):q['audio']=old[1]
target.write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Created 3 original exams, 150 questions')
