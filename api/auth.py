現在from http.server import BaseHTTPRequestHandler
import base64
import os

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 環境変数から認証情報を取得
        auth_user = os.environ.get('AUTH_USER', 'admin').strip()
        auth_pass = os.environ.get('AUTH_PASS', 'password').strip()
        
        # Basic認証のチェック
        auth_header = self.headers.get('Authorization')
        
        if auth_header is None:
            self.send_auth_required()
            return
        
        try:
            auth_decoded = base64.b64decode(auth_header.split(' ')[1]).decode('utf-8')
            # ユーザー名とパスワードを分割（パスワード内のコロンを許容するため最大1回分割）
            parts = auth_decoded.split(':', 1)
            if len(parts) != 2:
                self.send_auth_required()
                return
                
            username = parts[0].strip()
            password = parts[1].strip()
            
            if username == auth_user and password == auth_pass:
                # 認証成功 - index.htmlにリダイレクト
                self.send_response(302)
                self.send_header('Location', '/web/index.html')
                self.end_headers()
            else:
                self.send_auth_required()
        except:
            self.send_auth_required()
    
    def send_auth_required(self):
        self.send_response(401)
        self.send_header('WWW-Authenticate', 'Basic realm="Katsuo Dashboard"')
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(b'<html><body><h1>401 Unauthorized</h1><p>Please enter valid credentials.</p></body></html>')
