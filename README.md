# MuscleLog - 筋トレ記録アプリ

ジムでのトレーニング記録を管理するWebアプリケーション。詳細な要件は [REQUIREMENTS.md](./REQUIREMENTS.md) を参照。

## 技術構成

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma + SQLite (`dev.db`)
- Recharts (グラフ描画)

## セットアップ

```bash
npm install
npx prisma migrate dev
npx prisma db seed
```

## 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 をスマートフォン等のブラウザから開いて利用します(同一Wi-Fi内であれば `http://<PCのIPアドレス>:3000` でアクセス可能)。

## 主な画面

- `/` 記録 — その日のトレーニングを部位タグ・メニューから選んで登録
- `/history` 履歴 — 過去の記録を日付ごとに一覧・削除
- `/stats` グラフ — 部位別ボリュームや種目別の重量推移を可視化
- `/exercises` メニュー — トレーニングメニューと部位タグの管理

## DBスキーマ変更時

```bash
npx prisma migrate dev --name <変更内容>
npx prisma generate
```

## 本番デプロイ (Vercel + Turso)

外出先からもアクセスできるようにする場合の手順。ローカルのSQLiteファイルはVercelのようなサーバーレス環境では使えないため、SQLite互換のクラウドDB「[Turso](https://turso.tech/)」を使う。

### 1. Turso でデータベースを作成

1. https://turso.tech/ でアカウント作成し、[Turso CLI](https://docs.turso.tech/cli/installation) をインストール
2. データベースを作成し、接続情報を取得
   ```bash
   turso db create musclelog
   turso db show musclelog --url        # → TURSO_DATABASE_URL
   turso db tokens create musclelog      # → TURSO_AUTH_TOKEN
   ```
3. スキーマを反映(ローカルから実行)
   ```bash
   TURSO_DATABASE_URL="<上のURL>" TURSO_AUTH_TOKEN="<上のトークン>" npx prisma migrate deploy
   TURSO_DATABASE_URL="<上のURL>" TURSO_AUTH_TOKEN="<上のトークン>" npx prisma db seed
   ```
   ※ `prisma migrate deploy` がTursoに対応していない場合は、Turso CLIで直接SQLを流し込む代替手段もある:
   ```bash
   turso db shell musclelog < prisma/migrations/20260910122706_init/migration.sql
   ```

### 2. Vercel にデプロイ

1. https://vercel.com/ でアカウント作成し、GitHubリポジトリ `kotsu-29/muscleTrainer` をImport
2. プロジェクトの **Settings → Environment Variables** に以下を追加
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `APP_PASSWORD` — 好きなパスワードを設定すると、アクセス時にBasic認証(ユーザー名: `musclelog`)がかかる。他人に見られたくない場合は必須
3. Deploy

デプロイ後に発行されるURL(例: `https://muscle-trainer.vercel.app`)にスマートフォンから直接アクセス可能。`APP_PASSWORD`を設定した場合はユーザー名 `musclelog` と設定したパスワードの入力を求められる。
