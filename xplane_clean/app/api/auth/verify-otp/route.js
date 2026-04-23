import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";
import { signToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await initDb();
    const { phone, code } = await req.json();
    if (!phone || !code) return NextResponse.json({ error: "Phone and code required" }, { status: 400 });

    const rows = await sql(
      "SELECT id, code, expires_at FROM otp_codes WHERE phone = ? AND used = 0 ORDER BY id DESC LIMIT 1",
      [phone]
    );
    if (!rows.rows.length) return NextResponse.json({ error: "No OTP found. Please request a new one." }, { status: 400 });

    const [otpId, storedCode, expiresAt] = rows.rows[0];
    if (new Date(expiresAt) < new Date()) return NextResponse.json({ error: "OTP has expired" }, { status: 400 });
    if (String(storedCode) !== String(code)) return NextResponse.json({ error: "Incorrect OTP" }, { status: 400 });

    await sql("UPDATE otp_codes SET used = 1 WHERE id = ?", [otpId]);

    const user = await sql("SELECT id, name, email FROM users WHERE phone = ?", [phone]);
    if (!user.rows.length) return NextResponse.json({ error: "No account linked to this phone number" }, { status: 404 });

    const [userId, name, email] = user.rows[0];
    const token = signToken({ id: Number(userId), email, name });
    const res = NextResponse.json({ ok: true, name, email, token });
    res.cookies.set("xplane_token", token, { httpOnly: true, path: "/", maxAge: 604800 });
    return res;
  } catch (e) {
    console.error("VERIFY OTP ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
