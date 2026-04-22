import csv
import os

def merge_csvs(recovered_path, current_path, output_path):
    rows = {}
    
    # Read recovered data (mostly March and earlier)
    if os.path.exists(recovered_path):
        with open(recovered_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (row['date'], row['port'], row['size'], row.get('vessel', ''))
                rows[key] = row
                
    # Read current data (includes April)
    if os.path.exists(current_path):
        with open(current_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                key = (row['date'], row['port'], row['size'], row.get('vessel', ''))
                # Current data might have more recent fixes, but if dates are different, it adds new rows
                rows[key] = row
                
    # Sort by date
    sorted_rows = sorted(rows.values(), key=lambda x: x['date'])
    
    # Write back
    fieldnames = ['date', 'port', 'size', 'price', 'volume', 'vessel']
    # Check if vessel column exists in input, if not, remove from fieldnames for writing
    input_fieldnames = list(next(iter(rows.values())).keys()) if rows else []
    actual_fieldnames = [f for f in fieldnames if f in input_fieldnames]

    with open(output_path, mode='w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=actual_fieldnames)
        writer.writeheader()
        for row in sorted_rows:
            # Filter row to only include actual fieldnames
            filtered_row = {k: row[k] for k in actual_fieldnames}
            writer.writerow(filtered_row)

if __name__ == "__main__":
    merge_csvs('data/market_input_recovered_march_utf8.csv', 
               'data/market_input.csv', 
               'data/market_input.csv')
    print("CSVs merged successfully.")
