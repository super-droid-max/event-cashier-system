"use client"

import { Banknote, Download, QrCode, Receipt, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { Badge, Modal, TextInput } from "@/components/ui-kit"
import { formatDateTime, formatRupiah } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { PaymentMethod, Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"
import * as XLSX from "xlsx"

type MethodFilter = "ALL" | PaymentMethod

export function TransactionsSection() {
  const { transactions } = useStore()
  const [query, setQuery] = useState("")
  const [method, setMethod] = useState<MethodFilter>("ALL")
  const [date, setDate] = useState("")
  const [detail, setDetail] = useState<Transaction | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return transactions.filter((t) => {
      if (method !== "ALL" && t.paymentMethod !== method) return false
      if (date && !t.createdAt.startsWith(date)) return false
      if (q) {
        const inId = t.id.toLowerCase().includes(q)
        const inItems = t.items.some((i) => i.name.toLowerCase().includes(q))
        if (!inId && !inItems) return false
      }
      return true
    })
  }, [transactions, query, method, date])

  const totalValue = filtered.reduce((sum, t) => sum + t.total, 0)

  const exportToExcel = () => {
    if (filtered.length === 0) return

    const historyRows = filtered.map((t) => ({
      "No. Transaksi": t.id,
      "Tanggal & Waktu": formatDateTime(t.createdAt),
      "Produk": t.items.map((i) => `${i.name} x${i.quantity}`).join(" | "),
      "Total Item": t.items.reduce((sum, i) => sum + i.quantity, 0),
      "Subtotal": t.subtotal,
      "Diskon": t.discount,
      "Promo": t.promotionName ?? "",
      "Total": t.total,
      "Metode Pembayaran": t.paymentMethod,
      "Uang Diterima": t.amountReceived ?? "",
      "Kembalian": t.change ?? "",
    }))

    const detailRows = filtered.flatMap((t) =>
      t.items.map((i) => ({
        "No. Transaksi": t.id,
        "Tanggal & Waktu": formatDateTime(t.createdAt),
        "Kode Produk": i.productId,
        "Produk": i.name,
        "Qty": i.quantity,
        "Harga": i.price,
        "Subtotal Item": i.lineTotal,
        "Metode Pembayaran": t.paymentMethod,
      })),
    )

    const workbook = XLSX.utils.book_new()
    const historySheet = XLSX.utils.json_to_sheet(historyRows)
    const detailSheet = XLSX.utils.json_to_sheet(detailRows)

    historySheet["!cols"] = [
      { wch: 24 }, { wch: 20 }, { wch: 45 }, { wch: 12 }, { wch: 15 },
      { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 },
    ]
    detailSheet["!cols"] = [
      { wch: 24 }, { wch: 20 }, { wch: 18 }, { wch: 40 }, { wch: 10 },
      { wch: 15 }, { wch: 18 }, { wch: 20 },
    ]

    XLSX.utils.book_append_sheet(workbook, historySheet, "Riwayat")
    XLSX.utils.book_append_sheet(workbook, detailSheet, "Detail Item")

    const datePart = date || new Date().toISOString().slice(0, 10)
    XLSX.writeFile(workbook, `riwayat-transaksi-${datePart}.xlsx`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="border-b border-border bg-card px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div>
            <h1 className="text-base font-semibold">Riwayat Transaksi</h1>
            <p className="text-xs text-muted-foreground">
              {filtered.length} transaksi · {formatRupiah(totalValue)}
            </p>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <TextInput
                placeholder="Cari no. / produk…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-40 pl-9 sm:w-56"
              />
            </div>
            <TextInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-40"
            />
            <button
              type="button"
              onClick={exportToExcel}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              title="Export riwayat ke Excel"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <div className="flex overflow-hidden rounded-md border border-border">
              {(["ALL", "CASH", "QRIS"] as MethodFilter[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium",
                    method === m
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {m === "ALL" ? "Semua" : m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Receipt className="h-10 w-10 opacity-30" />
            <p className="text-sm">Belum ada transaksi.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setDetail(t)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 hover:bg-primary/5"
                >
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                      t.paymentMethod === "CASH"
                        ? "bg-chart-3/15 text-chart-3"
                        : "bg-chart-2/15 text-chart-2",
                    )}
                  >
                    {t.paymentMethod === "CASH" ? (
                      <Banknote className="h-5 w-5" />
                    ) : (
                      <QrCode className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-sm font-medium">{t.id}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(t.createdAt)} · {t.items.length} item
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold">{formatRupiah(t.total)}</p>
                    <Badge
                      className={cn(
                        "mt-0.5",
                        t.paymentMethod === "CASH"
                          ? "bg-chart-3/15 text-chart-3"
                          : "bg-chart-2/15 text-chart-2",
                      )}
                    >
                      {t.paymentMethod}
                    </Badge>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.id ?? "Detail"}
        wide
      >
        {detail ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">{formatDateTime(detail.createdAt)}</p>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 font-medium">Produk</th>
                    <th className="px-3 py-2 text-center font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Harga</th>
                    <th className="px-3 py-2 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {detail.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">{i.name}</td>
                      <td className="px-3 py-2 text-center font-mono">{i.quantity}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatRupiah(i.price)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatRupiah(i.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatRupiah(detail.subtotal)}</span>
              </div>
              {detail.discount > 0 ? (
                <div className="flex justify-between text-primary">
                  <span>Diskon{detail.promotionName ? ` · ${detail.promotionName}` : ""}</span>
                  <span className="font-mono">− {formatRupiah(detail.discount)}</span>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-border pt-1 font-semibold">
                <span>Total</span>
                <span className="font-mono text-primary">{formatRupiah(detail.total)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">Metode</span>
                <span>{detail.paymentMethod}</span>
              </div>
              {detail.paymentMethod === "CASH" ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Diterima</span>
                    <span className="font-mono">{formatRupiah(detail.amountReceived ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Kembalian</span>
                    <span className="font-mono">{formatRupiah(detail.change ?? 0)}</span>
                  </div>
                </>
              ) : null}
            </div>

            {detail.paymentMethod === "QRIS" ? (
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Bukti Pembayaran
                </p>
                {detail.paymentProof ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={detail.paymentProof}
                    alt={`Bukti pembayaran ${detail.id}`}
                    className="max-h-80 w-full rounded-lg border border-border object-contain bg-muted"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">Tidak ada bukti tersimpan.</p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
