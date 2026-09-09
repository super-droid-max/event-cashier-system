"use client"

import { Minus, Plus, Search, ShoppingCart, Trash2, X } from "lucide-react"
import { useMemo, useState } from "react"
import { PaymentDialog } from "@/components/payment-dialog"
import { Button, TextInput } from "@/components/ui-kit"
import { formatRupiah } from "@/lib/format"
import { useStore } from "@/lib/store"
import { cn } from "@/lib/utils"

export function CashierSection() {
  const {
    products,
    cart,
    addToCart,
    setQuantity,
    setItemPrice,
    removeFromCart,
    clearCart,
    promotions,
    activePromotionId,
    setActivePromotion,
    appliedPromotion,
    subtotal,
    discount,
    total,
  } = useStore()

  const [query, setQuery] = useState("")
  const [payOpen, setPayOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? products.filter(
          (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
        )
      : products
    return list.slice(0, 60)
  }, [products, query])

  const usablePromos = promotions.filter((p) => p.active)

  return (
    <div className="flex h-full min-h-0 flex-col lg:flex-row">
      {/* Products */}
      <section className="flex min-h-0 flex-1 flex-col border-b border-border lg:border-b-0 lg:border-r">
        <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <TextInput
              placeholder="Cari produk (nama atau ID)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
            {filtered.length} produk
          </span>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stock <= 0}
                className="flex flex-col justify-between gap-2 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/50 hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="line-clamp-3 text-sm font-medium leading-snug text-card-foreground">
                    {p.name}
                  </span>
                  <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {p.id}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-primary">
                    {formatRupiah(p.price)}
                  </span>
                  <span
                    className={cn(
                      "text-[11px]",
                      p.stock <= 0 ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    Stok {p.stock}
                  </span>
                </div>
              </button>
            ))}
            {filtered.length === 0 ? (
              <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                Produk tidak ditemukan.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {/* Cart */}
      <aside className="flex min-h-0 w-full flex-col bg-card lg:w-[380px] xl:w-[420px]">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Keranjang</h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {cart.reduce((n, i) => n + i.quantity, 0)}
            </span>
          </div>
          {cart.length > 0 ? (
            <button
              onClick={clearCart}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" /> Kosongkan
            </button>
          ) : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground">
              <ShoppingCart className="h-10 w-10 opacity-30" />
              <p className="text-sm">Keranjang kosong.</p>
              <p className="text-xs">Pilih produk untuk memulai transaksi.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {cart.map((item) => (
                <li key={item.productId} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 flex-1 text-sm font-medium leading-snug">
                      {item.name}
                    </span>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      aria-label="Hapus item"
                      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {/* Quantity stepper */}
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        aria-label="Kurangi"
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={item.quantity}
                        onChange={(e) =>
                          setQuantity(item.productId, Math.max(0, Number(e.target.value) || 0))
                        }
                        className="h-8 w-10 border-x border-border bg-transparent text-center font-mono text-sm outline-none"
                      />
                      <button
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        aria-label="Tambah"
                        className="flex h-8 w-8 items-center justify-center text-muted-foreground hover:bg-muted"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {/* Editable price */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">@</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        value={item.price}
                        onChange={(e) => setItemPrice(item.productId, Number(e.target.value) || 0)}
                        className="h-8 w-24 rounded-md border border-border bg-transparent px-2 text-right font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <div className="mt-1.5 text-right font-mono text-sm font-semibold text-foreground">
                    {formatRupiah(item.price * item.quantity)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals + checkout */}
        <div className="border-t border-border p-4">
          {usablePromos.length > 0 ? (
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Promo
              </label>
              <select
                value={activePromotionId ?? ""}
                onChange={(e) => setActivePromotion(e.target.value || null)}
                className="h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Tanpa promo</option>
                {usablePromos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                    {p.type === "gift"
                      ? ` (🎁 ${p.giftName ?? "Hadiah"} × ${p.giftQty ?? 1})`
                      : p.type === "percent"
                        ? ` (${p.value}%)`
                        : ` (${formatRupiah(p.value)})`}
                  </option>
                ))}
              </select>
              {activePromotionId && !appliedPromotion ? (
                <p className="mt-1 text-xs text-destructive">
                  Promo belum berlaku (cek minimum belanja).
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatRupiah(subtotal)}</span>
            </div>
            {discount > 0 ? (
              <div className="flex justify-between text-primary">
                <span>Diskon{appliedPromotion ? ` · ${appliedPromotion.name}` : ""}</span>
                <span className="font-mono">− {formatRupiah(discount)}</span>
              </div>
            ) : null}
            {appliedPromotion?.type === "gift" ? (
              <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-primary">
                🎁 <span className="font-semibold">Free Gift:</span> {appliedPromotion.giftName} × {appliedPromotion.giftQty ?? 1}
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-border pt-2">
              <span className="font-semibold">Total</span>
              <span className="font-mono text-xl font-bold text-primary">
                {formatRupiah(total)}
              </span>
            </div>
          </div>

          <Button
            className="mt-3 w-full"
            size="lg"
            disabled={cart.length === 0}
            onClick={() => setPayOpen(true)}
          >
            Bayar {cart.length > 0 ? formatRupiah(total) : ""}
          </Button>
        </div>
      </aside>

      <PaymentDialog open={payOpen} onClose={() => setPayOpen(false)} />
    </div>
  )
}
