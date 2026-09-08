import { read, utils } from "xlsx"
import type { Product } from "@/lib/types"

// Normalize a header/key: lowercase, strip spaces and non-alphanumerics.
function norm(key: string): string {
  return String(key).toLowerCase().replace(/[^a-z0-9]/g, "")
}

// Match a row's value against a list of candidate column names.
function pick(row: Record<string, unknown>, candidates: string[]): unknown {
  const wanted = candidates.map(norm)
  for (const rawKey of Object.keys(row)) {
    if (wanted.includes(norm(rawKey))) return row[rawKey]
  }
  return undefined
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  if (value == null) return 0
  // Strip currency symbols, thousand separators, spaces.
  const cleaned = String(value).replace(/[^0-9.-]/g, "")
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : 0
}

export type ImportResult = {
  products: Product[]
  skipped: number
}

// Parse an .xlsx/.xls ArrayBuffer into products, tolerating column-name variations.
export function parseProductsWorkbook(buffer: ArrayBuffer): ImportResult {
  const workbook = read(buffer, { cellDates: true })
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" })

  const products: Product[] = []
  let skipped = 0

  rows.forEach((row, index) => {
    const name = String(
      pick(row, ["nama barang", "nama", "name", "product name", "produk", "barang"]) ?? "",
    ).trim()
    if (!name) {
      skipped++
      return
    }
    const rawId = pick(row, ["id", "product id", "kode", "sku", "kode barang"])
    const id = rawId != null && String(rawId).trim() ? String(rawId).trim() : `P${index + 1}`
    const price = toNumber(pick(row, ["harga @", "harga", "price", "harga jual", "@"]))
    const stock = toNumber(pick(row, ["stok", "stock", "qty", "quantity", "jumlah"]))

    products.push({ id, name, price, stock })
  })

  return { products, skipped }
}
