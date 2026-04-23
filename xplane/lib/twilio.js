import twilio from "twilio";

export async function sendOTP(phone, code) {
  // In production this sends a real SMS via Twilio
  if (!process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_AUTH_TOKEN === "your_twilio_auth_token_here") {
    console.log(`[DEV] OTP for ${phone}: ${code}`);
    return { success: true, dev: true };
  }

  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  await client.messages.create({
    body: `Your X-Plane AI verification code is: ${code}. Expires in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { success: true };
}

export function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
