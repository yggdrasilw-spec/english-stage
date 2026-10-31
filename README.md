# English Stage — はじめての英検5級

小学5年生向けの試用版。基本100語・30表現を収録。

公開先： https://yggdrasilw-spec.github.io/english-stage/

カードで意味を知る → 読む・聞く・日本語から英語を選ぶ → 間違いをやり直す → 翌日以降の復習、の順で練習します。声は米国英語のGoogle Cloud Neural2です。

`python -m http.server 8765 --directory dist` で開きます。HTMLを直接ダブルクリックする方式には対応しません。

- `npm test` 復習計算・技能分離・バックアップ検証
- `npm run validate` 教材・音声の整合性

カード → 選択 → 誤答反復 → 翌日以降の復習。IndexedDBに履歴、技能別進捗、設定、中断位置を保存。設定からJSONの書き出しと検証付き復元が可能です。復元前の記録はlocalStorageに退避します。

画像はしりとり既存配信先を参照します。巨大な辞書の読み込み・Gitへの画像追加・外部検索での補完は行いません。対応表は IMAGE_ADOPTIONS.json、音声台本は AUDIO_SCRIPT.json。

音声：Google Cloud Text-to-Speech `en-US-Neural2-F` の米国英語。単語・例文それぞれを通常0.95・ゆっくり0.75の速度で事前生成し、合計520本のMP3を収録しています。APIは制作時のみ使用し、公開アプリやGitHub Actionsからは呼びません。認証情報をリポジトリに含めません。台本・声・各ファイルの対応は `dist/data/audio-manifest.json`、制作手順は `GOOGLE_TTS.md` にあります。

GitHub Pages：`main`へのpushで自動テストと教材・音声検証が通った後、`dist`を配信します。生成音声・画像については `THIRD_PARTY_NOTICES.md` を参照してください。

未完了：本人3〜7日の試用、教材・画像・全音声の最終確認、スマホSafari/Chrome実機確認、オフライン/PWA対応、600語＋100表現への拡充、試験形式の練習。
