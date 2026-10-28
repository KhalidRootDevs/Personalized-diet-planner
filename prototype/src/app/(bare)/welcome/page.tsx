"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarDays, Camera, Fish, HeartHandshake, Leaf, ShieldCheck } from "lucide-react"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { IconTile } from "@/components/app/page"
import { InstallPrompt } from "@/components/app/pwa"

const POINTS = [
  { icon: CalendarDays, title: "Plan what to eat", text: "Meal plans built around your body, budget, schedule and local foods." },
  { icon: Camera, title: "Understand what you ate", text: "Snap or type a meal, confirm it, and compare it with your plan." },
  { icon: HeartHandshake, title: "For every stage of life", text: "From a baby's first foods to busy workdays and older age." },
  { icon: ShieldCheck, title: "Safety first", text: "Allergies and food-safety rules are always checked. Never paywalled." },
]

/** Product preview collage for the hero — illustrative UI, not real data. */
function HeroPreview() {
  return (
    <div aria-hidden className="relative h-[244px] overflow-hidden rounded-[28px] bg-sage/70">
      <div className="absolute -top-14 -right-10 size-44 rounded-full bg-[#cddcc8]" />
      <div className="absolute -bottom-10 -left-8 size-28 rounded-full bg-[#ecd3c6]/70" />
      <div className="absolute top-5 left-5 w-[214px] rounded-2xl border border-border/80 bg-card p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-sage text-forest">
            <Fish className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-caption text-muted-foreground">Lunch · 1:00 PM</p>
            <p className="text-callout truncate font-semibold">Rice, rui fish &amp; dal</p>
          </div>
        </div>
      </div>
      <div className="absolute right-5 bottom-5 w-[184px] rounded-2xl border border-border/80 bg-card p-3">
        <p className="text-caption text-muted-foreground">Today so far · estimate</p>
        <p className="tabular text-headline mt-0.5">
          ~1,240 <span className="text-caption font-normal text-muted-foreground">kcal</span>
        </p>
        <div className="relative mt-2 h-1.5 rounded-full bg-muted">
          <div className="absolute inset-y-0 left-[58%] w-[16%] rounded-full bg-sage" />
          <div className="absolute inset-y-0 left-0 w-[52%] rounded-full bg-forest" />
        </div>
      </div>
      <span className="absolute top-[96px] left-5 inline-flex h-7 items-center gap-1.5 rounded-full bg-forest px-3 text-xs font-semibold text-ivory">
        <ShieldCheck className="size-3.5" /> Allergy-checked
      </span>
    </div>
  )
}

export default function WelcomePage() {
  const router = useRouter()
  const loadDemo = useApp((s) => s.loadDemo)

  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="px-gutter flex items-center gap-2.5 pt-5 text-forest">
        <span className="grid size-9 place-items-center rounded-xl bg-forest text-ivory">
          <Leaf className="size-[18px]" aria-hidden />
        </span>
        <span className="font-serif text-[22px] leading-none">NutriPlan</span>
      </div>

      <div className="px-gutter mt-6">
        <HeroPreview />
        <h1 className="text-display mt-8 text-[34px] leading-[40px]">Personalized nutrition for every stage of life</h1>
        <p className="text-body mt-3 text-muted-foreground">Plan what to eat, understand what you actually eat, and make healthier choices in real life.</p>
      </div>

      <ul className="px-gutter mt-7 space-y-4">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3.5">
            <IconTile size="md">
              <Icon aria-hidden />
            </IconTile>
            <div className="min-w-0 pt-0.5">
              <p className="text-body font-semibold">{title}</p>
              <p className="text-caption mt-0.5 text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="px-gutter mt-auto space-y-3 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="-mx-[var(--gutter)]">
          <InstallPrompt />
        </div>
        <Button asChild size="lg" className="w-full">
          <Link href="/signup">Create an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/login">I already have an account</Link>
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
        <p className="text-caption pt-1 text-center text-muted-foreground">Prototype for stakeholder review. Data stays in this browser. NutriPlan supports healthy eating and doesn&apos;t replace medical care.</p>
      </div>
    </main>
  )
}
