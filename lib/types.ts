export type Product = {
  id: string
  name: string
  stock: number
  price: number
}

export type Promotion = {
  id: string
  name: string
  type: "percent" | "amount"
  value: number
  minSubtotal: number
  active: boolean
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
  total: number
  paymentMethod: PaymentMethod
  amountReceived: number | null
  change: number | null
  /** Data URL of the uploaded QRIS payment proof. */
  paymentProof: string | null
}
