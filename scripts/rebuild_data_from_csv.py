import csv
import json
from collections import defaultdict

def convert_csv_to_json(csv_path, json_path):
    data = defaultdict(lambda: defaultdict(list))
    
    with open(csv_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row['date'] or not row['port']:
                continue
                
            port = row['port']
            size = row['size']
            
            entry = {
                "date": row['date'],
                "price": float(row['price']),
                "volume": float(row['volume'])
            }
            
            # 既存のJSONにある船名情報を維持したい場合はここに追加しますが、
            # ユーザーは「お渡ししているデータ」の確認を求めているため、
            # CSVにある情報のみを優先します。
            
            data[port][size].append(entry)
    
    # 日付順にソート
    for port in data:
        for size in data[port]:
            data[port][size].sort(key=lambda x: x['date'])
            
    with open(json_path, mode='w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    convert_csv_to_json(r'C:\Users\yabuk\OneDrive\デスクトップ\Antigravity（鰹相場グラフ）\data\market_input.csv', 
                        r'C:\Users\yabuk\OneDrive\デスクトップ\Antigravity（鰹相場グラフ）\data\katsuo_market_data.json')
    print("Market data JSON has been rebuilt from market_input.csv successfully.")
