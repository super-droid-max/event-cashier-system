import { createHmac, timingSafeEqual } from "crypto"

export type Role = "admin" | "kasir"
export type Session = { username: string; role: Role; exp: number }

const COOKIE_NAME = "pos_session"
const secret = () => process.env.AUTH_SECRET || "change-this-secret-before-production"

export function getAuthCookieName() { return COOKIE_NAME }

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url")
}

export function createSession(username: string, role: Role) {
  const payload = Buffer.from(JSON.stringify({ username, role, exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url")
  return `${payload}.${sign(payload)}`
}

export function verifySession(value?: string | null): Session | null {
  if (!value) return null
  const [payload, signature] = value.split(".")
  if (!payload || !signature) return null
  const expected = sign(payload)
  try {
    if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null
  } catch { return null }
  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as Session
    if (!session.username || !["admin", "kasir"].includes(session.role) || session.exp < Date.now()) return null
    return session
  } catch { return null }
}

export function authenticate(username: string, password: string): Role | null {
  const adminUser = process.env.ADMIN_USERNAME || "admin"
  const adminPass = process.env.ADMIN_PASSWORD || "admin123"
  const cashierUser = process.env.CASHIER_USERNAME || "kasir"
  const cashierPass = process.env.CASHIER_PASSWORD || "kasir123"
  if (username === adminUser && password === adminPass) return "admin"
  if (username === cashierUser && password === cashierPass) return "kasir"
  return null
}
