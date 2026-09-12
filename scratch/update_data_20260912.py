import json
import csv
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BID_JSON_PATH = os.path.join(ROOT, 'data', 'bid_schedule.json')
MARKET_CSV_PATH = os.path.join(ROOT, 'data', 'market_input.csv')
INDEX_HTML_PATH = os.path.join(ROOT, 'web', 'index.html')

OLD_VERSION = "20260908-1030"
NEW_VERSION = "20260912-0900"

# 1. New Bids and Delivery details to add
new_bids = [
    {
        "id": "20260915_meihomaru86",
        "delivery_date": "2026-09-15",
        "vessel_name": "86明豊丸",
        "bid_date": "2026-09-15",
        "tonnage": 660.0,
        "sea_area": {
            "lat": "S 02°31' 〜 N 04°36'",
            "lon": "E 154°51' 〜 E 146°44'"
        },
        "port": "枕崎",
        "is_latest": True,
        "items": [
            {"category": "B カツオ", "size": "8.0kg上", "type": "入札", "volume": 0.0},
            {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 0.0},
            {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 10.0},
            {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 100.0},
            {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 140.0},
            {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 40.0},
            {"category": "PS カツオ", "size": "7.0kg上", "type": "相対", "volume": 0.0},
            {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 2.0},
            {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 69.0},
            {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 92.0},
            {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 20.0},
            {"category": "キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 28.0},
            {"category": "キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 21.0},
            {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 12.0},
            {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 4.0},
            {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 82.0},
            {"category": "PS キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 37.0},
            {"category": "PS キワ・キメ", "size": "1.5kg上", "type": "相対", "volume": 3.0},
            {"category": "PS キワ・キメ", "size": "1.5kg下ダル混", "type": "相対", "volume": 0.0},
            {"category": "ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 0.0},
            {"category": "ダルマ", "size": "1.5kg上", "type": "入札", "volume": 0.0},
            {"category": "PS ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 0.0},
            {"category": "PS ダルマ", "size": "1.5kg上", "type": "相対", "volume": 0.0}
        ],
        "total_volume": 660.0
    },
    {
        "id": "20260911_wakabamaru6",
        "delivery_date": "2026-09-11",
        "vessel_name": "6わかば丸",
        "bid_date": "2026-09-11",
        "tonnage": 240.0,
        "sea_area": {
            "lat": "",
            "lon": ""
        },
        "port": "山川",
        "is_latest": False,
        "items": [
            {"category": "カツオ", "size": "4.5kg上", "type": "入札", "volume": 10.0},
            {"category": "カツオ", "size": "2.5kg上", "type": "入札", "volume": 140.0},
            {"category": "カツオ", "size": "1.8kg上", "type": "入札", "volume": 30.0},
            {"category": "カツオ", "size": "1.8kg下", "type": "入札", "volume": 40.0},
            {"category": "キメジ", "size": "3.0kg下", "type": "入札", "volume": 15.0},
            {"category": "キメジ", "size": "1.5kg下", "type": "入札", "volume": 5.0}
        ],
        "total_volume": 240.0
    },
    {
        "id": "20260911_eiseimaru",
        "delivery_date": "2026-09-11",
        "vessel_name": "永盛丸",
        "bid_date": "2026-09-11",
        "tonnage": 140.0,
        "sea_area": {
            "lat": "南方",
            "lon": ""
        },
        "port": "焼津",
        "is_latest": False,
        "items": [
            {"category": "海旋", "size": "2.5kg上", "type": "入札", "volume": 20.0},
            {"category": "海旋", "size": "1.8kg上", "type": "入札", "volume": 80.0},
            {"category": "海旋", "size": "1.8kg下", "type": "入札", "volume": 40.0}
        ],
        "total_volume": 140.0
    },
    {
        "id": "20260911_kiyomaru28",
        "delivery_date": "2026-09-11",
        "vessel_name": "28亀洋丸",
        "bid_date": "2026-09-11",
        "tonnage": 335.0,
        "sea_area": {
            "lat": "東沖",
            "lon": ""
        },
        "port": "焼津",
        "is_latest": False,
        "items": [
            {"category": "一本釣", "size": "4.5kg上", "type": "入札", "volume": 15.0},
            {"category": "一本釣", "size": "2.5kg上", "type": "入札", "volume": 280.0},
            {"category": "一本釣", "size": "1.5kg上", "type": "入札", "volume": 40.0}
        ],
        "total_volume": 335.0
    }
]

with open(BID_JSON_PATH, 'r', encoding='utf-8') as f:
    bids = json.load(f)

# Filter out existing entries with matching IDs if re-running
new_ids = {b['id'] for b in new_bids}
bids = [b for b in bids if b.get('id') not in new_ids]

# Reset is_latest flags
for b in bids:
    b['is_latest'] = False

# Merge and sort by delivery_date desc, id desc
all_bids = new_bids + bids
all_bids.sort(key=lambda x: (x.get('delivery_date', ''), x.get('id', '')), reverse=True)

# Set highest delivery date entry as is_latest
if all_bids:
    for i, b in enumerate(all_bids):
        b['is_latest'] = (i == 0)

with open(BID_JSON_PATH, 'w', encoding='utf-8') as f:
    json.dump(all_bids, f, ensure_ascii=False, indent=2)

print("Updated bid_schedule.json successfully.")

# 2. Update market_input.csv
new_market_rows = [
    # 焼津 (2026-09-11, 永盛丸)
    {"date": "2026-09-11", "port": "焼津", "size": "2.5kg上", "price": "327.0", "volume": "20.0", "vessel": "永盛丸"},
    {"date": "2026-09-11", "port": "焼津", "size": "1.8kg上", "price": "329.0", "volume": "80.0", "vessel": "永盛丸"},
    {"date": "2026-09-11", "port": "焼津", "size": "1.8kg下", "price": "320.5", "volume": "40.0", "vessel": "永盛丸"},

    # 枕崎 (2026-09-09, 88福一丸)
    {"date": "2026-09-09", "port": "枕崎", "size": "6.0kg上", "price": "340.0", "volume": "2.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "4.5kg上", "price": "357.0", "volume": "10.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "2.5kg上", "price": "343.9", "volume": "100.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "1.8kg上", "price": "326.7", "volume": "60.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "1.8kg下", "price": "320.9", "volume": "70.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "B品2.5kg上", "price": "322.1", "volume": "0.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "B品2.5kg下", "price": "300.2", "volume": "0.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "キワ・キメ 1.5kg上", "price": "262.6", "volume": "20.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "1.5kg下ダル混", "price": "232.0", "volume": "15.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "ダルマ1.5kg上", "price": "211.2", "volume": "1.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "キメジキス", "price": "203.1", "volume": "0.0", "vessel": "88福一丸"},
    {"date": "2026-09-09", "port": "枕崎", "size": "大キズ", "price": "268.0", "volume": "0.0", "vessel": "88福一丸"},

    # 山川 (2026-09-11, 6わかば丸)
    {"date": "2026-09-11", "port": "山川", "size": "4.5kg上", "price": "360.0", "volume": "10.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "2.5kg上", "price": "340.61", "volume": "140.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "1.8kg上", "price": "321.98", "volume": "30.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "1.8kg下", "price": "320.30", "volume": "40.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "2.5kg上変形", "price": "325.2", "volume": "0.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "2.5kg下変形", "price": "301.0", "volume": "0.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "キメジ3.0kg下", "price": "270.9", "volume": "15.0", "vessel": "6わかば丸"},
    {"date": "2026-09-11", "port": "山川", "size": "キメジ 1.5下", "price": "242.0", "volume": "5.0", "vessel": "6わかば丸"},
]

new_keys = {(r['date'], r['port'], r['size'], r['vessel']) for r in new_market_rows}

existing_rows = []
with open(MARKET_CSV_PATH, 'r', encoding='utf-8', newline='') as f:
    reader = csv.DictReader(f)
    fieldnames = reader.fieldnames
    for row in reader:
        key = (row.get('date'), row.get('port'), row.get('size'), row.get('vessel'))
        if key not in new_keys:
            existing_rows.append(row)

existing_rows.extend(new_market_rows)
existing_rows.sort(key=lambda x: (x['date'], x['port'], x['size']))

with open(MARKET_CSV_PATH, 'w', encoding='utf-8', newline='') as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(existing_rows)

print("Updated market_input.csv successfully.")

# 3. Update index.html version tag
with open(INDEX_HTML_PATH, 'r', encoding='utf-8') as f:
    html_content = f.read()

if OLD_VERSION in html_content:
    html_content = html_content.replace(OLD_VERSION, NEW_VERSION)
    with open(INDEX_HTML_PATH, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Updated index.html version to {NEW_VERSION}.")
else:
    print(f"Warning: {OLD_VERSION} not found in index.html.")
