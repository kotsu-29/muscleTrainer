import { NextRequest, NextResponse } from "next/server";

// APP_PASSWORD が設定されている環境(本番デプロイなど)でのみBasic認証を有効化する。
// ローカル開発では未設定のまま無認証で使える。
export function proxy(req: NextRequest) {
  const password = process.env.APP_PASSWORD;
  if (!password) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");
  const expected = "Basic " + Buffer.from(`musclelog:${password}`).toString("base64");

  if (authHeader === expected) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="MuscleLog"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
