import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "xplane_dev_secret_2024";

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

export function getAuthUser(req) {
  try {
    // Check Authorization header first
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token) return verifyToken(token);
    }
    // Fall back to cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/xplane_token=([^;]+)/);
    if (match) return verifyToken(decodeURIComponent(match[1]));
    return null;
  } catch {
    return null;
  }
}
