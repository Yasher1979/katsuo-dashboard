# 鰹相場グラフダッシュボード

焼津・枕崎・山川の3拠点における鰹（B巻網）の市況データを可視化するダッシュボードです。

## 🌐 公開URL

デプロイ後、以下のようなURLでアクセスできます:
```
https://your-project-name.vercel.app
```

## 🔐 アクセス方法

Basic認証で保護されています。
- **ユーザー名**: （Vercelの環境変数 `AUTH_USER` で設定）
- **パスワード**: （Vercelの環境変数 `AUTH_PASS` で設定）

## 📊 機能

- **3拠点別グラフ**: 焼津・枕崎・山川の相場推移を独立表示
- **混合グラフ**: 単価（折れ線）と水揚量（棒グラフ）を同時表示
- **サイズ区分**: 1.8kg上、2.5kg上、4.5kg上の3サイズに対応
- **自動更新**: GitHubにpushすると自動で再デプロイ

## 🚀 Vercelへのデプロイ手順

### 1. GitHubリポジトリの作成

1. [GitHub](https://github.com)にログイン
2. 「New repository」をクリック
3. リポジトリ名を入力（例: `katsuo-dashboard`）
4. **Private**を選択（推奨）
5. 「Create repository」をクリック

### 2. プロジェクトをGitHubにアップロード

ターミナルで以下を実行:

```powershell
cd "c:\Users\yabuk\OneDrive\デスクトップ\Antigravity（鰹相場グラフ）"
git init
git add .
git commit -m "Initial commit: Katsuo market dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 3. Vercelアカウント作成とデプロイ

1. [Vercel](https://vercel.com)にアクセス
2. 「Sign Up」→「Continue with GitHub」でログイン
3. 「Import Project」をクリック
4. 作成したGitHubリポジトリを選択
5. 「Import」をクリック

### 4. 環境変数の設定（パスワード保護）

Vercelのプロジェクト設定で:

1. 「Settings」→「Environment Variables」に移動
2. 以下の2つの変数を追加:
   - `AUTH_USER`: 任意のユーザー名（例: `katsuo_admin`）
   - `AUTH_PASS`: 任意のパスワード（例: `SecurePass2026!`）
3. 「Save」をクリック
4. 「Deployments」→最新のデプロイを選択→「Redeploy」

### 5. 完了！

デプロイが完了すると、URLが発行されます。
そのURLにアクセスし、設定したユーザー名とパスワードでログインしてください。

## 📝 データの更新方法

1. `data/market_input.csv` を編集
2. `python scripts/katsuo_fetcher.py` を実行
3. GitHubにpush:
   ```powershell
   git add .
   git commit -m "Update market data"
   git push
   ```
4. Vercelが自動で再デプロイ（1-2分）

## 📁 ディレクトリ構成

```
.
├── web/                    # フロントエンド
│   ├── index.html
│   ├── index.css
│   └── dashboard.js
├── data/                   # データファイル
│   ├── market_input.csv    # 入力データ
│   └── katsuo_market_data.json  # グラフ用JSON
├── scripts/                # データ処理スクリプト
│   ├── katsuo_fetcher.py
│   └── yaizu_scraper.py
├── api/                    # Vercel用API
│   └── auth.py            # Basic認証
├── vercel.json            # Vercel設定
└── README.md              # このファイル
```

## 🛠️ ローカル開発

```powershell
python run_dashboard.py
```

ブラウザで `http://localhost:8000/web/index.html` を開く

## 📞 サポート

質問や問題がある場合は、GitHubのIssuesでお知らせください。
