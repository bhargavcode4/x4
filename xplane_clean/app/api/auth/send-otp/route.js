import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

export const runtime = "nodejs";

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendViaTwilio(phone, code) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { dev: true };

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: phone, From: from, Body: `Your X-Plane AI code: ${code}` }).toString(),
  });
  if (!res.ok) { const e = await res.json(); throw new Error(e.message); }
  return { dev: false };
}

export async function POST(req) {
  try {
    await initDb();
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "Phone required" }, { status: 400 });

    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await sql("UPDATE otp_codes SET used = 1 WHERE phone = ? AND used = 0", [phone]);
    await sql("INSERT INTO otp_codes (phone, code, expires_at) VALUES (?, ?, ?)", [phone, code, expires]);

    const result = await sendViaTwilio(phone, code);
    console.log(result.dev ? `[DEV OTP] ${phone}: ${code}` : `OTP sent to ${phone}`);
    return NextResponse.json({ ok: true, ...(result.dev ? { code } : {}) });
  } catch (e) {
    console.error("SEND OTP ERROR:", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
