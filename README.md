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
