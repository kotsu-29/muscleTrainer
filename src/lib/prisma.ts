import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;

  // TURSO_DATABASE_URL が設定されている場合はTurso(本番/Vercel向け)、
  // なければローカルのSQLiteファイル(開発向け)に接続する
  const adapter = tursoUrl
    ? new PrismaLibSql({ url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN })
    : new PrismaBetterSqlite3({ url: process.env.DATABASE_URL ?? "file:./dev.db" });

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
