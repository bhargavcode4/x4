import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await initDb();
    const body = await req.json();
    const { name, email, password, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    const db = getDb();

    const exists = await db.execute({
      sql: "SELECT id FROM users WHERE email = ?",
      args: [email.toLowerCase().trim()],
    });
    if (exists.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 8);
    const result = await db.execute({
      sql: "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      args: [name.trim(), email.toLowerCase().trim(), hashed, phone || ""],
    });

    const userId = Number(result.lastInsertRowid);
    const token = signToken({ id: userId, email: email.toLowerCase().trim(), name: name.trim() });

    const res = NextResponse.json({ ok: true, name: name.trim(), email: email.toLowerCase().trim(), token });
    res.cookies.set("xplane_token", token, { httpOnly: true, path: "/", maxAge: 604800 });
    return res;
  } catch (e) {
    console.error("SIGNUP ERROR:", e.message, e.stack);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
