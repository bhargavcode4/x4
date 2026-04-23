import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getDb } from "@/lib/db";

export async function GET(req) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db.execute({
    sql: "SELECT id, name, email, phone FROM users WHERE id = ?",
    args: [user.id],
  });

  if (!rows.rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const [id, name, email, phone] = rows.rows[0];
  return NextResponse.json({ id, name, email, phone });
}
