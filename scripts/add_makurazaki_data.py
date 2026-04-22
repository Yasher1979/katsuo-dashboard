import csv

def add_makurazaki_data():
    file_path = 'data/market_input.csv'
    new_rows = [
        # 4月1日分 (55岬洋丸)
        ['2026-04-01', '枕崎', '6.0kg上', '321.0', '3.0', '55岬洋丸'],
        ['2026-04-01', '枕崎', '4.5kg上', '341.0', '20.0', '55岬洋丸'],
        ['2026-04-01', '枕崎', '2.5kg上', '348.8', '140.0', '55岬洋丸'],
        ['2026-04-01', '枕崎', '1.8kg上', '353.3', '60.0', '55岬洋丸'],
        ['2026-04-01', '枕崎', '1.8kg下', '345.0', '10.0', '55岬洋丸'],
        # 4月11日分 (5わかば丸)
        ['2026-04-11', '枕崎', '6.0kg上', '331.0', '30.0', '5わかば丸'],
        ['2026-04-11', '枕崎', '4.5kg上', '351.0', '60.0', '5わかば丸'],
        ['2026-04-11', '枕崎', '2.5kg上', '342.0', '390.0', '5わかば丸'],
        ['2026-04-11', '枕崎', '1.8kg上', '343.7', '80.0', '5わかば丸'],
        ['2026-04-11', '枕崎', '1.8kg下', '340.0', '30.0', '5わかば丸']
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
        
    print(f"Added {added_count} new records for Makurazaki (4/1 and 4/11).")

if __name__ == "__main__":
    add_makurazaki_data()
