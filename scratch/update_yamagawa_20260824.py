import json
import csv
import os
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV_PATH = ROOT / 'data' / 'market_input.csv'
BID_JSON_PATH = ROOT / 'data' / 'bid_schedule.json'
INDEX_HTML_PATH = ROOT / 'web' / 'index.html'

OLD_VERSION = "20260728-1500"
NEW_VERSION = "20260824-1050"

# 1. Update market_input.csv
yamagawa_rows = [
    {"date": "2026-08-24", "port": "山川", "size": "1.8kg上", "price": "315.0", "volume": "40.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "1.8kg下", "price": "315.0", "volume": "10.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "2.5kg上", "price": "315.35", "volume": "300.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "2.5kg上変形", "price": "295.0", "volume": "0.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "2.5kg下変形", "price": "295.0", "volume": "0.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "4.5kg上", "price": "320.0", "volume": "100.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "6.0kg上", "price": "311.0", "volume": "20.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "キメジ 1.5下", "price": "238.0", "volume": "10.0", "vessel": "35八興丸"},
    {"date": "2026-08-24", "port": "山川", "size": "キメジ3.0kg下", "price": "256.0", "volume": "20.0", "vessel": "35八興丸"},
]

existing_rows = []
with open(MARKET_CSV_PATH, 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        if not (row.get('date') == '2026-08-24' and row.get('port') == '山川' and row.get('vessel') == '35八興丸'):
            existing_rows.append(row)

existing_rows.extend(yamagawa_rows)
existing_rows.sort(key=lambda x: (x['date'], x['port'], x['size']))

with open(MARKET_CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(existing_rows)

print("Updated market_input.csv successfully.")

# 2. Update bid_schedule.json
new_bid_entry = {
    "id": "20260824_hakkomaru35",
    "delivery_date": "2026-08-24",
    "vessel_name": "35八興丸",
    "bid_date": "2026-08-24",
    "tonnage": 500.0,
    "sea_area": {
        "lat": "",
        "lon": ""
    },
    "port": "山川",
    "is_latest": True,
    "items": [
        {"category": "カツオ", "size": "6.0kg上", "type": "入札", "volume": 20.0},
        {"category": "カツオ", "size": "4.5kg上", "type": "入札", "volume": 100.0},
        {"category": "カツオ", "size": "2.5kg上", "type": "入札", "volume": 300.0},
        {"category": "カツオ", "size": "1.8kg上", "type": "入札", "volume": 40.0},
        {"category": "カツオ", "size": "1.8kg下", "type": "入札", "volume": 10.0},
        {"category": "キメジ", "size": "3.0kg下", "type": "入札", "volume": 20.0},
        {"category": "キメジ", "size": "1.5kg下", "type": "入札", "volume": 10.0}
    ],
    "total_volume": 500.0
}

with open(BID_JSON_PATH, 'r', encoding='utf-8') as f:
    bids = json.load(f)

# Remove existing entry if ID matches
bids = [b for b in bids if b.get('id') != new_bid_entry['id']]

for b in bids:
    b['is_latest'] = False

all_bids = [new_bid_entry] + bids
all_bids.sort(key=lambda x: (x.get('delivery_date', ''), x.get('id', '')), reverse=True)

if all_bids:
    for i, b in enumerate(all_bids):
        b['is_latest'] = (i == 0)

with open(BID_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_bids, f, ensure_ascii=False, indent=2)

print("Updated bid_schedule.json successfully.")

# 3. Update index.html version
with open(INDEX_HTML_PATH, 'r', encoding='utf-8') as f:
    html_content = f.read()

if OLD_VERSION in html_content:
    html_content = html_content.replace(OLD_VERSION, NEW_VERSION)
    with open(INDEX_HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Updated index.html version to {NEW_VERSION}.")
else:
    print(f"Warning: {OLD_VERSION} not found in index.html.")
