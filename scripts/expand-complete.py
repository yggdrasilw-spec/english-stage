import json,pathlib,re
root=pathlib.Path(__file__).resolve().parents[1]
deck=json.loads((root/'tests/grade5-v2.json').read_text(encoding='utf-8'))
base=list(deck); existing={c['en'].lower() for c in deck}
def add(en,ja,ex,exja,theme,kind='word'):
 if en.lower() in existing:return
 existing.add(en.lower())
 ident='g5-'+('w-' if kind=='word' else 'p-extra-')+re.sub('[^a-z0-9]+','-',en.lower()).strip('-')
 deck.append(dict(id=ident,kind=kind,theme=theme,en=en,ja=ja,example=ex,exampleJa=exja,reading='',explanation=f'{en}：{ja}。例文の場面で使ってみよう。',grade=5,revision=2,prerequisites=[],source='独自教材／範囲参照: https://www.eiken.or.jp/eiken/exam/grade_5/',review='独自に作成・本人試用待ち',image=None,audioMode='google-neural2',audioText=en,exampleAudioText=ex))
# Concrete count nouns: each row supplies a natural example and an unambiguous sense.
groups={
'食べ物と買い物':'''sandwich|サンドイッチ
hamburger|ハンバーガー
potato|じゃがいも
tomato|トマト
carrot|にんじん
onion|玉ねぎ
lemon|レモン
peach|桃
melon|メロン
cookie|クッキー
cup|カップ
glass|コップ
plate|皿
spoon|スプーン
fork|フォーク
knife|ナイフ
bottle|瓶
basket|かご
coin|硬貨
menu|メニュー
present|贈り物
dollar|ドル（通貨単位）''',
'動物と自然':'''bear|熊
tiger|虎
fox|きつね
sheep|羊
duck|あひる
mouse|ねずみ
turtle|亀
snake|蛇
frog|蛙
butterfly|蝶
ant|蟻
bee|蜂
pet|ペット
flower|花
tree|木
leaf|葉
river|川
lake|湖
mountain|山
star|星
cloud|雲
stone|石
island|島''',
'学校と持ち物':'''pencil case|筆箱
textbook|教科書
dictionary|辞書
letter|手紙
stamp|切手
postcard|はがき
calendar|カレンダー
camera|カメラ
phone|電話
watch|腕時計
key|鍵
umbrella|傘
bicycle|自転車
bike|自転車（くだけた言い方）
ball|ボール
bat|バット
racket|ラケット
game|ゲーム
toy|おもちゃ
doll|人形
robot|ロボット
kite|凧
model|模型
ticket|切符
test|テスト
question|質問
answer|答え
word|単語
page|ページ
sentence|文
story|物語
song|歌
movie|映画
CD|CD''',
'家と町':'''table|テーブル
bed|ベッド
sofa|ソファ
TV|テレビ
television|テレビ（正式な言い方）
radio|ラジオ
lamp|ランプ
mirror|鏡
desk lamp|電気スタンド
floor|床
wall|壁
roof|屋根
gate|門
building|建物
classroom|教室
gym|体育館
office|事務所
post office|郵便局
bank|銀行
hotel|ホテル
museum|博物館
airport|空港
bus stop|バス停
shop|店
bookstore|本屋
flower shop|花屋
street|通り
road|道路
bridge|橋
corner|角
farm|農場
city|都市
village|村
country|国
train|電車
plane|飛行機
ship|船
boat|小舟
truck|トラック
taxi|タクシー''',
'人と体と服':'''baby|赤ちゃん
child|子ども
man|男性
woman|女性
uncle|おじ
aunt|おば
cousin|いとこ
parent|親
doctor|医者
nurse|看護師
dentist|歯医者
farmer|農家の人
driver|運転手
singer|歌手
player|選手
police officer|警察官
cook|料理人
face|顔
arm|腕
leg|脚
foot|足（足首から先）
finger|指
tooth|歯
neck|首
knee|膝
shoulder|肩
cap|つばのある帽子
T-shirt|Tシャツ
sweater|セーター
jacket|ジャケット
skirt|スカート
dress|ワンピース
sock|靴下
glove|手袋
boot|ブーツ
uniform|制服'''
}
for theme,rows in groups.items():
 for row in rows.splitlines():
  en,ja=row.split('|');add(en,ja,f'Look at the {en.lower()}.',f'その{ja.split("（")[0]}を見て。',theme)
# Other words use individual examples so function words, mass nouns and verbs are not forced into noun templates.
rows='''I|わたしは|I am Yui.|わたしはユイです。
you|あなたは・あなたたちは|You are kind.|あなたは親切です。
he|彼は|He is my brother.|彼はわたしの兄（弟）です。
she|彼女は|She is my sister.|彼女はわたしの姉（妹）です。
it|それは|It is a dog.|それは犬です。
we|わたしたちは|We like music.|わたしたちは音楽が好きです。
they|彼らは・それらは|They are students.|彼らは生徒です。
my|わたしの|This is my bag.|これはわたしのかばんです。
your|あなたの|Is this your pen?|これはあなたのペンですか。
his|彼の|His name is Tom.|彼の名前はトムです。
her|彼女の・彼女を|This is her book.|これは彼女の本です。
our|わたしたちの|This is our school.|これはわたしたちの学校です。
their|彼らの|Their house is big.|彼らの家は大きいです。
me|わたしを・わたしに|Please help me.|わたしを手伝ってください。
him|彼を・彼に|I know him.|わたしは彼を知っています。
us|わたしたちを・わたしたちに|Please join us.|わたしたちの仲間に入ってください。
them|彼らを・それらを|I like them.|わたしはそれらが好きです。
mine|わたしのもの|This pen is mine.|このペンはわたしのものです。
yours|あなたのもの|Is this yours?|これはあなたのものですか。
this|これ・この|This is a cat.|これは猫です。
that|あれ・あの|That is a dog.|あれは犬です。
these|これら・これらの|These are my books.|これらはわたしの本です。
those|あれら・あれらの|Those are birds.|あれらは鳥です。
who|だれ|Who is she?|彼女はだれですか。
what|何|What is this?|これは何ですか。
where|どこ|Where is my bag?|わたしのかばんはどこですか。
when|いつ|When is your birthday?|誕生日はいつですか。
whose|だれの|Whose bag is this?|これはだれのかばんですか。
which|どちら・どの|Which bag is yours?|どちらのかばんがあなたのものですか。
how|どのように・どれくらい|How are you?|元気ですか。
why|なぜ|Why do you like dogs?|なぜ犬が好きなのですか。
a|ひとつの（子音の音の前）|I have a pen.|わたしはペンを1本持っています。
an|ひとつの（母音の音の前）|I eat an apple.|わたしはりんごを1個食べます。
the|その（特定のもの）|Open the door.|そのドアを開けて。
am|〜です（Iと使う）|I am happy.|わたしはうれしいです。
is|〜です（単数と使う）|She is kind.|彼女は親切です。
are|〜です（you・複数と使う）|We are students.|わたしたちは生徒です。
be|〜である（原形）|Please be quiet.|静かにしてください。
do|〜する・疑問文などを作る|Do you like cats?|猫は好きですか。
does|doの三人称単数形|Does he play tennis?|彼はテニスをしますか。
can|〜できる|I can swim.|わたしは泳げます。
not|〜でない|I am not tired.|わたしは疲れていません。
yes|はい|Yes, I do.|はい、そうです。
no|いいえ|No, I do not.|いいえ、違います。
please|どうぞ・〜してください|Please sit down.|座ってください。
and|〜と・そして|I like cats and dogs.|わたしは猫と犬が好きです。
but|しかし|I am tired, but I am happy.|疲れていますが、うれしいです。
or|または|Tea or milk?|お茶、それとも牛乳ですか。
because|なぜなら〜だから|I like summer because I can swim.|泳げるので夏が好きです。
in|〜の中に|The pen is in the box.|ペンは箱の中です。
on|〜の上に（接して）|The book is on the desk.|本は机の上です。
under|〜の下に|The cat is under the chair.|猫は椅子の下です。
at|〜で・時刻の〜に|I get up at seven.|わたしは7時に起きます。
to|〜へ・〜に|I go to school.|わたしは学校へ行きます。
from|〜から|I am from Japan.|わたしは日本出身です。
with|〜と一緒に・〜を使って|I play with my sister.|わたしは妹（姉）と遊びます。
for|〜のために|This is for you.|これはあなたへのものです。
of|〜の|This is a picture of my dog.|これはわたしの犬の写真です。
by|〜で（手段）・〜のそばに|I go by bus.|わたしはバスで行きます。
about|〜について・約|Tell me about your school.|あなたの学校について教えて。
near|〜の近くに|The park is near my house.|公園はわたしの家の近くです。
behind|〜の後ろに|The dog is behind the tree.|犬は木の後ろです。
between|〜の間に（2つ）|The ball is between the boxes.|ボールは2つの箱の間です。
before|〜の前に（時間）|Wash your hands before dinner.|夕食の前に手を洗って。
after|〜の後に（時間）|I play after school.|わたしは放課後に遊びます。
up|上へ|Look up.|上を見て。
down|下へ|Sit down.|座って。
out|外へ|Let's go out.|外へ出かけましょう。
here|ここに|Come here.|ここに来て。
there|そこに・あそこに|My bag is there.|かばんはあそこです。
some|いくらかの|I want some water.|水がいくらか欲しいです。
any|いくらかの（疑問・否定で）|Do you have any pets?|ペットを飼っていますか。
many|たくさんの（数）|I have many books.|本をたくさん持っています。
much|たくさんの（量）|Thank you very much.|どうもありがとうございます。
all|すべての|All my friends like music.|わたしの友達はみんな音楽が好きです。
every|毎〜・すべての（単数）|I read every day.|わたしは毎日本を読みます。
each|それぞれの|Each student has a book.|それぞれの生徒が本を持っています。
other|ほかの|The other bag is blue.|もう一方のかばんは青いです。
another|もうひとつの|I want another apple.|もうひとつりんごが欲しいです。
both|両方の|Both my sisters play tennis.|わたしの2人の姉（妹）はどちらもテニスをします。
have|持っている・食べる|I have a bike.|自転車を持っています。
has|haveの三人称単数形|She has a cat.|彼女は猫を飼っています。
like|好む|I like apples.|わたしはりんごが好きです。
love|大好きである|I love my family.|家族が大好きです。
want|欲しい|I want a new bag.|新しいかばんが欲しいです。
need|必要とする|I need a pen.|ペンが必要です。
know|知っている|I know that song.|その歌を知っています。
think|思う・考える|I think it is good.|それはよいと思います。
understand|理解する|I understand English.|わたしは英語がわかります。
remember|覚えている|I remember your name.|あなたの名前を覚えています。
forget|忘れる|Don't forget your bag.|かばんを忘れないで。
see|見える・会う|I see a bird.|鳥が見えます。
look|見る|Look at this picture.|この絵を見て。
hear|聞こえる|I can hear music.|音楽が聞こえます。
say|言う|Please say your name.|名前を言ってください。
tell|伝える|Tell me your name.|名前を教えて。
talk|話す|I talk with my friends.|友達と話します。
ask|尋ねる|Ask your teacher.|先生に尋ねて。
help|助ける・手伝う|Please help me.|手伝ってください。
use|使う|Can I use this pen?|このペンを使っていいですか。
make|作る|I make lunch.|昼食を作ります。
take|取る・連れて行く|Take this book.|この本を持っていって。
give|あげる|Give me the ball, please.|ボールをください。
get|手に入れる|I get a present.|贈り物をもらいます。
put|置く|Put your book on the desk.|本を机に置いて。
bring|持ってくる|Bring your notebook.|ノートを持ってきて。
buy|買う|I buy a book.|本を買います。
open|開ける|Open your book.|本を開いて。
close|閉める|Close the door.|ドアを閉めて。
start|始める|Let's start the game.|ゲームを始めましょう。
finish|終える|I finish my homework.|宿題を終えます。
stop|止まる・止める|Stop here, please.|ここで止まってください。
wait|待つ|Please wait here.|ここで待ってください。
live|住む|I live in Tokyo.|わたしは東京に住んでいます。
work|働く|My mother works here.|母はここで働いています。
teach|教える|He teaches English.|彼は英語を教えています。
learn|学ぶ|I learn English.|英語を学びます。
practice|練習する|I practice the piano.|ピアノを練習します。
draw|絵を描く|I draw a cat.|猫を描きます。
clean|掃除する|I clean my room.|部屋を掃除します。
ride|乗る|I ride my bike.|自転車に乗ります。
drive|運転する|My father drives a bus.|父はバスを運転します。
fly|飛ぶ|Birds can fly.|鳥は飛べます。
jump|跳ぶ|I can jump high.|高く跳べます。
sit|座る|Please sit here.|ここに座ってください。
stand|立つ|Please stand up.|立ってください。
meet|会う|I meet my friends.|友達に会います。
visit|訪ねる|I visit my grandmother.|祖母を訪ねます。
enjoy|楽しむ|I enjoy music.|音楽を楽しみます。
stay|滞在する|I stay at home.|家にいます。
leave|出発する・去る|I leave home at eight.|8時に家を出ます。
arrive|到着する|We arrive at school at eight.|わたしたちは8時に学校に着きます。
return|戻る|I return home at five.|5時に家に戻ります。
carry|運ぶ|I carry my bag.|かばんを運びます。
find|見つける|I can find my pen.|ペンを見つけられます。
try|試す|Let's try this game.|このゲームをやってみましょう。
turn|曲がる・回す|Turn right.|右に曲がって。
call|電話する・呼ぶ|Please call me.|電話してください。
cut|切る|I cut the paper.|紙を切ります。
catch|捕まえる・受け止める|Catch the ball.|ボールを受け止めて。
throw|投げる|Throw the ball.|ボールを投げて。
kick|蹴る|I kick the ball.|ボールを蹴ります。
smile|ほほえむ|The baby smiles.|赤ちゃんがほほえみます。
cry|泣く|The baby is crying.|赤ちゃんが泣いています。'''
for row in rows.splitlines():add(*row.split('|'),'文をつくることば')
rows='''beautiful|美しい|This flower is beautiful.|この花は美しいです。
cute|かわいい|Your cat is cute.|あなたの猫はかわいいです。
nice|すてきな|This is a nice bag.|これはすてきなかばんです。
great|すばらしい|That is a great idea.|それはすばらしい考えです。
fine|元気な・晴れた|I am fine.|元気です。
bad|悪い|That is a bad idea.|それはよくない考えです。
sad|悲しい|I am sad.|悲しいです。
angry|怒った|He is angry.|彼は怒っています。
sleepy|眠い|I am sleepy.|眠いです。
thirsty|喉が渇いた|I am thirsty.|喉が渇いています。
sick|病気の・気分が悪い|I am sick.|体調が悪いです。
young|若い|My teacher is young.|わたしの先生は若いです。
tall|背が高い|He is tall.|彼は背が高いです。
high|高い（高さ）|That mountain is high.|あの山は高いです。
low|低い|This table is low.|このテーブルは低いです。
large|大きな（広さ・量）|This room is large.|この部屋は広いです。
little|小さな・少しの|Look at the little dog.|その小さな犬を見て。
fast|速い・速く|He can run fast.|彼は速く走れます。
slow|遅い|This bus is slow.|このバスは遅いです。
easy|簡単な|This question is easy.|この問題は簡単です。
difficult|難しい|This question is difficult.|この問題は難しいです。
interesting|おもしろい（興味深い）|This book is interesting.|この本はおもしろいです。
fun|楽しいこと|Soccer is fun.|サッカーは楽しいです。
favorite|いちばん好きな|My favorite sport is tennis.|いちばん好きなスポーツはテニスです。
delicious|おいしい|This cake is delicious.|このケーキはおいしいです。
sweet|甘い|This apple is sweet.|このりんごは甘いです。
warm|暖かい|It is warm today.|今日は暖かいです。
cool|涼しい|It is cool today.|今日は涼しいです。
right|右・正しい|Turn right.|右に曲がって。
left|左|Turn left.|左に曲がって。
wrong|間違った|That answer is wrong.|その答えは間違っています。
early|早い時間に|I get up early.|早く起きます。
late|遅れた・遅い時間に|Don't be late.|遅れないで。
free|暇な・無料の|Are you free today?|今日は暇ですか。
full|いっぱいの|The box is full.|その箱はいっぱいです。
ready|準備ができた|I am ready.|準備ができました。
quiet|静かな|Please be quiet.|静かにしてください。
strong|強い|He is strong.|彼は力が強いです。
safe|安全な|This place is safe.|ここは安全です。
dark|暗い|This room is dark.|この部屋は暗いです。
bright|明るい|This room is bright.|この部屋は明るいです。
brown|茶色の|My bag is brown.|かばんは茶色です。
pink|ピンク色の|This flower is pink.|この花はピンク色です。
purple|紫色の|This pen is purple.|このペンは紫色です。
gray|灰色の|The cat is gray.|猫は灰色です。
very|とても|It is very hot.|とても暑いです。
well|上手に|She sings well.|彼女は上手に歌います。
too|〜も・〜すぎる|I like dogs, too.|わたしも犬が好きです。
also|〜もまた|I also like cats.|わたしは猫も好きです。
really|本当に|I really like music.|音楽が本当に好きです。
always|いつも|I always eat breakfast.|いつも朝食を食べます。
usually|たいてい|I usually walk to school.|たいてい歩いて学校に行きます。
often|よく・しばしば|I often read books.|よく本を読みます。
sometimes|ときどき|I sometimes play tennis.|ときどきテニスをします。
never|一度も〜ない|I never drink coffee.|コーヒーは全く飲みません。
now|今|I am studying now.|今、勉強しています。
again|もう一度|Please say it again.|もう一度言ってください。
together|一緒に|Let's play together.|一緒に遊びましょう。
only|〜だけ|I have only one pen.|ペンを1本だけ持っています。
soon|まもなく|See you soon.|また近いうちに会いましょう。
away|離れて|The station is far away.|駅は遠く離れています。
home|家へ・自宅|I go home at four.|4時に家へ帰ります。
outside|外に|Let's play outside.|外で遊びましょう。
inside|中に|Please come inside.|中に入ってください。'''
for row in rows.splitlines():add(*row.split('|'),'様子と頻度')
rows='''time|時間・時刻|What time is it?|何時ですか。
day|日・1日|Have a nice day.|よい1日を。
week|週|I play tennis every week.|毎週テニスをします。
month|月（期間）|My birthday is next month.|誕生日は来月です。
year|年|I am ten years old.|わたしは10歳です。
hour|1時間|I study for an hour.|1時間勉強します。
minute|分|Please wait ten minutes.|10分待ってください。
second|秒・2番目|Wait one second.|1秒待って。
weekend|週末|I play soccer on weekends.|週末にサッカーをします。
holiday|休日|Today is a holiday.|今日は休日です。
vacation|休暇|I like summer vacation.|夏休みが好きです。
yesterday|昨日|It was sunny yesterday.|昨日は晴れでした。
tonight|今夜|I am at home tonight.|今夜は家にいます。
next|次の|See you next week.|また来週会いましょう。
last|この前の・最後の|This is the last question.|これが最後の問題です。
first|1番目の|This is my first book.|これはわたしの最初の本です。
third|3番目の|This is my third book.|これはわたしの3冊目の本です。
thirty|30|I have thirty books.|本を30冊持っています。
forty|40|My father is forty.|父は40歳です。
fifty|50|I have fifty cards.|カードを50枚持っています。
sixty|60|An hour has sixty minutes.|1時間は60分です。
seventy|70|My grandmother is seventy.|祖母は70歳です。
eighty|80|This pen is eighty yen.|このペンは80円です。
ninety|90|This book has ninety pages.|この本は90ページあります。
hundred|100|This pen is one hundred yen.|このペンは100円です。
thousand|1000|This bag is one thousand yen.|このかばんは1000円です。
zero|0|The number is zero.|その数は0です。
half|半分|I want half of the cake.|ケーキの半分が欲しいです。
yen|円|This is one hundred yen.|これは100円です。
Japan|日本|I live in Japan.|日本に住んでいます。
Japanese|日本語・日本の|I speak Japanese.|日本語を話します。
America|アメリカ合衆国|My friend lives in America.|友達はアメリカに住んでいます。
American|アメリカの・アメリカ人|He is American.|彼はアメリカ人です。
Canada|カナダ|I am from Canada.|カナダ出身です。
Australia|オーストラリア|I live in Australia.|オーストラリアに住んでいます。
China|中国|My friend is from China.|友達は中国出身です。
Chinese|中国語・中国の|She speaks Chinese.|彼女は中国語を話します。
Korea|韓国・朝鮮|My friend is from Korea.|友達は韓国出身です。
French|フランス語・フランスの|I study French.|フランス語を勉強します。
science|理科・科学|I like science.|理科が好きです。
art|美術・芸術|I like art.|美術が好きです。
PE|体育|We have PE today.|今日は体育があります。
subject|教科|What subject do you like?|どの教科が好きですか。
homework|宿題|I do my homework.|宿題をします。
lesson|授業・レッスン|I have a piano lesson today.|今日はピアノのレッスンがあります。
club|クラブ|I am in the tennis club.|テニスクラブに入っています。
team|チーム|This is our team.|これがわたしたちのチームです。
member|会員・一員|I am a member of this club.|このクラブの一員です。
name|名前|My name is Yui.|名前はユイです。
age|年齢|We are the same age.|わたしたちは同じ年齢です。
number|数・番号|What is your phone number?|電話番号は何番ですか。
color|色|What color do you like?|何色が好きですか。
food|食べ物|My favorite food is rice.|好きな食べ物はご飯です。
fruit|果物（総称）|I eat fruit every day.|毎日果物を食べます。
vegetable|野菜|A carrot is a vegetable.|にんじんは野菜です。
coffee|コーヒー|My father drinks coffee.|父はコーヒーを飲みます。
sugar|砂糖|I want some sugar.|砂糖がいくらか欲しいです。
salt|塩|Pass me the salt, please.|塩を取ってください。
butter|バター|I like bread with butter.|バターを塗ったパンが好きです。
beef|牛肉|I like beef.|牛肉が好きです。
pork|豚肉|I eat pork.|豚肉を食べます。
salad|サラダ|I eat salad for lunch.|昼食にサラダを食べます。
curry|カレー|I like curry.|カレーが好きです。
pizza|ピザ|Let's eat pizza.|ピザを食べましょう。
spaghetti|スパゲッティ|I like spaghetti.|スパゲッティが好きです。
weather|天気|How is the weather?|天気はどうですか。
sky|空|The sky is blue.|空は青いです。
sun|太陽|The sun is bright.|太陽は明るいです。
moon|月（天体）|Look at the moon.|月を見て。
sea|海|I can see the sea.|海が見えます。
air|空気|We need air.|わたしたちには空気が必要です。
grass|草|The grass is green.|草は緑色です。
hair|髪|Her hair is long.|彼女の髪は長いです。
clothes|衣服|I wash my clothes.|服を洗います。
pants|ズボン|These pants are blue.|このズボンは青いです。
shorts|半ズボン|I wear shorts in summer.|夏は半ズボンをはきます。
shoes|靴（複数）|My shoes are new.|わたしの靴は新しいです。
glasses|眼鏡|I wear glasses.|眼鏡をかけています。
people|人々|Many people are in the park.|公園にたくさんの人がいます。
children|子どもたち|The children are playing.|子どもたちは遊んでいます。
feet|足（複数）|Wash your feet.|足を洗って。
teeth|歯（複数）|I brush my teeth.|歯を磨きます。
money|お金|I need some money.|お金がいくらか必要です。
paper|紙|I need some paper.|紙がいくらか必要です。
news|知らせ・ニュース|That is good news.|それはよい知らせです。
idea|考え|That is a good idea.|それはよい考えです。
thing|もの・こと|What is that thing?|あのものは何ですか。
place|場所|This is a nice place.|ここはすてきな場所です。
life|生活・命|I like my school life.|学校生活が好きです。
trip|旅行|Have a nice trip.|よい旅を。
party|パーティー|Come to my party.|わたしのパーティーに来て。
picnic|ピクニック|Let's have a picnic.|ピクニックをしましょう。
shopping|買い物|I go shopping on Sundays.|日曜日に買い物に行きます。
swimming|水泳|I like swimming.|水泳が好きです。
running|走ること|I like running.|走ることが好きです。
fishing|魚釣り|I like fishing.|魚釣りが好きです。
tennis court|テニスコート|Let's go to the tennis court.|テニスコートに行きましょう。
wear|身に着けている|I wear a uniform.|制服を着ています。
brush|ブラシで磨く|I brush my teeth.|歯を磨きます。
take a bath|風呂に入る|I take a bath at night.|夜に風呂に入ります。
go to bed|寝る|I go to bed at nine.|9時に寝ます。
get home|帰宅する|I get home at five.|5時に帰宅します。
have lunch|昼食を食べる|I have lunch at twelve.|12時に昼食を食べます。
after school|放課後|I play soccer after school.|放課後にサッカーをします。
every day|毎日|I read every day.|毎日本を読みます。
on foot|歩いて|I go to school on foot.|歩いて学校へ行きます。
in front of|〜の前に（位置）|The bus is in front of the school.|バスは学校の前にいます。
next to|〜の隣に|I sit next to my friend.|友達の隣に座ります。
a lot of|たくさんの|I have a lot of books.|本をたくさん持っています。
look at|〜を見る|Look at the sky.|空を見て。
listen to|〜を聞く|I listen to music.|音楽を聞きます。
be from|〜の出身である|I am from Japan.|日本出身です。
be good at|〜が得意である|I am good at tennis.|テニスが得意です。
want to|〜したい|I want to play soccer.|サッカーをしたいです。
would like|〜が欲しい（丁寧）|I would like some water.|水をいただきたいです。
how much|値段・量はいくら|How much is this bag?|このかばんはいくらですか。
how many|数はいくつ|How many books do you have?|本を何冊持っていますか。
how old|何歳|How old are you?|何歳ですか。
how about|〜はどうですか|How about you?|あなたはどうですか。'''
for row in rows.splitlines():add(*row.split('|'),'生活と時間')
phrases='''I'm from Japan.|日本出身です。
Where are you from?|どこの出身ですか。
I live in Tokyo.|東京に住んでいます。
Where do you live?|どこに住んでいますか。
Who is that boy?|あの男の子はだれですか。
He is my brother.|彼はわたしの兄（弟）です。
This is my friend.|こちらはわたしの友達です。
Is this your book?|これはあなたの本ですか。
Yes, it is.|はい、そうです。（単数のものについて）
No, it isn't.|いいえ、違います。（単数のものについて）
Are you a student?|あなたは生徒ですか。
Yes, I am.|はい、そうです。（自分について）
No, I'm not.|いいえ、違います。（自分について）
These are my shoes.|これらはわたしの靴です。
Whose pen is this?|これはだれのペンですか。
It's mine.|わたしのものです。
What color is it?|それは何色ですか。
It's blue.|青色です。
What's your favorite food?|いちばん好きな食べ物は何ですか。
My favorite food is curry.|いちばん好きな食べ物はカレーです。
What subject do you like?|どの教科が好きですか。
I like English.|英語が好きです。
Does she like tennis?|彼女はテニスが好きですか。
Yes, she does.|はい、彼女はそうです。
No, she doesn't.|いいえ、彼女は違います。
He plays soccer every day.|彼は毎日サッカーをします。
She doesn't play the piano.|彼女はピアノを弾きません。
What do you have for breakfast?|朝食に何を食べますか。
I have bread and milk.|パンと牛乳をとります。
When do you get up?|いつ起きますか。
I get up at seven.|7時に起きます。
I go to bed at nine.|9時に寝ます。
What do you do after school?|放課後は何をしますか。
I do my homework after school.|放課後に宿題をします。
How do you go to school?|どうやって学校に行きますか。
I walk to school.|歩いて学校へ行きます。
How much is this?|これはいくらですか。
It's five hundred yen.|500円です。
May I help you?|いらっしゃいませ。何かお探しですか。
I'd like this one.|これをいただきたいです。
Anything else?|ほかに何かありますか。
No, thank you.|いいえ、結構です。
Can I have some water?|水をもらえますか。
You're welcome.|どういたしまして。（短縮形）
I'm hungry.|おなかがすいています。
I'm thirsty.|喉が渇いています。
Let's have lunch.|昼食にしましょう。
How about some juice?|ジュースはいかがですか。
How's the weather today?|今日の天気はどうですか。
It's sunny today.|今日は晴れです。
It's cold in winter.|冬は寒いです。
What season do you like?|どの季節が好きですか。
I like summer.|夏が好きです。
What can you do?|何ができますか。
I can play the piano.|ピアノが弾けます。
I can't swim.|泳げません。
Yes, I can.|はい、できます。
No, I can't.|いいえ、できません。
Can you help me?|手伝ってくれますか。
Sure.|もちろんです。
Sorry, I can't.|ごめんなさい、できません。
Let's go to the park.|公園へ行きましょう。
That's a good idea.|それはよい考えです。
Sorry, I'm busy.|ごめんなさい、忙しいです。
Are you free tomorrow?|明日は暇ですか。
Please come in.|どうぞ入ってください。
Please sit down.|座ってください。
Stand up, please.|立ってください。
Don't run here.|ここでは走らないで。
Be careful.|気をつけて。
Please be quiet.|静かにしてください。
Turn right at the corner.|角で右に曲がって。
The bank is next to the station.|銀行は駅の隣です。
Where is the post office?|郵便局はどこですか。
It's near the park.|公園の近くです。
There is a cat under the table.|テーブルの下に猫がいます。
There are three books on the desk.|机の上に本が3冊あります。
Is he reading a book?|彼は本を読んでいますか。
Yes, he is.|はい、彼はそうしています。
No, he isn't.|いいえ、彼はそうしていません。
They are playing soccer.|彼らはサッカーをしています。
I'm not watching TV.|テレビを見ていません。
What is she doing?|彼女は何をしていますか。
She is cooking dinner.|彼女は夕食を作っています。
I want to be a teacher.|先生になりたいです。
I like playing tennis.|テニスをするのが好きです。
Happy birthday!|お誕生日おめでとう。
Happy New Year!|あけましておめでとう。
Have a nice day.|よい1日を。
Have a good time.|楽しんできてね。
See you later.|またあとで。
Take care.|元気でね。
Are you OK?|大丈夫ですか。
I'm tired.|疲れています。
What's wrong?|どうしたのですか。
One more time, please.|もう一度お願いします。
Please speak slowly.|ゆっくり話してください。
I don't understand.|わかりません。
How do you say this in English?|これは英語で何と言いますか。
What does this word mean?|この単語はどういう意味ですか。'''
for row in phrases.splitlines():
 en,ja=row.split('|');add(en,ja,en,ja,'基本の会話と文型','phrase')
(root/'tests/grade5-v2.json').write_text(json.dumps(base,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'dist/data/grade5.json').write_text(json.dumps(deck,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'scripts/grade5-expansion-02.json').write_text(json.dumps(deck[len(base):],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('words',sum(c['kind']=='word' for c in deck),'phrases',sum(c['kind']=='phrase' for c in deck))

# Preserve the independently authored RareJob vocabulary supplement.
import runpy
runpy.run_path(str(root/"scripts/sync-rarejob-vocabulary.py"))["sync"]()
