import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await initDb();
    const { phone, code } = await req.json();
    if (!phone || !code) return NextResponse.json({ error: "Phone and code required" }, { status: 400 });

    const db = getDb();
    const rows = await db.execute({
      sql: "SELECT id, code, expires_at FROM otp_codes WHERE phone = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      args: [phone],
    });

    if (!rows.rows.length) return NextResponse.json({ error: "No OTP found" }, { status: 400 });

    const [otpId, storedCode, expiresAt] = rows.rows[0];
    if (new Date(expiresAt) < new Date()) return NextResponse.json({ error: "OTP expired" }, { status: 400 });
    if (storedCode !== code) return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });

    await db.execute({ sql: "UPDATE otp_codes SET used = 1 WHERE id = ?", args: [otpId] });

    const user = await db.execute({ sql: "SELECT id, name, email FROM users WHERE phone = ?", args: [phone] });
    if (!user.rows.length) return NextResponse.json({ error: "No account linked to this phone" }, { status: 404 });

    const [userId, name, email] = user.rows[0];
    const token = signToken({ id: Number(userId), email, name });
    const res = NextResponse.json({ ok: true, name, email, token });
    res.cookies.set("xplane_token", token, { httpOnly: true, path: "/", maxAge: 604800 });
    return res;
  } catch (e) {
    console.error("VERIFY OTP ERROR:", e.message);
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
