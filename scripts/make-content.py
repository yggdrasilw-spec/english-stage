import json,csv,pathlib
root=pathlib.Path(__file__).resolve().parents[1]
# English meanings and examples are authored independently of the source dictionary.
groups={
'食べ物':'''apple|りんご|I like apples.|わたしはりんごが好きです。|りんご
banana|バナナ|This is a banana.|これはバナナです。|ばなな
orange|オレンジ（果物）|I eat an orange.|わたしはオレンジを食べます。|おれんじ
bread|パン|I eat bread for breakfast.|わたしは朝食にパンを食べます。|ぱん
rice|ご飯|I like rice.|わたしはご飯が好きです。|ごはん
milk|牛乳|I drink milk.|わたしは牛乳を飲みます。|ぎゅうにゅう
water|水|I drink water.|わたしは水を飲みます。|みず
egg|卵|This is an egg.|これは卵です。|たまご
cake|ケーキ|This cake is good.|このケーキはおいしいです。|けーき
fish|魚|I like fish.|わたしは魚が好きです。|さかな''',
'動物':'''dog|犬|This is my dog.|これはわたしの犬です。|いぬ
cat|猫|The cat is small.|その猫は小さいです。|ねこ
bird|鳥|That bird can fly.|あの鳥は飛べます。|とり
rabbit|うさぎ|I have a rabbit.|わたしはうさぎを飼っています。|うさぎ
horse|馬|That horse is big.|あの馬は大きいです。|うま
cow|牛|This is a cow.|これは牛です。|うし
pig|豚|That pig is pink.|あの豚はピンク色です。|ぶた
elephant|象|An elephant has big ears.|象には大きな耳があります。|ぞう
lion|ライオン|That is a lion.|あれはライオンです。|らいおん
monkey|猿|I see a monkey.|わたしには猿が見えます。|さる''',
'学校と持ち物':'''book|本|This is my book.|これはわたしの本です。|ほん
pen|ペン|I have a pen.|わたしはペンを持っています。|ぺん
pencil|鉛筆|This pencil is long.|この鉛筆は長いです。|えんぴつ
desk|机|This is my desk.|これはわたしの机です。|つくえ
chair|椅子|The chair is red.|その椅子は赤いです。|いす
bag|かばん|My bag is blue.|わたしのかばんは青いです。|かばん
school|学校|I go to school.|わたしは学校に行きます。|がっこう
teacher|先生|She is a teacher.|彼女は先生です。|せんせい
student|生徒|He is a student.|彼は生徒です。|
English|英語|I study English.|わたしは英語を勉強します。|''',
'家族と人':'''mother|母|My mother likes music.|わたしの母は音楽が好きです。|
father|父|My father can swim.|わたしの父は泳げます。|
sister|姉・妹|My sister is ten.|わたしの姉（妹）は10歳です。|
brother|兄・弟|My brother likes soccer.|わたしの兄（弟）はサッカーが好きです。|
grandmother|祖母|My grandmother is kind.|わたしの祖母は親切です。|
grandfather|祖父|My grandfather likes tea.|わたしの祖父はお茶が好きです。|
friend|友達|She is my friend.|彼女はわたしの友達です。|
family|家族|I love my family.|わたしは家族が大好きです。|
boy|男の子|That boy is Tom.|あの男の子はトムです。|
girl|女の子|That girl is my sister.|あの女の子はわたしの姉（妹）です。|''',
'色と様子':'''red|赤い|This apple is red.|このりんごは赤いです。|
blue|青い|My bag is blue.|わたしのかばんは青いです。|
green|緑色の|This pen is green.|このペンは緑色です。|
yellow|黄色い|This flower is yellow.|この花は黄色いです。|
white|白い|That cat is white.|あの猫は白いです。|
black|黒い|My shoes are black.|わたしの靴は黒いです。|
big|大きい|This dog is big.|この犬は大きいです。|
small|小さい|This cat is small.|この猫は小さいです。|
happy|うれしい|I am happy.|わたしはうれしいです。|
hungry|おなかがすいている|I am hungry.|わたしはおなかがすいています。|''',
'毎日の動作':'''eat|食べる|I eat breakfast.|わたしは朝食を食べます。|
drink|飲む|I drink water.|わたしは水を飲みます。|
play|遊ぶ・スポーツをする|I play tennis.|わたしはテニスをします。|
read|読む|I read books.|わたしは本を読みます。|
write|書く|I write my name.|わたしは自分の名前を書きます。|
run|走る|I can run fast.|わたしは速く走れます。|
swim|泳ぐ|I can swim.|わたしは泳げます。|
sing|歌う|I like to sing.|わたしは歌うのが好きです。|
dance|踊る|I can dance.|わたしは踊れます。|
study|勉強する|I study English.|わたしは英語を勉強します。|''',
'場所と身の回り':'''house|家（建物）|That house is big.|あの家は大きいです。|いえ
park|公園|I play in the park.|わたしは公園で遊びます。|こうえん
library|図書館|I go to the library.|わたしは図書館に行きます。|としょかん
station|駅|The station is near my house.|駅はわたしの家の近くです。|えき
hospital|病院|This is a hospital.|これは病院です。|びょういん
room|部屋|This is my room.|これはわたしの部屋です。|へや
door|ドア|Please open the door.|ドアを開けてください。|どあ
window|窓|Please close the window.|窓を閉めてください。|まど
car|自動車|That car is white.|あの自動車は白いです。|じどうしゃ
bus|バス|I go to school by bus.|わたしはバスで学校に行きます。|ばす''',
'体と服':'''hand|手|This is my hand.|これはわたしの手です。|て
head|頭|Touch your head.|自分の頭に触ってください。|あたま
eye|目|Close your eyes.|目を閉じてください。|め
ear|耳|A rabbit has long ears.|うさぎには長い耳があります。|みみ
nose|鼻|This is my nose.|これはわたしの鼻です。|はな
mouth|口|Open your mouth.|口を開けてください。|くち
hat|帽子|This is my hat.|これはわたしの帽子です。|ぼうし
shirt|シャツ|My shirt is white.|わたしのシャツは白いです。|しゃつ
shoe|靴（片方）|This shoe is small.|この靴は小さいです。|くつ
coat|コート|This coat is warm.|このコートは暖かいです。|こーと''',
'数':'''one|1（ひとつ）|I have one book.|わたしは本を1冊持っています。|
two|2（ふたつ）|I have two pens.|わたしはペンを2本持っています。|
three|3（みっつ）|I have three pencils.|わたしは鉛筆を3本持っています。|
four|4（よっつ）|I see four birds.|わたしには鳥が4羽見えます。|
five|5（いつつ）|I have five books.|わたしは本を5冊持っています。|
six|6（むっつ）|I see six cats.|わたしには猫が6匹見えます。|
seven|7（ななつ）|I have seven pens.|わたしはペンを7本持っています。|
eight|8（やっつ）|I see eight dogs.|わたしには犬が8匹見えます。|
nine|9（ここのつ）|I have nine books.|わたしは本を9冊持っています。|
ten|10（とお）|I have ten pencils.|わたしは鉛筆を10本持っています。|''',
'曜日と季節':'''Monday|月曜日|I play tennis on Monday.|わたしは月曜日にテニスをします。|
Tuesday|火曜日|I study English on Tuesday.|わたしは火曜日に英語を勉強します。|
Wednesday|水曜日|I swim on Wednesday.|わたしは水曜日に泳ぎます。|
Thursday|木曜日|I dance on Thursday.|わたしは木曜日に踊ります。|
Friday|金曜日|I sing on Friday.|わたしは金曜日に歌います。|
Saturday|土曜日|I read on Saturday.|わたしは土曜日に本を読みます。|
Sunday|日曜日|I play on Sunday.|わたしは日曜日に遊びます。|
spring|春|I like spring.|わたしは春が好きです。|
summer|夏|I swim in summer.|わたしは夏に泳ぎます。|
winter|冬|I like winter.|わたしは冬が好きです。|'''}
phrases='''Hello.|こんにちは。|会ったときのあいさつです。
Good morning.|おはようございます。|朝のあいさつです。
Good night.|おやすみなさい。|寝る前のあいさつです。
Thank you.|ありがとう。|感謝を伝える表現です。
You are welcome.|どういたしまして。|ありがとうと言われたときに返します。
I'm sorry.|ごめんなさい。|あやまるときに使います。
Excuse me.|すみません。|人に呼びかけるときなどに使います。
See you.|またね。|別れるときのあいさつです。
My name is Yui.|わたしの名前はユイです。|My name is の後に名前を続けます。
How are you?|元気ですか。|相手の調子をたずねます。
I'm fine.|元気です。|自分の調子を答えます。
How old are you?|何歳ですか。|年齢をたずねます。
I'm eleven.|わたしは11歳です。|年齢は I'm の後に数を続けて言えます。
I like music.|わたしは音楽が好きです。|I like の後に好きなものを続けます。
Do you like soccer?|サッカーは好きですか。|Do you like で好きかどうかたずねます。
Yes, I do.|はい、そうです。|Do you で始まる質問に、はいと答えます。
No, I don't.|いいえ、ちがいます。|Do you で始まる質問に、いいえと答えます。
I don't like milk.|わたしは牛乳が好きではありません。|don't like で好きではないと伝えます。
I can dance.|わたしは踊れます。|can の後に動作を置くと、できると言えます。
Can you swim?|泳げますか。|Can you でできるかどうかたずねます。
What is this?|これは何ですか。|近くにあるものが何かたずねます。
It's a cat.|それは猫です。|It's は It is を短くした形です。
Where is my bag?|わたしのかばんはどこですか。|Where で場所をたずねます。
It's on the desk.|それは机の上にあります。|on は表面に触れた上の位置を表します。
It's under the desk.|それは机の下にあります。|under は下の位置を表します。
It's in the bag.|それはかばんの中にあります。|in は中の位置を表します。
What time is it?|何時ですか。|時刻をたずねる表現です。
It's seven o'clock.|7時です。|数と o'clock でちょうど何時かを伝えます。
Please open your book.|本を開いてください。|Please を付けて動作をお願いします。
I'm reading a book.|わたしは今、本を読んでいます。|am reading で今読んでいるところだと伝えます。'''
cards=[]
for theme,lines in groups.items():
 for line in lines.splitlines():
  en,ja,ex,jex,reading=line.split('|'); cards.append(dict(id='g5-w-'+en.lower(),kind='word',theme=theme,en=en,ja=ja,example=ex,exampleJa=jex,reading=reading,explanation=f'{en} は「{ja}」という意味です。例文といっしょに確かめよう。'))
for i,line in enumerate(phrases.splitlines()):
 en,ja,why=line.split('|'); cards.append(dict(id=f'g5-p-{i+1:02}',kind='phrase',theme='会話と表現',en=en,ja=ja,example=en,exampleJa=ja,reading='',explanation=why))
cards.extend(json.loads((root/'scripts/grade5-expansion-01.json').read_text(encoding='utf-8')))
manifest=json.loads(pathlib.Path('C:/Users/user/hiragana-ninshiki/assets/shiritori/manifest.json').read_text(encoding='utf-8'))
adoptions=[]
for c in cards:
 c.update(grade=5,revision=1,prerequisites=[],source='独自教材／範囲参照: https://www.eiken.or.jp/eiken/exam/grade_5/',review='試用版・保護者確認待ち')
 c['image']=None
 # Restrict image reuse to an unambiguous approved object meaning.
 matches=[a for a in manifest['assets'] if c['reading'] and a.get('reading')==c['reading'] and a.get('status')=='reviewed']
 if c['en']=='orange': matches=[] # The dictionary's オレンジ image means the color.
 if c['en']=='park': matches=[a for a in matches if a.get('word')=='公園']
 if c['en']=='eye': matches=[a for a in matches if a.get('word')=='目']
 if matches:
  a=matches[0];c['image']={'url':'https://shiritori-images.yggdrasil-learning.workers.dev/assets/shiritori/'+a['file'],'credit':a.get('credit','AI生成イラスト'),'sourceMeaning':a.get('meaning'),'sourceSheet':a.get('sourceSheet'),'sourceReview':a.get('review')}
  adoptions.append({'id':c['id'],**c['image'],'status':'参照元の目視確認記録と語義を照合／本アプリで再確認待ち'})
 c['audioMode']='google-neural2';c['audioText']=c['en'];c['exampleAudioText']=c['example']
(root/'dist/data/grade5.json').write_text(json.dumps(cards,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'IMAGE_ADOPTIONS.json').write_text(json.dumps(adoptions,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'AUDIO_SCRIPT.json').write_text(json.dumps([{'id':c['id'],'word':c['en'],'example':c['example']} for c in cards],ensure_ascii=False,indent=2),encoding='utf-8')
print(f'{len(cards)} cards; {len(adoptions)} image references')

# Keep the second expansion on repeatable content builds.
extra=json.loads((root/'scripts/grade5-expansion-02.json').read_text(encoding='utf-8'))
cards.extend(extra)
(root/'dist/data/grade5.json').write_text(json.dumps(cards,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
(root/'AUDIO_SCRIPT.json').write_text(json.dumps([{'id':c['id'],'word':c['en'],'example':c['example']} for c in cards],ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Complete deck: {len(cards)} cards')

# Preserve the independently authored RareJob vocabulary supplement.
import runpy
runpy.run_path(str(root/"scripts/sync-rarejob-vocabulary.py"))["sync"]()
