import csv
import json
import math
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MARKET_CSV = ROOT / "data" / "market_input.csv"
MARKET_JSON = ROOT / "data" / "katsuo_market_data.json"

EXPECTED_COLUMNS = ["date", "port", "size", "price", "volume", "vessel"]
VALID_PORTS = {"枕崎", "焼津", "山川"}
YAIZU_PORT = "焼津"
YAIZU_ALLOWED_MARKET_SIZES = {"4.5kg上", "2.5kg上", "1.8kg上", "1.8kg下"}
YAIZU_EXCLUDED_VESSEL_KEYWORDS = ("日光丸", "亀洋丸")


def read_market_csv():
    violations = []
    expected = defaultdict(lambda: defaultdict(list))
    exact_rows = set()
    yaizu_date_size_counts = {}

    with MARKET_CSV.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != EXPECTED_COLUMNS:
            violations.append(
                f"{MARKET_CSV}: CSV列が想定と異なります ({reader.fieldnames!r})"
            )
            return violations, None

        for line_no, row in enumerate(reader, start=2):
            if None in row or any(row.get(column) is None for column in EXPECTED_COLUMNS):
                violations.append(f"{MARKET_CSV}:{line_no}: 列数が想定と異なります")
                continue

            date_text = row["date"].strip()
            port = row["port"].strip()
            size = row["size"].strip()
            vessel = row["vessel"].strip()
            price_text = row["price"].strip()
            volume_text = row["volume"].strip()

            if not all((date_text, port, size, price_text, volume_text)):
                violations.append(f"{MARKET_CSV}:{line_no}: 必須項目に空欄があります")
                continue
            if port not in VALID_PORTS:
                violations.append(f"{MARKET_CSV}:{line_no}: 未知の港名 {port!r}")
                continue

            try:
                parsed_date = date.fromisoformat(date_text)
                price = float(price_text)
                volume = float(volume_text)
            except ValueError:
                violations.append(f"{MARKET_CSV}:{line_no}: 日付または数値が不正です")
                continue

            if parsed_date.isoformat() != date_text:
                violations.append(f"{MARKET_CSV}:{line_no}: 日付はYYYY-MM-DD形式で入力してください")
                continue
            if not math.isfinite(price) or price <= 0:
                violations.append(f"{MARKET_CSV}:{line_no}: 価格は0より大きい有限値で入力してください")
                continue
            if not math.isfinite(volume) or volume < 0:
                violations.append(f"{MARKET_CSV}:{line_no}: 数量は0以上の有限値で入力してください")
                continue

            exact_key = (date_text, port, size, price, volume, vessel)
            if exact_key in exact_rows:
                violations.append(
                    f"{MARKET_CSV}:{line_no}: 完全重複データです ({date_text}, {port}, {size}, {vessel})"
                )
                continue
            exact_rows.add(exact_key)

            if port == YAIZU_PORT:
                if size not in YAIZU_ALLOWED_MARKET_SIZES:
                    violations.append(
                        f"{MARKET_CSV}:{line_no}: 焼津の相場CSVに対象外サイズ {size} が入っています"
                    )
                if any(keyword in vessel for keyword in YAIZU_EXCLUDED_VESSEL_KEYWORDS):
                    violations.append(
                        f"{MARKET_CSV}:{line_no}: 焼津の相場CSVに一本釣り船 {vessel} が入っています"
                    )
                key = (date_text, size)
                yaizu_date_size_counts[key] = yaizu_date_size_counts.get(key, 0) + 1

            entry = {"date": date_text, "price": price, "volume": volume}
            if vessel:
                entry["vessel"] = vessel
            expected[port][size].append(entry)

    for (date_text, size), count in yaizu_date_size_counts.items():
        if count > 1:
            violations.append(
                f"{MARKET_CSV}: 焼津 {date_text} {size} が {count} 行あります。同一日の縦線グラフ防止のため1行にしてください"
            )

    for port in expected:
        for size in expected[port]:
            expected[port][size].sort(key=lambda record: record["date"])

    return violations, {port: dict(sizes) for port, sizes in expected.items()}


def validate_market_json(expected_data=None):
    violations = []

    try:
        with MARKET_JSON.open("r", encoding="utf-8") as f:
            data = json.load(f)
    except (OSError, json.JSONDecodeError) as error:
        return [f"{MARKET_JSON}: JSONを読み込めません ({error})"]

    if not isinstance(data, dict):
        return [f"{MARKET_JSON}: ルートは港名をキーとするオブジェクトである必要があります"]

    if expected_data is not None and data != expected_data:
        violations.append(
            f"{MARKET_JSON}: market_input.csvから再生成した想定データと一致しません。再生成してください"
        )

    yaizu_data = data.get(YAIZU_PORT, {})
    if not isinstance(yaizu_data, dict):
        return violations + [f"{MARKET_JSON}: 焼津データはサイズ名をキーとするオブジェクトである必要があります"]

    for size in yaizu_data:
        if size not in YAIZU_ALLOWED_MARKET_SIZES:
            violations.append(
                f"{MARKET_JSON}: 焼津の表示JSONに対象外サイズ {size} が入っています"
            )

    for size, records in yaizu_data.items():
        if not isinstance(records, list):
            violations.append(f"{MARKET_JSON}: 焼津 {size} の履歴は配列である必要があります")
            continue
        date_counts = {}
        for index, record in enumerate(records):
            if not isinstance(record, dict):
                violations.append(f"{MARKET_JSON}: 焼津 {size} record #{index + 1} がオブジェクトではありません")
                continue
            record_date = record.get("date", "")
            date_counts[record_date] = date_counts.get(record_date, 0) + 1

            vessel = record.get("vessel", "")
            if any(keyword in vessel for keyword in YAIZU_EXCLUDED_VESSEL_KEYWORDS):
                violations.append(
                    f"{MARKET_JSON}: 焼津 {size} record #{index + 1} に一本釣り船 {vessel} が入っています"
                )

        for record_date, count in date_counts.items():
            if count > 1:
                violations.append(
                    f"{MARKET_JSON}: 焼津 {record_date} {size} が {count} 件あります。同一日の縦線グラフ防止のため1件にしてください"
                )

    return violations


def main():
    csv_violations, expected_data = read_market_csv()
    violations = csv_violations + validate_market_json(expected_data if not csv_violations else None)
    if violations:
        print("Market rule validation failed:")
        for violation in violations:
            print(f"- {violation}")
        return 1

    print("Market rule validation passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
