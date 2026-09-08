import type { Transaction } from "@/lib/types"
import { formatDateTime, formatRupiah } from "@/lib/format"

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function printReceipt(transaction: Transaction) {
  if (typeof window === "undefined") return

  const printWindow = window.open("", "_blank", "width=420,height=720")
  if (!printWindow) {
    window.alert("Jendela print diblokir browser. Izinkan pop-up untuk mencetak struk.")
    return
  }

  const itemsHtml = transaction.items
    .map(
      (item) => `
        <div class="item">
          <div class="name">${escapeHtml(item.name)}</div>
          <div class="line">
            <span>${item.quantity} x ${formatRupiah(item.price)}</span>
            <span>${formatRupiah(item.lineTotal)}</span>
          </div>
        </div>`,
    )
    .join("")

  const promotionHtml = transaction.discount > 0
    ? `<div class="row"><span>Diskon${transaction.promotionName ? ` (${escapeHtml(transaction.promotionName)})` : ""}</span><span>- ${formatRupiah(transaction.discount)}</span></div>`
    : ""

  const paymentHtml = transaction.paymentMethod === "CASH"
    ? `
      <div class="row"><span>Diterima</span><span>${formatRupiah(transaction.amountReceived ?? 0)}</span></div>
      <div class="row"><span>Kembalian</span><span>${formatRupiah(transaction.change ?? 0)}</span></div>`
    : `<div class="row"><span>Pembayaran</span><span>QRIS</span></div>`

  printWindow.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Struk ${escapeHtml(transaction.id)}</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 8mm 5mm; width: 80mm; font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; }
    .center { text-align: center; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
    .muted { color: #555; font-size: 10px; }
    .sep { border-top: 1px dashed #777; margin: 10px 0; }
    .row { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0; }
    .item { margin: 7px 0; }
    .name { font-weight: 600; line-height: 1.3; }
    .line { display: flex; justify-content: space-between; gap: 8px; margin-top: 2px; }
    .total { font-size: 16px; font-weight: 700; }
    .thanks { margin-top: 14px; font-weight: 600; }
    @media print { body { padding: 5mm; } }
  </style>
</head>
<body>
  <div class="center">
    <div class="title">KASIR GATHERING</div>
    <div class="muted">POS Event</div>
    <div class="muted">${escapeHtml(transaction.id)}</div>
    <div class="muted">${escapeHtml(formatDateTime(transaction.createdAt))}</div>
  </div>
  <div class="sep"></div>
  ${itemsHtml}
  <div class="sep"></div>
  <div class="row"><span>Subtotal</span><span>${formatRupiah(transaction.subtotal)}</span></div>
  ${promotionHtml}
  <div class="row total"><span>TOTAL</span><span>${formatRupiah(transaction.total)}</span></div>
  <div class="sep"></div>
  <div class="row"><span>Metode</span><span>${transaction.paymentMethod}</span></div>
  ${paymentHtml}
  <div class="center thanks">Terima kasih 🙏</div>
</body>
</html>`)
  printWindow.document.close()
  window.setTimeout(() => {
    printWindow.focus()
    printWindow.print()
  }, 300)
}
