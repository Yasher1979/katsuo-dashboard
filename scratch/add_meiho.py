import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))

from update_data import add_bid_schedule, bump_version

items = [
    {"category": "B カツオ", "size": "8.0kg上", "type": "入札", "volume": 0.0},
    {"category": "B カツオ", "size": "6.0kg上", "type": "入札", "volume": 10.0},
    {"category": "B カツオ", "size": "4.5kg上", "type": "入札", "volume": 50.0},
    {"category": "B カツオ", "size": "2.5kg上", "type": "入札", "volume": 120.0},
    {"category": "B カツオ", "size": "1.8kg上", "type": "入札", "volume": 80.0},
    {"category": "B カツオ", "size": "1.8kg下", "type": "入札", "volume": 20.0},
    
    {"category": "PS カツオ", "size": "7.0kg上", "type": "相対", "volume": 0.0},
    {"category": "PS カツオ", "size": "4.5kg上", "type": "相対", "volume": 18.0},
    {"category": "PS カツオ", "size": "2.5kg上", "type": "相対", "volume": 33.0},
    {"category": "PS カツオ", "size": "1.8kg上", "type": "相対", "volume": 17.0},
    {"category": "PS カツオ", "size": "1.8kg下", "type": "相対", "volume": 0.0},
    
    {"category": "キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 74.0},
    {"category": "キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 111.0},
    {"category": "キワ・キメ", "size": "1.5kg上", "type": "入札", "volume": 11.0},
    {"category": "キワ・キメ", "size": "1.5kg下ダル混", "type": "入札", "volume": 5.0},
    
    {"category": "PS キワ・キメ", "size": "10.0kg上", "type": "相対", "volume": 96.0},
    {"category": "PS キワ・キメ", "size": "5.0-3.0kg上", "type": "相対", "volume": 63.0},
    {"category": "PS キワ・キメ", "size": "1.5kg上", "type": "相対", "volume": 2.0},
    {"category": "PS キワ・キメ", "size": "1.5kg下ダル混", "type": "相対", "volume": 0.0},
    
    {"category": "ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 0.0},
    {"category": "ダルマ", "size": "1.5kg上", "type": "入札", "volume": 0.0},
    
    {"category": "PS ダルマ", "size": "10.0-3.0kg上", "type": "相対", "volume": 0.0},
    {"category": "PS ダルマ", "size": "1.5kg上", "type": "相対", "volume": 0.0}
]

add_bid_schedule(
    id="20260522_meihomaru88",
    vessel_name="88 明豊丸",
    bid_date="2026-05-22",
    delivery_date="2026-05-22",
    tonnage=710.0,
    port="枕崎",
    lat="N 00°24' 〜 N 01°50'",
    lon="E 154°11' 〜 E 148°10'",
    items=items
)

bump_version()
print("88 明豊丸 bidding schedule added successfully.")
