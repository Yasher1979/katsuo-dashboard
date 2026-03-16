import json
import os
from datetime import datetime

MARKET_DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'katsuo_market_data.json')
BID_SCHEDULE_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'bid_schedule.json')

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved to {path}")

def add_market_data(port, size, date, price, volume):
    """
    相場データを追加します。
    """
    data = load_json(MARKET_DATA_PATH)
    if port not in data:
        print(f"Error: Port '{port}' not found.")
        return
    if size not in data[port]:
        print(f"Info: Size '{size}' not found in '{port}'. Creating new category.")
        data[port][size] = []
    
    new_entry = {
        "date": date,
        "price": float(price),
        "volume": float(volume)
    }
    
    # 重複チェック
    existing = [d for d in data[port][size] if d['date'] == date]
    if existing:
        print(f"Warning: Entry for {date} already exists for {port} {size}. Updating price/volume.")
        existing[0]['price'] = float(price)
        existing[0]['volume'] = float(volume)
    else:
        data[port][size].append(new_entry)
        # 日付順にソート
        data[port][size].sort(key=lambda x: x['date'])
    
    save_json(MARKET_DATA_PATH, data)

def add_bid_schedule(id, vessel_name, bid_date, delivery_date, tonnage, port, items, lat="", lon=""):
    """
    入札予定を追加します。
    """
    data = load_json(BID_SCHEDULE_PATH)
    
    # 既存の is_latest をすべて解除
    for entry in data:
        entry['is_latest'] = False
        
    total_vol = sum([float(item.get('volume', 0)) for item in items])
    
    new_entry = {
        "id": id,
        "delivery_date": delivery_date,
        "vessel_name": vessel_name,
        "bid_date": bid_date,
        "tonnage": float(tonnage),
        "sea_area": {
            "lat": lat,
            "lon": lon
        },
        "port": port,
        "is_latest": True,
        "items": items,
        "total_volume": total_vol
    }
    
    data.insert(0, new_entry)
    save_json(BID_SCHEDULE_PATH, data)

def bump_version():
    """
    index.html の VERSION を現在の日時に更新します。
    """
    path = os.path.join(os.path.dirname(__file__), '..', 'web', 'index.html')
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_version = datetime.now().strftime("%Y%m%d-%H%M")
    new_lines = []
    for line in lines:
        if 'const VERSION =' in line:
            new_lines.append(f'            const VERSION = "{new_version}";\n')
        elif 'href="index.css?v=' in line:
            import re
            new_lines.append(re.sub(r'v=[^"]+', f'v={new_version}', line))
        elif 'src="dashboard.js?v=' in line:
            import re
            new_lines.append(re.sub(r'v=[^"]+', f'v={new_version}', line))
        else:
            new_lines.append(line)
            
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print(f"Bumped version to {new_version} in index.html")

if __name__ == "__main__":
    # 使用例
    # bump_version()
    print("This script provides utility functions to update katsuo data safely.")
