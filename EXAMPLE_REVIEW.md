# 森の全画面表示と例文見直し（2026-11-01）

森は #forest を開いた時点で画面内に収まる。アプリのヘッダーと下部ナビは外し、「学習にもどる」、水の残数、森、水やり、区画移動を表示する。ブラウザの全画面APIに依存せず、iPhoneでも使える100dvhの表示。画面の向きが変わっても収まる。森上は touch-action:none とし、1本指ドラッグ・2本指拡大・ボタン・矢印キーで操作できる。

「メニュー」で飾り・学習への移動・記録・育ち方を開く。ここだけ内部スクロールできる。飾り選択後も開いた欄とスクロール位置を維持し、「森にもどる」またはEscapeで閉じる。学習に戻ると通常のページスクロールを復元する。

追加語の名詞153件に一律設定されていた Look at the ... を、各語の場面に合う独自例文・日本語訳に交換。意図的な look at、little、moon の例文は残した。全977項目、既存IDと学習履歴の形式を維持。通常・ゆっくりの例文音声306件をNeural2-Fで再生成し、全3908音声との対応を検証した。

## 表現の分散

既存155表現と単語例文を併せ、以下を扱う。公式案内の「中学初級程度」を範囲の目安とした独自の整理であり、公式の全出題表現リストではない。

| 項目 | 例文 |
| --- | --- |
| be動詞の肯定・否定・疑問 | This potato is big. / I am not tired. / Is this your bottle? |
| 一般動詞の肯定・否定・疑問 | I eat a sandwich for lunch. / I don't know the answer. / Do you have a pet? |
| 三人称単数とdoes | She likes tomatoes. / My aunt doesn't like coffee. / Does your sister live in this city? |
| 能力と依頼 | This turtle can swim. / Can I see the menu, please? |
| 現在進行形 | She is writing a letter. / Is he reading a book? / I'm not watching TV. |
| 存在・単数複数 | There is an onion in the bag. / There are three sheep on the farm. |
| 命令・禁止・勧誘 | Please open your textbook. / Don't play in the street. / Let's sing this song together. |
| 疑問詞 | Where is my pencil case? / Who is that man? / Whose bike is this? / Which bag is yours? / Why do you like dogs? / When is your birthday? |
| 数・値段・時刻 | How many peaches do you have? / How much is this skirt? / What time does the train leave? |
| 所有・指示語 | This CD is hers. / This is my brother's bat. / These flowers are for my mother. |
| 場所・方向・交通手段 | The ball is between the boxes. / Turn right at the corner. / He goes to school by bicycle. |
| 日時・習慣・頻度 | We have an English test on Monday. / I read every day. / I go to bed at nine. |
| 希望・好み | I want to be a dentist. / What is your favorite movie? |
| 形容詞・副詞・接続詞 | That snake is very long. / My uncle can cook well. / Her dress is blue and white. |
| 冠詞・可算不可算・不規則複数 | an onion / some water / one tooth / my teeth / three sheep / two people |

toothは「歯（1本）」、teethは「歯（2本以上）」。1本と3本の独自SVGを分け、a tooth / one tooth、two teeth / my teethの説明と、かるたで取り違えた際の比較を追加した。

## 保守と検証

- 原稿: scripts/reviewed-examples.txt。python scripts/sync-reviewed-examples.py で配信データ・追加語原稿・AUDIO_SCRIPT.jsonを同期する。expand-complete.pyからも呼び出し、一律例文への巻き戻りを防ぐ。
- 画像対応はscripts/shiritori-image-links.jsonとIMAGE_ADOPTIONS.jsonに保存。npm run images:checkで再現性を確認する。
- npm test: 90件成功。npm run validate / npm run validate:entry / npm run images:check成功。
- node scripts/qa-forest-fullscreen.cjs: 320×568、390×844、430×932、768×1024、1280×900、844×390。実タッチイベントでのドラッグ・ピンチ、水やり、飾り、回転、再読み込み、学習へ戻った後のスクロールを確認。tooth/teethの画像と6本の新例文音声のデコード・再生進行を確認。
- 既存の森QAは、モード切替でランダム化した後の表示を基準に回答し、同じ問題の繰り返し検証では対象を1語に固定するよう調整。保存前の出題順への依存を除いた。
- 証跡: reports/fullscreen/checks.json、同ディレクトリの画面画像。スマホ実機・全音声の聴覚確認は未実施。

参照: https://www.eiken.or.jp/eiken/exam/grade_5/ 、https://learnenglishkids.britishcouncil.org/grammar-vocabulary/grammar-practice

mainへのプッシュでGitHub Actionsの検証とGitHub Pagesへの公開が実行される。公開結果はActionsと公開サイトで別途確認する。
