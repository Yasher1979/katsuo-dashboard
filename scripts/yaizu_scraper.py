import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import re
from datetime import datetime

def scrape_yaizu_current():
    url = "https://www.yaizu-gyokyo.or.jp/itiba/msinfo/"
    print(f"Fetching {url}...")
    
    try:
        response = requests.get(url, timeout=10)
        response.encoding = 'utf-8'
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. 日付を取得
        date_str = ""
        # ページ内の「2026/02/13相場情報」といったテキストを探す
        content_text = soup.get_text()
        date_match = re.search(r'(\d{4}/\d{2}/\d{2})', content_text)
        if date_match:
            date_str = date_match.group(1).replace('/', '-')
        else:
            date_str = datetime.now().strftime("%Y-%m-%d")

        data = []
        
        # 2. すべてのテーブルを走査してかつお情報を探す
        tables = soup.find_all('table')
        for table in tables:
            # テーブルの直前にある見出し（船名や魚種）を確認
            prev_node = table.find_parent().find_previous_sibling(['h3', 'h4', 'div'])
            context_text = prev_node.get_text() if prev_node else ""
            
            # 「旋網冷凍かつお」が含まれるか、テーブル内のテキストを確認
            table_text = table.get_text()
            if "旋網冷凍かつお" in context_text or "旋網冷凍かつお" in table_text:
                rows = table.find_all('tr')
                for row in rows:
                    cols = row.find_all('td')
                    if len(cols) >= 4:
                        size_raw = cols[0].text.strip()
                        high_price_raw = cols[1].text.strip()
                        low_price_raw = cols[2].text.strip()
                        volume_raw = cols[3].text.strip()
                        
                        # サイズ判定
                        size = ""
                        if "4.5" in size_raw: size = "4.5kg上"
                        elif "2.5" in size_raw: size = "2.5kg上"
                        elif "1.8" in size_raw: size = "1.8kg上"
                        
                        if size:
                            # 数値抽出 (数値以外を除去)
                            def to_float(s):
                                try:
                                    return float(re.sub(r'[^\d.]', '', s))
                                except:
                                    return 0.0
                            
                            p_high = to_float(high_price_raw)
                            p_low = to_float(low_price_raw)
                            vol = to_float(volume_raw)
                            
                            # 平均価格
                            avg_p = (p_high + p_low) / 2 if p_high > 0 and p_low > 0 else (p_high if p_high > 0 else p_low)
                            
                            if avg_p > 0:
                                data.append({
                                    "date": date_str,
                                    "port": "焼津",
                                    "size": size,
                                    "price": avg_p,
                                    "volume": vol
                                })
        
        # 重複削除 (複数船の情報がある場合は平均化または最新を採用)
        if data:
            df_temp = pd.DataFrame(data)
            # 同じ日付・拠点・サイズで平均をとる
            df_grouped = df_temp.groupby(['date', 'port', 'size']).agg({'price': 'mean', 'volume': 'sum'}).reset_index()
            return df_grouped.to_dict('records')
            
        return []
    except Exception as e:
        print(f"Error scraping Yaizu: {e}")
        return []

if __name__ == "__main__":
    yaizu_data = scrape_yaizu_current()
    if yaizu_data:
        print(f"Successfully scraped {len(yaizu_data)} entries.")
        csv_path = "data/market_input.csv"
        df_new = pd.DataFrame(yaizu_data)
        
        if os.path.exists(csv_path):
            df_old = pd.read_csv(csv_path)
            # 既存データと統合（同じ日のデータは最新で上書き）
            df_combined = pd.concat([df_old, df_new]).drop_duplicates(subset=['date', 'port', 'size'], keep='last')
            df_combined.to_csv(csv_path, index=False, encoding='utf-8')
            print(f"Updated {csv_path}")
        else:
            df_new.to_csv(csv_path, index=False, encoding='utf-8')
            print(f"Created {csv_path}")
    else:
        print("No valid data found.")
