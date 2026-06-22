import csv
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV = ROOT / "data" / "market_input.csv"
BID_SCHEDULE = ROOT / "data" / "bid_schedule.json"
INDEX_HTML = ROOT / "web" / "index.html"

DATE_YAMAKAWA = "2026-06-19"
DATE_MAKURAZAKI = "2026-06-20"
DATE_BID = "2026-06-24"

def add_market_rows():
    new_rows = [
        # 山川 (5わかば丸, 2026-06-19)
        [DATE_YAMAKAWA, "山川", "6.0kg上", "315.0", "10.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "4.5kg上", "330.0", "30.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "2.5kg上", "330.17", "230.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "1.8kg上", "330.05", "30.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "1.8kg下", "323.0", "10.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "2.5kg上変形", "315.05", "0.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "2.5kg下変形", "313.0", "0.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "キメジ3.0kg下", "280.0", "15.0", "5わかば丸"],
        [DATE_YAMAKAWA, "山川", "キメジ 1.5下", "225.0", "5.0", "5わかば丸"],
        
        # 枕崎 (81源福丸, 2026-06-20)
        [DATE_MAKURAZAKI, "枕崎", "8.0kg上", "300.0", "5.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "6.0kg上", "325.0", "40.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "4.5kg上", "335.0", "40.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "2.5kg上", "335.0", "90.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "1.8kg上", "331.1", "20.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "1.8kg下", "331.0", "30.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "0.5kg下", "310.0", "5.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "B品2.5kg上", "320.1", "0.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "B品2.5kg下", "317.0", "0.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "キワ・キメ 1.5kg上", "305.0", "5.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "1.5kg下ダル混", "225.0", "3.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "ダルマ1.5kg上", "218.1", "1.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "キメジキス", "210.0", "0.0", "81源福丸"],
        [DATE_MAKURAZAKI, "枕崎", "大キズ", "247.0", "0.0", "81源福丸"]
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
            "id": "20260624_genfukumaru18",
            "delivery_date": DATE_BID,
            "vessel_name": "18 源福丸",
            "bid_date": DATE_BID,
            "tonnage": 680.0,
            "sea_area": {
                "lat": "N 00°45' 〜 N 01°11'",
                "lon": "E 147°47' 〜 E 142°36'"
            },
            "port": "枕崎",
            "is_latest": True,
            "items": [
                {"category": "B カツオ", "size": "8.0kg上", "type": "入札", "volume": 0.0},
                {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 0.0},
                {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 0.0},
                {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 70.0},
                {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 110.0},
                {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 20.0},
                
                {"category": "PS カツオ", "size": "7.0kg上", "type": "相対", "volume": 0.0},
                {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 1.0},
                {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 31.0},
                {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 47.0},
                {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 1.0},
                
                {"category": "キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 50.0},
                {"category": "キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 206.0},
                {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 10.0},
                {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 5.0},
                
                {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 3.0},
                {"category": "PS キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 97.0},
                {"category": "PS キワ・キメ", "size": "1.5kg上", "type": "相対", "volume": 2.0},
                {"category": "PS キワ・キメ", "size": "1.5kg下ダル混", "type": "相対", "volume": 1.0},
                
                {"category": "ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 23.0},
                {"category": "ダルマ", "size": "1.5kg上", "type": "入札", "volume": 2.0},
                
                {"category": "PS ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 1.0},
                {"category": "PS ダルマ", "size": "1.5kg上", "type": "相対", "volume": 0.0}
            ],
            "total_volume": 680.0
        }
    ]

    existing_ids = {entry.get("id") for entry in schedules}
    added = 0
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
    old_version = "20260615-1340"
    new_version = "20260622-0910"
    
    with INDEX_HTML.open("r", encoding="utf-8") as f:
        content = f.read()
        
    if old_version in content:
        content = content.replace(old_version, new_version)
        with INDEX_HTML.open("w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated version to {new_version} in index.html.")
    else:
        print(f"Old version {old_version} not found in index.html.")

if __name__ == "__main__":
    market_added = add_market_rows()
    schedule_added = update_bid_schedule()
    update_version()
    print(f"Added {market_added} market rows.")
    print(f"Added {schedule_added} bid schedule entries.")
