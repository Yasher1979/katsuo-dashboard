import http.server
import socketserver
import os
import sys

# サーバーの設定
PORT = 8000
# プロジェクトのルートディレクトリを取得
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT_DIR)

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # キャッシュを無効化するヘッダーを追加（開発中のため）
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        # CORSを許可
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

# サーバーの起動
print("--- 鰹相場ダッシュボード 起動スクリプト ---")
try:
    with socketserver.TCPServer(("", PORT), MyHandler) as httpd:
        print(f"\n[1] サーバーが正常に起動しました（ポート: {PORT}）")
        print("\n[2] 以下のURLをコピーしてブラウザ（Chromeなど）のアドレスバーに貼り付けてください:")
        print(f"    http://localhost:{PORT}/web/index.html")
        print("\n[3] 終了するには、この画面で Ctrl + C を押してください。")
        httpd.serve_forever()
except OSError as e:
    if e.errno == 98 or e.errno == 10048:
        print(f"\n[エラー] ポート {PORT} が既に使用されています。")
        print("他のPowerShell画面でサーバーを既に起動している可能性があります。")
        print("一度すべての画面を閉じるか、Ctrl + C で終了してから再度お試しください。")
    else:
        print(f"\n[エラー] 起動に失敗しました: {e}")
except Exception as e:
    print(f"\n[予期しないエラー] {e}")
