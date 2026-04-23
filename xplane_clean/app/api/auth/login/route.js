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

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const rows = await sql(
      "SELECT id, name, email, password, phone FROM users WHERE email = ?",
      [email]
    );

    if (!rows.rows.length) {
      return NextResponse.json({ error: "No account found with this email. Please sign up first." }, { status: 401 });
    }

    const [id, name, userEmail, hashed, phone] = rows.rows[0];
    const match = await bcrypt.compare(password, hashed);
    if (!match) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
    }

    const token = signToken({ id: Number(id), email: userEmail, name });
    const res = NextResponse.json({ ok: true, name, email: userEmail, phone, token });
    res.cookies.set("xplane_token", token, { httpOnly: true, path: "/", maxAge: 604800 });
    return res;
  } catch (e) {
    console.error("LOGIN ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
