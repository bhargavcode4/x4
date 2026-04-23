import { NextResponse } from "next/server";
import { getDb, initDb } from "@/lib/db";
import { sendOTP, generateOTP } from "@/lib/twilio";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    await initDb();
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const db = getDb();

    await db.execute({ sql: "UPDATE otp_codes SET used = 1 WHERE phone = ? AND used = 0", args: [phone] });
    await db.execute({ sql: "INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)", args: [phone, code, expires] });

    const result = await sendOTP(phone, code);
    return NextResponse.json({ ok: true, dev: result.dev || false, ...(result.dev ? { code } : {}) });
  } catch (e) {
    console.error("OTP ERROR:", e.message);
    return NextResponse.json({ error: e.message || "Failed to send OTP" }, { status: 500 });
  }
}
