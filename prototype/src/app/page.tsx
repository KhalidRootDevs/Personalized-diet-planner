"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppFrame, Splash } from "@/components/app/shell"
import { useApp } from "@/lib/store"

export default function Index() {
  const router = useRouter()
  const hydrated = useApp((s) => s.hydrated)
  const user = useApp((s) => s.user)
  const onboarded = useApp((s) => s.onboarded)
  useEffect(() => {
    if (!hydrated) return
    router.replace(!user ? "/welcome" : !onboarded ? "/onboarding" : "/home")
  }, [hydrated, user, onboarded, router])
  return (
    <AppFrame>
      <Splash />
    </AppFrame>
  )
}
