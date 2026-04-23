import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db.execute({
    sql: "SELECT id, repo_url, repo_name, analysed_at FROM repos WHERE user_id = ? ORDER BY analysed_at DESC",
    args: [user.id],
  });

  const history = rows.rows.map(([id, url, name, date]) => ({ id: Number(id), url, name, date }));
  return NextResponse.json({ history });
}

export async function DELETE(req) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const repoId = searchParams.get("repoId");
  if (!repoId) return NextResponse.json({ error: "repoId required" }, { status: 400 });

  const db = getDb();

  // Verify ownership
  const check = await db.execute({
    sql: "SELECT id FROM repos WHERE id = ? AND user_id = ?",
    args: [repoId, user.id],
  });
  if (!check.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.execute({ sql: "DELETE FROM cached_answers WHERE repo_id = ?", args: [repoId] });
  await db.execute({ sql: "DELETE FROM chunks WHERE repo_id = ?", args: [repoId] });
  await db.execute({ sql: "DELETE FROM repos WHERE id = ?", args: [repoId] });

  return NextResponse.json({ ok: true });
}
