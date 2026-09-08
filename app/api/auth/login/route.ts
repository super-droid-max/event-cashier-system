import { NextResponse } from "next/server"
import { authenticate, createSession, getAuthCookieName } from "@/lib/auth"

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const username = String(body?.username || "").trim()
  const password = String(body?.password || "")
  const role = authenticate(username, password)
  if (!role) return NextResponse.json({ error: "Username atau password salah." }, { status: 401 })
  const response = NextResponse.json({ ok: true, role })
  response.cookies.set(getAuthCookieName(), createSession(username, role), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60 * 60 * 8,
  })
  return response
}
