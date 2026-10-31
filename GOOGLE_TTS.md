# Google Cloud Neural2 音声の制作

方針：米国英語 `en-US-Neural2-F` を候補とし、単語と例文それぞれを通常0.95・ゆっくり0.75でMP3化する。学習者のスマホからAPIを呼ばず、静的音声のみ再生する。認証情報はGitHubにもブラウザにも含めない。

最初に費用見積もりだけを確認：

```powershell
node scripts/google-tts.mjs
```

利用プロジェクト・API有効化・課金・権限を確認後、既存gcloud認証で試聴用3語を生成：

```powershell
node scripts/google-tts.mjs --project YOUR_PROJECT_ID --sample --generate
```

本生成（全830項目、最大45,000文字のガード付き）：

```powershell
node scripts/google-tts.mjs --project YOUR_PROJECT_ID --generate
```

APIは最大4並列で実行。失敗時も生成済みファイルを保持し、全件成功したときだけマニフェストを更新する。同じ台本・声・速度の完成ファイルは再利用する。全量のマニフェストができた後にアプリで利用できる。試聴用マニフェストは本番用とは分離する。生成音声はまだ試聴済みと扱わない。

公式資料（2026-10-31確認）：

- 生成音声をアプリで利用できるとの案内：https://docs.cloud.google.com/text-to-speech/docs/basics
- 利用規約：https://cloud.google.com/terms/
- 音声一覧：https://docs.cloud.google.com/text-to-speech/docs/list-voices-and-types
- 料金：https://cloud.google.com/text-to-speech/pricing

Neural2は月100万文字の無料枠、超過分16米ドル/100万文字。課金アカウントの有効化が必要。別用途での使用量を含めた無料枠残量はこのスクリプトでは確認しない。生成音声はアプリの一部として利用し、コードと同じ自由ライセンスを自動的に付与しない。
