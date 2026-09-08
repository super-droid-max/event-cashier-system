import { POSApp } from "@/components/pos-app"
import { StoreProvider } from "@/lib/store"

export default function Page() {
  return (
    <StoreProvider>
      <POSApp />
    </StoreProvider>
  )
}
