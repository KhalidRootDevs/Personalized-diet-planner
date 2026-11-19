"use client"

import Link from "next/link"
import { ChefHat, Lightbulb, ShieldAlert, Timer } from "lucide-react"
import { Section } from "@/components/app/page"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"
import { CHILD_FEEDING_NOTES, minutesLabel, stepSafety } from "./helpers"

/** Steps tab: numbered step cards, timers, step-related safety notes, tips and the Cook mode entry. */
export function StepsPanel({ recipe, cookHref }: { recipe: Recipe; cookHref: string }) {
  const { byStep, general } = stepSafety(recipe)
  const child = recipe.profile !== "adult"
  return (
    <div className="space-y-7">
      <Section>
        <Button asChild size="lg" variant="secondary" className="w-full">
          <Link href={cookHref}>
            <ChefHat className="size-5" /> Start cooking · step by step
          </Link>
        </Button>
        {general.length > 0 && (
          <CautionNote title="Food safety">
            <ul className="list-disc space-y-0.5 pl-4">
              {general.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </CautionNote>
        )}
        <ol className="space-y-2.5">
          {recipe.steps.map((step, i) => {
            const mins = recipe.stepMinutes?.[i]
            const notes = byStep[i]
            return (
              <li key={i} className={cn("rounded-2xl bg-card p-4 shadow-card", notes.length > 0 && "ring-1 ring-caution/25")}>
                <div className="flex items-center gap-2.5">
                  <span className="tabular text-callout grid size-8 shrink-0 place-items-center rounded-full bg-lime font-bold text-charcoal">{i + 1}</span>
                  <span className="text-overline flex-1 text-muted-foreground">Step {i + 1}</span>
                  {mins ? (
                    <span className="tabular inline-flex h-7 items-center gap-1 rounded-full bg-sky-tint px-2.5 text-xs font-semibold text-sky-text">
                      <Timer className="size-3.5" aria-hidden />
                      {minutesLabel(mins)}
                    </span>
                  ) : null}
                </div>
                <p className="text-body mt-2.5">{step}</p>
                {notes.map((n) => (
                  <p key={n} className="text-callout mt-3 flex gap-2 rounded-xl bg-caution-surface px-3 py-2.5">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-caution" aria-hidden />
                    <span>
                      <span className="font-semibold">Safety: </span>
                      {n}
                    </span>
                  </p>
                ))}
              </li>
            )
          })}
        </ol>
      </Section>

      {child && (
        <InfoNote title="When you serve it">
          {CHILD_FEEDING_NOTES.responsive} {CHILD_FEEDING_NOTES.choking}
        </InfoNote>
      )}

      {recipe.tips && recipe.tips.length > 0 && (
        <Section title="Cook's tips">
          <ul className="space-y-2">
            {recipe.tips.map((t) => (
              <li key={t} className="text-callout flex gap-3 rounded-2xl bg-sage p-4">
                <Lightbulb className="mt-0.5 size-5 shrink-0 text-forest" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  )
}
