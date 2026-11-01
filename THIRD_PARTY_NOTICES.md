# 教材・画像・音声

本アプリは英検公式教材ではありません。語彙・訳・例文・設問は独自に作成しています。試験範囲の参考資料は英検公式の5級案内です。

画像：しりとりアプリで制作されたAI生成イラストを配信サーバーから参照します。各参照のクレジット、語義、出典シート、既存の確認記録は `IMAGE_ADOPTIONS.json` と教材JSONに保持しています。元画像は本リポジトリに収録していません。語義が曖昧な同音語はそのまま転用せず、果物orangeと色orange、公園と後援、目と芽を区別しています。

音声：Google Cloud Text-to-Speech `en-US-Neural2-F` による米国英語の合成音声です。独自の教材台本から制作しています。通常とゆっくりを別々に生成しています。声・言語・文字列・各ファイルの対応は `dist/data/audio-manifest.json` に記録しています。生成音声の利用にはGoogle Cloudの利用規約が適用されます。生成音声に対しコードと同じ自由ライセンスを自動的に付与するものではありません。

- https://docs.cloud.google.com/text-to-speech/docs/basics
- https://cloud.google.com/terms/

字体：Google Fonts経由でDM SansとNoto Sans JPを参照しています。読み込めない場合は端末の標準フォントを使います。

ZiraなどOS音声で生成した音声ファイルは収録していません。


## 実戦テストの独自問題・イラスト・音声

150問は英検公式の公開構成を参考にした独自問題です。公式の問題文・画像・音源の転載ではありません。補助イラストは本アプリで描いたSVGです。75問の米国英語MP3はGoogle Cloud Text-to-Speech（en-US-Neural2-D/F）で制作しました。公式試験の録音ではありません。出典・再生成手順はFAST_EXAMS.mdを参照してください。

語彙範囲の追加照合（2026-11-01）：RareJob English Lab「英検5級の重要単語リスト305語！おすすめ単語教材も」 https://www.rarejob.com/englishlab/column/20210918_02/ 。記事の語彙・表現を照合の参考とし、綴りと語義を確認しました。記事本文や訳の一括転載ではなく、追加の訳・説明・例文は独自に作成しています。記事の表記 automn は autumn、cityhall は city hall、clearup は clear up、tabletennis は table tennis とし、thesun は既存の sun に対応付けました。
