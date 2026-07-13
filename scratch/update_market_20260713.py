import csv
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV = ROOT / "data" / "market_input.csv"
BID_SCHEDULE = ROOT / "data" / "bid_schedule.json"
INDEX_HTML = ROOT / "web" / "index.html"
MARKET_JSON = ROOT / "data" / "katsuo_market_data.json"

OLD_VERSION = "20260702-1615"
NEW_VERSION = "20260713-1000"

def add_market_rows():
    new_rows = [
        # 2026-07-07, 枕崎, 7わかば丸
        ["2026-07-07", "枕崎", "6.0kg上", "327.0", "3.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "4.5kg上", "328.1", "20.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "2.5kg上", "343.8", "200.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "1.8kg上", "337.4", "70.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "1.8kg下", "322.0", "20.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "0.5kg下", "303.1", "3.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "B品2.5kg上", "318.0", "0.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "B品2.5kg下", "302.0", "0.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "キワ・キメ 1.5kg上", "296.2", "3.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "1.5kg下ダル混", "241.5", "3.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "キメジキス", "206.1", "0.0", "7わかば丸"],
        ["2026-07-07", "枕崎", "大キズ", "262.0", "0.0", "7わかば丸"],

        # 2026-07-08, 焼津, 88福一丸
        ["2026-07-08", "焼津", "4.5kg上", "312.5", "60.0", "88福一丸"],
        ["2026-07-08", "焼津", "2.5kg上", "332.5", "320.0", "88福一丸"],
        ["2026-07-08", "焼津", "1.8kg上", "317.5", "70.0", "88福一丸"],
        ["2026-07-08", "焼津", "1.8kg下", "317.5", "35.0", "88福一丸"],

        # 2026-07-08, 焼津, 51日光丸(東沖)
        ["2026-07-08", "焼津", "2.5kg上", "520.0", "10.0", "51日光丸(東沖)"],
        ["2026-07-08", "焼津", "1.5kg上", "442.5", "30.0", "51日光丸(東沖)"],
        # 2026-07-08, 焼津, 51日光丸(南方)
        ["2026-07-08", "焼津", "7.0kg上", "410.0", "80.0", "51日光丸(南方)"],
        ["2026-07-08", "焼津", "4.5kg上", "480.0", "5.0", "51日光丸(南方)"],
        ["2026-07-08", "焼津", "2.5kg上", "440.0", "1.0", "51日光丸(南方)"],
        ["2026-07-08", "焼津", "1.5kg上", "390.0", "3.0", "51日光丸(南方)"],

        # 2026-07-13, 枕崎, 55岬洋丸
        ["2026-07-13", "枕崎", "6.0kg上", "320.0", "5.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "4.5kg上", "326.9", "45.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "2.5kg上", "329.2", "180.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "1.8kg上", "320.5", "60.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "1.8kg下", "316.7", "40.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "0.5kg下", "301.3", "5.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "B品2.5kg上", "308.1", "0.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "B品2.5kg下", "295.2", "0.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "キワ・キメ 1.5kg上", "297.0", "25.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "1.5kg下ダル混", "242.0", "18.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "キメジキス", "212.0", "2.0", "55岬洋丸"],
        ["2026-07-13", "枕崎", "大キズ", "265.0", "0.0", "55岬洋丸"],
    ]

    with MARKET_CSV.open("r", encoding="utf-8", newline="") as f:
        rows = list(csv.reader(f))

    header, data = rows[0], rows[1:]
    existing = {tuple(row) for row in data}
    added = 0
    for row in new_rows:
        key = tuple(row)
        if key not in existing:
            data.append(row)
            existing.add(key)
            added += 1

    # Sort data by Date, Port, Size, Vessel
    data.sort(key=lambda r: (r[0], r[1], r[2], r[5] if len(r) > 5 else ""))

    with MARKET_CSV.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(data)

    return added

def update_bid_schedule():
    with BID_SCHEDULE.open("r", encoding="utf-8") as f:
        schedules = json.load(f)

    # Set is_latest = False for all existing
    for entry in schedules:
        entry["is_latest"] = False

    new_entries = [
        # 2026-07-13: 55岬洋丸 (枕崎)
        {
            "id": "20260713_misakimaru55",
            "delivery_date": "2026-07-13",
            "vessel_name": "55 岬洋丸",
            "bid_date": "2026-07-13",
            "tonnage": 600.0,
            "sea_area": {
                "lat": "N 01°12' 〜 N 04°58'",
                "lon": "E 157°05' 〜 E 149°19'"
            },
            "port": "枕崎",
            "is_latest": True,
            "items": [
                {"category": "B カツオ", "size": "8.0kg上", "type": "入札", "volume": 0.0},
                {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 10.0},
                {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 40.0},
                {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 160.0},
                {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 80.0},
                {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 40.0},
                {"category": "PS カツオ", "size": "7.0kg上", "type": "相対", "volume": 0.0},
                {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 13.0},
                {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 60.0},
                {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 25.0},
                {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 19.0},
                {"category": "キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 9.0},
                {"category": "キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 30.0},
                {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 25.0},
                {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 18.0},
                {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 14.0},
                {"category": "PS キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 31.0},
                {"category": "PS キワ・キメ", "size": "1.5kg上", "type": "相対", "volume": 14.0},
                {"category": "PS キワ・キメ", "size": "1.5kg下ダル混", "type": "相対", "volume": 5.0},
                {"category": "ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 6.0},
                {"category": "ダルマ", "size": "1.5kg上", "type": "入札", "volume": 0.0},
                {"category": "PS ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 1.0},
                {"category": "PS ダルマ", "size": "1.5kg上", "type": "相対", "volume": 0.0}
            ],
            "total_volume": 600.0
        },
        # 2026-07-08: 88福一丸 (焼津)
        {
            "id": "20260708_fukuichimaru88",
            "delivery_date": "2026-07-08",
            "vessel_name": "88 福一丸",
            "bid_date": "2026-07-08",
            "tonnage": 485.0,
            "sea_area": {
                "lat": "南方",
                "lon": ""
            },
            "port": "焼津",
            "is_latest": False,
            "items": [
                {"category": "海旋", "size": "4.5kg上", "type": "入札", "volume": 60.0},
                {"category": "海旋", "size": "2.5kg上", "type": "入札", "volume": 320.0},
                {"category": "海旋", "size": "1.8kg上", "type": "入札", "volume": 70.0},
                {"category": "海旋", "size": "1.8kg下", "type": "入札", "volume": 35.0}
            ],
            "total_volume": 485.0
        },
        # 2026-07-08: 51日光丸(東沖) (焼津)
        {
            "id": "20260708_nikkomaru51_east",
            "delivery_date": "2026-07-08",
            "vessel_name": "51 日光丸 (東沖)",
            "bid_date": "2026-07-08",
            "tonnage": 40.0,
            "sea_area": {
                "lat": "東沖",
                "lon": ""
            },
            "port": "焼津",
            "is_latest": False,
            "items": [
                {"category": "一本釣", "size": "2.5kg上", "type": "入札", "volume": 10.0},
                {"category": "一本釣", "size": "1.5kg上", "type": "入札", "volume": 30.0}
            ],
            "total_volume": 40.0
        },
        # 2026-07-08: 51日光丸(南方) (焼津)
        {
            "id": "20260708_nikkomaru51_south",
            "delivery_date": "2026-07-08",
            "vessel_name": "51 日光丸 (南方)",
            "bid_date": "2026-07-08",
            "tonnage": 89.0,
            "sea_area": {
                "lat": "南方",
                "lon": ""
            },
            "port": "焼津",
            "is_latest": False,
            "items": [
                {"category": "一本釣", "size": "7.0kg上", "type": "入札", "volume": 80.0},
                {"category": "一本釣", "size": "4.5kg上", "type": "入札", "volume": 5.0},
                {"category": "一本釣", "size": "2.5kg上", "type": "入札", "volume": 1.0},
                {"category": "一本釣", "size": "1.5kg上", "type": "入札", "volume": 3.0}
            ],
            "total_volume": 89.0
        },
        # 2026-07-07: 7わかば丸 (枕崎)
        {
            "id": "20260707_wakabamaru7",
            "delivery_date": "2026-07-07",
            "vessel_name": "7 わかば丸",
            "bid_date": "2026-07-07",
            "tonnage": 322.0,
            "sea_area": {
                "lat": "南方",
                "lon": ""
            },
            "port": "枕崎",
            "is_latest": False,
            "items": [
                {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 3.0},
                {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 20.0},
                {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 200.0},
                {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 70.0},
                {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 20.0},
                {"category": "B カツオ", "size": "0.5kg下", "type": "入札", "volume": 3.0},
                {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 3.0},
                {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 3.0}
            ],
            "total_volume": 322.0
        }
    ]

    existing_ids = {entry.get("id") for entry in schedules}
    added = 0
    # Prepend newest entries in reverse chronological order so 20260713 is at index 0.
    for entry in reversed(new_entries):
        if entry["id"] not in existing_ids:
            schedules.insert(0, entry)
            added += 1
        else:
            # If it already exists, update properties just in case
            for e in schedules:
                if e["id"] == entry["id"]:
                    e["is_latest"] = entry["is_latest"]

    with BID_SCHEDULE.open("w", encoding="utf-8") as f:
        json.dump(schedules, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return added

def update_version():
    with INDEX_HTML.open("r", encoding="utf-8") as f:
        content = f.read()
        
    if OLD_VERSION in content:
        content = content.replace(OLD_VERSION, NEW_VERSION)
        with INDEX_HTML.open("w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated version to {NEW_VERSION} in index.html.")
    else:
        print(f"Old version {OLD_VERSION} not found in index.html.")

def rebuild_market_json():
    from collections import defaultdict
    data = defaultdict(lambda: defaultdict(list))
    
    with MARKET_CSV.open("r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row['date'] or not row['port']:
                continue
                
            port = row['port']
            size = row['size']
            
            # Skip if price or volume is empty
            if not row['price'] or not row['volume']:
                continue
                
            entry = {
                "date": row['date'],
                "price": float(row['price']),
                "volume": float(row['volume'])
            }
            if 'vessel' in row and row['vessel']:
                entry['vessel'] = row['vessel']
                
            data[port][size].append(entry)
            
    # Sort by date
    for port in data:
        for size in data[port]:
            data[port][size].sort(key=lambda x: x['date'])
            
    with MARKET_JSON.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print("Market data JSON has been rebuilt successfully.")

if __name__ == "__main__":
    market_added = add_market_rows()
    schedule_added = update_bid_schedule()
    update_version()
    rebuild_market_json()
    print(f"Added {market_added} market rows.")
    print(f"Added {schedule_added} bid schedule entries.")
