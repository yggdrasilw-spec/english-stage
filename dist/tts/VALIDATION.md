# 検証記録（2026-11-08）

- 29文、8パターン、58 MP3をdry-runで生成。58/58 PASS。
- 語尾差: -4.566〜+4.504半音。A/Bの長さ・音量・無音差の警告は0。
- dry-runの途中の選択肢は上昇を模擬していないため、パターン2/3に警告あり。
- ffmpegはimageio-ffmpeg同梱版を使用。モノラル24kHz MP3、trim/loudnorm実行済み。
- Praat・pytestのpipインストールは名前解決失敗。F0はdry-run専用の正弦波ゼロ交差推定。
- pytest互換の10テストをunittestで実行し全件成功。u/d/flatを音声から判定。
- Node再生制御テスト4件成功（A/Bのモック統一、低速・同期、停止、エラーフォールバック）。
- HTML本体・レポートのscriptはnode --check成功。sync-htmlは冪等性・変更範囲をテスト済み。
- 元HTMLの単語モード処理はハッシュ一致。元のvoiceMockは関数名以外一致。
- 英検5級アプリの既存105テスト、validate:entry、validateが成功。
- 実APIへの呼び出しは0。ADC・キーは使っていない。
- 実API、Praat計測とPSOLA、英語音声の人による全件試聴、iOS/Android実機は未検証。
- ブラウザUI確認はローカル接続制限により実施できていない。
- 実音声未生成のためCLIPSは空で、両側とも元のモックを使う。dry-runの確認レポートと58 MP3も公開対象に含める。

配置: 英検5級アプリのdist/accent.htmlとdist/tts/。ホームに入口を追加。
dry-run成果物はdist/tts/dry-run/に隔離し、CLIPSには登録しない。
設定変更で声が混在した場合も、同じエンジン・設定の声・話速でそろうペアだけ登録。
