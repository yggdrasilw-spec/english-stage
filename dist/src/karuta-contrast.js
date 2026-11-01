// Explanations describe the senses taught by this deck, not every dictionary sense.
const groups=[
 [['tooth','teeth'],'tooth は歯１本。２本以上は teeth。s をつけるのではなく、形が変わるよ。',{tooth:'a tooth / one tooth で歯１本。',teeth:'two teeth / my teeth。歯を磨くときは I brush my teeth. と言うよ。'}],
 [['phone','telephone'],'どちらも「電話」。phone は telephone を短くした言い方だよ。音を聞き比べよう。',{}],
 [['police officer','police'],'police officer は警察官１人。police は警察という組織や、警察の人たちをまとめた言い方だよ。',{
  'police officer':'a police officer で「警察官１人」。',police:'警察という組織や人たち。１人を a police とは言わないよ。'}],
 [['snow','snowy'],'snow は雪そのもの。snowy は雪が降ったり、積もったりしているようすを表すよ。',{
  snow:'空から降ってくる「雪」の名前。',snowy:'「雪の降る・雪の多い」という、天気や場所のようす。'}],
 [['rain','rainy'],'rain は雨そのもの。rainy は雨が降るような天気を表すよ。',{
  rain:'空から降ってくる「雨」の名前。',rainy:'「雨の降る・雨の多い」という天気のようす。'}],
 [['fog','foggy'],'fog は霧そのもの。foggy は霧が出ているようすを表すよ。',{
  fog:'空気中の小さな水のつぶで、遠くが見えにくくなる「霧」。',foggy:'「霧が出ている」という天気や場所のようす。'}],
 [['sun','sunny'],'sun は太陽の名前。sunny は日が差して晴れているようすを表すよ。',{
  sun:'空に見える「太陽」の名前。',sunny:'「晴れた・日当たりのよい」というようす。'}],
 [['cloud','cloudy'],'cloud は雲の名前。cloudy は雲が多く、曇っているようすを表すよ。',{
  cloud:'空に浮かぶ「雲」の名前。',cloudy:'「曇った」という天気のようす。'}],
 [['big','large'],'どちらも「大きい」という意味で使えるよ。絵だけでは区別しにくいので、聞こえた音を確かめよう。',{
  big:'「大きい」。大きな物などを言う、よく使うことば。',large:'「大きい・大きな」。広さや量にも使う。big と同じ物に使えることもあるよ。'}],
 [['small','little'],'「小さい」という意味が重なるよ。little は「少しの」という量にも使えるよ。',{
  small:'大きさなどが「小さい」。',little:'「小さな」。量が「少しの」という意味にもなるよ。'}],
 [['play','enjoy'],'play は遊ぶことやスポーツをすること。enjoy はそれを楽しむことだよ。',{
  play:'「遊ぶ・スポーツをする」という動き。',enjoy:'「楽しむ」。遊び以外に、食事や音楽などにも使うよ。'}],
 [['run','running'],'この札では run は「走る」という動き、running は「走ること」という活動の名前だよ。',{
  run:'「走る」という動きを表す。',running:'この札では「走ること」。文の中では「走っている」という使い方もあるよ。'}],
 [['house','home'],'house は家という建物。home は自分が暮らす場所、帰る場所という言い方だよ。',{
  house:'「家」という建物。',home:'「自宅・わが家」。go home では「家へ帰る」になるよ。'}],
 [['shoe','shoes'],'shoe は靴１つ。shoes は靴が２つ以上。最後の s の音にも耳をすませよう。',{
  shoe:'片方の「靴」１つ。',shoes:'「靴」が２つ以上。左右１足の靴にも使うよ。'}],
 [['fall','autumn'],'どちらも季節の「秋」。fall は米国英語で、autumn は英国英語でよく使うよ。意味のまちがいより、音の聞き分けを確かめよう。',{}],
 [['store','shop'],'どちらも「店」という意味で使えるよ。同じ絵になることもあるので、ことばの音を聞き比べよう。',{}],
 [['watch','look','look at'],'watch は動きや変化をしばらく見ること。look は目を向けること。look at のあとには、見る相手や物を続けるよ。',{
  watch:'テレビや試合などを、しばらく「見る」。',look:'「見る・目を向ける」。Look! だけなら「見て！」。', 'look at':'「〜を見る」。look at the bird なら「その鳥を見る」。'}],
 [['listen','listen to'],'どちらも耳をすませて聞くこと。聞く相手や物を続けるときは listen to を使うよ。',{
  listen:'「耳を傾ける」。Listen! だけなら「聞いて！」。','listen to':'「〜を聞く」。listen to music なら「音楽を聞く」。'}],
 [['speak','talk'],'どちらも「話す」。speak は言語を話すときにも使い、talk は人とのおしゃべりでよく使うよ。使い方が重なることもあるよ。',{
  speak:'「話す」。speak English なら「英語を話す」。',talk:'「話す・おしゃべりする」。talk with a friend なら「友達と話す」。'}],
 [['walk','on foot'],'walk は「歩く」という動き。on foot は「歩いて」という移動のしかただよ。',{
  walk:'「歩く」。I walk to school. なら「学校へ歩いて行く」。','on foot':'「歩いて」。I go to school on foot. も「学校へ歩いて行く」。'}],
 [['sleep','go to bed'],'sleep は眠っていること。go to bed は寝るためにベッドや布団に入ることだよ。',{
  sleep:'「眠る」。目を閉じて眠っていること。','go to bed':'「寝る・床に就く」。眠るためにベッドや布団に入ること。'}],
 [['lunch','have lunch'],'lunch は昼ごはんの名前。have lunch は昼ごはんを食べることだよ。',{
  lunch:'「昼食・昼ごはん」という食事の名前。','have lunch':'「昼食を食べる」という動き。'}],
 [['plate','dish'],'どちらも「皿」という意味で使えるよ。dish には、食べ物の「料理」という意味もあるよ。',{
  plate:'食べ物をのせる「皿」。',dish:'「皿」。a fish dish なら「魚料理」のように、料理も表せるよ。'}],
 [['bicycle','bike'],'この札では、どちらも「自転車」。bike は bicycle を短くした言い方だよ。音を聞き比べよう。',{}],
 [['tv','television'],'どちらも「テレビ」。TV は television を短くした言い方だよ。音を聞き比べよう。',{}],
 [['start','begin'],'どちらも「始まる・始める」という意味で使えるよ。絵だけでは区別しにくいので、聞こえた音を確かめよう。',{}],
 [['work','job'],'この札では work は「働く」という動き、job は「仕事・職業」の名前だよ。',{
  work:'この札では「働く」。別の文では「仕事」という名前にもなるよ。',job:'「仕事・職業」の名前。どんな仕事かを言うときにも使うよ。'}],
];
const word=c=>c?.en?.trim().toLowerCase();
export function karutaContrast(target,chosen){
 if(!target||!chosen||target.id===chosen.id)return null;
 const a=word(target),b=word(chosen),group=groups.find(([words])=>words.includes(a)&&words.includes(b));
 const sharedImage=!!target.image?.url&&target.image.url===chosen.image?.url;
 if(!group&&!sharedImage)return null;
 return {sharedImage,reviewed:!!group,note:group?.[1]||'同じ絵でも、表す意味や使い方が違うことがあるよ。意味と例文を見て、音を聞き比べよう。',
  targetNote:group?.[2]?.[a]||`「${target.ja}」という意味。`,chosenNote:group?.[2]?.[b]||`「${chosen.ja}」という意味。`};
}
