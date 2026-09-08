import { NextRequest, NextResponse } from "next/server"

type Role = "admin" | "kasir"
type Session = { username: string; role: Role; exp: number }

const COOKIE_NAME = "pos_session"

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4)
  const binary = atob(base64)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]
  return result === 0
}

async function sign(payload: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  const bytes = new Uint8Array(signature)
  let binary = ""
  bytes.forEach((byte) => { binary += String.fromCharCode(byte) })
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "")
}

async function verifySession(value?: string | null): Promise<Session | null> {
  if (!value) return null
  const dot = value.indexOf(".")
  if (dot <= 0) return null

  const payload = value.slice(0, dot)
  const signature = value.slice(dot + 1)
  const secret = process.env.AUTH_SECRET || "change-this-secret-before-production"
  const expected = await sign(payload, secret)

  if (!timingSafeEqual(new TextEncoder().encode(signature), new TextEncoder().encode(expected))) return null

  try {
    const session = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))) as Session
    if (!session.username || !["admin", "kasir"].includes(session.role) || session.exp < Date.now()) return null
    return session
  } catch {
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes and Next internals.
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next()
  }

  const session = await verifySession(request.cookies.get(COOKIE_NAME)?.value)

  if (!session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Kasir cannot access admin-only sections.
  const adminOnly = ["/products", "/promotions", "/dashboard", "/admin"]
  if (session.role === "kasir" && adminOnly.some((path) => pathname === path || pathname.startsWith(`${path}/`))) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
