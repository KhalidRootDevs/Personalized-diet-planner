"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Leaf } from "lucide-react"
import { useApp } from "@/lib/store"
import { SCENE_PHOTO } from "@/lib/data/photos"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Example callouts on the hero photo. Positions are % of the hero box and sit on the
 * peppers, which stay in frame at any phone width. Values are rough per-100 g examples
 * (raw), labelled as examples — never presented as measurements of this photo.
 */
const CALLOUTS = [
  { label: "Red pepper", kcal: "~30", x: 53, pillTop: 19, dotY: 27, align: "center" },
  { label: "Green pepper", kcal: "~20", x: 84, pillTop: 33, dotY: 44, align: "right" },
  { label: "Yellow pepper", kcal: "~27", x: 36, pillTop: 49, dotY: 66, align: "left" },
] as const

function Hero() {
  return (
    <div className="relative h-[clamp(240px,46dvh,440px)] shrink-0 overflow-hidden rounded-b-[36px] bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element -- static prototype asset */}
      <img src={SCENE_PHOTO.hero} alt="A basket of fresh vegetables: peppers, eggplant, mushrooms, asparagus and herbs" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/10" aria-hidden />

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-[var(--gutter)] flex items-center gap-2 rounded-full bg-card/95 py-1.5 pr-3.5 pl-1.5 shadow-card">
        <span className="grid size-7 place-items-center rounded-full bg-lime text-charcoal">
          <Leaf className="size-4" aria-hidden />
        </span>
        <span className="text-[15px] leading-none font-bold tracking-tight">NutriPlan</span>
      </div>

      <div aria-hidden>
        {CALLOUTS.map((c) => (
          <div key={c.label} className="absolute flex w-0 flex-col items-center" style={{ left: `${c.x}%`, top: `${c.pillTop}%`, bottom: `${100 - c.dotY}%` }}>
            <span
              className={cn(
                "tabular relative rounded-full bg-card/95 px-3 py-1.5 text-[12px] leading-none font-semibold whitespace-nowrap text-charcoal shadow-card",
                c.align === "left" && "translate-x-[calc(50%-14px)]",
                c.align === "right" && "-translate-x-[calc(50%-14px)]",
              )}
            >
              {c.label} · {c.kcal} kcal
            </span>
            <span className="w-px flex-1 bg-white/90" />
            <span className="size-3 shrink-0 rounded-full border-2 border-white bg-lime" />
          </div>
        ))}
      </div>
      <p className="absolute right-[var(--gutter)] bottom-3 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white">Example values per 100 g</p>
    </div>
  )
}

export default function WelcomePage() {
  const router = useRouter()
  const loadDemo = useApp((s) => s.loadDemo)

  return (
    <main className="flex flex-1 flex-col">
      <Hero />

      <div className="px-gutter pt-5">
        <h1 className="text-[28px] leading-[34px] font-bold tracking-tight">Personalized nutrition for every stage of life</h1>
        <p className="text-callout mt-2 text-muted-foreground">Plan what to eat and understand what you actually eat, with local foods you know.</p>
      </div>

      <div className="px-gutter mt-auto space-y-2 pt-5 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button asChild size="lg" className="w-full">
          <Link href="/signup">Get started</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/login">I have an account</Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => {
            loadDemo()
            router.push("/home")
          }}
        >
          Explore with demo data
        </Button>
        <p className="text-caption hidden text-center text-muted-foreground [@media(min-height:700px)]:block">Prototype · supports healthy eating, doesn&apos;t replace medical care.</p>
      </div>
    </main>
  )
}
