import csv
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV = ROOT / "data" / "market_input.csv"
BID_SCHEDULE = ROOT / "data" / "bid_schedule.json"
INDEX_HTML = ROOT / "web" / "index.html"

# 日付の定義
DATE_YAIZU_1 = "2026-06-23"
DATE_MAKURAZAKI_1 = "2026-06-24"
DATE_YAIZU_2 = "2026-06-29"
DATE_MAKURAZAKI_2 = "2026-06-29"
DATE_YAMAKAWA = "2026-06-29"
DATE_BID = "2026-06-29"

def add_market_rows():
    new_rows = [
        # 焼津 (38常磐丸, 2026-06-23)
        [DATE_YAIZU_1, "焼津", "4.5kg上", "315.0", "50.0", "38常磐丸"],
        [DATE_YAIZU_1, "焼津", "2.5kg上", "329.0", "280.0", "38常磐丸"],
        [DATE_YAIZU_1, "焼津", "1.8kg上", "320.0", "120.0", "38常磐丸"],
        [DATE_YAIZU_1, "焼津", "1.8kg下", "317.5", "100.0", "38常磐丸"],
        
        # 枕崎 (18源福丸, 2026-06-24)
        [DATE_MAKURAZAKI_1, "枕崎", "6.0kg上", "325.0", "3.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "4.5kg上", "338.1", "10.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "2.5kg上", "335.4", "110.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "1.8kg上", "328.5", "70.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "1.8kg下", "328.0", "20.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "B品2.5kg上", "323.0", "0.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "B品2.5kg下", "318.0", "0.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "キワ・キメ 1.5kg上", "305.2", "10.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "1.5kg下ダル混", "230.1", "5.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "ダルマ1.5kg上", "213.1", "1.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "キメジキス", "207.0", "0.0", "18源福丸"],
        [DATE_MAKURAZAKI_1, "枕崎", "大キズ", "253.0", "0.0", "18源福丸"],

        # 焼津 (88光洋丸, 2026-06-29)
        [DATE_YAIZU_2, "焼津", "4.5kg上", "311.0", "120.0", "88光洋丸"],
        [DATE_YAIZU_2, "焼津", "2.5kg上", "325.0", "200.0", "88光洋丸"],
        [DATE_YAIZU_2, "焼津", "1.8kg上", "318.0", "70.0", "88光洋丸"],
        [DATE_YAIZU_2, "焼津", "1.8kg下", "315.0", "60.0", "88光洋丸"],

        # 枕崎 (35八興丸, 2026-06-29)
        [DATE_MAKURAZAKI_2, "枕崎", "6.0kg上", "320.0", "3.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "4.5kg上", "324.5", "20.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "2.5kg上", "328.0", "140.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "1.8kg上", "320.2", "100.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "1.8kg下", "320.5", "160.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "0.5kg下", "301.0", "20.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "B品2.5kg上", "312.1", "0.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "B品2.5kg下", "300.0", "0.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "キワ・キメ 1.5kg上", "295.1", "25.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "1.5kg下ダル混", "240.0", "30.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "ダルマ1.5kg上", "213.0", "2.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "キメジキス", "205.1", "0.0", "35八興丸"],
        [DATE_MAKURAZAKI_2, "枕崎", "大キズ", "257.0", "0.0", "35八興丸"],

        # 山川 (83福一丸, 2026-06-29)
        [DATE_YAMAKAWA, "山川", "4.5kg上", "340.0", "10.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "2.5kg上", "331.8", "150.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "1.8kg上", "325.0", "30.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "1.8kg下", "324.67", "120.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "0.5kg下", "306.0", "20.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "2.5kg上変形", "317.5", "0.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "2.5kg下変形", "315.0", "0.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "キメジ3.0kg下", "278.0", "40.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "キメジ 1.5下", "235.0", "30.0", "83福一丸"],
        [DATE_YAMAKAWA, "山川", "ダルマ3.0kg下", "195.0", "5.0", "83福一丸"],
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
            "id": "20260629_hakkomaru35",
            "delivery_date": DATE_BID,
            "vessel_name": "35 八興丸",
            "bid_date": DATE_BID,
            "tonnage": 690.0,
            "sea_area": {
                "lat": "N 01°09' 〜 N 05°17'",
                "lon": "E 152°59' 〜 E 146°25'"
            },
            "port": "枕崎",
            "is_latest": True,
            "items": [
                {"category": "B カツオ", "size": "8.0kg上", "type": "入札", "volume": 0.0},
                {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 0.0},
                {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 20.0},
                {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 150.0},
                {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 110.0},
                {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 150.0},
                
                {"category": "PS カツオ", "size": "7.0kg上", "type": "相対", "volume": 0.0},
                {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 8.0},
                {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 67.0},
                {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 48.0},
                {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 16.0},
                
                {"category": "キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 4.0},
                {"category": "キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 27.0},
                {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 30.0},
                {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 20.0},
                
                {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 8.0},
                {"category": "PS キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 13.0},
                {"category": "PS キワ・キメ", "size": "1.5kg上", "type": "相対", "volume": 9.0},
                {"category": "PS キワ・キメ", "size": "1.5kg下ダル混", "type": "相対", "volume": 0.0},
                
                {"category": "ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 7.0},
                {"category": "ダルマ", "size": "1.5kg上", "type": "入札", "volume": 0.0},
                
                {"category": "PS ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 3.0},
                {"category": "PS ダルマ", "size": "1.5kg上", "type": "相対", "volume": 0.0}
            ],
            "total_volume": 690.0
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
    old_version = "20260622-0910"
    new_version = "20260701-1605"
    
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
