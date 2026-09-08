"use client"
import { FormEvent, useState } from "react"
import { LockKeyhole, ShoppingCart } from "lucide-react"
import { Button, Field, TextInput } from "@/components/ui-kit"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  async function submit(e: FormEvent) {
    e.preventDefault(); setLoading(true); setError("")
    const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) })
    if (!res.ok) { const data = await res.json().catch(() => ({})); setError(data.error || "Login gagal."); setLoading(false); return }
    window.location.href = "/"
  }
  return <main className="flex min-h-dvh items-center justify-center bg-background p-4"><form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-lg">
    <div className="mb-6 flex flex-col items-center text-center"><div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShoppingCart className="h-6 w-6" /></div><h1 className="text-xl font-bold">Kasir</h1><p className="text-sm text-muted-foreground">Silakan login untuk melanjutkan</p></div>
    <div className="space-y-4"><Field label="Username"><TextInput autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} required /></Field><Field label="Password"><TextInput type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required /></Field>{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" className="w-full" size="lg" disabled={loading}>{loading ? "Memeriksa…" : <><LockKeyhole className="mr-2 h-4 w-4" />Login</>}</Button></div>
    <p className="mt-5 text-center text-xs text-muted-foreground">Akun diatur melalui environment variables server.</p>
  </form></main>
}
