import csv

def update_and_add_final_data():
    file_path = 'data/market_input.csv'
    rows = []
    
    # 現在のデータを読み込み
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = list(csv.reader(f))
        header = reader[0]
        data_rows = reader[1:]

    # 1. 焼津 4/22 昇喜丸 4.5kg上 の修正 (325.0 -> 325.5)
    for row in data_rows:
        if row[0] == '2026-04-22' and row[1] == '焼津' and row[2] == '4.5kg上' and row[3] == '325.0':
            row[3] = '325.5'
            print("Corrected Yaizu 4/22 4.5kg+ price to 325.5.")

    # 2. 枕崎 4/22 岬洋丸 のデータ追加 (確定値)
    new_makurazaki = [
        ['2026-04-22', '枕崎', '6.0kg上', '334.8', '10.0', '7岬洋丸'],
        ['2026-04-22', '枕崎', '4.5kg上', '347.1', '40.0', '7岬洋丸'],
        ['2026-04-22', '枕崎', '2.5kg上', '342.0', '270.0', '7岬洋丸'],
        ['2026-04-22', '枕崎', '1.8kg上', '340.2', '80.0', '7岬洋丸'],
        ['2026-04-22', '枕崎', '1.8kg下', '340.0', '20.0', '7岬洋丸']
    ]

    # 重複チェックしながら追加
    existing_keys = set(tuple(r[:3] + [r[5]]) for r in data_rows)
    added_count = 0
    for nm in new_makurazaki:
        key = tuple(nm[:3] + [nm[5]])
        if key not in existing_keys:
            data_rows.append(nm)
            added_count += 1
            
    # 日付順にソート
    data_rows.sort(key=lambda x: x[0])

    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(data_rows)
        
    print(f"Update complete: Corrected Yaizu and added {added_count} records for Makurazaki.")

if __name__ == "__main__":
    update_and_add_final_data()
