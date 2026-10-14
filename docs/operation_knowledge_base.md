# 運用ナレッジベース

このファイルは、相場更新で得た実績・判断ルール・再発防止策を蓄積する場所です。
新しい事故、例外、確認方法、更新の型が見つかったら、ここへ短く追記します。

## 基本方針

- 相場データ、更新ルール、検証方法を作業のたびに少しずつ蓄積する。
- 一度起きたミスは、次回から検知できる形にする。
- 口頭の注意で終わらせず、`AGENTS.md`、検証スクリプト、個別ルール文書のどれかに落とす。
- 更新作業を速くするため、毎回の探索範囲を狭くできるように記録を残す。

## 実績ログ

### 2026-07-13 焼津グラフ異常修正

- 事象: 焼津 `2.5kg上` のグラフに `440円` / `520円` のスパイクが表示された。
- 原因: 一本釣り船 `51日光丸` の価格が、相場グラフ用の `data/market_input.csv` に混入していた。
- 修正: 焼津の一本釣り行を `market_input.csv` と `katsuo_market_data.json` から削除。
- 追加ルール: 焼津の相場CSV更新対象は海旋船のみ。一本釣り船は相場グラフに入れない。
- 再発防止: `scripts/validate_market_rules.py` を追加し、焼津に対象外サイズ・一本釣り船が混入したら検知する。
- 追加修正: 表示側の `web/dashboard.js` に `sanitizeMarketData()` を追加。古いJSONや混入データを読んでも、焼津の対象外サイズ・一本釣り船を描画前に除外する。
- 追加修正: 同一日付に複数行がある場合は `collapseDuplicateDates()` で水揚量が大きい行にまとめ、グラフの縦線を防ぐ。
- 追加検証: `validate_market_rules.py` に、焼津の同一日付・同一サイズ重複チェックを追加。

### 2026-07-13 ルール制度化

- `AGENTS.md` を追加し、AI/開発者が最初に読むルールを作成。
- `docs/project_constitution.md` を追加し、憲法・デグレ禁止ルールを明文化。
- `docs/market_update_rules.md` を追加し、焼津の個別ルールを明文化。
### 2026-08-04 枕崎（81源福丸）入札予定・相場更新

- 反映データ: 枕崎 2026-08-04「81 源福丸」（水揚量 710t）の入札予定（`data/bid_schedule.json`）および市況相場（`data/market_input.csv`）。
- 手順: CSV更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。
- デプロイ: GitHub `main` ブランチへコミット・Pushを完了しVercelへ即時反映。

### 2026-08-17 枕崎（18源福丸）入札予定・相場更新

- 反映データ: 枕崎 2026-08-17「18 源福丸」（水揚量 580t）の入札予定（`data/bid_schedule.json`）および市況相場（`data/market_input.csv`）。
- 手順: CSV更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。
- デプロイ: GitHub `main` ブランチへコミット・Push完了。

### 2026-08-18 焼津相場（38常盤丸）および枕崎入札予定（128福一丸）更新

- 反映データ: 
  1. 焼津 2026-08-17「38 常盤丸」（海旋船 365t）の相場データ（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。※一本釣り船「83 稲荷丸」（35t）はルールに従い `market_input.csv` には含めず `bid_schedule.json` に記録。
  2. 枕崎 2026-08-22「128 福一丸」（水揚量 650t）の最新入札予定（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。
- デプロイ: GitHub `main` ブランチへコミット・Pushを完了。

### 2026-08-19 山川相場（88光洋丸）更新

- 反映データ: 山川 2026-08-19「88光洋丸」（水揚量 435t）の相場データ（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。
- デプロイ: GitHub `main` ブランチへコミット・Pushを完了。

### 2026-08-24 山川相場（35八興丸）更新

- 反映データ: 山川 2026-08-24「35八興丸」（水揚量 500t）の相場データ（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260824-1050` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Pushを完了。

### 2026-08-27 枕崎相場（18宮丸）更新

- 反映データ: 枕崎 2026-08-27「18宮丸」の市況相場（`data/market_input.csv`）。
- 手順: CSV更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260827-1030` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Pushを完了。

### 2026-09-01 枕崎入札予定・相場（81福一丸）および焼津相場（83福一丸）更新

- 反映データ:
  1. 枕崎 2026-09-01「81福一丸」（水揚量 880t）の最新入札予定（`data/bid_schedule.json`）および市況相場（`data/market_input.csv`）。
  2. 焼津 2026-08-28「83福一丸」（海旋船 345t）の相場データ（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260901-1510` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Push完了。

### 2026-09-03 焼津相場（2八興丸）および一本釣り明細（8永盛丸）更新

- 反映データ: 
  1. 焼津 2026-09-03「2八興丸」（海旋船 310t）の市況相場（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
  2. 焼津 2026-09-03「8永盛丸」（一本釣り船 180t）の水揚げ明細（`data/bid_schedule.json`）。※焼津ルールに従い一本釣り船の価格は `market_input.csv` に含めず `bid_schedule.json` のみに記録。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260904-1320` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Push完了。

### 2026-09-08 山川相場（55岬洋丸）および 枕崎入札予定（88福一丸）更新

- 反映データ:
  1. 山川 2026-09-08「55岬洋丸」（水揚量 195t）の市況相場（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
  2. 枕崎 2026-09-09「88 福一丸」（MSC 800t）の最新入札予定（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260908-1030` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Push完了。






### 2026-09-15 枕崎相場（86明豊丸）・枕崎入札予定（5わかば丸）・山川相場（36昇喜丸）更新

- 反映データ:
  1. 枕崎 2026-09-15「86明豊丸」（MSC）の市況相場（`data/market_input.csv`）。
  2. 枕崎 2026-09-18「5わかば丸」（水揚量 520t）の最新入札予定（`data/bid_schedule.json`）。
  3. 山川 2026-09-15「36昇喜丸」（MSC 水揚量 325t）の市況相場（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260915-1130` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Push完了。

### 2026-09-18 焼津相場（78光洋丸）・枕崎相場（5わかば丸）更新

- 反映データ:
  1. 焼津 2026-09-17「78光洋丸」（海旋船 180t）の市況相場（`data/market_input.csv`）および水揚げ明細（`data/bid_schedule.json`）。
  2. 枕崎 2026-09-18「5わかば丸」（市況確定 209t）の市況相場（`data/market_input.csv`）および確定水揚げ明細（`data/bid_schedule.json`）。
- 手順: CSVおよびJSON更新後 `rebuild_data_from_csv.py` および `validate_market_rules.py` を実行し正常検証済み。キャッシュ対策として `web/index.html` のバージョンを `20260918-0930` に更新。
- デプロイ: GitHub `main` ブランチへコミット・Push完了。

### 2026-10-14 山川市況・枕崎入札予定

- 反映データ: 山川 2026-10-14「128福一丸」（120t）の市況相場、および枕崎 2026-10-16「78 光洋丸」（960t）の入札予定。
- 再発防止: 依頼文の港名と市況票の見出しが異なる場合、帳票の港名を優先し、別港の相場として登録しない。今回の市況票は山川町漁業協同組合のため、焼津の相場行は追加していない。
- 検証: CSVから表示JSONを再生成し、相場ルール検証を実行。市況の数量合計120t、入札明細の合計960tを確認。

### 2026-10-14 焼津市況（81福一丸）更新

- 反映データ: 焼津 2026-10-05「81福一丸」（海旋船 355t）の相場4サイズ。
- 価格処理: 価格帯は上下限の平均を登録し、片側のみ記載の場合はその値を使用（`scripts/yaizu_scraper.py` と同じ処理）。
- 検証: 焼津の海旋船4サイズだけをCSVへ反映し、CSVからJSONを再生成。相場ルール検証と合計355tを確認。

## 更新時に蓄積するもの

- 新しく判明した市場別ルール。
- 船名と漁法の判断材料。
- 相場CSVに入れる情報と、入札予定だけに残す情報の分岐。
- よく使う検証コマンド。
- 表示異常の原因と再発防止策。

## 次回以降の基本ルート

1. `AGENTS.md` を確認する。
2. `docs/market_update_rules.md` を確認する。
3. 新しいデータを `data/market_input.csv` または `data/bid_schedule.json` に入れる。
4. `python scripts/rebuild_data_from_csv.py` を実行する。
5. `python scripts/validate_market_rules.py` を実行する。
6. 新しい知見があれば、このファイルへ短く追記する。
