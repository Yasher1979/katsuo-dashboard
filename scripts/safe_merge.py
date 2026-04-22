import csv
import os

def safe_merge():
    fieldnames = ['date', 'port', 'size', 'price', 'volume', 'vessel']
    all_rows = {}
    
    files = ['data/market_input.csv', 'data/market_input_march_only.csv']
    
    for filename in files:
        if not os.path.exists(filename):
            continue
            
        with open(filename, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # 船名がない場合は空文字で補完する
                vessel = row.get('vessel', '')
                # 日付、港、サイズ、船名の組み合わせをキーにして重複を避ける
                key = (row['date'], row['port'], row['size'], vessel)
                
                # 行データを整理（必要な項目だけに絞る）
                clean_row = {
                    'date': row['date'],
                    'port': row['port'],
                    'size': row['size'],
                    'price': row['price'],
                    'volume': row['volume'],
                    'vessel': vessel
                }
                all_rows[key] = clean_row

    # 日付順に並び替え
    sorted_rows = sorted(all_rows.values(), key=lambda x: x['date'])

    # 最終的なファイルに書き出し
    with open('data/market_input_merged.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(sorted_rows)
        
    print(f"Merge complete: {len(sorted_rows)} records in total.")

if __name__ == "__main__":
    safe_merge()
