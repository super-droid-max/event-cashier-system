"use client"

import { Pencil, Plus, Tag, Trash2 } from "lucide-react"
import { useState } from "react"
import { Badge, Button, Field, Modal, TextInput } from "@/components/ui-kit"
import { formatRupiah } from "@/lib/format"
import { useStore } from "@/lib/store"
import type { Promotion } from "@/lib/types"
import { cn } from "@/lib/utils"

type Draft = {
  name: string
  type: "percent" | "amount"
  value: string
  minSubtotal: string
  active: boolean
}

const emptyDraft: Draft = { name: "", type: "percent", value: "", minSubtotal: "", active: true }

export function PromotionsSection() {
  const { promotions, addPromotion, updatePromotion, deletePromotion } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  function openAdd() {
    setEditing(null)
    setDraft(emptyDraft)
    setOpen(true)
  }

  function openEdit(p: Promotion) {
    setEditing(p)
    setDraft({
      name: p.name,
      type: p.type,
      value: String(p.value),
      minSubtotal: String(p.minSubtotal),
      active: p.active,
    })
    setOpen(true)
  }

  function submit() {
    const payload = {
      name: draft.name.trim(),
      type: draft.type,
      value: Number(draft.value) || 0,
      minSubtotal: Number(draft.minSubtotal) || 0,
      active: draft.active,
    }
    if (!payload.name) return
    if (editing) updatePromotion(editing.id, payload)
    else addPromotion(payload)
    setOpen(false)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-card px-4 py-3">
        <div>
          <h1 className="text-base font-semibold">Promo</h1>
          <p className="text-xs text-muted-foreground">{promotions.length} promo tersimpan</p>
        </div>
        <Button className="ml-auto" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Tambah Promo</span>
        </Button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Tag className="h-10 w-10 opacity-30" />
            <p className="text-sm">Belum ada promo.</p>
            <p className="text-xs">Tambahkan diskon untuk dipakai di kasir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {promotions.map((p) => (
              <div key={p.id} className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-medium leading-tight">{p.name}</h3>
                    <p className="mt-1 font-mono text-sm text-primary">
                      {p.type === "percent" ? `${p.value}%` : formatRupiah(p.value)}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      p.active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {p.active ? "Aktif" : "Nonaktif"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {p.minSubtotal > 0 ? `Min. belanja ${formatRupiah(p.minSubtotal)}` : "Tanpa minimum"}
                </p>
                <div className="mt-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updatePromotion(p.id, { active: !p.active })}
                  >
                    {p.active ? "Nonaktifkan" : "Aktifkan"}
                  </Button>
                  <button
                    onClick={() => openEdit(p)}
                    aria-label="Edit"
                    className="ml-auto rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deletePromotion(p.id)}
                    aria-label="Hapus"
                    className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit Promo" : "Tambah Promo"}
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
          <Field label="Nama Promo">
            <TextInput
              value={draft.name}
              placeholder="mis. Diskon Member"
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <Field label="Tipe Diskon">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: "percent" })}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium",
                  draft.type === "percent"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                Persen (%)
              </button>
              <button
                type="button"
                onClick={() => setDraft({ ...draft, type: "amount" })}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium",
                  draft.type === "amount"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                Nominal (Rp)
              </button>
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={draft.type === "percent" ? "Nilai (%)" : "Nilai (Rp)"}>
              <TextInput
                type="number"
                inputMode="numeric"
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                className="font-mono"
              />
            </Field>
            <Field label="Min. Belanja (Rp)">
              <TextInput
                type="number"
                inputMode="numeric"
                value={draft.minSubtotal}
                onChange={(e) => setDraft({ ...draft, minSubtotal: e.target.value })}
                className="font-mono"
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
              className="h-4 w-4 accent-primary"
            />
            Aktifkan promo ini
          </label>
        </div>
      </Modal>
    </div>
  )
}
