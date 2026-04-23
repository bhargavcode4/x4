import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SECRET = process.env.JWT_SECRET || "xplane_dev_secret";

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function getAuthUser(request) {
  const token =
    request.headers.get("Authorization")?.replace("Bearer ", "") ||
    request.cookies?.get("xplane_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}
