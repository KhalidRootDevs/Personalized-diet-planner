import { Suspense } from "react"
import { LogFlow } from "@/components/log/log-flow"

export default function LogNewPage() {
  return (
    <Suspense fallback={null}>
      <LogFlow />
    </Suspense>
  )
}
