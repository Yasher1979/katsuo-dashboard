import csv
import json
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV = ROOT / "data" / "market_input.csv"
MARKET_JSON = ROOT / "data" / "katsuo_market_data.json"

YAIZU_PORT = "焼津"
YAIZU_ALLOWED_MARKET_SIZES = {"4.5kg上", "2.5kg上", "1.8kg上", "1.8kg下"}
YAIZU_EXCLUDED_VESSEL_KEYWORDS = ("日光丸", "亀洋丸")


def validate_market_csv():
    violations = []
    yaizu_date_size_counts = {}

    with MARKET_CSV.open("r", encoding="utf-8", newline="") as f:
        for line_no, row in enumerate(csv.DictReader(f), start=2):
            if row.get("port") != YAIZU_PORT:
                continue

            size = row.get("size", "")
            vessel = row.get("vessel", "")

            if size not in YAIZU_ALLOWED_MARKET_SIZES:
                violations.append(
                    f"{MARKET_CSV}:{line_no}: 焼津の相場CSVに対象外サイズ {size} が入っています"
                )

            if any(keyword in vessel for keyword in YAIZU_EXCLUDED_VESSEL_KEYWORDS):
                violations.append(
                    f"{MARKET_CSV}:{line_no}: 焼津の相場CSVに一本釣り船 {vessel} が入っています"
                )

            key = (row.get("date", ""), size)
            yaizu_date_size_counts[key] = yaizu_date_size_counts.get(key, 0) + 1

    for (date, size), count in yaizu_date_size_counts.items():
        if count > 1:
            violations.append(
                f"{MARKET_CSV}: 焼津 {date} {size} が {count} 行あります。同一日の縦線グラフ防止のため1行にしてください"
            )

    return violations


def validate_market_json():
    violations = []

    with MARKET_JSON.open("r", encoding="utf-8") as f:
        data = json.load(f)

    yaizu_data = data.get(YAIZU_PORT, {})
    for size in yaizu_data:
        if size not in YAIZU_ALLOWED_MARKET_SIZES:
            violations.append(
                f"{MARKET_JSON}: 焼津の表示JSONに対象外サイズ {size} が入っています"
            )

    for size, records in yaizu_data.items():
        date_counts = {}
        for index, record in enumerate(records):
            date = record.get("date", "")
            date_counts[date] = date_counts.get(date, 0) + 1

            vessel = record.get("vessel", "")
            if any(keyword in vessel for keyword in YAIZU_EXCLUDED_VESSEL_KEYWORDS):
                violations.append(
                    f"{MARKET_JSON}: 焼津 {size} record #{index + 1} に一本釣り船 {vessel} が入っています"
                )

        for date, count in date_counts.items():
            if count > 1:
                violations.append(
                    f"{MARKET_JSON}: 焼津 {date} {size} が {count} 件あります。同一日の縦線グラフ防止のため1件にしてください"
                )

    return violations


def main():
    violations = validate_market_csv() + validate_market_json()
    if violations:
        print("Market rule validation failed:")
        for violation in violations:
            print(f"- {violation}")
        return 1

    print("Market rule validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
