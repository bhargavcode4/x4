import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await sql(
    "SELECT id, repo_url, repo_name, analysed_at FROM repos WHERE user_id = ? ORDER BY analysed_at DESC",
    [user.id]
  );
  return NextResponse.json({ history: rows.rows.map(([id,url,name,date]) => ({ id, url, name, date })) });
}

export async function DELETE(req) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const repoId = searchParams.get("repoId");
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });
  await sql("DELETE FROM cached_answers WHERE repo_id = ?", [repoId]);
  await sql("DELETE FROM chunks WHERE repo_id = ?", [repoId]);
  await sql("DELETE FROM repos WHERE id = ? AND user_id = ?", [repoId, user.id]);
  return NextResponse.json({ ok: true });
}
