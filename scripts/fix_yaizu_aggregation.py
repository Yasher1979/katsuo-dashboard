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

print(f"=== {DATE} {PORT} データ集計・修正実行 ===")

# 1. market_input.csv のクリーンアップと最新データの再構築
# (本日分 2026-04-03 の重複を排除し、正しい集計値を書き込む)

# 画像からの生データ
raw_data = [
    # 海旋 (PS)
    {"size": "4.5kg上", "price": 350.0, "volume": 15.0, "vessel": "83福一丸"},
    {"size": "2.5kg上", "price": 350.0, "volume": 260.0, "vessel": "83福一丸"},
    {"size": "1.8kg上", "price": 337.5, "volume": 40.0, "vessel": "83福一丸"},
    {"size": "1.8kg下", "price": 340.0, "volume": 25.0, "vessel": "83福一丸"},
    # 一本釣り (PL)
    {"size": "7.0kg上", "price": 420.0, "volume": 75.0, "vessel": "31永盛丸"},
    {"size": "4.5kg上", "price": 425.0, "volume": 75.0, "vessel": "31永盛丸"},
    {"size": "2.5kg上", "price": 445.0, "volume": 40.0, "vessel": "31永盛丸"},
    {"size": "1.5kg上", "price": 400.0, "volume": 15.0, "vessel": "31永盛丸"},
]

# サイズごとに集計 (加重平均)
aggregated = defaultdict(lambda: {"total_price_vol": 0.0, "total_vol": 0.0, "vessels": set()})
for d in raw_data:
    aggregated[d["size"]]["total_price_vol"] += d["price"] * d["volume"]
    aggregated[d["size"]]["total_vol"] += d["volume"]
    aggregated[d["size"]]["vessels"].add(d["vessel"].replace("丸", "")) # 短縮表記

# CSV の読み込みと 2026-04-03 焼津以外の行を保持
rows = []
if os.path.exists(CSV_PATH):
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if row[0] == DATE and row[1] == PORT:
                continue # 今日のは一旦除外
            rows.append(row)

# 集計した最新データを CSV 行に追加
for size, val in sorted(aggregated.items()):
    avg_price = round(val["total_price_vol"] / val["total_vol"], 1)
    rows.append([DATE, PORT, size, str(avg_price), str(val["total_vol"])])

# CSV 書き戻し
with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(["date", "port", "size", "price", "volume"])
    writer.writerows(rows)
print(f"✓ {CSV_PATH} を更新しました (2026-04-03 焼津分を集計反映)")

# 2. katsuo_market_data.json の更新
for size, val in aggregated.items():
    avg_price = round(val["total_price_vol"] / val["total_vol"], 1)
    vessels_str = "/".join(sorted(list(val["vessels"]))) + "丸"
    add_market_data(PORT, size, DATE, avg_price, val["total_vol"], vessel=vessels_str)
    print(f"✓ JSON: {PORT} {size} {avg_price}円, {val['total_vol']}t ({vessels_str})")

# 3. バージョンバンプ
bump_version()
print("✓ index.html のバージョンをバンプしました。")

print()
print("=== 完了 ===")
print("お待たせしました。焼津の複数データを統合（加重平均）して最新の状態に修正完了しました。")
