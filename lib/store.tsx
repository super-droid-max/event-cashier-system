"use client"

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import seedProducts from "@/lib/data/products.json"
import type {
  CartItem,
  PaymentMethod,
  Product,
  Promotion,
  Transaction,
  TransactionItem,
} from "@/lib/types"

const KEYS = {
  products: "pos:products",
  promotions: "pos:promotions",
  transactions: "pos:transactions",
  cart: "pos:cart",
} as const

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save<T>(key: string, value: T) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full (large payment proofs) — fail silently rather than break checkout.
  }
}

export type CheckoutInput = {
  paymentMethod: PaymentMethod
  amountReceived: number | null
  paymentProof: string | null
}

type StoreValue = {
  ready: boolean
  products: Product[]
  promotions: Promotion[]
  transactions: Transaction[]
  cart: CartItem[]
  activePromotionId: string | null
  // derived
  subtotal: number
  discount: number
  total: number
  appliedPromotion: Promotion | null
  // products
  addProduct: (p: Omit<Product, "id"> & { id?: string }) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  deleteProduct: (id: string) => void
  resetProducts: () => void
  importProducts: (products: Product[]) => void
  clearAllData: () => void
  // promotions
  addPromotion: (p: Omit<Promotion, "id">) => void
  updatePromotion: (id: string, patch: Partial<Promotion>) => void
  deletePromotion: (id: string) => void
  // cart
  addToCart: (product: Product) => void
  setQuantity: (productId: string, quantity: number) => void
  setItemPrice: (productId: string, price: number) => void
  removeFromCart: (productId: string) => void
  clearCart: () => void
  setActivePromotion: (id: string | null) => void
  // checkout
  checkout: (input: CheckoutInput) => Transaction
  // transactions
  deleteTransaction: (id: string) => void
  clearTransactions: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

function nextTransactionNumber(transactions: Transaction[], now: Date): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  const datePart = `${y}${m}${d}`
  const todayCount = transactions.filter((t) => t.id.includes(`TRX-${datePart}`)).length
  const seq = String(todayCount + 1).padStart(4, "0")
  return `TRX-${datePart}-${seq}`
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [activePromotionId, setActivePromotionId] = useState<string | null>(null)

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setProducts(load<Product[]>(KEYS.products, seedProducts as Product[]))
    setPromotions(load<Promotion[]>(KEYS.promotions, []))
    setTransactions(load<Transaction[]>(KEYS.transactions, []))
    setCart(load<CartItem[]>(KEYS.cart, []))
    setReady(true)
  }, [])

  useEffect(() => {
    if (ready) save(KEYS.products, products)
  }, [products, ready])
  useEffect(() => {
    if (ready) save(KEYS.promotions, promotions)
  }, [promotions, ready])
  useEffect(() => {
    if (ready) save(KEYS.transactions, transactions)
  }, [transactions, ready])
  useEffect(() => {
    if (ready) save(KEYS.cart, cart)
  }, [cart, ready])

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  )

  const appliedPromotion = useMemo(() => {
    // If the cashier explicitly selected a promo, use it when eligible.
    const selected = promotions.find((p) => p.id === activePromotionId && p.active)
    if (selected && subtotal >= selected.minSubtotal) {
      if (selected.type !== "gift" || (selected.giftStock ?? 0) > 0) return selected
    }

    // Otherwise automatically use the highest eligible threshold. This makes
    // "belanja sekian dapat hadiah" work without manual selection.
    const eligible = promotions.filter((p) => {
      if (!p.active || subtotal < p.minSubtotal) return false
      if (p.type === "gift" && (p.giftStock ?? 0) <= 0) return false
      return true
    })
    if (eligible.length === 0) return null
    return [...eligible].sort((a, b) => b.minSubtotal - a.minSubtotal)[0]
  }, [promotions, activePromotionId, subtotal])

  const discount = useMemo(() => {
    if (!appliedPromotion) return 0
    const raw =
      appliedPromotion.type === "percent"
        ? (subtotal * appliedPromotion.value) / 100
        : appliedPromotion.value
    return Math.min(Math.round(raw), subtotal)
  }, [appliedPromotion, subtotal])

  const total = Math.max(0, subtotal - discount)
  const giftName = appliedPromotion?.type === "gift" ? appliedPromotion.giftName?.trim() || null : null
  const giftQty = giftName ? Math.max(1, appliedPromotion?.giftQty || 1) : 0

  const value: StoreValue = {
    ready,
    products,
    promotions,
    transactions,
    cart,
    activePromotionId,
    subtotal,
    discount,
    total,
    appliedPromotion,

    addProduct: (p) =>
      setProducts((prev) => {
        const id = p.id?.trim() || `P${Date.now()}`
        return [{ id, name: p.name, price: p.price, stock: p.stock }, ...prev]
      }),
    updateProduct: (id, patch) =>
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    deleteProduct: (id) => setProducts((prev) => prev.filter((p) => p.id !== id)),
    resetProducts: () => setProducts(seedProducts as Product[]),
    importProducts: (next) => setProducts(next),
    clearAllData: () => {
      setProducts([])
      setPromotions([])
      setTransactions([])
      setCart([])
      setActivePromotionId(null)
    },

    addPromotion: (p) =>
      setPromotions((prev) => [{ ...p, id: `PROMO${Date.now()}` }, ...prev]),
    updatePromotion: (id, patch) =>
      setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    deletePromotion: (id) => {
      setPromotions((prev) => prev.filter((p) => p.id !== id))
      setActivePromotionId((cur) => (cur === id ? null : cur))
    },

    addToCart: (product) =>
      setCart((prev) => {
        const existing = prev.find((i) => i.productId === product.id)
        const requested = (existing?.quantity ?? 0) + 1
        if (product.stock <= 0 || requested > product.stock) return prev
        if (existing) return prev.map((i) => i.productId === product.id ? { ...i, quantity: requested } : i)
        return [...prev, { productId: product.id, name: product.name, quantity: 1, price: product.price }]
      }),
    setQuantity: (productId, quantity) =>
      setCart((prev) => {
        const product = products.find((p) => p.id === productId)
        if (quantity <= 0) return prev.filter((i) => i.productId !== productId)
        if (!product || quantity > product.stock) return prev
        return prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
      }),
    setItemPrice: (productId, price) =>
      setCart((prev) =>
        prev.map((i) => (i.productId === productId ? { ...i, price: Math.max(0, price) } : i)),
      ),
    removeFromCart: (productId) =>
      setCart((prev) => prev.filter((i) => i.productId !== productId)),
    clearCart: () => {
      setCart([])
      setActivePromotionId(null)
    },
    setActivePromotion: (id) => setActivePromotionId(id),

    checkout: (input) => {
      if (cart.length === 0) throw new Error("Keranjang kosong.")
      for (const item of cart) {
        const product = products.find((p) => p.id === item.productId)
        if (!product) throw new Error(`Produk ${item.name} tidak ditemukan.`)
        if (product.stock <= 0 || item.quantity > product.stock) {
          throw new Error(`Stok ${item.name} tidak mencukupi. Stok tersedia: ${product.stock}.`)
        }
      }
      const now = new Date()
      const items: TransactionItem[] = cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        price: i.price,
        lineTotal: i.price * i.quantity,
      }))
      if (appliedPromotion?.type === "gift") {
        const stock = appliedPromotion.giftStock ?? 0
        if (stock < giftQty) {
          throw new Error(`Stok hadiah ${appliedPromotion.giftName || "promo"} tidak mencukupi.`)
        }
      }

      const tx: Transaction = {
        id: nextTransactionNumber(transactions, now),
        createdAt: now.toISOString(),
        items,
        subtotal,
        discount,
        promotionName: appliedPromotion?.name ?? null,
        giftName,
        giftQty,
        total,
        paymentMethod: input.paymentMethod,
        amountReceived: input.amountReceived,
        change:
          input.paymentMethod === "CASH" && input.amountReceived != null
            ? Math.max(0, input.amountReceived - total)
            : null,
        paymentProof: input.paymentMethod === "QRIS" ? input.paymentProof : null,
      }
      setTransactions((prev) => [tx, ...prev])
      // Reduce stock for sold products.
      setProducts((prev) =>
        prev.map((p) => {
          const sold = items.find((i) => i.productId === p.id)
          return sold ? { ...p, stock: p.stock - sold.quantity } : p
        }),
      )
      setCart([])
      setActivePromotionId(null)
      return tx
    },

    deleteTransaction: (id) => {
      const transaction = transactions.find((t) => t.id === id)
      if (!transaction) return

      // Restore the sold quantity back to stock before removing the transaction.
      // If a product was deleted after the sale, there is no product record to restore.
      setProducts((prev) =>
        prev.map((p) => {
          const sold = transaction.items.find((i) => i.productId === p.id)
          return sold ? { ...p, stock: p.stock + sold.quantity } : p
        }),
      )
      setTransactions((prev) => prev.filter((t) => t.id !== id))
      if (transaction.giftName && transaction.giftQty > 0) {
        setPromotions((prev) =>
          prev.map((p) =>
            p.type === "gift" && p.giftName?.trim() === transaction.giftName?.trim()
              ? { ...p, giftStock: (p.giftStock ?? 0) + transaction.giftQty }
              : p,
          ),
        )
      }
    },
    clearTransactions: () => setTransactions([]),
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within StoreProvider")
  return ctx
}
