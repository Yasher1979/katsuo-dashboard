# AGENTS.md

このリポジトリで作業するAI/開発者は、作業前に必ずこのファイルを読むこと。

## 最重要ルール

- データの正確性を最優先する。見た目の修正より、相場データの混入・欠落・上書き事故を防ぐ。
- 既存データを削除・置換する前に、対象日付・港・船名・サイズ・価格・水揚量を確認する。
- 不明な相場値を推測で追加しない。ユーザー提供情報、既存データ、明示された資料に基づく。
- 表示用JSONを直接手で直さない。原則として `data/market_input.csv` を修正し、`scripts/rebuild_data_from_csv.py` で `data/katsuo_market_data.json` を再生成する。
- `data/bid_schedule.json` は入札予定・水揚げ明細、`data/market_input.csv` は相場グラフ・最新相場カードの元データとして分けて扱う。
- 作業で得た新しい知見・事故・再発防止策は `docs/operation_knowledge_base.md` に短く蓄積する。
- トークン消費を抑えるため、`docs/token_saving_rules.md` に従い、対象を絞ってから読む。

## 焼津の特別ルール

- 焼津の `data/market_input.csv` 更新対象は海旋船のみ。
- 焼津の一本釣り船の価格は、相場グラフ・最新相場カードへ反映しない。
- 一本釣り船の明細を残す場合は `data/bid_schedule.json` に記録する。
- 詳細は `docs/market_update_rules.md` を参照する。

## デグレ禁止

- 最新相場カード、グラフ、全サイズ一覧、入札予定表示の既存動作を壊さない。
- 既存の港名・サイズ名・船名の表記を安易に変更しない。表記変更は過去データの参照に影響する。
- データ更新後は、少なくとも対象日付・港のCSV行とJSON出力を確認する。
- 既存の未追跡ファイルやバックアップを、依頼なしに削除しない。

## 標準更新手順

1. 対象データを確認する。
2. 必要なら `data/market_input.csv` または `data/bid_schedule.json` を更新する。
3. `python scripts/rebuild_data_from_csv.py` を実行する。
4. `python scripts/validate_market_rules.py` を実行する。
5. `rg` や短い検証スクリプトで、対象日付・港・船名の混入/欠落を確認する。
6. 差分を確認し、意図しないファイル変更がないか見る。

## 参照ドキュメント

- `docs/project_constitution.md`
- `docs/market_update_rules.md`
- `docs/operation_knowledge_base.md`
- `docs/token_saving_rules.md`
- `docs/AIアシスタント不在時の運用マニュアル.md`
