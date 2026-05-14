import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from update_data import add_bid_schedule, bump_version

items = [
    {"category": "B カツオ", "size": "8.0kg上", "type": "入札", "volume": 0.0},
    {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 10.0},
    {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 40.0},
    {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 150.0},
    {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 120.0},
    {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 30.0},
    
    {"category": "PS カツオ", "size": "7.0kg上", "type": "相対", "volume": 0.0},
    {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 16.0},
    {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 56.0},
    {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 23.0},
    {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 0.0},
    
    {"category": "キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 4.0},
    {"category": "キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 80.0},
    {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 9.0},
    {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 4.0},
    
    {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 11.0},
    {"category": "PS キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 65.0},
    {"category": "PS キワ・キメ", "size": "1.5kg上", "type": "相対", "volume": 2.0},
    {"category": "PS キワ・キメ", "size": "1.5kg下ダル混", "type": "相対", "volume": 0.0},
    
    {"category": "ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 0.0},
    {"category": "ダルマ", "size": "1.5kg上", "type": "入札", "volume": 0.0},
    
    {"category": "PS ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 0.0},
    {"category": "PS ダルマ", "size": "1.5kg上", "type": "相対", "volume": 0.0}
]

add_bid_schedule(
    id="20260516_koyomaru55",
    vessel_name="55 岬洋丸",
    bid_date="2026-05-16",
    delivery_date="2026-05-16",
    tonnage=620.0,
    port="枕崎",
    lat="N 02°42' 〜 N 04°03'",
    lon="E 155°14' 〜 E 154°07'",
    items=items
)

bump_version()
print("Data addition complete.")
