import csv

def update_latest_data():
    file_path = 'data/market_input.csv'
    rows = []
    
    # 現在のデータを読み込み
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = list(csv.reader(f))
        header = reader[0]
        data_rows = reader[1:]

    # 4月16日の誤記修正 (1.8kg上 342.5 -> 1.8kg下 342.5)
    for row in data_rows:
        if row[0] == '2026-04-16' and row[1] == '焼津' and row[2] == '1.8kg上' and row[3] == '342.5':
            row[2] = '1.8kg下'
            print("Fixed 4/16 Yaizu 1.8kg size error.")
        rows.append(row)

    # 4月22日 焼津（昇喜丸）のデータを追加
    new_data = [
        ['2026-04-22', '焼津', '4.5kg上', '325.0', '40.0', '36昇喜丸'],
        ['2026-04-22', '焼津', '2.5kg上', '317.5', '390.0', '36昇喜丸'],
        ['2026-04-22', '焼津', '1.8kg上', '300.0', '40.0', '36昇喜丸'],
        ['2026-04-22', '焼津', '1.8kg下', '330.0', '10.0', '36昇喜丸']
    ]
    
    # 重複チェックしながら追加
    existing_keys = set(tuple(r[:3] + [r[5]]) for r in rows)
    added_count = 0
    for nd in new_data:
        key = tuple(nd[:3] + [nd[5]])
        if key not in existing_keys:
            rows.append(nd)
            added_count += 1
            
    # 日付順にソート
    rows.sort(key=lambda x: x[0])

    # 保存
    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
        
    print(f"Update complete: Added {added_count} new records for 4/22.")

if __name__ == "__main__":
    update_latest_data()
