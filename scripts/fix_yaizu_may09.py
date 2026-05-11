import json
import csv
import os

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def fix_katsuo_market_data():
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'katsuo_market_data.json')
    data = load_json(path)
    
    # 焼津のデータから、海旋の価格を復元する（一本釣りで上書きされていたため）
    # 海旋の価格
    # 4.5kg上: 285.0
    # 2.5kg上: 288.0
    # 1.8kg上: 286.0 (これは一本釣りデータが無かったのでそのままのはず)
    # 1.8kg下: 285.0 (そのまま)
    # 7.0kg上: 455.0 (一本釣り由来なので削除)
    # 1.5kg上: 415.0 (一本釣り由来なので削除)
    
    port = "焼津"
    date = "2026-05-09"
    
    # 4.5kg上 の修正
    if "4.5kg上" in data[port]:
        for d in data[port]["4.5kg上"]:
            if d['date'] == date:
                d['price'] = 285.0
                d['volume'] = 80.0
                
    # 2.5kg上 の修正
    if "2.5kg上" in data[port]:
        for d in data[port]["2.5kg上"]:
            if d['date'] == date:
                d['price'] = 288.0
                d['volume'] = 300.0

    # 7.0kg上 の削除
    if "7.0kg上" in data[port]:
        data[port]["7.0kg上"] = [d for d in data[port]["7.0kg上"] if d['date'] != date]

    # 1.5kg上 の削除
    if "1.5kg上" in data[port]:
        data[port]["1.5kg上"] = [d for d in data[port]["1.5kg上"] if d['date'] != date]

    save_json(path, data)
    print("katsuo_market_data.json fixed.")

def fix_bid_schedule():
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'bid_schedule.json')
    data = load_json(path)
    
    for entry in data:
        if entry.get("id") == "20260509_koyomaru78":
            entry["total_volume"] = 440.0
            entry["items"] = [item for item in entry["items"] if item.get("category") != "一本釣"]
            
    save_json(path, data)
    print("bid_schedule.json fixed.")

def fix_market_input_csv():
    path = os.path.join(os.path.dirname(__file__), '..', 'data', 'market_input.csv')
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    new_lines = []
    for line in lines:
        if "2026-05-09,焼津" in line:
            # 7.0kg上, 1.5kg上 の行は削除
            if ",7.0kg上," in line or ",1.5kg上," in line:
                continue
            # 4.5kg上の上書きデータ(452.5)を削除
            if ",4.5kg上,452.5," in line:
                continue
            # 2.5kg上の上書きデータ(430.0)を削除
            if ",2.5kg上,430.0," in line:
                continue
        new_lines.append(line)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    print("market_input.csv fixed.")

def main():
    fix_katsuo_market_data()
    fix_bid_schedule()
    fix_market_input_csv()
    
    from update_data import bump_version
    bump_version()

if __name__ == "__main__":
    main()
