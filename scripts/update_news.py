import os
import json
import feedparser
import google.generativeai as genai
import requests
from datetime import datetime
import time

# 設定: ニュース取得元 (RSSフィード)
RSS_FEEDS = [
    "https://www3.nhk.or.jp/rss/news/cat0.xml",  # NHK 主要ニュース
    "https://www3.nhk.or.jp/rss/news/cat5.xml",  # NHK 経済
    "https://prtimes.jp/main/html/searchrlp/ct1/000000057/rss.xml", # PR TIMES 食品・飲料
]

def check_url_active(url):
    """URLが有効か（404等でないか）を確認する"""
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def summarize_with_strict_ai(title, description):
    """
    AIに『要約のみ』を依頼し、捏造を厳禁する
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "要約不可（APIキー未設定）"

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    prompt = f"""
あなたはプロの水産業界アナリストです。
提供されたニュースの【タイトル】と【内容】に基づき、水産・カツオ相場・物流の観点から「専門的な要約」を1つだけ作成してください。

【厳守事項】
1. 元の文章にない「具体的な数値」「日付」「人名」などを絶対に勝手に捏造・補足しないでください。
2. 専門用語（漁況、相場、物流2024年問題など）を適切に使用してください。
3. 日本語で100文字程度で簡潔にまとめてください。

【タイトル】: {title}
【内容】: {description}

要約文のみを出力してください。
"""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"AI Summarization Error: {e}")
        return "要約の生成に失敗しました。"

def main():
    print("Fetching news from RSS...")
    entries = []
    for url in RSS_FEEDS:
        feed = feedparser.parse(url)
        entries.extend(feed.entries)
    
    # キーワードフィルタリング（カツオ、水産、物流、食品など）
    keywords = ["カツオ", "かつお", "漁", "水産", "相場", "物流", "食品", "だし", "出汁", "魚"]
    relevant_items = []
    
    for entry in entries:
        title = entry.get('title', '')
        summary_text = entry.get('summary', '') or entry.get('description', '')
        
        # タイトルか本文にキーワードが含まれているか
        if any(kw in title or kw in summary_text for kw in keywords):
            # 重複回避用の簡易ID
            relevant_items.append({
                "id": "rss_" + entry.link.split('/')[-1].replace('.', '_'),
                "date": datetime.now().strftime("%Y-%m-%d"),
                "title": title, # タイトルは原本をそのまま使用
                "source": "RSS Feed",
                "url": entry.link, # URLも原本をそのまま使用
                "description": summary_text
            })

    # 最新の5件に絞って要約を生成
    new_results = []
    print(f"Processing {min(len(relevant_items), 5)} relevant items...")
    
    for item in relevant_items[:5]:
        if not check_url_active(item['url']):
            print(f"Skipping broken link: {item['url']}")
            continue
            
        print(f"Summarizing: {item['title']}")
        # カテゴリ判定（簡易）
        category = "市場"
        if any(kw in item['title'] for kw in ["漁", "不漁", "豊漁", "水揚げ"]): category = "漁況"
        elif any(kw in item['title'] for kw in ["燃料", "油"]): category = "燃費油"
        elif any(kw in item['title'] for kw in ["物流", "2024"]): category = "物流"
        elif any(kw in item['title'] for kw in ["新商品", "発売", "開発"]): category = "新商品"
        
        summary = summarize_with_strict_ai(item['title'], item['description'])
        
        new_results.append({
            "id": item['id'],
            "date": item['date'],
            "title": item['title'],
            "source": item['source'],
            "url": item['url'],
            "category": category,
            "summary": summary
        })
        time.sleep(1) # Rate limit避剤

    # 既存データの読み込みとマージ
    data_path = "data/katsuo_news.json"
    existing_data = []
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            existing_data = json.load(f)

    # リンク切れチェック（既存データからも404を除去）
    print("Checking existing links...")
    valid_existing = [d for d in existing_data if check_url_active(d['url'])]
    
    # マージ（ID重複排除）
    existing_ids = {d['id'] for d in new_results}
    combined = new_results + [d for d in valid_existing if d['id'] not in existing_ids]
    
    # 最新順にソートして最大20件保持
    combined.sort(key=lambda x: x['date'], reverse=True)
    combined = combined[:20]

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=4)
    
    print(f"Successfully updated. Current news count: {len(combined)}")

if __name__ == "__main__":
    main()
