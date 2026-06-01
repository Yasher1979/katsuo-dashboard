import sys
import os
import csv

sys.path.insert(0, os.path.dirname(__file__))
from update_data import add_market_data, add_bid_schedule, bump_version

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'market_input.csv')

def safe_append_csv(rows):
    """CSVに重複チェックしながら追加"""
    existing = set()
    all_rows = []
    with open(CSV_PATH, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            key = (row[0], row[1], row[2], row[5] if len(row) > 5 else '')
            existing.add(key)
            all_rows.append(row)

    added = 0
    for row in rows:
        key = (row[0], row[1], row[2], row[5] if len(row) > 5 else '')
        if key not in existing:
            all_rows.append(row)
            existing.add(key)
            added += 1

    all_rows.sort(key=lambda x: x[0])
    with open(CSV_PATH, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(header)
        writer.writerows(all_rows)
    print(f"  CSV: {added} 件追加")
    return added

def main():
    print("=" * 60)
    print("一括データ追加: 枕崎 5/7, 5/11, 5/20, 5/22 / 山川 5/18")
    print("=" * 60)

    # ── 1. 枕崎 2026-05-07 (11 わかば丸) ──────────────────────────
    print("\n[1] 枕崎 2026-05-07  11わかば丸")
    d, p, v = "2026-05-07", "枕崎", "11わかば丸"
    rows = [
        [d, p, "6.0kg上",    "301.0",   "3.0",   v],
        [d, p, "4.5kg上",    "320.0",  "15.0",   v],
        [d, p, "2.5kg上",    "303.0", "250.0",   v],
        [d, p, "1.8kg上",    "303.0", "140.0",   v],
        [d, p, "1.8kg下",    "301.3",  "10.0",   v],
        [d, p, "B品2.5kg上", "288.1",   "0.0",   v],
        [d, p, "B品2.5kg下", "286.0",   "0.0",   v],
        [d, p, "1.5kg上",    "296.0",   "1.0",   v],
        [d, p, "1.5kg下ダル混", "205.1","1.0",   v],
        [d, p, "大キズ",     "210.0",   "0.0",   v],
        [d, p, "キメジキス", "205.0",   "0.0",   v],
    ]
    safe_append_csv(rows)
    for size, price, vol in [
        ("6.0kg上", 301.0, 3.0), ("4.5kg上", 320.0, 15.0),
        ("2.5kg上", 303.0, 250.0), ("1.8kg上", 303.0, 140.0),
        ("1.8kg下", 301.3, 10.0), ("B品2.5kg上", 288.1, 0.0),
        ("B品2.5kg下", 286.0, 0.0), ("1.5kg上", 296.0, 1.0),
        ("1.5kg下ダル混", 205.1, 1.0), ("大キズ", 210.0, 0.0),
        ("キメジキス", 205.0, 0.0),
    ]:
        add_market_data(p, size, d, price, vol, v)

    add_bid_schedule(
        "20260507_wakabamaru11", "11 わかば丸", d, d, 420.0, p,
        [
            {"category": "B カツオ", "size": "6.0kg上",    "type": "入札", "volume": 3.0},
            {"category": "B カツオ", "size": "4.5kg上",    "type": "入札", "volume": 15.0},
            {"category": "B カツオ", "size": "2.5kg上",    "type": "入札", "volume": 250.0},
            {"category": "B カツオ", "size": "1.8kg上",    "type": "入札", "volume": 140.0},
            {"category": "B カツオ", "size": "1.8kg下",    "type": "入札", "volume": 10.0},
            {"category": "キワ・キメ", "size": "1.5kg上",  "type": "入札", "volume": 1.0},
            {"category": "キワ・キメ", "size": "1.5kg下ダル混","type":"入札","volume": 1.0},
        ],
        "南方", ""
    )
    print("  ✓ 枕崎 5/7 完了")

    # ── 2. 枕崎 2026-05-11 (88 福一丸) ─────────────────────────────
    print("\n[2] 枕崎 2026-05-11  88福一丸")
    d, p, v = "2026-05-11", "枕崎", "88福一丸"
    rows = [
        [d, p, "6.0kg上",    "303.1",   "3.0",   v],
        [d, p, "4.5kg上",    "320.1",  "10.0",   v],
        [d, p, "2.5kg上",    "293.0", "260.0",   v],
        [d, p, "1.8kg上",    "285.1", "170.0",   v],
        [d, p, "1.8kg下",    "286.3",  "10.0",   v],
        [d, p, "B品2.5kg上", "277.9",   "0.0",   v],
        [d, p, "B品2.5kg下", "275.1",   "0.0",   v],
        [d, p, "1.5kg上",    "300.0",   "5.0",   v],
        [d, p, "1.5kg下ダル混", "200.5","2.0",   v],
        [d, p, "大キズ",     "214.0",   "0.0",   v],
        [d, p, "キメジキス", "201.1",   "0.0",   v],
    ]
    safe_append_csv(rows)
    for size, price, vol in [
        ("6.0kg上", 303.1, 3.0), ("4.5kg上", 320.1, 10.0),
        ("2.5kg上", 293.0, 260.0), ("1.8kg上", 285.1, 170.0),
        ("1.8kg下", 286.3, 10.0), ("B品2.5kg上", 277.9, 0.0),
        ("B品2.5kg下", 275.1, 0.0), ("1.5kg上", 300.0, 5.0),
        ("1.5kg下ダル混", 200.5, 2.0), ("大キズ", 214.0, 0.0),
        ("キメジキス", 201.1, 0.0),
    ]:
        add_market_data(p, size, d, price, vol, v)

    add_bid_schedule(
        "20260511_fukuichimaru88", "88 福一丸", d, d, 460.0, p,
        [
            {"category": "B カツオ", "size": "6.0kg上",    "type": "入札", "volume": 3.0},
            {"category": "B カツオ", "size": "4.5kg上",    "type": "入札", "volume": 10.0},
            {"category": "B カツオ", "size": "2.5kg上",    "type": "入札", "volume": 260.0},
            {"category": "B カツオ", "size": "1.8kg上",    "type": "入札", "volume": 170.0},
            {"category": "B カツオ", "size": "1.8kg下",    "type": "入札", "volume": 10.0},
            {"category": "キワ・キメ", "size": "1.5kg上",  "type": "入札", "volume": 5.0},
            {"category": "キワ・キメ", "size": "1.5kg下ダル混","type":"入札","volume": 2.0},
        ],
        "南方", ""
    )
    print("  ✓ 枕崎 5/11 完了")

    # ── 3. 山川 2026-05-18 (永盛丸) ─────────────────────────────────
    print("\n[3] 山川 2026-05-18  永盛丸  365t")
    d, p, v = "2026-05-18", "山川", "永盛丸"
    rows = [
        [d, p, "6.0kg上",      "290.2",   "5.0",   v],
        [d, p, "4.5kg上",      "315.0",  "20.0",   v],
        [d, p, "2.5kg上",      "310.0", "250.0",   v],
        [d, p, "1.8kg上",      "320.3",  "60.0",   v],
        [d, p, "1.8kg下",      "310.0",  "10.0",   v],
        [d, p, "2.5kg上変形",  "298.8",   "0.0",   v],
        [d, p, "2.5kg下変形",  "295.0",   "0.0",   v],
        [d, p, "キメジ3.0kg下","300.0",  "15.0",   v],
        [d, p, "キメジ1.5kg下","215.0",   "5.0",   v],
    ]
    safe_append_csv(rows)
    for size, price, vol in [
        ("6.0kg上", 290.2, 5.0), ("4.5kg上", 315.0, 20.0),
        ("2.5kg上", 310.0, 250.0), ("1.8kg上", 320.3, 60.0),
        ("1.8kg下", 310.0, 10.0), ("2.5kg上変形", 298.8, 0.0),
        ("2.5kg下変形", 295.0, 0.0), ("キメジ3.0kg下", 300.0, 15.0),
        ("キメジ1.5kg下", 215.0, 5.0),
    ]:
        add_market_data(p, size, d, price, vol, v)

    add_bid_schedule(
        "20260518_eiseimaru", "永盛丸", d, d, 365.0, p,
        [
            {"category": "カツオ", "size": "6.0kg上",     "type": "入札", "volume": 5.0},
            {"category": "カツオ", "size": "4.5kg上",     "type": "入札", "volume": 20.0},
            {"category": "カツオ", "size": "2.5kg上",     "type": "入札", "volume": 250.0},
            {"category": "カツオ", "size": "1.8kg上",     "type": "入札", "volume": 60.0},
            {"category": "カツオ", "size": "1.8kg下",     "type": "入札", "volume": 10.0},
            {"category": "キメジ", "size": "3.0kg下",     "type": "入札", "volume": 15.0},
            {"category": "キメジ", "size": "1.5kg下",     "type": "入札", "volume": 5.0},
        ],
        "", ""
    )
    print("  ✓ 山川 5/18 完了")

    # ── 4. 枕崎 2026-05-20 (6 わかば丸) ─────────────────────────────
    print("\n[4] 枕崎 2026-05-20  6わかば丸")
    d, p, v = "2026-05-20", "枕崎", "6わかば丸"
    rows = [
        [d, p, "6.0kg上",    "309.0",   "2.0",   v],
        [d, p, "4.5kg上",    "325.1",  "10.0",   v],
        [d, p, "2.5kg上",    "326.0", "160.0",   v],
        [d, p, "1.8kg上",    "323.0", "140.0",   v],
        [d, p, "1.8kg下",    "324.0",  "10.0",   v],
        [d, p, "B品2.5kg上", "317.1",   "0.0",   v],
        [d, p, "B品2.5kg下", "314.2",   "0.0",   v],
        [d, p, "1.5kg上",    "307.2",   "3.0",   v],
        [d, p, "1.5kg下ダル混", "215.1","2.0",   v],
        [d, p, "大キズ",     "237.0",   "0.0",   v],
        [d, p, "キメジキス", "203.1",   "0.0",   v],
    ]
    safe_append_csv(rows)
    for size, price, vol in [
        ("6.0kg上", 309.0, 2.0), ("4.5kg上", 325.1, 10.0),
        ("2.5kg上", 326.0, 160.0), ("1.8kg上", 323.0, 140.0),
        ("1.8kg下", 324.0, 10.0), ("B品2.5kg上", 317.1, 0.0),
        ("B品2.5kg下", 314.2, 0.0), ("1.5kg上", 307.2, 3.0),
        ("1.5kg下ダル混", 215.1, 2.0), ("大キズ", 237.0, 0.0),
        ("キメジキス", 203.1, 0.0),
    ]:
        add_market_data(p, size, d, price, vol, v)

    add_bid_schedule(
        "20260520_wakabamaru6_mak", "6 わかば丸 (枕崎)", d, d, 320.0, p,
        [
            {"category": "B カツオ", "size": "6.0kg上",    "type": "入札", "volume": 2.0},
            {"category": "B カツオ", "size": "4.5kg上",    "type": "入札", "volume": 10.0},
            {"category": "B カツオ", "size": "2.5kg上",    "type": "入札", "volume": 160.0},
            {"category": "B カツオ", "size": "1.8kg上",    "type": "入札", "volume": 140.0},
            {"category": "B カツオ", "size": "1.8kg下",    "type": "入札", "volume": 10.0},
            {"category": "キワ・キメ", "size": "1.5kg上",  "type": "入札", "volume": 3.0},
            {"category": "キワ・キメ", "size": "1.5kg下ダル混","type":"入札","volume": 2.0},
        ],
        "南方", ""
    )
    print("  ✓ 枕崎 5/20 完了")

    # ── 5. 枕崎 2026-05-22 (88 明豊丸) ─────────────────────────────
    # 読み取り:
    #  B欄: 10上:-, 8上:-, 6上:-, 4.5上:10t@348.8, 2.5上:100t@345.0, 1.8上:50t@350.0, 0.5:20t@338.3
    #       B品2.5上:326.1, B品2.5下:320.0
    # キワ/キメ: 1.5上:1t@310.0, 1.5下ダル混:5t@220.0
    # 大キズ: 225.1, キメジキス: 210.0
    print("\n[5] 枕崎 2026-05-22  88明豊丸 (今日の最新)")
    d, p, v = "2026-05-22", "枕崎", "88明豊丸"
    rows = [
        [d, p, "4.5kg上",    "348.8",  "10.0",   v],
        [d, p, "2.5kg上",    "345.0", "100.0",   v],
        [d, p, "1.8kg上",    "350.0",  "50.0",   v],
        [d, p, "0.5kg",      "338.3",  "20.0",   v],
        [d, p, "B品2.5kg上", "326.1",   "0.0",   v],
        [d, p, "B品2.5kg下", "320.0",   "0.0",   v],
        [d, p, "1.5kg上",    "310.0",   "1.0",   v],
        [d, p, "1.5kg下ダル混","220.0", "5.0",   v],
        [d, p, "大キズ",     "225.1",   "0.0",   v],
        [d, p, "キメジキス", "210.0",   "0.0",   v],
    ]
    safe_append_csv(rows)
    for size, price, vol in [
        ("4.5kg上", 348.8, 10.0), ("2.5kg上", 345.0, 100.0),
        ("1.8kg上", 350.0, 50.0), ("0.5kg", 338.3, 20.0),
        ("B品2.5kg上", 326.1, 0.0), ("B品2.5kg下", 320.0, 0.0),
        ("1.5kg上", 310.0, 1.0), ("1.5kg下ダル混", 220.0, 5.0),
        ("大キズ", 225.1, 0.0), ("キメジキス", 210.0, 0.0),
    ]:
        add_market_data(p, size, d, price, vol, v)

    add_bid_schedule(
        "20260522_meihomaru88_new", "88 明豊丸", d, d, 186.0, p,
        [
            {"category": "B カツオ", "size": "4.5kg上",    "type": "入札", "volume": 10.0},
            {"category": "B カツオ", "size": "2.5kg上",    "type": "入札", "volume": 100.0},
            {"category": "B カツオ", "size": "1.8kg上",    "type": "入札", "volume": 50.0},
            {"category": "B カツオ", "size": "0.5kg",      "type": "入札", "volume": 20.0},
            {"category": "キワ・キメ", "size": "1.5kg上",  "type": "入札", "volume": 1.0},
            {"category": "キワ・キメ", "size": "1.5kg下ダル混","type":"入札","volume": 5.0},
        ],
        "南方", ""
    )
    print("  ✓ 枕崎 5/22 完了 (最新)")

    # ── バージョンバンプ ─────────────────────────────────────────
    print("\n[6] バージョンバンプ")
    bump_version()

    print("\n" + "=" * 60)
    print("✅ 全データ追加完了！")
    print("=" * 60)

if __name__ == "__main__":
    main()
