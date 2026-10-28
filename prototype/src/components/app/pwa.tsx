"use client"

import { useEffect, useState } from "react"
import { Download, Share, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return
    if (process.env.NODE_ENV !== "production") return
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch(() => {})
  }, [])
  return null
}

const DISMISS_KEY = "nutriplan-install-dismissed"

/** Install banner: native prompt on Android/Chrome, manual instructions on iOS Safari. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1"
    } catch {}
    if (standalone || dismissed) return
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setHidden(false)
    }
    window.addEventListener("beforeinstallprompt", onPrompt)
    const t = isIos
      ? window.setTimeout(() => {
          setIos(true)
          setHidden(false)
        }, 1500)
      : undefined
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt)
      if (t) window.clearTimeout(t)
    }
  }, [])

  if (hidden) return null

  const dismiss = () => {
    setHidden(true)
    try {
      localStorage.setItem(DISMISS_KEY, "1")
    } catch {}
  }

  return (
    <div className="text-callout mx-[var(--gutter)] mb-2 flex items-start gap-3 rounded-2xl border border-border/80 bg-card p-4">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-forest text-ivory">
        <Download className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Install NutriPlan</p>
        {ios ? (
          <p className="text-muted-foreground">
            Tap <Share className="inline size-4 align-text-bottom" aria-label="Share" /> then <strong>Add to Home Screen</strong> to use it like an app.
          </p>
        ) : (
          <p className="text-muted-foreground">Add it to your home screen for a full-screen, app-like experience.</p>
        )}
        {deferred && (
          <Button
            size="sm"
            className="mt-2"
            onClick={async () => {
              await deferred.prompt()
              await deferred.userChoice
              setDeferred(null)
              setHidden(true)
            }}
          >
            Install app
          </Button>
        )}
      </div>
      <button onClick={dismiss} className="-m-1 grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label="Dismiss">
        <X className="size-4" />
      </button>
    </div>
  )
}
