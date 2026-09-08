export function formatRupiah(value: number): string {
  const rounded = Math.round(value || 0)
  return "Rp " + rounded.toLocaleString("id-ID")
}

export function formatNumber(value: number): string {
  return (value || 0).toLocaleString("id-ID")
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}
