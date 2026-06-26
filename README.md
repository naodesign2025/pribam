# プリバム — 昭和のプロフィール帳、デジタルで復活！

## 機能
- ユーザー登録・ログイン（JWT / httpOnly Cookie）
- プロフィール作成・編集・閲覧
- アイコン画像アップロード（最大5MB）
- 昭和プロフ帳風のポップなUI（スマホファースト）

## プロフィール項目
アイコン写真 / ニックネーム / 誕生日 / 血液型 / 好きな食べ物 / 好きなタイプ /
たからもの / 今ほしいもの / マイBEST3 / もしもコーナー / FREE SPACE / LOVE LOVEコーナー

---

## セットアップ

### 1. リポジトリをクローン & 依存関係インストール

```bash
cd pribam
npm install
```

### 2. Supabase でデータベースを準備

1. [supabase.com](https://supabase.com) でプロジェクトを作成
2. **SQL Editor** を開き、`sql/schema.sql` の内容をコピー＆実行
3. **Project Settings > Database > Connection string (URI)** をコピー

### 3. 環境変数を設定

```bash
cp .env.example .env
```

`.env` を編集して以下を設定：

```
DATABASE_URL=postgresql://postgres:[パスワード]@db.[プロジェクトID].supabase.co:5432/postgres
DATABASE_SSL=true
JWT_SECRET=ランダムな長い文字列（例: openssl rand -hex 32 で生成）
```

### 4. 起動

```bash
# 開発モード（ファイル変更を監視）
npm run dev

# 本番モード
npm start
```

ブラウザで http://localhost:3000 にアクセス！

---

## ディレクトリ構成

```
pribam/
├── server.js              # Expressサーバー
├── package.json
├── .env.example           # 環境変数テンプレート
├── db/
│   └── index.js           # PostgreSQL接続
├── middleware/
│   └── auth.js            # JWT認証ミドルウェア
├── routes/
│   ├── auth.js            # 登録・ログイン・ログアウト
│   └── profile.js         # プロフィールCRUD
├── views/                 # EJSテンプレート
│   ├── partials/
│   │   ├── header.ejs
│   │   └── footer.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── profile-create.ejs
│   ├── profile-edit.ejs
│   └── profile-view.ejs
├── public/
│   ├── css/style.css      # 昭和プロフ帳スタイル
│   ├── js/app.js          # クライアントJS
│   └── uploads/           # アイコン画像の保存先
└── sql/
    └── schema.sql         # テーブル定義
```

## URL一覧

| URL | 説明 |
|-----|------|
| `GET /` | トップ（ログイン状態によりリダイレクト） |
| `GET /auth/login` | ログイン画面 |
| `GET /auth/register` | 新規登録画面 |
| `GET /auth/logout` | ログアウト |
| `GET /profile` | マイプロフへリダイレクト |
| `GET /profile/create` | プロフィール作成 |
| `GET /profile/edit` | プロフィール編集（要ログイン） |
| `GET /profile/view/:userId` | プロフィール閲覧（公開） |

## 注意事項

- `public/uploads/` に画像が保存されます。本番環境では Supabase Storage や S3 への変更を推奨します。
- `.env` は絶対にGitにコミットしないでください（`.gitignore` に追加）。

## .gitignore の推奨設定

```
node_modules/
.env
public/uploads/*
!public/uploads/.gitkeep
```
