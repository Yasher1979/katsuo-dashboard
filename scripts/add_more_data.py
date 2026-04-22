import csv

def add_additional_market_data():
    file_path = 'data/market_input.csv'
    new_rows = [
        # 4月11日 焼津 (永盛丸)
        ['2026-04-11', '焼津', '4.5kg上', '342.5', '60.0', '永盛丸'],
        ['2026-04-11', '焼津', '2.5kg上', '337.5', '390.0', '永盛丸'],
        ['2026-04-11', '焼津', '1.8kg上', '345.0', '40.0', '永盛丸'],
        ['2026-04-11', '焼津', '1.8kg下', '335.0', '10.0', '永盛丸'],
        # 4月13日 山川 (88明豊丸)
        ['2026-04-13', '山川', '6.0kg上', '326.0', '10.0', '88明豊丸'],
        ['2026-04-13', '山川', '4.5kg上', '345.1', '40.0', '88明豊丸'],
        ['2026-04-13', '山川', '2.5kg上', '341.8', '300.0', '88明豊丸'],
        ['2026-04-13', '山川', '1.8kg上', '337.6', '40.0', '88明豊丸'],
        ['2026-04-13', '山川', '1.8kg下', '341.0', '10.0', '88明豊丸']
    ]
    
    rows = []
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = list(csv.reader(f))
        header = reader[0]
        rows = reader[1:]

    # 重複を避けつつ追加
    existing_keys = set(tuple(r[:3] + [r[5]]) for r in rows)
    added_count = 0
    for nr in new_rows:
        key = tuple(nr[:3] + [nr[5]])
        if key not in existing_keys:
            rows.append(nr)
            added_count += 1
            
    # 日付順にソート
    rows.sort(key=lambda x: x[0])

    with open(file_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(rows)
        
    print(f"Added {added_count} new records for Yaizu (4/11) and Yamagawa (4/13).")

if __name__ == "__main__":
    add_additional_market_data()
