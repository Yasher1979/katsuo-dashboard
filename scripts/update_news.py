import os
import json
import feedparser
import google.generativeai as genai
from datetime import datetime

# 設定: ニュース取得元 (RSS等)
RSS_FEEDS = [
    "https://www3.nhk.or.jp/rss/news/cat0.xml",  # NHK 主要ニュース
    "https://www3.nhk.or.jp/rss/news/cat5.xml",  # NHK 経済
    "https://prtimes.jp/main/html/searchrlp/ct1/000000057/rss.xml", # PR TIMES 食品・飲料
]

def fetch_rss_news():
    entries = []
    for url in RSS_FEEDS:
        feed = feedparser.parse(url)
        entries.extend(feed.entries)
    return entries

def summarize_news_with_ai(news_list):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: GEMINI_API_KEY is not set.")
        return []

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')

    # AIへの指示（プロンプト）
    prompt = f"""
あなたは水産業界の専門アナリストです。
以下のニュースリストから、特に「カツオ」「漁業」「水産市場」「燃費」「物流2024年問題」「消費動向」に関連する重要なニュースを3〜5件厳選してください。
それぞれのニュースについて、以下のJSON形式で出力してください。

出力形式:
[
  {{
    "id": "一意のID",
    "date": "YYYY-MM-DD",
    "title": "簡潔で目を引くタイトル",
    "source": "ニュース元名",
    "url": "ニュースのURL",
    "category": "漁況, 燃費油, 規制, 市場 のいずれか",
    "summary": "100文字程度の専門的かつ分かりやすい要約（カツオ相場への影響に触れること）"
  }}
]

ニュースリスト:
{news_list}
"""

    try:
        response = model.generate_content(prompt)
        # JSON部分だけを抽出
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0]
        elif "[" in text:
            text = text[text.find("["):text.rfind("]")+1]
        
        return json.loads(text)
    except Exception as e:
        print(f"AI Summarization Error: {e}")
        return []

def main():
    print("Fetching news from RSS...")
    raw_news = fetch_rss_news()
    
    # ニュースのタイトルとリンクをテキスト化してAIに渡す
    news_items_text = "\n".join([f"- Title: {e.title}, Link: {e.link}" for e in raw_news[:20]])
    
    print("Summarizing with Gemini AI...")
    summarized_news = summarize_news_with_ai(news_items_text)
    
    if not summarized_news:
        print("No relevant news found or AI error.")
        return

    # 既存データの読み込み
    data_path = "data/katsuo_news.json"
    existing_data = []
    if os.path.exists(data_path):
        with open(data_path, "r", encoding="utf-8") as f:
            existing_data = json.load(f)

    # 重複チェックとマージ（IDを基準に。新しいものを優先）
    existing_ids = {item["id"] for item in existing_data}
    new_items = [n for n in summarized_news if n["id"] not in existing_ids]
    
    # 全データを統合して最新順にソート（日付順）し、最大15件保持
    combined_data = new_items + existing_data
    combined_data.sort(key=lambda x: x["date"], reverse=True)
    combined_data = combined_data[:15]

    # ファイル保存
    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(combined_data, f, ensure_ascii=False, indent=4)
    
    print(f"Successfully updated. Added {len(new_items)} new items.")

if __name__ == "__main__":
    main()
