# 教材の編集点検（2026-11-08）

添付ZIPのREADME、CODEX_PROMPT、metadata、43教材項目・179語、MVP・ステージ・pitfalls・出典・教材設計・ライセンス資料を確認。独立した既存教材が並ぶリポジトリ構造に合わせ、専用ディレクトリとして追加した。既存教材のコード・保存領域は変更しない。

MVP全66語を語義・分解・元の語・難易度の観点で編集点検。これは全語の個別辞書照合や専門家校閲ではない。元データの暫定review_statusは維持。56語を暫定出題、次の10語は出題せず説明カードに限定した。

| 語 | 保留理由 |
|---|---|
| bicycle / tricycle | cycleの現在の単独語義から意味を足せない。語源・図を伴う説明を要する |
| bilingual | lingualの意味と既習性を要確認 |
| tripod | 結合語基podは単独語「さや」と異なる。元データもquiz_eligible=false |
| preschool | 国・制度と品詞により訳が変わる |
| underfill | 使用頻度と日本語訳の自然さを要確認 |
| multivitamin | 単純な多＋ビタミンで薬剤という意味まで確定できない |
| subheading | 位置ではなく文書内の階層。文脈教材を要する |
| subfloor | 建築用語の図解と難易度を要確認 |
| superpower | 超能力・大国など文脈による違いがある |

biplaneは「上下2組の主翼をもつ飛行機」と説明し、「2機の飛行機」という推測を防ぐため意味選択に限定。oversleepは「寝過ごす」に補正し、起床予定の時刻との関係を補足。underchargeは「本来より安い料金を請求する」と補足。元の語のヒントは全66語に新規作成した。これらはeditorial.jsonに記録し、元のwords.jsonには手を加えていない。

un-/dis-/non-の類似した否定の意味を、互いに意味選択の誤答にしない。選択肢に現れる英単語と分解もすべてwords.jsonから取得する。自由合成はしない。発展のunbigは元パックの誤語例としてのみ提示し、正解語として生成しない。

## 出典の確認範囲

一般則：[Cambridge Prefixes](https://dictionary.cambridge.org/grammar/british-grammar/prefixes)。一部語義：[Cambridge biplane](https://dictionary.cambridge.org/dictionary/english/biplane)、[Cambridge biweekly](https://dictionary.cambridge.org/dictionary/english/biweekly)、[Collins undercharge](https://www.collinsdictionary.com/dictionary/english/undercharge)。検索結果に表示された一般則・語義の範囲で確認した。Cambridge本文への取得は403で失敗したため、辞書本文の閲読・全語照合済みとは扱わない。oversleepの補正は編集判断で、個別辞書本文との照合は未完了。

辞書の本文・例文・図版・音声は収録していない。追加日本語説明は独自に記述し、音声はブラウザ標準機能を使用する。

## 残る確認

全出題語の語義・品詞・分解の個別辞書照合、教員による日本語・元語の適切さの校閲、小学生による実学習・難易度の検証、保留10語の図解・文脈教材、元パックの非MVP113語の点検が必要。4段階は教材独自の構成で、英検やCEFR等の公式区分ではない。
