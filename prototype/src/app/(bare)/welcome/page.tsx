"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { CalendarDays, Camera, HeartHandshake, Leaf, ShieldCheck } from "lucide-react"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { InstallPrompt } from "@/components/app/pwa"

const POINTS = [
  { icon: CalendarDays, title: "Plan what to eat", text: "Meal plans built around your body, budget, schedule and local foods." },
  { icon: Camera, title: "Understand what you ate", text: "Snap or type a meal, confirm it, and see how it compares with your plan." },
  { icon: HeartHandshake, title: "For every stage of life", text: "From a baby's first foods to busy workdays and older age." },
  { icon: ShieldCheck, title: "Safety first", text: "Allergies and food-safety rules are always checked. Never paywalled." },
]

export default function WelcomePage() {
  const router = useRouter()
  const loadDemo = useApp((s) => s.loadDemo)

  return (
    <main className="flex flex-1 flex-col pt-safe">
      <div className="relative overflow-hidden bg-sage px-6 pt-12 pb-10">
        <div aria-hidden className="absolute -top-10 -right-12 size-48 rounded-full bg-[#c9dac4]" />
        <div aria-hidden className="absolute top-28 -right-4 size-20 rounded-full bg-terracotta/30" />
        <div className="relative">
          <div className="flex items-center gap-2 text-forest">
            <Leaf className="size-6" aria-hidden />
            <span className="font-serif text-2xl">NutriPlan</span>
          </div>
          <h1 className="mt-10 max-w-[18rem] font-serif text-[34px] leading-[1.15] text-charcoal">Personalized nutrition for every stage of life</h1>
          <p className="mt-3 max-w-xs text-charcoal/80">Your personal nutrition companion for planning meals, understanding what you eat, and making healthier choices in real life.</p>
        </div>
      </div>

      <ul className="space-y-4 px-6 py-8">
        {POINTS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-forest ring-1 ring-border">
              <Icon className="size-5" aria-hidden />
            </span>
            <div>
              <p className="font-medium">{title}</p>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-auto space-y-3 px-6 pb-8">
        <InstallPrompt />
        <Button asChild size="lg" className="w-full">
          <Link href="/signup">Create an account</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/login">I already have an account</Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full text-forest"
          onClick={() => {
            loadDemo()
            router.push("/home")
          }}
        >
          Explore with demo data
        </Button>
        <p className="text-center text-xs text-muted-foreground">Prototype for stakeholder review. Data stays in this browser. NutriPlan supports healthy eating and doesn&apos;t replace medical care.</p>
      </div>
    </main>
  )
}
