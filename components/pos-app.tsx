"use client"

import {
  LayoutDashboard,
  Package,
  Receipt,
  ShoppingCart,
  Tag,
} from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useStore } from "@/lib/store"
import { CashierSection } from "@/components/sections/cashier-section"
import { ProductsSection } from "@/components/sections/products-section"
import { PromotionsSection } from "@/components/sections/promotions-section"
import { TransactionsSection } from "@/components/sections/transactions-section"
import { DashboardSection } from "@/components/sections/dashboard-section"

type Section = "cashier" | "products" | "promotions" | "transactions" | "dashboard"

const NAV: { id: Section; label: string; icon: typeof ShoppingCart }[] = [
  { id: "cashier", label: "Kasir", icon: ShoppingCart },
  { id: "products", label: "Produk", icon: Package },
  { id: "promotions", label: "Promo", icon: Tag },
  { id: "transactions", label: "Riwayat", icon: Receipt },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
]

export function POSApp() {
  const [section, setSection] = useState<Section>("cashier")
  const { ready, cart } = useStore()
  const cartCount = cart.reduce((n, i) => n + i.quantity, 0)

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background md:flex-row">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-56 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Kasir Gathering</p>
            <p className="text-xs text-sidebar-foreground/60">POS Event</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = section === item.id
            return (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4.5 w-4.5" />
                <span>{item.label}</span>
                {item.id === "cashier" && cartCount > 0 ? (
                  <span className="ml-auto rounded-full bg-sidebar-primary-foreground/20 px-2 py-0.5 text-xs">
                    {cartCount}
                  </span>
                ) : null}
              </button>
            )
          })}
        </nav>
        <p className="px-5 py-4 text-xs text-sidebar-foreground/40">
          Data tersimpan di perangkat ini.
        </p>
      </aside>

      {/* Main content */}
      <main className="flex min-h-0 flex-1 flex-col">
        {!ready ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Memuat data…
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden">
            {section === "cashier" && <CashierSection />}
            {section === "products" && <ProductsSection />}
            {section === "promotions" && <PromotionsSection />}
            {section === "transactions" && <TransactionsSection />}
            {section === "dashboard" && <DashboardSection />}
          </div>
        )}
      </main>

      {/* Bottom nav (mobile) */}
      <nav className="grid shrink-0 grid-cols-5 border-t border-border bg-sidebar text-sidebar-foreground md:hidden">
        {NAV.map((item) => {
          const Icon = item.icon
          const active = section === item.id
          return (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={cn(
                "relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-sidebar-primary-foreground" : "text-sidebar-foreground/60",
              )}
            >
              <Icon className={cn("h-5 w-5", active && "text-sidebar-primary")} />
              {item.label}
              {item.id === "cashier" && cartCount > 0 ? (
                <span className="absolute right-1/2 top-1 translate-x-4 rounded-full bg-sidebar-primary px-1.5 text-[10px] text-sidebar-primary-foreground">
                  {cartCount}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
