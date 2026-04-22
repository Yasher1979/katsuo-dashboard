import json
import csv

def json_to_csv_rows(json_path):
    with open(json_path, 'r', encoding='utf-8') as f:
        # 制御文字などのゴミを掃除してからロード
        content = f.read().replace('\r\n', '\n').replace('\r', '\n')
        data = json.loads(content)
    
    rows = []
    for port, sizes in data.items():
        for size, entries in sizes.items():
            for entry in entries:
                rows.append({
                    'date': entry['date'],
                    'port': port,
                    'size': size,
                    'price': entry['price'],
                    'volume': entry['volume'],
                    'vessel': entry.get('vessel', '')
                })
    return rows

if __name__ == "__main__":
    # 救出した3月末のJSONから全行を抽出
    recovered_rows = json_to_csv_rows('data/katsuo_market_data_recovered_utf8.json')
    
    # 現在のCSV（4月分入り）を読み込み
    current_rows = []
    with open('data/market_input.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        current_rows = list(reader)
        
    # 合体（日付、港、サイズ、船名で重複排除）
    all_rows = {}
    for r in recovered_rows + current_rows:
        key = (r['date'], r['port'], r['size'], r.get('vessel', ''))
        all_rows[key] = r
        
    # 日付順にソート
    sorted_rows = sorted(all_rows.values(), key=lambda x: x['date'])
    
    # 書き出し
    fieldnames = ['date', 'port', 'size', 'price', 'volume', 'vessel']
    with open('data/market_input.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in sorted_rows:
            # 必要なカラムのみ抽出
            filtered = {k: r.get(k, '') for k in fieldnames}
            writer.writerow(filtered)
            
    print(f"Total rows after recovery: {len(sorted_rows)}")
