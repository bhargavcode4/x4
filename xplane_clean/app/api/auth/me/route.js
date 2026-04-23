import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req) {
  const user = getAuthUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await sql("SELECT id, name, email, phone FROM users WHERE id = ?", [user.id]);
  if (!rows.rows.length) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const [id, name, email, phone] = rows.rows[0];
  return NextResponse.json({ id, name, email, phone });
}
