# しつもんの声・事前音声

Python 3.10+、ffmpeg（PATH または環境変数 `FFMPEG`）を用意します。
このフォルダは英検5級アプリの `dist/tts/`、HTML は `dist/accent.html` です。
以下は **dist ディレクトリ**で実行します。

```powershell
python -m pip install -r tts/requirements.txt
# 任意: ffmpegがない場合、同梱バイナリを利用
python -m pip install imageio-ffmpeg
python tts/build_clips.py --dry-run
python -m pytest tts/test_build_clips.py
node --test tts/test_player.cjs
```

dry-run はAPI・認証を使わず、58個の試験用グライドを生成します。
結果は `tts/dry-run/manifest.json` と `tts/dry-run/report.html`。
**英語音声ではありません。HTMLのCLIPSには登録しません。**
Praat未導入時に限り、dry-run は正弦波専用のゼロ交差F0推定に切り替わります。
pytestがなければ `python -m unittest discover -s tts -p test_build_clips.py` で同じテストを実行できます。
ffmpegがないと警告してWAVを保存します（MP3に見せかけません）。

## 実音声（API利用料が発生）

Google CloudでText-to-Speech APIを有効化し、ADCまたは
`GOOGLE_APPLICATION_CREDENTIALS` で認証します。キーはこの教材に保存しません。
ADCがない場合、既存のgcloudログインも `$env:TTS_USE_GCLOUD_AUTH='1'` で使用できます。
この場合も認証情報はメモリ内だけで使い、ファイル・HTML・manifestには保存しません。

```powershell
gcloud auth application-default login
gcloud auth application-default set-quota-project YOUR_PROJECT_ID
python tts/build_clips.py
python -m http.server 8000
# http://localhost:8000/tts/report.html で全音声を聞く
```

レポートでOK/NGを選び、コピーしたJSONを `tts/overrides.json` に保存します。
既存JSONはレポートの入力欄に貼り「既存の判定を読み込む」で取り込めます。

```powershell
python tts/build_clips.py sync-html
python tts/build_clips.py --only 0a,1b --max-attempts 4
# 全再生成（キャッシュも使わずAPI再呼び出し）
python tts/build_clips.py --force
```

設定は `config.json`、問題の正は `questions.json`。`sync-html` は
QD/CLIPSマーカー内だけを更新します。rejectはacceptより優先します。
音声・問題・設定が同じで合格/accept済みならスキップします。NGはキャッシュを再利用して判定・加工します。
NG音声そのものを新たに生成したい場合は `--only ID --force` を使います。

## 声と判定

既定は全て en-US-Neural2-F、speaking_rate=0.9。句読点2種を順に試し、
不合格なら最後の語をPraat PSOLAで加工して再判定します。
`max_attempts` はAPIレシピ候補の上限で、PSOLA再判定は別枠です。
Geminiは既定無効。使う場合は `gemini.enabled=true` にして
`--engine gemini` で全件同じ声で生成してください。
`--engine all` はSSML→Gemini→PSOLAの順です。声が混在すると比較の手がかりに
なるため、CLIPSは最初の採用候補と同じエンジン、かつu/d両方そろう組だけを登録します。
全件を同じ声にそろえるにはエンジンを固定して再生成してください。

最終語の有声末尾100msと直前150msの中央値差が±2半音以上なら合格。
時刻がなければ有声区間末尾35%を使い、単語時刻は文字数比で近似します。
パターン2/3の途中の選択肢、A/Bの長さ・音量・無音差は警告のみです。
自動合格は自然さの保証ではないので、全ペアを人が聞いて確認してください。
端末内の判定は同じブラウザで保存されます。ファイル直接表示よりHTTPを推奨します。

公式仕様: [SSML / marks](https://docs.cloud.google.com/text-to-speech/docs/ssml)、
[v1beta1 timepointing](https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1beta1/text/synthesize)、
[Gemini-TTS](https://docs.cloud.google.com/text-to-speech/docs/gemini-tts)。
実API・実音声の自然さ・PSOLA・iOS/Android実機はこの環境では未検証です。
