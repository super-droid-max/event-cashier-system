import { NextRequest, NextResponse } from "next/server"
import { getAuthCookieName, verifySession } from "@/lib/auth"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith("/login") || pathname.startsWith("/api/auth")) return NextResponse.next()
  const session = verifySession(request.cookies.get(getAuthCookieName())?.value)
  if (!session) return NextResponse.redirect(new URL("/login", request.url))
  if (session.role === "kasir" && ["/admin", "/products", "/promotions", "/dashboard"].some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] }
