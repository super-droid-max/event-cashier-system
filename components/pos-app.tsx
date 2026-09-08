"use client"

import { LayoutDashboard, LogOut, Package, Receipt, ShoppingCart, Tag } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { CashierSection } from "@/components/sections/cashier-section"
import { ProductsSection } from "@/components/sections/products-section"
import { PromotionsSection } from "@/components/sections/promotions-section"
import { TransactionsSection } from "@/components/sections/transactions-section"
import { DashboardSection } from "@/components/sections/dashboard-section"

type Section = "cashier" | "products" | "promotions" | "transactions" | "dashboard"
const NAV = [
  { id: "cashier" as Section, label: "Kasir", icon: ShoppingCart, roles: ["admin", "kasir"] },
  { id: "products" as Section, label: "Produk", icon: Package, roles: ["admin"] },
  { id: "promotions" as Section, label: "Promo", icon: Tag, roles: ["admin"] },
  { id: "transactions" as Section, label: "Riwayat", icon: Receipt, roles: ["admin", "kasir"] },
  { id: "dashboard" as Section, label: "Dashboard", icon: LayoutDashboard, roles: ["admin"] },
]

export function POSApp() {
  const [section, setSection] = useState<Section>("cashier")
  const [session, setSession] = useState<{ username: string; role: "admin" | "kasir" } | null>(null)
  const { ready, cart } = useStore()
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0)

  useEffect(() => {
    fetch("/api/auth/me").then(async r => r.ok ? setSession(await r.json()) : window.location.href = "/login").catch(() => { window.location.href = "/login" })
  }, [])

  const nav = NAV.filter(item => session && item.roles.includes(session.role))
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/login" }

  return <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
    <aside className="hidden w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex items-center gap-2.5 px-5 py-5"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><ShoppingCart className="h-5 w-5" /></div><div className="leading-tight"><p className="text-sm font-semibold">Kasir Gathering</p><p className="text-xs text-sidebar-foreground/60">POS Event</p></div></div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">{nav.map(item => { const Icon=item.icon; const active=section===item.id; return <button key={item.id} onClick={()=>setSection(item.id)} className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",active?"bg-sidebar-primary text-sidebar-primary-foreground":"text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}><Icon className="h-4.5 w-4.5"/><span>{item.label}</span>{item.id==="cashier"&&cartCount>0?<span className="ml-auto rounded-full bg-sidebar-primary-foreground/20 px-2 py-0.5 text-xs">{cartCount}</span>:null}</button>})}</nav>
      <div className="border-t border-sidebar-border px-4 py-3"><p className="truncate text-xs font-medium">{session?.username || "…"} · {session?.role || "…"}</p><button onClick={logout} className="mt-2 flex items-center gap-2 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground"><LogOut className="h-3.5 w-3.5"/>Keluar</button></div>
    </aside>
    <main className="flex min-h-0 flex-1 flex-col">{!ready || !session ? <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Memuat aplikasi…</div> : <div className="min-h-0 flex-1 overflow-hidden">{section==="cashier"&&<CashierSection/>}{section==="products"&&session.role==="admin"&&<ProductsSection/>}{section==="promotions"&&session.role==="admin"&&<PromotionsSection/>}{section==="transactions"&&<TransactionsSection/>}{section==="dashboard"&&session.role==="admin"&&<DashboardSection/>}</div>}</main>
    <nav className="grid shrink-0 grid-cols-2 border-t border-border bg-sidebar text-sidebar-foreground md:hidden">{nav.slice(0,2).map(item=>{const Icon=item.icon; return <button key={item.id} onClick={()=>setSection(item.id)} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"><Icon className="h-5 w-5"/>{item.label}</button>})}<button onClick={logout} className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium"><LogOut className="h-5 w-5"/>Keluar</button></nav>
  </div>
}
