# 英検5級PDF語彙の取り込み記録（2026-11-01）

参照：[ぷりんと保管庫・英検5級単語テスト](https://desafiante.net/eiken-g5-tango-a/)

- 全23ページ、Aランク415行＋Bランク115行＝530行をカードIDに対応付けた。
- 未収録の76項目を追加。計822語・語句＋155表現＝977項目。既存901項目の内容・ID・画像を維持。
- 76項目すべてに独自の訳・説明・例文と画像／図を付与。44項目は共有画像（43再利用＋犬小屋1新規）、32項目は独自SVGの学習図。
- 単語・例文それぞれ通常／ゆっくりの音声を304本追加。全3908本を整合検証。
- ことば帳にA／B／その他の絞り込みと、参考重要度順・ABC順・従来の収録順を追加。連続カードにも並べ替えを追加し、中断保存・バックアップに対応。
- A/Bは参考教材の分類。英検公式の順位や語別の実測頻度を意味しない。同じランク内はPDFの掲載順。
- high（あいさつ）→hi、chopstick(s)→chopsticks、P.E.→既存PE、a/an→両方の既存カード、lot→既存a lot ofに対応。watchの動詞／名詞、orangeの果物／色を区別。
- 同一表示の誤答選択肢の重複を修正。同じ発音のorangeが音声選択肢や同じかるた盤で競合しないよう修正。phone/telephoneとpolice officer/policeには説明を追加。

## 検証

- `npm test`：83件通過。530行の対応、全901既存カードの保持、語義・重要度・画像、バックアップ、出題の重複を含む。
- `npm run validate`：977項目・3908本の学習音声と75問の実戦音声を検証。
- `npm run images:check`：共有画像790項目＋独自図32項目、画像なしの単語0。
- `npm run validate:entry`、`git diff --check`：通過。
- `node scripts/qa-print-ho-kan.cjs`：Edgeの320／390／1280px。全76新規画像の読み込み、重要度フィルター・検索・テーマ・3種の順序、4語の通常／ゆっくり／例文音声・停止、連続カードの順序・再読込・バックアップ。
- `node scripts/qa-startup.cjs`：キャッシュ・モジュール失敗からの回復、ホーム・連続カード・初回チェック。
- `node scripts/qa-rarejob-vocabulary.cjs`：既存追加語彙の検索、音声再生、仕分け保存・取り消し。
- `node scripts/qa-karuta.cjs`：かるたの音声・誤答／正答・停止・中断再開・完了・カテゴリ。

## しりとりとの共有

既存の単語ID76173「犬小屋（いぬごや）」に256×256 PNGを付与。語彙や難易度は維持。辞書、画像マニフェスト、取り込み履歴、画像確認カタログ、配信データを更新。

保存画像：`C:/Users/user/hiragana-ninshiki/assets/shiritori/eiken-20261101-doghouse-word-76173.png`

元画像：`C:/Users/user/hiragana-ninshiki/assets/shiritori/sheets/single-eiken-20261101-doghouse.png`

内蔵image_genを使用。生成指示全文は `scripts/print-ho-kan-image-prompts.json`。この1枚の生成後に受けたユーザー指定に従い、以後の新規生成はshiritori-image-sheetsの16語・4×4テンプレート方式とする。

共有R2への画像、非公開アーカイブへの元画像の転送とハッシュ照合が完了。しりとり全87746行／14277画像の監査で欠損0、辞書／履歴テスト通過。390／1280pxで実際の共有サーバーからゲーム詳細と新規画像確認への表示を検証。

## 残る確認と公開状態

スマートフォンSafari/Chrome実機、追加音声全件の人による試聴、本人の学習試用は未実施。アプリ本体はmainへのpush後、GitHub Actionsの検証を経て公開する構成。共有画像の配信は完了。

照合表：`scripts/print-ho-kan-coverage.json`。再反映：`python scripts/sync-print-ho-kan-vocabulary.py`。
