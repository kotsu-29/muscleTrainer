import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";

const tursoUrl = process.env.TURSO_DATABASE_URL;
const adapter = tursoUrl
  ? new PrismaLibSql({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
  : new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
const prisma = new PrismaClient({ adapter });

const bodyParts = [
  { name: "胸", color: "#FF6B6B", order: 1 },
  { name: "背中", color: "#4D96FF", order: 2 },
  { name: "脚", color: "#6BCB77", order: 3 },
  { name: "肩", color: "#FFD93D", order: 4 },
  { name: "腕", color: "#C780FA", order: 5 },
  { name: "腹筋", color: "#FF9F45", order: 6 },
  { name: "有酸素", color: "#4ECDC4", order: 7 },
];

const exercisesByBodyPart: Record<string, string[]> = {
  胸: ["ベンチプレス", "インクラインベンチプレス", "ダンベルフライ", "腕立て伏せ"],
  背中: ["デッドリフト", "懸垂", "ラットプルダウン", "ベントオーバーロウ"],
  脚: ["スクワット", "レッグプレス", "レッグエクステンション", "レッグカール"],
  肩: ["ショルダープレス", "サイドレイズ", "アップライトロウ"],
  腕: ["アームカール", "トライセプスエクステンション", "ハンマーカール"],
  腹筋: ["クランチ", "レッグレイズ", "プランク"],
  有酸素: ["ランニング", "エアロバイク"],
};

async function main() {
  for (const bp of bodyParts) {
    const created = await prisma.bodyPart.upsert({
      where: { name: bp.name },
      update: { color: bp.color, order: bp.order },
      create: bp,
    });

    for (const exerciseName of exercisesByBodyPart[bp.name] ?? []) {
      await prisma.exercise.upsert({
        where: { name: exerciseName },
        update: {},
        create: { name: exerciseName, bodyPartId: created.id },
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
