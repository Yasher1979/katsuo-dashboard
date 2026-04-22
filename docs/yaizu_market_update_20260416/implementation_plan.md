# 焼津相場データ反映計画（2026-04-16）

焼津魚市場の最新相場データ（2026-04-16分）をシステムに完全に反映します。数値データは一部入力済みですが、船名の追加やダッシュボードへの反映を確実に完了させます。

## ユーザー確認事項

> [!IMPORTANT]
> `GEMINI_API_KEY` が未設定のため、AIによるニュースの自動要約（`update_news.py`）は今回スキップいたします。相場データおよび入札スケジュールの更新に集中します。

> [!NOTE]
> 焼津の集計データには、該当する2隻（35 八興丸、88 亀洋丸）の名称を併記（例：「八興/亀洋丸」）して表示するように設定します。

## 変更内容

### データ更新

#### [MODIFY] [katsuo_market_data.json](file:///c:/Users/yabuk/OneDrive/デスクトップ/Antigravity（鰹相場グラフ）/data/katsuo_market_data.json)
- 2026-04-16 の焼津データに船名情報 (`vessel`) を追加。
- 各サイズの加重平均価格と合計数量を再確認。

#### [MODIFY] [bid_schedule.json](file:///c:/Users/yabuk/OneDrive/デスクトップ/Antigravity（鰹相場グラフ）/data/bid_schedule.json)
- 該当する2隻（35 八興丸、88 亀洋丸）のIDを整理し、入札完了状態として適切に配置。

### フロントエンド反映

#### [MODIFY] [index.html](file:///c:/Users/yabuk/OneDrive/デスップ/Antigravity（鰹相場グラフ）/web/index.html)
- `VERSION` 変数を更新し、ブラウザのキャッシュを回避して最新データを表示。

### 管理ドキュメント

#### [MODIFY] [task.md](file:///c:/Users/yabuk/OneDrive/デスクトップ/Antigravity（鰹相場グラフ）/docs/yaizu_market_update_20260416/task.md)
- 全てのタスクを完了状態に更新。

## 検証計画

### 自動検証
- `scripts/rebuild_data_from_csv.py` を実行し、CSVとJSONの一貫性を確認。

### 手動確認
- ダッシュボード（`web/index.html`）をブラウザで確認し、焼津のカードに船名バッジが表示されていることを確認。
