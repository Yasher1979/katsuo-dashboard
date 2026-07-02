import csv
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV = ROOT / "data" / "market_input.csv"
BID_SCHEDULE = ROOT / "data" / "bid_schedule.json"
INDEX_HTML = ROOT / "web" / "index.html"
MARKET_JSON = ROOT / "data" / "katsuo_market_data.json"

DATE_YAIZU = "2026-07-02"

def add_market_rows():
    new_rows = [
        # 焼津 (永盛丸, 2026-07-02)
        # 4.5kg上: 90t, 335〜321円 (平均 328.0円)
        # 2.5kg上: 220t, 350円〜 (350.0円)
        # 1.8kg上: 40t, 350〜345円 (平均 347.5円)
        # 1.8kg下: 20t, 320円〜 (320.0円)
        [DATE_YAIZU, "焼津", "4.5kg上", "328.0", "90.0", "永盛丸"],
        [DATE_YAIZU, "焼津", "2.5kg上", "350.0", "220.0", "永盛丸"],
        [DATE_YAIZU, "焼津", "1.8kg上", "347.5", "40.0", "永盛丸"],
        [DATE_YAIZU, "焼津", "1.8kg下", "320.0", "20.0", "永盛丸"],
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
    data.sort(key=lambda row: (row[0], row[1], row[2], row[5] if len(row) > 5 else ""))

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
        {
            "id": "20260702_eiseimaru",
            "delivery_date": DATE_YAIZU,
            "vessel_name": "永盛丸",
            "bid_date": DATE_YAIZU,
            "tonnage": 370.0,
            "sea_area": {
                "lat": "南方",
                "lon": ""
            },
            "port": "焼津",
            "is_latest": True,
            "items": [
                {"category": "海旋", "size": "4.5kg上", "type": "入札", "volume": 90.0},
                {"category": "海旋", "size": "2.5kg上", "type": "入札", "volume": 220.0},
                {"category": "海旋", "size": "1.8kg上", "type": "入札", "volume": 40.0},
                {"category": "海旋", "size": "1.8kg下", "type": "入札", "volume": 20.0}
            ],
            "total_volume": 370.0
        },
        {
            "id": "20260702_yaizu_training",
            "delivery_date": DATE_YAIZU,
            "vessel_name": "実習船やいづ",
            "bid_date": DATE_YAIZU,
            "tonnage": 2.1,
            "sea_area": {
                "lat": "南方",
                "lon": ""
            },
            "port": "焼津",
            "is_latest": True,
            "items": [
                {"category": "一本釣", "size": "7.0kg上", "type": "入札", "volume": 0.5},
                {"category": "一本釣", "size": "4.5kg上", "type": "入札", "volume": 0.6},
                {"category": "一本釣", "size": "1.5kg上", "type": "入札", "volume": 1.0}
            ],
            "total_volume": 2.1
        }
    ]

    existing_ids = {entry.get("id") for entry in schedules}
    added = 0
    # To keep the order: prepend yaizu_training first, then eiseimaru, so eiseimaru will be at the very top (first)
    for entry in reversed(new_entries):
        if entry["id"] not in existing_ids:
            schedules.insert(0, entry)
            added += 1
        else:
            # If exists, set is_latest = True
            for e in schedules:
                if e["id"] == entry["id"]:
                    e["is_latest"] = True

    with BID_SCHEDULE.open("w", encoding="utf-8") as f:
        json.dump(schedules, f, ensure_ascii=False, indent=2)
        f.write("\n")

    return added

def update_version():
    old_version = "20260701-1605"
    new_version = "20260702-1615"
    
    with INDEX_HTML.open("r", encoding="utf-8") as f:
        content = f.read()
        
    if old_version in content:
        content = content.replace(old_version, new_version)
        with INDEX_HTML.open("w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated version to {new_version} in index.html.")
    else:
        print(f"Old version {old_version} not found in index.html.")

def rebuild_market_json():
    # Import rebuild script directly or run the conversion logic
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
