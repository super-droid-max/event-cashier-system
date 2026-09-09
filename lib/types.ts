export type Product = {
  id: string
  name: string
  stock: number
  price: number
}

export type PromotionType = "percent" | "amount" | "gift"

export type Promotion = {
  id: string
  name: string
  type: PromotionType
  value: number
  minSubtotal: number
  active: boolean
  /** Used when type === "gift". */
  giftName?: string
  giftQty?: number
  /** Remaining free-gift stock for this promotion. */
  giftStock?: number
}

export type CartItem = {
  productId: string
  name: string
  quantity: number
  /** Selling price, editable during the transaction. */
  price: number
}

export type PaymentMethod = "CASH" | "QRIS"

export type TransactionItem = {
  productId: string
  name: string
  quantity: number
  price: number
  lineTotal: number
}

export type Transaction = {
  id: string
  createdAt: string
  items: TransactionItem[]
  subtotal: number
  discount: number
  promotionName: string | null
  giftName: string | null
  giftQty: number
  total: number
  paymentMethod: PaymentMethod
  amountReceived: number | null
  change: number | null
  /** Data URL of the uploaded QRIS payment proof. */
  paymentProof: string | null
}
