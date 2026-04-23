import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await initDb();

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }

    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const phone = (body.phone || "").trim();

    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });
    if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });

    const existing = await sql("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 8);
    const result = await sql(
      "INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)",
      [name, email, hashed, phone]
    );

    const token = signToken({ id: result.lastInsertRowid, email, name });
    const res = NextResponse.json({ ok: true, name, email, token });
    res.cookies.set("xplane_token", token, { httpOnly: true, path: "/", maxAge: 604800 });
    return res;
  } catch (e) {
    console.error("SIGNUP ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
