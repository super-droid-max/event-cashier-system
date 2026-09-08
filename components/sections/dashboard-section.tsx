"use client"

import { Banknote, QrCode, Receipt, TrendingUp } from "lucide-react"
import { useMemo } from "react"
import { formatNumber, formatRupiah } from "@/lib/format"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function DashboardSection() {
  const { transactions } = useStore()

  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10)
    let revenue = 0
    let today = 0
    let cash = 0
    let qris = 0
    let itemsSold = 0
    const productTotals = new Map<string, { name: string; qty: number; revenue: number }>()
    const dayTotals = new Map<string, number>()

    for (const t of transactions) {
      revenue += t.total
      if (t.createdAt.slice(0, 10) === todayStr) today += t.total
      if (t.paymentMethod === "CASH") cash += t.total
      else qris += t.total
      const day = t.createdAt.slice(0, 10)
      dayTotals.set(day, (dayTotals.get(day) ?? 0) + t.total)
      for (const i of t.items) {
        itemsSold += i.quantity
        const cur = productTotals.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 }
        cur.qty += i.quantity
        cur.revenue += i.lineTotal
        productTotals.set(i.productId, cur)
      }
    }

    const topProducts = [...productTotals.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6)

    const days = [...dayTotals.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)

    return {
      revenue,
      today,
      cash,
      qris,
      itemsSold,
      count: transactions.length,
      avg: transactions.length ? revenue / transactions.length : 0,
      topProducts,
      days,
    }
  }, [transactions])

  const cashPct = stats.revenue ? Math.round((stats.cash / stats.revenue) * 100) : 0
  const maxDay = Math.max(1, ...stats.days.map((d) => d[1]))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border bg-card px-4 py-3">
        <h1 className="text-base font-semibold">Dashboard</h1>
        <p className="text-xs text-muted-foreground">Ringkasan penjualan event</p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {stats.count === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <TrendingUp className="h-10 w-10 opacity-30" />
            <p className="text-sm">Belum ada data penjualan.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard
                label="Total Pendapatan"
                value={formatRupiah(stats.revenue)}
                icon={<TrendingUp className="h-4 w-4" />}
                accent
              />
              <StatCard
                label="Pendapatan Hari Ini"
                value={formatRupiah(stats.today)}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <StatCard
                label="Jumlah Transaksi"
                value={formatNumber(stats.count)}
                icon={<Receipt className="h-4 w-4" />}
              />
              <StatCard
                label="Rata-rata / Transaksi"
                value={formatRupiah(stats.avg)}
                icon={<Receipt className="h-4 w-4" />}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Payment split */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Metode Pembayaran</h2>
                <div className="mb-3 flex h-3 overflow-hidden rounded-full bg-muted">
                  <div className="bg-chart-3" style={{ width: `${cashPct}%` }} />
                  <div className="bg-chart-2" style={{ width: `${100 - cashPct}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3/15 text-chart-3">
                      <Banknote className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">Tunai ({cashPct}%)</p>
                      <p className="font-mono font-medium">{formatRupiah(stats.cash)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-2/15 text-chart-2">
                      <QrCode className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-xs text-muted-foreground">QRIS ({100 - cashPct}%)</p>
                      <p className="font-mono font-medium">{formatRupiah(stats.qris)}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  Total item terjual:{" "}
                  <span className="font-mono font-medium text-foreground">
                    {formatNumber(stats.itemsSold)}
                  </span>
                </p>
              </div>

              {/* Revenue by day */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold">Pendapatan Harian</h2>
                <div className="flex h-40 items-end gap-2">
                  {stats.days.map(([day, val]) => (
                    <div key={day} className="flex flex-1 flex-col items-center gap-1">
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {(val / 1000).toFixed(0)}k
                      </span>
                      <div
                        className="w-full rounded-t bg-primary/80"
                        style={{ height: `${Math.max(4, (val / maxDay) * 100)}%` }}
                        title={formatRupiah(val)}
                      />
                      <span className="text-[10px] text-muted-foreground">{day.slice(5)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top products */}
            <div className="rounded-lg border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Produk Terlaris</h2>
              <ul className="flex flex-col gap-2">
                {stats.topProducts.map((p, idx) => {
                  const max = stats.topProducts[0]?.qty || 1
                  return (
                    <li key={idx} className="flex items-center gap-3">
                      <span className="w-4 text-center font-mono text-xs text-muted-foreground">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm">{p.name}</span>
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {p.qty}× · {formatRupiah(p.revenue)}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary"
                            style={{ width: `${(p.qty / max) * 100}%` }}
                          />
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string
  value: string
  icon: React.ReactNode
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        accent ? "border-primary/30 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("font-mono text-lg font-bold", accent ? "text-primary" : "text-foreground")}>
        {value}
      </p>
    </div>
  )
}
