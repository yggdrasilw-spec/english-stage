# ことばのパーツ研究所

小学生向け英語接頭辞アプリ。ビルド・アカウント・APIキー不要の静的HTML/CSS/JavaScriptです。

## 起動

英検5級アプリのホームから「ことばのパーツ研究所」を選びます。公開先は https://yggdrasilw-spec.github.io/english-stage/prefixes/ です。ローカルではリポジトリの `dist` をHTTP配信し、`/prefixes/` を開いてください。ファイルの直接起動はできません。

編集後は `npm run prefixes:build` で公開用ファイルを生成し、`npm run prefixes:check` でソース・公開物・ホーム入口の一致を確認します。

## 実装

- 基本8項目・中級6項目、応用混合8問、発展例外8問。un-の2用法を分離。
- 接頭辞の意味選択、組み立て、分解、意味推測。元の語の確認・ヒントを各問の前に用意。
- 元データの許可リストのみから出題。56語の出題候補、10語の説明カード。biplaneは意味問題限定。
- SpeechSynthesisによるen-US優先読み上げと音声OFF。無音でも学習可。
- 独立した `english-prefix-lab-v1` キー、schemaVersion=1、語・用法・形式・日時・正誤の端末内保存。ほかの教材の保存領域には触れません。
- 誤答10分後、正解1/3/7日後の復習。予定より早い正解では間隔を進めません。苦手語の即時練習も可。
- サービスワーカーはこのフォルダー内だけをキャッシュ。HTTPSまたはlocalhostで初回準備後にオフライン利用可。音声は端末依存。
- CSSのprefers-reduced-motion対応、キーボード操作、日本語UI、大きなボタン。

## ファイル構成と拡張

`data/*.json` はZIPのマスターをそのまま保持。元データのreview_statusを検証済みに変更していません。追加説明・出題可否・語義補正・形式制約は `data/editorial.json` に分離し、実行時に適用します。

`core.mjs` は出題・採点候補・間隔復習・解放条件、`audio.mjs` は端末音声と利用不可時の処理、`app.js` は画面・保存、`style.css` は表示、`sw.js` はオフライン用です。

語を追加するときはwords.jsonに実在語を追加し、editorial.jsonに元語ヒントとuseを設定します。公開確認前はuse=cardとしてください。項目の追加にはmvp.jsonと段階・解放条件の見直しが必要です。元パックのstages.jsonは将来の43項目用資料として保持し、初版の応用・発展の画面構成とは区別しています。データ更新時はsw.jsのCACHE名を更新してください。新バージョンは既存タブを閉じた後の再表示で反映されます。

## 検証

```sh
python prefixes/tests/test_data.py
node --test prefixes/tests/*.test.mjs
node --input-type=module --check < prefixes/app.js
node --check prefixes/sw.js
```

教材の点検範囲・保留理由・検証の限界は [docs/REVIEW.md](docs/REVIEW.md)、実行結果は [docs/QA.md](docs/QA.md) を参照してください。

## 動くイメージの絵本（2026-11-09）

14項目それぞれに固定した核のイメージを用意し、画面に入った絵が一度だけ動きます。日本語の「先生のお話」、元の絵との比較、別の語を絵で確かめる読み物型の流れを追加しました。基本・中級の14のお話は初めからすべて読め、確認問題は任意です。`seen`は見た記録で、正解や習得には加算しません。旧schemaVersion=1の解答履歴は維持し、動きを減らす設定も保存します。

`data/stories.json`が意味の手がかり・例語・ナレーション・注意を管理し、`story-art.mjs`が図、`story-view.mjs`が絵本、`story-player.mjs`が一度だけの動きと後片付け、`story.css`が表示を担当します。

共通キャラクターと表情・鍵・読書・水量の4場面はbuilt-in image_genで新規生成しました。5点のPNGは `assets/` に保存し、正確な最終プロンプト・寸法・用途は `data/image-assets.json` に記録しています。元画像は加工せず保存し、2場面の画像は画面上で前後を切り替えています。数・時間・位置などの図はコードで描き、意味に対応する変化を付けます。

詳細は `docs/VISUAL_DESIGN.md` と `docs/VISUAL_QA.md` を参照。
