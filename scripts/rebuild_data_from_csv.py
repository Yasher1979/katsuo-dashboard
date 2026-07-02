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
            
            # 価格または数量が空の場合はスキップ
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
    
    # 日付順にソート
    for port in data:
        for size in data[port]:
            data[port][size].sort(key=lambda x: x['date'])
            
    with open(json_path, mode='w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    import os
    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(ROOT, 'data', 'market_input.csv')
    json_path = os.path.join(ROOT, 'data', 'katsuo_market_data.json')
    convert_csv_to_json(csv_path, json_path)
    print("Market data JSON has been rebuilt from market_input.csv successfully.")
