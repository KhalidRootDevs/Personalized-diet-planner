"use client"

import Link from "next/link"
import { ChevronLeft, Leaf } from "lucide-react"

/** Shared frame for sign-in, sign-up and password reset (§19.1). */
export function AuthShell({ title, subtitle, back = "/welcome", children, footer }: { title: string; subtitle?: string; back?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col px-6 pt-safe pb-8">
      <div className="flex h-14 items-center">
        <Link href={back} className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-muted" aria-label="Back">
          <ChevronLeft className="size-5" />
        </Link>
      </div>
      <div className="mb-8 mt-4">
        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-forest text-ivory">
          <Leaf className="size-6" aria-hidden />
        </span>
        <h1 className="font-serif text-[30px] leading-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex-1">{children}</div>
      {footer && <div className="mt-8 text-center text-sm text-muted-foreground">{footer}</div>}
    </main>
  )
}

/** Mock social sign-in buttons (prototype only). */
export function SocialButtons({ onPick }: { onPick: (provider: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["Google", "Phone (OTP)"].map((p) => (
        <button key={p} type="button" onClick={() => onPick(p)} className="h-11 rounded-lg border bg-card text-sm font-medium hover:bg-muted/60">
          {p}
        </button>
      ))}
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
