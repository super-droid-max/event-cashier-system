"use client"

import { Banknote, Check, QrCode, Upload } from "lucide-react"
import { useRef, useState } from "react"
import { Button, Field, Modal, TextInput } from "@/components/ui-kit"
import { formatRupiah } from "@/lib/format"
import { printReceipt } from "@/lib/print-receipt"
import { fileToCompressedDataUrl } from "@/lib/image"
import { useStore } from "@/lib/store"
import type { PaymentMethod, Transaction } from "@/lib/types"
import { cn } from "@/lib/utils"

const QUICK_CASH = [50000, 100000, 150000, 200000]

export function PaymentDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { total, checkout } = useStore()
  const [method, setMethod] = useState<PaymentMethod>("CASH")
  const [received, setReceived] = useState<string>("")
  const [proof, setProof] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState<Transaction | null>(null)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const receivedNum = Number(received) || 0
  const change = receivedNum - total
  const canPayCash = method === "CASH" && receivedNum >= total && total > 0
  const canPayQris = method === "QRIS" && !!proof && total > 0

  function reset() {
    setMethod("CASH")
    setReceived("")
    setProof(null)
    setDone(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      setProof(await fileToCompressedDataUrl(file))
    } catch {
      setProof(null)
    } finally {
      setUploading(false)
    }
  }

  function handleConfirm() {
    setError("")
    try {
      const tx = checkout({
        paymentMethod: method,
        amountReceived: method === "CASH" ? receivedNum : null,
        paymentProof: method === "QRIS" ? proof : null,
      })
      setDone(tx)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transaksi gagal. Silakan cek stok dan coba lagi.")
    }
  }

  // Success / receipt view
  if (done) {
    return (
      <Modal open={open} onClose={handleClose} title="Transaksi Berhasil">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Nomor Transaksi</p>
            <p className="font-mono text-lg font-semibold">{done.id}</p>
          </div>
          <div className="w-full rounded-lg border border-border bg-muted/40 p-4 text-sm">
            <Row label="Total" value={formatRupiah(done.total)} strong />
            <Row label="Metode" value={done.paymentMethod} />
            {done.paymentMethod === "CASH" ? (
              <>
                <Row label="Diterima" value={formatRupiah(done.amountReceived ?? 0)} />
                <Row label="Kembalian" value={formatRupiah(done.change ?? 0)} strong />
              </>
            ) : (
              <Row label="Bukti Bayar" value="Tersimpan" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              size="lg"
              onClick={() => printReceipt(done)}
            >
              Print Struk
            </Button>
            <Button className="flex-1" size="lg" onClick={handleClose}>
              Transaksi Baru
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Pembayaran"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            Batal
          </Button>
          <Button
            className="flex-[2]"
            size="md"
            disabled={method === "CASH" ? !canPayCash : !canPayQris}
            onClick={handleConfirm}
          >
            Konfirmasi Bayar
          </Button>
        </div>
      }
    >
      {error ? <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div> : null}

      <div className="mb-4 rounded-lg bg-primary px-4 py-3 text-primary-foreground">
        <p className="text-xs uppercase tracking-wide opacity-80">Total Tagihan</p>
        <p className="font-mono text-3xl font-bold">{formatRupiah(total)}</p>
      </div>

      {/* Method selector */}
      <div className="mb-4 grid grid-cols-2 gap-2">
        <MethodButton
          active={method === "CASH"}
          onClick={() => setMethod("CASH")}
          icon={<Banknote className="h-5 w-5" />}
          label="Tunai (Cash)"
        />
        <MethodButton
          active={method === "QRIS"}
          onClick={() => setMethod("QRIS")}
          icon={<QrCode className="h-5 w-5" />}
          label="QRIS"
        />
      </div>

      {method === "CASH" ? (
        <div className="flex flex-col gap-3">
          <Field label="Uang Diterima">
            <TextInput
              type="number"
              inputMode="numeric"
              autoFocus
              placeholder="0"
              value={received}
              onChange={(e) => setReceived(e.target.value)}
              className="font-mono text-lg"
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setReceived(String(total))}>
              Uang Pas
            </Button>
            {QUICK_CASH.filter((v) => v >= total).map((v) => (
              <Button key={v} variant="secondary" size="sm" onClick={() => setReceived(String(v))}>
                {formatRupiah(v)}
              </Button>
            ))}
          </div>
          <div
            className={cn(
              "rounded-lg border p-4",
              change >= 0 ? "border-primary/30 bg-primary/5" : "border-border bg-muted/40",
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Kembalian</span>
              <span className="font-mono text-xl font-bold text-foreground">
                {change >= 0 ? formatRupiah(change) : "—"}
              </span>
            </div>
            {receivedNum > 0 && change < 0 ? (
              <p className="mt-1 text-xs text-destructive">
                Kurang {formatRupiah(Math.abs(change))}
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Tunjukkan QRIS ke pembeli, lalu unggah bukti pembayaran.
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
          {proof ? (
            <div className="overflow-hidden rounded-lg border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={proof} alt="Bukti pembayaran QRIS" className="max-h-64 w-full object-contain bg-muted" />
              <div className="flex items-center justify-between border-t border-border p-2">
                <span className="text-xs text-primary">Bukti terunggah</span>
                <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
                  Ganti
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 py-8 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground"
            >
              <Upload className="h-6 w-6" />
              {uploading ? "Memproses…" : "Unggah Bukti Pembayaran"}
            </button>
          )}
        </div>
      )}
    </Modal>
  )
}

function MethodButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-muted-foreground hover:border-primary/30",
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-mono", strong ? "font-bold text-foreground" : "text-foreground")}>
        {value}
      </span>
    </div>
  )
}
