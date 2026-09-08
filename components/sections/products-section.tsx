"use client"

import { AlertTriangle, Pencil, Plus, RotateCcw, Search, Trash2, Upload } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { Button, Field, Modal, TextInput } from "@/components/ui-kit"
import { formatRupiah } from "@/lib/format"
import { parseProductsWorkbook } from "@/lib/import-products"
import { useStore } from "@/lib/store"
import type { Product } from "@/lib/types"

type Draft = { id: string; name: string; price: string; stock: string }

const emptyDraft: Draft = { id: "", name: "", price: "", stock: "" }

export function ProductsSection() {
  const { products, addProduct, updateProduct, deleteProduct, resetProducts, importProducts, clearAllData } =
    useStore()
  const [query, setQuery] = useState("")
  const [editing, setEditing] = useState<Product | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [open, setOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<{ products: Product[]; skipped: number } | null>(
    null,
  )
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  async function handleFile(file: File) {
    setImportError(null)
    try {
      const buffer = await file.arrayBuffer()
      const result = parseProductsWorkbook(buffer)
      if (result.products.length === 0) {
        setImportError("Tidak ada produk yang terbaca. Pastikan ada kolom Nama Barang dan Harga.")
        return
      }
      setImportPreview(result)
    } catch {
      setImportError("Gagal membaca file. Pastikan format .xlsx atau .xls yang valid.")
      setImportPreview(null)
    }
  }

  function confirmImport() {
    if (importPreview) importProducts(importPreview.products)
    setImportPreview(null)
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q),
    )
  }, [products, query])

  function openAdd() {
    setEditing(null)
    setDraft(emptyDraft)
    setOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setDraft({ id: p.id, name: p.name, price: String(p.price), stock: String(p.stock) })
    setOpen(true)
  }

  function submit() {
    const payload = {
      id: draft.id.trim(),
      name: draft.name.trim(),
      price: Number(draft.price) || 0,
      stock: Number(draft.stock) || 0,
    }
    if (!payload.name) return
    if (editing) {
      updateProduct(editing.id, { name: payload.name, price: payload.price, stock: payload.stock })
    } else {
      addProduct(payload)
    }
    setOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-base font-semibold">Produk</h1>
          <p className="text-xs text-muted-foreground">{products.length} item dalam katalog</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <TextInput
              placeholder="Cari produk…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-40 pl-9 sm:w-64"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ""
            }}
          />
          <Button
            variant="outline"
            size="md"
            onClick={() => fileRef.current?.click()}
            title="Ganti katalog dari file Excel"
          >
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Impor Excel</span>
          </Button>
          <Button variant="outline" size="md" onClick={resetProducts} title="Kembalikan ke data spreadsheet">
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => setConfirmClear(true)}
            title="Hapus semua data"
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
            <span className="hidden sm:inline">Hapus Semua</span>
          </Button>
          <Button size="md" onClick={openAdd}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-2 font-medium">ID</th>
              <th className="px-4 py-2 font-medium">Nama Barang</th>
              <th className="px-4 py-2 text-right font-medium">Harga</th>
              <th className="px-4 py-2 text-right font-medium">Stok</th>
              <th className="px-4 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-muted/40">
                <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{p.id}</td>
                <td className="px-4 py-2.5">{p.name}</td>
                <td className="px-4 py-2.5 text-right font-mono">{formatRupiah(p.price)}</td>
                <td className="px-4 py-2.5 text-right font-mono">{p.stock}</td>
                <td className="px-4 py-2.5">
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => openEdit(p)}
                      aria-label="Edit"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      aria-label="Hapus"
                      className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Tidak ada produk.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Produk" : "Tambah Produk"}
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={submit}>
              Simpan
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3">
          <Field label="ID Produk">
            <TextInput
              value={draft.id}
              disabled={!!editing}
              placeholder="Otomatis jika kosong"
              onChange={(e) => setDraft({ ...draft, id: e.target.value })}
            />
          </Field>
          <Field label="Nama Barang">
            <TextInput
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Harga (Rp)">
              <TextInput
                type="number"
                inputMode="numeric"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field label="Stok">
              <TextInput
                type="number"
                inputMode="numeric"
                value={draft.stock}
                onChange={(e) => setDraft({ ...draft, stock: e.target.value })}
                className="font-mono"
              />
            </Field>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!importPreview}
        onClose={() => setImportPreview(null)}
        title="Konfirmasi Impor"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setImportPreview(null)}>
              Batal
            </Button>
            <Button className="flex-1" onClick={confirmImport}>
              Ganti Katalog
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2 rounded-md bg-accent/60 p-3 text-accent-foreground">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Katalog saat ini ({products.length} item) akan{" "}
              <strong>diganti</strong> dengan data dari file. Transaksi yang sudah tersimpan tidak
              terpengaruh.
            </p>
          </div>
          <p>
            Terbaca <strong>{importPreview?.products.length ?? 0} produk</strong>
            {importPreview && importPreview.skipped > 0
              ? ` (${importPreview.skipped} baris dilewati karena tanpa nama)`
              : ""}
            .
          </p>
          {importPreview && importPreview.products.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  {importPreview.products.slice(0, 8).map((p) => (
                    <tr key={p.id}>
                      <td className="px-3 py-1.5 font-mono text-muted-foreground">{p.id}</td>
                      <td className="px-3 py-1.5">{p.name}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatRupiah(p.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {importPreview.products.length > 8 ? (
                <p className="px-3 py-1.5 text-center text-xs text-muted-foreground">
                  +{importPreview.products.length - 8} produk lainnya
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={!!importError}
        onClose={() => setImportError(null)}
        title="Gagal Impor"
        footer={
          <Button className="w-full" onClick={() => setImportError(null)}>
            Mengerti
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">{importError}</p>
      </Modal>

      <Modal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        title="Hapus Semua Data"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmClear(false)}>
              Batal
            </Button>
            <Button
              className="flex-1 bg-destructive text-white hover:bg-destructive/90"
              onClick={() => {
                clearAllData()
                setConfirmClear(false)
              }}
            >
              Ya, Hapus Semua
            </Button>
          </div>
        }
      >
        <div className="flex items-start gap-2 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-muted-foreground">
            Semua <strong>produk</strong>, <strong>promo</strong>, <strong>riwayat transaksi</strong>, dan{" "}
            <strong>keranjang</strong> akan dihapus permanen dari perangkat ini. Tindakan ini tidak bisa
            dibatalkan. Untuk mengembalikan katalog awal dari spreadsheet, gunakan tombol Reset.
          </p>
        </div>
      </Modal>
    </div>
  )
}
