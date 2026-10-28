"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { useT } from "@/lib/i18n"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime, nowHHMM } from "@/lib/date"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { PlannedMeal } from "@/lib/types"

/** Exactly one next step (§44.6). Order: an earlier meal left unrecorded, the next meal, then the weekly review. */
export function NextStepCard({ meals }: { meals: PlannedMeal[] }) {
  const t = useT()
  const lookup = useRecipeLookup()
  const now = nowHHMM()
  const sorted = [...meals].sort((a, b) => a.time.localeCompare(b.time))
  const missed = sorted.find((m) => !m.outcome && m.time < now)
  const next = sorted.find((m) => !m.outcome && m.time >= now)

  let content: { title: string; body: string; href: string; cta: string; recipeId?: string }
  if (missed) {
    content = {
      title: `How did ${MEAL_LABEL[missed.mealType].toLowerCase()} go?`,
      body: "Record it in a few seconds — eaten, changed or skipped are all fine.",
      href: `/log/new?meal=${missed.id}`,
      cta: "Record it",
      recipeId: missed.recipeId,
    }
  } else if (next) {
    const r = lookup(next.recipeId)
    content = {
      title: `${MEAL_LABEL[next.mealType]} at ${formatTime(next.time)}`,
      body: r ? `${r.name} · about ${r.prepMinutes + r.cookMinutes} min to make` : "Your next planned meal",
      href: r ? `/recipes/${r.id}` : "/plan",
      cta: "View recipe",
      recipeId: next.recipeId,
    }
  } else {
    content = { title: "Today is recorded", body: "Take a look at how your week is going.", href: "/progress/weekly-review", cta: "Weekly review" }
  }
  const recipe = content.recipeId ? lookup(content.recipeId) : undefined

  return (
    <section aria-labelledby="next-step" className="overflow-hidden rounded-2xl bg-card shadow-card">
      {recipe && <RecipeThumb recipe={recipe} size="hero" className="h-36 rounded-none" />}
      <div className="p-4">
        <p id="next-step" className="text-overline text-lime-text">
          {t("nextStep")}
        </p>
        <p className="text-headline mt-1 text-charcoal">{content.title}</p>
        <p className="text-callout mt-0.5 text-muted-foreground">{content.body}</p>
        <Link href={content.href} className="text-callout mt-4 inline-flex h-10 items-center gap-1.5 rounded-full bg-sage px-4 font-semibold text-lime-text transition-colors hover:bg-sage-strong">
          {content.cta} <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  )
}
