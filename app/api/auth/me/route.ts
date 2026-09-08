import { NextRequest, NextResponse } from "next/server"
import { getAuthCookieName, verifySession } from "@/lib/auth"
export async function GET(request: NextRequest) {
  const session = verifySession(request.cookies.get(getAuthCookieName())?.value)
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 })
  return NextResponse.json({ authenticated: true, username: session.username, role: session.role })
}
