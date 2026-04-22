import sys
import os
import csv
import json
from collections import defaultdict
from datetime import datetime

# scripts ディレクトリの update_data をインポートできるようにパスを通す
sys.path.insert(0, os.path.dirname(__file__))
from update_data import add_market_data, bump_version, MARKET_DATA_PATH

DATE = "2026-04-03"
PORT = "焼津"
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'market_input.csv')

print(f"=== {DATE} {PORT} データのリセット修正実行 (海旋船のみに限定) ===")

# 1. market_input.csv のクリーンアップ
# 本日分の 2026-04-03 焼津の行を一度すべて削除し、海旋船の4件のみを追加する

purse_seine_rows = [
    [DATE, PORT, "4.5kg上", "350.0", "15"],
    [DATE, PORT, "2.5kg上", "350.0", "260"],
    [DATE, PORT, "1.8kg上", "337.5", "40"],
    [DATE, PORT, "1.8kg下", "340.0", "25"],
]

rows = []
if os.path.exists(CSV_PATH):
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if row[0] == DATE and row[1] == PORT:
                continue # 今日のは削除
            rows.append(row)

# 海旋船のデータのみ追加
rows.extend(purse_seine_rows)

# CSV 書き戻し
with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["date", "port", "size", "price", "volume"])
    writer.writerows(rows)
print(f"✓ {CSV_PATH} を更新しました (海旋船の4件のみ反映)")

# 2. katsuo_market_data.json の更新
with open(MARKET_DATA_PATH, 'r', encoding='utf-8') as f:
    data = json.load(f)

# 本日分の PL データを完全に削除（焼津のすべてのサイズから本日日付を探して削除）
sizes_to_cleanup = list(data[PORT].keys())
for size in sizes_to_cleanup:
    # FILTER: 本日日付以外のデータのみ残す
    data[PORT][size] = [entry for entry in data[PORT][size] if entry["date"] != DATE]
    # もしデータが空になったサイズがあれば、それは本日一本釣りで新規追加されたものかもしれない（が、過去データがある場合も考慮してカテゴリ自体は消さない）

# 改めて海旋船のデータを add_market_data で追加
# (一旦 data を save_json して空にしてから add するか、直接操作する)
with open(MARKET_DATA_PATH, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

VESSEL = "83福一丸"
for row in purse_seine_rows:
    add_market_data(PORT, row[2], DATE, float(row[3]), float(row[4]), vessel=VESSEL)
    print(f"✓ JSON: {PORT} {row[2]} {row[3]}円, {row[4]}t ({VESSEL})")

# 3. バージョンバンプ
bump_version()

print()
print("=== 完了 ===")
print("一本釣り船のデータをすべて削除し、海旋船（83福一丸）のデータのみに修正しました。")
