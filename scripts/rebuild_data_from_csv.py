import csv
import json
import math
from collections import defaultdict
from datetime import date


VALID_PORTS = {"枕崎", "焼津", "山川"}
EXPECTED_COLUMNS = ["date", "port", "size", "price", "volume", "vessel"]


def convert_csv_to_json(csv_path, json_path):
    data = defaultdict(lambda: defaultdict(list))
    seen_records = set()

    with open(csv_path, mode="r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != EXPECTED_COLUMNS:
            raise ValueError(
                f"CSV列が想定と異なります: {reader.fieldnames!r} (expected {EXPECTED_COLUMNS!r})"
            )

        for line_no, row in enumerate(reader, start=2):
            if None in row or any(row.get(column) is None for column in EXPECTED_COLUMNS):
                raise ValueError(f"CSV {line_no} 行目: 列数が想定と異なります")

            date_text = row["date"].strip()
            port = row["port"].strip()
            size = row["size"].strip()
            vessel = row["vessel"].strip()
            if not date_text or not port or not size or not row["price"].strip() or not row["volume"].strip():
                raise ValueError(f"CSV {line_no} 行目: 必須項目に空欄があります")
            if port not in VALID_PORTS:
                raise ValueError(f"CSV {line_no} 行目: 未知の港名 {port!r}")

            try:
                parsed_date = date.fromisoformat(date_text)
                price = float(row["price"])
                volume = float(row["volume"])
            except ValueError as error:
                raise ValueError(f"CSV {line_no} 行目: 日付または数値が不正です ({error})") from error

            if parsed_date.isoformat() != date_text:
                raise ValueError(f"CSV {line_no} 行目: 日付はYYYY-MM-DD形式で入力してください")
            if not math.isfinite(price) or price <= 0:
                raise ValueError(f"CSV {line_no} 行目: 価格は0より大きい有限値で入力してください")
            if not math.isfinite(volume) or volume < 0:
                raise ValueError(f"CSV {line_no} 行目: 数量は0以上の有限値で入力してください")

            record_key = (date_text, port, size, price, volume, vessel)
            if record_key in seen_records:
                raise ValueError(f"CSV {line_no} 行目: 完全重複データです ({date_text}, {port}, {size}, {vessel})")
            seen_records.add(record_key)

            entry = {"date": date_text, "price": price, "volume": volume}
            if vessel:
                entry["vessel"] = vessel
            data[port][size].append(entry)

    for port in data:
        for size in data[port]:
            data[port][size].sort(key=lambda item: item["date"])

    with open(json_path, mode="w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    import os

    ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    csv_path = os.path.join(ROOT, "data", "market_input.csv")
    json_path = os.path.join(ROOT, "data", "katsuo_market_data.json")
    convert_csv_to_json(csv_path, json_path)
    print("Market data JSON has been rebuilt from market_input.csv successfully.")
