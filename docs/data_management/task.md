# データ整合性およびダミーデータ排除タスクリスト

## 1. 不要なダミー生成スクリプトの削除
- [ ] `scripts/generate_dummy_2024_data.py` の削除
- [ ] `katsuo_fetcher.py` から `generate_sample_data` メソッドを削除

## 2. データのクリーンアップ確認
- [x] `data/market_input.csv` の実データ状態を確認（2/17削除済み）
- [x] `katsuo_market_data.json` 内に 2024年等の不自然なデータがないことを確認

## 3. 方針のドキュメント化
- [/] `implementation_plan_data_policy.md` の作成（完了）
- [ ] 今後のデータ運用における AI との合意（報告）

## 4. GitHub同期
- [ ] 削除・修正内容をコミット＆プッシュ
