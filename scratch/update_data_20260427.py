import json
import os
from datetime import datetime

# ファイルパス
MARKET_DATA_PATH = r"c:\Users\yabuk\OneDrive\デスクトップ\Antigravity（鰹相場グラフ）\data\katsuo_market_data.json"
BID_SCHEDULE_PATH = r"c:\Users\yabuk\OneDrive\デスクトップ\Antigravity（鰹相場グラフ）\data\bid_schedule.json"

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def update_market_data():
    data = load_json(MARKET_DATA_PATH)
    
    # 焼津 (2026-04-25)
    yaizu_updates = {
        "4.5kg上": {"date": "2026-04-25", "price": 305.0, "volume": 10.0},
        "2.5kg上": {"date": "2026-04-25", "price": 305.0, "volume": 250.0},
        "1.8kg上": {"date": "2026-04-25", "price": 302.5, "volume": 40.0},
        "1.8kg下": {"date": "2026-04-25", "price": 300.0, "volume": 10.0}
    }
    
    for size, entry in yaizu_updates.items():
        if size not in data["焼津"]:
            data["焼津"][size] = []
        # 重複チェック
        if not any(d["date"] == entry["date"] for d in data["焼津"][size]):
            data["焼津"][size].append(entry)
            print(f"Added Yaizu {size} for {entry['date']}")

    # 山川 (2026-04-27)
    yamagawa_updates = {
        "6.0kg上": {"date": "2026-04-27", "price": 307.0, "volume": 15.0},
        "4.5kg上": {"date": "2026-04-27", "price": 310.18, "volume": 50.0},
        "2.5kg上": {"date": "2026-04-27", "price": 310.57, "volume": 300.0},
        "1.8kg上": {"date": "2026-04-27", "price": 308.31, "volume": 130.0},
        "1.8kg下": {"date": "2026-04-27", "price": 306.3, "volume": 40.0},
        "2.5kg上変形": {"date": "2026-04-27", "price": 296.95, "volume": 0.0},
        "2.5kg下変形": {"date": "2026-04-27", "price": 297.8, "volume": 0.0},
        "キメジ 3下": {"date": "2026-04-27", "price": 300.0, "volume": 15.0},
        "キメジ 1.5下": {"date": "2026-04-27", "price": 210.0, "volume": 15.0}
    }
    
    for size, entry in yamagawa_updates.items():
        if size not in data["山川"]:
            data["山川"][size] = []
        if not any(d["date"] == entry["date"] for d in data["山川"][size]):
            data["山川"][size].append(entry)
            print(f"Added Yamagawa {size} for {entry['date']}")

    # 枕崎 (2026-04-27)
    makurazaki_updates = {
        "6.0kg上": {"date": "2026-04-27", "price": 330.0, "volume": 2.0},
        "4.5kg上": {"date": "2026-04-27", "price": 335.0, "volume": 20.0},
        "2.5kg上": {"date": "2026-04-27", "price": 309.7, "volume": 280.0},
        "1.8kg上": {"date": "2026-04-27", "price": 313.4, "volume": 85.0},
        "1.8kg下": {"date": "2026-04-27", "price": 310.0, "volume": 20.0},
        "ダルマ1.5kg上": {"date": "2026-04-27", "price": 300.0, "volume": 1.0},
        "1.5kg下ダル混": {"date": "2026-04-27", "price": 210.3, "volume": 2.0},
        "B品2.5kg下": {"date": "2026-04-27", "price": 295.0, "volume": 0.0}
    }
    
    for size, entry in makurazaki_updates.items():
        if size not in data["枕崎"]:
            data["枕崎"][size] = []
        if not any(d["date"] == entry["date"] for d in data["枕崎"][size]):
            data["枕崎"][size].append(entry)
            print(f"Added Makurazaki {size} for {entry['date']}")

    save_json(MARKET_DATA_PATH, data)
    print("Market data updated successfully.")

def update_bid_schedule():
    data = load_json(BID_SCHEDULE_PATH)
    
    # 新規エントリの作成
    new_entry = {
        "id": "20260427_wakabamaru7",
        "delivery_date": "2026-04-27",
        "vessel_name": "7 わかば丸",
        "bid_date": "2026-04-27",
        "tonnage": 900.0,
        "sea_area": {
            "lat": "N 02°24' 〜 N 06°12'",
            "lon": "E 162°01' 〜 E 154°14'"
        },
        "port": "枕崎",
        "is_latest": True,
        "items": [
            {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 20.0},
            {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 280.0},
            {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 80.0},
            {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 20.0},
            {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 6.0},
            {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 330.0},
            {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 132.0},
            {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 20.0},
            {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 6.0},
            {"category": "PS キワ・キメ", "size": "5.0kg上", "type": "相対", "volume": 6.0}
        ],
        "total_volume": 900.0
    }
    
    # 既存の is_latest を False に
    for entry in data:
        entry["is_latest"] = False
        
    # 重複チェック (IDで)
    if not any(e["id"] == new_entry["id"] for e in data):
        data.insert(0, new_entry)
        print(f"Added Bid Schedule for {new_entry['vessel_name']} on {new_entry['bid_date']}")
    else:
        # すでにある場合は is_latest だけ更新
        for e in data:
            if e["id"] == new_entry["id"]:
                e["is_latest"] = True
                break
        print(f"Bid Schedule for {new_entry['id']} already exists, updated is_latest.")

    save_json(BID_SCHEDULE_PATH, data)
    print("Bid schedule updated successfully.")

if __name__ == "__main__":
    update_market_data()
    update_bid_schedule()
