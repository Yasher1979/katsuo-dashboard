import sys
import os
sys.path.insert(0, os.path.dirname(__file__))
from update_data import add_market_data, bump_version

DATE = "2026-04-03"
PORT = "焼津"

print(f"=== {DATE} 焼津魚市場相場 データ更新 ===")
print()

# ===== 海旋ブライン冷鰹（南方）340t =====
# 83福一丸 計1隻

# 4.5kg上: 15t, 350円/kg~
add_market_data(PORT, "4.5kg上", DATE, 350.0, 15)
print(f"✓ {PORT} 4.5kg上 350円/kg, 15t")

# 2.5kg上: 260t, 370~330円/kg → 中間値 350円/kg  
add_market_data(PORT, "2.5kg上", DATE, 350.0, 260)
print(f"✓ {PORT} 2.5kg上 350円/kg(370~330), 260t")

# 1.8kg上: 40t, 350~325円/kg → 中間値 337.5円/kg
add_market_data(PORT, "1.8kg上", DATE, 337.5, 40)
print(f"✓ {PORT} 1.8kg上 337.5円/kg(350~325), 40t")

# 1.8kg下: 25t, 340円/kg~
add_market_data(PORT, "1.8kg下", DATE, 340.0, 25)
print(f"✓ {PORT} 1.8kg下 340.0円/kg, 25t")

# ===== （南方）一本釣りB-1冷鰹 205t =====
# 31永盛丸 計1隻

# 7.0kg上: 75t, 420円/kg~
add_market_data(PORT, "7.0kg上", DATE, 420.0, 75)
print(f"✓ {PORT} 7.0kg上 420.0円/kg, 75t")

# 4.5kg上: 75t, 425円/kg~ (既存のカテゴリに追加)
add_market_data(PORT, "4.5kg上", DATE, 425.0, 75)
print(f"✓ {PORT} 4.5kg上(一本釣) 425.0円/kg, 75t")

# 2.5kg上: 40t, 450~440円/kg → 中間値 445.0円/kg
add_market_data(PORT, "2.5kg上", DATE, 445.0, 40)
print(f"✓ {PORT} 2.5kg上(一本釣) 445.0円/kg(450~440), 40t")

# 1.5kg上: 15t, 400円/kg~
add_market_data(PORT, "1.5kg上", DATE, 400.0, 15)
print(f"✓ {PORT} 1.5kg上 400.0円/kg, 15t")

print()
print("=== market_input.csv への追記 ===")
CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'market_input.csv')
new_rows = [
    f"{DATE},{PORT},4.5kg上,350.0,15\n",
    f"{DATE},{PORT},2.5kg上,350.0,260\n",
    f"{DATE},{PORT},1.8kg上,337.5,40\n",
    f"{DATE},{PORT},1.8kg下,340.0,25\n",
    f"{DATE},{PORT},7.0kg上,420.0,75\n",
    f"{DATE},{PORT},4.5kg上,425.0,75\n",
    f"{DATE},{PORT},2.5kg上,445.0,40\n",
    f"{DATE},{PORT},1.5kg上,400.0,15\n",
]

with open(CSV_PATH, 'a', encoding='utf-8') as f:
    f.writelines(new_rows)
print(f"✓ {CSV_PATH} に {len(new_rows)} 行追加しました。")

print()
print("=== バージョンバンプ ===")
bump_version()

print()
print("=== 完了 ===")
