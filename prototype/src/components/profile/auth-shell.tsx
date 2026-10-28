"use client"

import { Leaf } from "lucide-react"
import { BackButton } from "@/components/app/page"

/** Shared frame for sign-in, sign-up and password reset (§19.1, UI-SPEC §5.2). */
export function AuthShell({ title, subtitle, back = "/welcome", children, footer }: { title: string; subtitle?: string; back?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex h-14 items-center pl-3">
        <BackButton href={back} />
      </div>
      <div className="px-gutter flex flex-1 flex-col pb-8">
        <div className="mt-2 mb-8">
          <span className="mb-6 grid size-12 place-items-center rounded-[14px] bg-forest text-ivory">
            <Leaf className="size-6" aria-hidden />
          </span>
          <h1 className="text-display">{title}</h1>
          {subtitle && <p className="text-body mt-2 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex-1">{children}</div>
        {footer && <div className="text-callout mt-10 text-center text-muted-foreground">{footer}</div>}
      </div>
    </main>
  )
}

/** Mock social sign-in buttons (prototype only). */
export function SocialButtons({ onPick }: { onPick: (provider: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["Google", "Phone (OTP)"].map((p) => (
        <button key={p} type="button" onClick={() => onPick(p)} className="h-12 rounded-[14px] border border-input bg-card text-[15px] font-semibold text-charcoal transition-colors hover:bg-muted">
          {p}
        </button>
      ))}
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="text-caption my-6 flex items-center gap-3 text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or with email
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
