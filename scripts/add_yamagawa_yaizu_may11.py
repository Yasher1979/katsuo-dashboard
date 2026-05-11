import sys
import os

sys.path.insert(0, os.path.dirname(__file__))
from update_data import add_market_data, add_bid_schedule, bump_version

def main():
    print("=== 山川 2026-05-11 18 宮丸 ===")
    date_yamagawa = "2026-05-11"
    port_yamagawa = "山川"
    vessel_yamagawa = "18宮丸"
    
    # 6上: 10 t, 288.0
    add_market_data(port_yamagawa, "6.0kg上", date_yamagawa, 288.0, 10.0, vessel_yamagawa)
    # 4.5上: 30 t, 293.87
    add_market_data(port_yamagawa, "4.5kg上", date_yamagawa, 293.87, 30.0, vessel_yamagawa)
    # 2.5上: 240 t, 294.85
    add_market_data(port_yamagawa, "2.5kg上", date_yamagawa, 294.85, 240.0, vessel_yamagawa)
    # 1.8上: 70 t, 290.30
    add_market_data(port_yamagawa, "1.8kg上", date_yamagawa, 290.30, 70.0, vessel_yamagawa)
    # 1.8下: 10 t, 295.00
    add_market_data(port_yamagawa, "1.8kg下", date_yamagawa, 295.00, 10.0, vessel_yamagawa)
    
    # market_input.csv への追記 (山川)
    csv_path = os.path.join(os.path.dirname(__file__), '..', 'data', 'market_input.csv')
    new_csv_rows = [
        f"{date_yamagawa},{port_yamagawa},6.0kg上,288.0,10.0,{vessel_yamagawa}\n",
        f"{date_yamagawa},{port_yamagawa},4.5kg上,293.87,30.0,{vessel_yamagawa}\n",
        f"{date_yamagawa},{port_yamagawa},2.5kg上,294.85,240.0,{vessel_yamagawa}\n",
        f"{date_yamagawa},{port_yamagawa},1.8kg上,290.30,70.0,{vessel_yamagawa}\n",
        f"{date_yamagawa},{port_yamagawa},1.8kg下,295.00,10.0,{vessel_yamagawa}\n"
    ]
    with open(csv_path, 'a', encoding='utf-8') as f:
        f.writelines(new_csv_rows)
    print(f"✓ 山川のデータを {csv_path} に追加しました。")

    yamagawa_items = [
        { "category": "カツオ", "size": "6.0kg上", "type": "入札", "volume": 10.0 },
        { "category": "カツオ", "size": "4.5kg上", "type": "入札", "volume": 30.0 },
        { "category": "カツオ", "size": "2.5kg上", "type": "入札", "volume": 240.0 },
        { "category": "カツオ", "size": "1.8kg上", "type": "入札", "volume": 70.0 },
        { "category": "カツオ", "size": "1.8kg下", "type": "入札", "volume": 10.0 },
        { "category": "キメジ", "size": "3.0kg下", "type": "入札", "volume": 15.0 },
        { "category": "キメジ", "size": "1.5kg下", "type": "入札", "volume": 10.0 }
    ]

    print("=== 焼津 2026-05-09 78 光洋丸 ===")
    date_yaizu = "2026-05-09"
    port_yaizu = "焼津"
    vessel_yaizu = "78光洋丸"
    
    # 海旋
    add_market_data(port_yaizu, "4.5kg上", date_yaizu, 285.0, 80.0, vessel_yaizu)
    add_market_data(port_yaizu, "2.5kg上", date_yaizu, 288.0, 300.0, vessel_yaizu)
    add_market_data(port_yaizu, "1.8kg上", date_yaizu, 286.0, 50.0, vessel_yaizu)
    add_market_data(port_yaizu, "1.8kg下", date_yaizu, 285.0, 10.0, vessel_yaizu)
    
    # 一本釣
    add_market_data(port_yaizu, "7.0kg上", date_yaizu, 455.0, 50.0, vessel_yaizu)
    add_market_data(port_yaizu, "4.5kg上", date_yaizu, 452.5, 40.0, vessel_yaizu)
    add_market_data(port_yaizu, "2.5kg上", date_yaizu, 430.0, 60.0, vessel_yaizu)
    add_market_data(port_yaizu, "1.5kg上", date_yaizu, 415.0, 10.0, vessel_yaizu)
    
    new_csv_rows_yaizu = [
        f"{date_yaizu},{port_yaizu},4.5kg上,285.0,80.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},2.5kg上,288.0,300.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},1.8kg上,286.0,50.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},1.8kg下,285.0,10.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},7.0kg上,455.0,50.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},4.5kg上,452.5,40.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},2.5kg上,430.0,60.0,{vessel_yaizu}\n",
        f"{date_yaizu},{port_yaizu},1.5kg上,415.0,10.0,{vessel_yaizu}\n"
    ]
    with open(csv_path, 'a', encoding='utf-8') as f:
        f.writelines(new_csv_rows_yaizu)
    print(f"✓ 焼津のデータを {csv_path} に追加しました。")

    yaizu_items = [
      { "category": "旋網", "size": "4.5kg上", "type": "入札", "volume": 80.0 },
      { "category": "旋網", "size": "2.5kg上", "type": "入札", "volume": 300.0 },
      { "category": "旋網", "size": "1.8kg上", "type": "入札", "volume": 50.0 },
      { "category": "旋網", "size": "1.8kg下", "type": "入札", "volume": 10.0 },
      { "category": "一本釣", "size": "7.0kg上", "type": "入札", "volume": 50.0 },
      { "category": "一本釣", "size": "4.5kg上", "type": "入札", "volume": 40.0 },
      { "category": "一本釣", "size": "2.5kg上", "type": "入札", "volume": 60.0 },
      { "category": "一本釣", "size": "1.5kg上", "type": "入札", "volume": 10.0 }
    ]

    # 追加順序：新しいものが先頭になるようにするため、焼津→山川の順に追加する (山川が5/11で新しい)
    add_bid_schedule("20260509_koyomaru78", "78 光洋丸", "2026-05-09", "2026-05-09", 600.0, "焼津", yaizu_items, "南方", "")
    add_bid_schedule("20260511_miyamaru18", "18 宮丸", "2026-05-11", "2026-05-11", 385.0, "山川", yamagawa_items, "", "")

    print("=== バージョンバンプ ===")
    bump_version()
    print("完了しました。")

if __name__ == "__main__":
    main()
