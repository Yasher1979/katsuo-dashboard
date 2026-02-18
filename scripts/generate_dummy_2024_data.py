import json
import random
from datetime import datetime, timedelta

# 設定
START_DATE = datetime(2024, 1, 1)
END_DATE = datetime(2024, 12, 31)
OUTPUT_FILE = "data/katsuo_market_data_2024.json"

PORTS = ["枕崎", "焼津", "山川"]
SIZES = [
    "1.8kg下", "1.8kg上", "2.5kg上", "4.5kg上",
    "8.0kg", "6.0kg", "キメジ", "ダルマ", "変形"
]

# ベース価格と季節変動の設定 (擬似)
BASE_PRICES = {
    "枕崎": 230,
    "焼津": 240,
    "山川": 235
}

def generate_data():
    data = {port: {size: [] for size in SIZES} for port in PORTS}
    
    current_date = START_DATE
    
    # ランダムウォークの初期値設定
    current_prices = {
        port: {size: BASE_PRICES[port] + random.randint(-20, 20) for size in SIZES}
        for port in PORTS
    }

    while current_date <= END_DATE:
        date_str = current_date.strftime("%Y/%m/%d")
        
        # 日曜・祝日は市場休み（簡易的に日曜だけ除外）
        if current_date.weekday() == 6:
            current_date += timedelta(days=1)
            continue
            
        for port in PORTS:
            # 水揚げがあるかどうか（ランダム）
            if random.random() < 0.3: # 30%の確率で水揚げなし
                continue
                
            for size in SIZES:
                # 前日価格からの変動
                volatility = random.randint(-5, 5)
                
                # 季節変動（夏は安く、冬は高いなど）
                season_factor = 0
                month = current_date.month
                if month in [6, 7, 8]: # 夏
                    season_factor = -2
                elif month in [11, 12, 1, 2]: # 冬
                    season_factor = 2
                
                new_price = current_prices[port][size] + volatility + season_factor
                
                # 価格の上下限クリップ
                new_price = max(150, min(400, new_price))
                current_prices[port][size] = new_price
                
                # 水揚げ量 (ランダム)
                volume = 0
                if random.random() > 0.2: # 80%の確率で水揚げあり
                    volume = random.randint(10, 300)
                    if random.random() > 0.9: # たまに大漁
                        volume += random.randint(200, 500)
                
                # データ追加
                # 2025年のデータと比較しやすいよう、日付形式は合わせる
                # ただしこのデータは2024年のもの
                data[port][size].append({
                    "date": date_str,
                    "price": round(new_price, 1),
                    "volume": float(volume)
                })
        
        current_date += timedelta(days=1)

    return data

def main():
    print(f"Generating dummy data for 2024...")
    dummy_data = generate_data()
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(dummy_data, f, ensure_ascii=False, indent=4)
    
    print(f"Saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
