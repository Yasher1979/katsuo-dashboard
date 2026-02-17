import os
import json
import pandas as pd
from datetime import datetime, timedelta
import random

class KatsuoDataFetcher:
    """
    鰹節原料（B巻網）の相場データを取得・管理するクラス
    """
    def __init__(self, data_dir="data"):
        self.data_dir = data_dir
        if not os.path.exists(data_dir):
            os.makedirs(data_dir)
            
        self.ports = ["焼津", "枕崎", "山川"]
        # 画像に基づいた全サイズリスト (かつお)
        self.sizes = [
            "10.0kg上", "8.0kg上", "6.0kg上", "4.5kg上", "2.5kg上", "1.8kg上", "1.8kg下", "0.5kg下",
            "B品2.5kg上", "B品2.5kg下", "PS", "1.5kg下"
        ]
        
    def generate_sample_data(self, years=5):
        """
        過去5年分のサンプルデータを生成する（プロトタイプ用）
        実際の運用時はJAFICや各漁協のデータソースに差し替える
        """
        data = []
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * years)
        
        current_date = start_date
        
        # 拠点ごとの基準価格（円/kg） - 画像データに基づき補完
        default_base = {
            "10.0kg上": 200, "8.0kg上": 205, "6.0kg上": 215, "4.5kg上": 240, 
            "2.5kg上": 245, "1.8kg上": 240, "1.8kg下": 235, "0.5kg下": 220,
            "B品2.5kg上": 210, "B品2.5kg下": 215, "PS": 180, "1.5kg下": 190
        }
        
        while current_date <= end_date:
            month = current_date.month
            season_factor = 1.0 + 0.1 * (abs(month - 7) / 6.0)
            
            for port in self.ports:
                for size in self.sizes:
                    base = default_base.get(size, 200)
                    # 拠点ごとの微調整
                    if port == "枕崎": base += 5
                    if port == "山川": base -= 5
                    
                    price = base * season_factor + random.uniform(-15, 15)
                    volume = random.uniform(5, 100)
                    
                    data.append({
                        "date": current_date.strftime("%Y-%m-%d"),
                        "port": port,
                        "size": size,
                        "price": round(price, 1),
                        "volume": round(volume, 1)
                    })
            
            current_date += timedelta(days=1)
            
        return pd.DataFrame(data)

    def load_from_csv(self):
        """
        data/market_input.csv から実データを読み込む
        """
        csv_path = os.path.join(self.data_dir, "market_input.csv")
        if os.path.exists(csv_path):
            try:
                # 日本語(cp932/shift_jis)が含まれる可能性を考慮し、encodingを指定
                df = pd.read_csv(csv_path, encoding='utf-8')
                print(f"Loaded real data from {csv_path}")
                return df
            except Exception as e:
                print(f"Error loading CSV: {e}")
                # utf-8で失敗した場合は、日本語環境で一般的な cp932 を試す
                try:
                    df = pd.read_csv(csv_path, encoding='cp932')
                    return df
                except:
                    return None
        return None

    def save_to_json(self, df):
        """
        データをJSON形式で保存（Web可視化用）
        """
        if df is None or len(df) == 0:
            print("No data to save.")
            return

        output = {}
        for port in self.ports:
            port_data = df[df['port'] == port]
            output[port] = {}
            # その拠点のデータに含まれるユニークなサイズを取得
            available_sizes = port_data['size'].unique()
            for size in available_sizes:
                size_data = port_data[port_data['size'] == size]
                # 日付順にソート
                size_data = size_data.sort_values('date')
                output[port][size] = size_data[['date', 'price', 'volume']].to_dict(orient='records')
                
        file_path = os.path.join(self.data_dir, "katsuo_market_data.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)
        print(f"Data saved to {file_path}")

if __name__ == "__main__":
    fetcher = KatsuoDataFetcher()
    
    # 1. CSVからの実データ読み込み
    print("Loading real data from CSV...")
    df_real = fetcher.load_from_csv()
    
    if df_real is not None and len(df_real) > 0:
        # データ型を調整
        df_real['price'] = df_real['price'].astype(float)
        df_real['volume'] = df_real['volume'].astype(float)
        
        # 安全策: 異常値フィルタリング（範囲を拡大：10円〜600円）
        df_real = df_real[(df_real['price'] < 600) & (df_real['price'] > 10)]
        
        # 日付でソートして時系列を保証
        df_real['date'] = pd.to_datetime(df_real['date'])
        df_real = df_real.sort_values(by=['date', 'port', 'size'])
        # JSONには文字列の日付が必要
        df_real['date'] = df_real['date'].dt.strftime('%Y-%m-%d')
        
        # JSON保存
        fetcher.save_to_json(df_real)
    else:
        print("No real data found in CSV. Please ensure data/market_input.csv exists.")
        
    print("Done.")
