import sys
import os
import json

# scripts ディレクトリのモジュールをインポートできるようにパスを通す
sys.path.insert(0, os.path.dirname(__file__))
from update_data import add_market_data, add_bid_schedule, bump_version

def main():
    print("=== 焼津 2026-05-19 最新相場データ追加 ===")
    
    date_str = "2026-05-19"
    port_yaizu = "焼津"
    
    # 1. 海旋船「5わかば丸」のデータを追加 (ダッシュボードのグラフ・価格用)
    vessel_wakaba = "5わかば丸"
    
    # サイズと単価・水揚量（相場が範囲の場合は平均値を算出）
    # 4.5kg上: 290 〜 285 円 (平均 287.5 円), 20 t
    # 2.5kg上: 300 〜 円 (300.0 円), 80 t
    # 1.8kg上: 297 〜 円 (297.0 円), 10 t
    # 1.8kg下: 290 〜 円 (290.0 円), 10 t
    
    add_market_data(port_yaizu, "4.5kg上", date_str, 287.5, 20.0, vessel_wakaba)
    add_market_data(port_yaizu, "2.5kg上", date_str, 300.0, 80.0, vessel_wakaba)
    add_market_data(port_yaizu, "1.8kg上", date_str, 297.0, 10.0, vessel_wakaba)
    add_market_data(port_yaizu, "1.8kg下", date_str, 290.0, 10.0, vessel_wakaba)
    
    # 2. market_input.csv への追記 (5わかば丸)
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'market_input.csv')
    new_csv_rows = [
        f"{date_str},{port_yaizu},4.5kg上,287.5,20.0,{vessel_wakaba}\n",
        f"{date_str},{port_yaizu},2.5kg上,300.0,80.0,{vessel_wakaba}\n",
        f"{date_str},{port_yaizu},1.8kg上,297.0,10.0,{vessel_wakaba}\n",
        f"{date_str},{port_yaizu},1.8kg下,290.0,10.0,{vessel_wakaba}\n"
    ]
    
    with open(csv_path, 'a', encoding='utf-8') as f:
        f.writelines(new_csv_rows)
    print("OK: Added 5わかば丸 data to market_input.csv.")
    
    # 3. 入札予定（水揚情報）への追加 (5わかば丸 & 8永盛丸)
    wakaba_items = [
        { "category": "旋網", "size": "4.5kg上", "type": "入札", "volume": 20.0 },
        { "category": "旋網", "size": "2.5kg上", "type": "入札", "volume": 80.0 },
        { "category": "旋網", "size": "1.8kg上", "type": "入札", "volume": 10.0 },
        { "category": "旋網", "size": "1.8kg下", "type": "入札", "volume": 10.0 }
    ]
    
    eiseimaru_items = [
        { "category": "一本釣", "size": "7.0kg上", "type": "入札", "volume": 140.0 },
        { "category": "一本釣", "size": "4.5kg上", "type": "入札", "volume": 90.0 },
        { "category": "一本釣", "size": "2.5kg上", "type": "入札", "volume": 35.0 },
        { "category": "一本釣", "size": "1.5kg上", "type": "入札", "volume": 20.0 }
    ]
    
    # bid_schedule.json への反映 (日付が同じなのでどちらを先にしても良いが、順に追加)
    # add_bid_schedule 内部で insert(0) されるため、8永盛丸 → 5わかば丸 の順で追加すると、5わかば丸が一番上になります
    add_bid_schedule("20260519_eiseimaru8", "8 永盛丸", date_str, date_str, 285.0, port_yaizu, eiseimaru_items, "南方", "")
    add_bid_schedule("20260519_wakabamaru5", "5 わかば丸", date_str, date_str, 120.0, port_yaizu, wakaba_items, "南方", "")
    
    print("OK: Added 5わかば丸 & 8永盛丸 to bid_schedule.json.")
    
    # 4. バージョンバンプ
    bump_version()
    print("OK: Bumped version.")
    
    print("\n=== Finished data addition ===")

if __name__ == "__main__":
    main()
