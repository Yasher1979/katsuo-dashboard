import os
import shutil
from datetime import datetime

def create_backup():
    """
    dataフォルダ内の重要なファイルを backups フォルダにコピーする
    """
    # 1. フォルダの準備
    backup_root = "data/backups"
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = os.path.join(backup_root, timestamp)
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        
    # 2. 対象ファイルのリスト
    target_files = [
        "data/market_input.csv",
        "data/katsuo_market_data.json",
        "data/bid_schedule.json"
    ]
    
    # 3. コピー実行
    copied_count = 0
    for file_path in target_files:
        if os.path.exists(file_path):
            filename = os.path.basename(file_path)
            shutil.copy2(file_path, os.path.join(backup_dir, filename))
            copied_count += 1
            
    print(f"Backup created at: {backup_dir} ({copied_count} files)")
    return backup_dir

if __name__ == "__main__":
    create_backup()
