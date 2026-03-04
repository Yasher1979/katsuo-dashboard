# 相場データおよび入札情報の更新計画 (2026/03/04)

枕崎漁協から提供された最新の市況情報および次回の入札予定をシステムに反映します。

## 変更内容

### 1. 相場データの更新 (`katsuo_market_data.json`)
2026年3月4日の枕崎（7 わかば丸）および焼津（18 松友丸）の市況を反映します。

#### [MODIFY] [katsuo_market_data.json](file:///c:/Users/yabuk/OneDrive/デスクトップ/Antigravity（鰹相場グラフ）/data/katsuo_market_data.json)
##### 枕崎 (2026-03-04)
- **6.0kg上**: price: 226.7, volume: 30.0
- **4.5kg上**: price: 245.7, volume: 30.0
- **2.5kg上**: price: 251.0, volume: 300.0
- **1.8kg上**: price: 252.3, volume: 50.0
- **1.8kg下**: price: 252.3, volume: 25.0
- **B品2.5kg上**: price: 234.6, volume: 0.0
- **B品2.5kg下**: price: 236.0, volume: 0.0
- **1.5kg上**: price: 288.0, volume: 5.0
- **1.5kg下ダル混**: price: 186.0, volume: 5.0
- **ダルマ1.5kg上**: price: 202.0, volume: 2.0
- **キメジキス**: price: 128.1, volume: 0.0
- **大キズ**: price: 151.5, volume: 0.0

##### 焼津 (2026-03-04)
- **4.5kg上**: price: 230.0, volume: 30.0
- **2.5kg上**: price: 240.0 (平均値), volume: 330.0
- **1.8kg上**: price: 241.0, volume: 100.0
- **1.8kg下**: price: 230.0, volume: 20.0

### 2. 入札情報の更新 (`bid_schedule.json`)
2026年3月9日の「18 源福丸」の入札予定を追加します。

#### [MODIFY] [bid_schedule.json](file:///c:/Users/yabuk/OneDrive/デスクトップ/Antigravity（鰹相場グラフ）/data/bid_schedule.json)
- 新しい入札情報（ID: `20260309_genpukumaru`）を追加。
- `is_latest` を新規データに設定し、既存データの `is_latest` を `false` に変更。

## 検証計画

### 1. JSON バリデーション
- 各 JSON ファイルが正しい形式であることを確認。

### 2. ダッシュボードの確認（手動）
- `run_dashboard.py` を実行し、ブラウザで最新データがグラフや表に正しく表示されるか確認します。
