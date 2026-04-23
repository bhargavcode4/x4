import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await initDb();
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const db = getDb();
    const rows = await db.execute({
      sql: "SELECT id, name, email, password, phone FROM users WHERE email = ?",
      args: [email.toLowerCase().trim()],
    });

    if (rows.rows.length === 0) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const [id, name, userEmail, hashed, phone] = rows.rows[0];
    const match = await bcrypt.compare(password, hashed);
    if (!match) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ id: Number(id), email: userEmail, name });
    const res = NextResponse.json({ ok: true, name, email: userEmail, phone, token });
    res.cookies.set("xplane_token", token, { httpOnly: true, path: "/", maxAge: 604800 });
    return res;
  } catch (e) {
    console.error("LOGIN ERROR:", e.message, e.stack);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
