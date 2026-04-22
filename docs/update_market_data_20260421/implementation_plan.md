# 市場データおよび入札予定の更新（2026年4月21日）

ユーザーから提供された最新の情報（画像2枚）に基づき、鰹相場システムの市場データと入札予定を更新します。

## ユーザーレビューが必要な項目

- **画像1（焼津相場 4/16）**: このデータは既に `market_input.csv` に反映されていることを確認しました。念のため、内容に相違がないか再確認しました。
- **画像2（枕崎入札予定 4/22）**: こちらは新規データです。`bid_schedule.json` に追加します。

## 変更内容

### 1. 入札予定の更新

#### [MODIFY] [bid_schedule.json](file:///c:/Users/yabuk/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/Antigravity%EF%BC%88%E9%B0%B9%E7%9B%B8%E5%A0%B4%E3%82%B0%E3%83%A9%E3%83%95%EF%BC%89/data/bid_schedule.json)
- 2026年4月22日の「岬洋丸」（枕崎港）の入札予定データを新規追加します。
- 既存のデータの `is_latest` フラグを更新し、今回のデータを最新として設定します。

### 2. 市場データの同期

#### [EXECUTE] `scripts/katsuo_fetcher.py`
- CSV（`market_input.csv`）の最新データを `katsuo_market_data.json` に反映させます。

### 3. バージョン更新

#### [MODIFY] [index.html](file:///c:/Users/yabuk/OneDrive/%E3%83%87%E3%82%B9%E3%82%AF%E3%83%88%E3%83%83%E3%83%97/Antigravity%EF%BC%88%E9%B0%B9%E7%9B%B8%E5%A0%B4%E3%82%B0%E3%83%A9%E3%83%95%EF%BC%89/web/index.html)
- `const VERSION` およびアセットのクエリパラメータを更新し、ブラウザのキャッシュを無効化します。

## 公開・実行手順

1. `data/bid_schedule.json` の更新。
2. `scripts/katsuo_fetcher.py` の実行。
3. `web/index.html` のバージョン更新。

## 検証計画

### 手動確認
- `bid_schedule.json` の内容が画像2の内容（トン数、サイズ別数量、海域など）と正確に一致しているか確認します。
- スクリプト実行後、`katsuo_market_data.json` が正常に更新されていることを確認します。
