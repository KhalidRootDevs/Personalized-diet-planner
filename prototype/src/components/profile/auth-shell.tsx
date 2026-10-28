"use client"

import { Leaf } from "lucide-react"
import { BackButton } from "@/components/app/page"
import { RECIPE_PHOTO } from "@/lib/data/photos"

const STACK = [RECIPE_PHOTO.r_rice_fish_dal, RECIPE_PHOTO.r_khichuri, RECIPE_PHOTO.r_oats_milk]

/** Brand mark with a small stack of round dish photos (refs: overlapping meal photos). */
function BrandStack() {
  return (
    <div className="flex items-center" aria-hidden>
      {STACK.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- static prototype asset
        <img key={src} src={src} alt="" className="-mr-2.5 size-10 rounded-full object-cover ring-[3px] ring-background" style={{ zIndex: i }} />
      ))}
      <span className="z-10 grid size-10 place-items-center rounded-full bg-lime text-charcoal ring-[3px] ring-background">
        <Leaf className="size-[18px]" />
      </span>
    </div>
  )
}

/** Shared one-screen frame for sign-in, sign-up and password reset (§19.1, UI-SPEC §5.2). */
export function AuthShell({ title, subtitle, back = "/welcome", children, footer }: { title: string; subtitle?: string; back?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="flex h-16 items-center justify-between pr-gutter pl-4">
        <BackButton href={back} />
        <BrandStack />
      </div>
      <div className="px-gutter flex flex-1 flex-col pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-4">
          <h1 className="mt-1 text-[28px] leading-[34px] font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="text-callout mt-1 text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex-1">{children}</div>
        {footer && <div className="text-callout mt-4 text-center text-muted-foreground">{footer}</div>}
      </div>
    </main>
  )
}

/** Mock social sign-in buttons (prototype only). */
export function SocialButtons({ onPick }: { onPick: (provider: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {["Google", "Phone (OTP)"].map((p) => (
        <button key={p} type="button" onClick={() => onPick(p)} className="h-12 rounded-full bg-card text-[15px] font-semibold text-charcoal shadow-card transition-colors hover:bg-muted">
          {p}
        </button>
      ))}
    </div>
  )
}

export function OrDivider() {
  return (
    <div className="text-caption my-3.5 flex items-center gap-3 text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      or with email
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
