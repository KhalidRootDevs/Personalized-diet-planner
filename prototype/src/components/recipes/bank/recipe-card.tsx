"use client"

import Link from "next/link"
import { Clock, Flame } from "lucide-react"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { Pill } from "@/components/app/page"
import { CUISINE_MAP, HEALTH_FIT_MAP, isChildRecipe, perServing, recipeCuisine, recipeHealthFits, totalMinutes } from "@/lib/recipe-bank"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"

/** "~420 kcal": rounded to 10 so a per-serving estimate doesn't look exact. */
function approxKcal(kcal: number) {
  return `~${(Math.round(kcal / 10) * 10).toLocaleString("en-US")} kcal`
}

/**
 * Recipe card used across the recipe bank, recipe detail ("More like this") and Home.
 * Contract: props `{ recipe, variant?: "grid" | "wide" | "rail", className? }`. Restyle freely, keep the props.
 * Child/infant recipes never show calories (§12).
 */
export function RecipeCard({ recipe: r, variant = "grid", className }: { recipe: Recipe; variant?: "grid" | "wide" | "rail"; className?: string }) {
  const n = perServing(r)
  const child = isChildRecipe(r)
  const cuisine = CUISINE_MAP[recipeCuisine(r)]
  const time = totalMinutes(r)
  const pending = r.reviewStatus === "pending"

  // Child recipes: texture on its own line instead of calories (§12).
  const meta = (
    <div className="text-caption tabular flex flex-wrap items-center gap-x-2.5 gap-y-1">
      {child ? (
        r.texture && <span className="line-clamp-2 w-full text-muted-foreground">{r.texture}</span>
      ) : (
        <span className="inline-flex items-center gap-1 font-semibold whitespace-nowrap text-charcoal">
          <Flame className="size-3.5 text-terracotta" aria-hidden />
          {approxKcal(n.energyKcal)}
        </span>
      )}
      <span className="inline-flex shrink-0 items-center gap-1 text-muted-foreground">
        <Clock className="size-3.5 shrink-0" aria-hidden />
        {time} min
      </span>
    </div>
  )

  if (variant === "wide") {
    const fits = recipeHealthFits(r).slice(0, 2)
    return (
      <Link href={`/recipes/${r.id}`} className={cn("flex items-center gap-3 rounded-2xl bg-card p-3 shadow-card transition-colors hover:bg-muted/40 active:bg-muted", className)}>
        <RecipeThumb recipe={r} size="lg" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-caption truncate text-muted-foreground">{cuisine.label}</p>
          <p className="text-body line-clamp-2 leading-snug font-semibold">{r.name}</p>
          {meta}
          {(pending || fits.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {pending && <Pill tone="caution">Pending review</Pill>}
              {fits.map((f) => (
                <Pill key={f} tone="sage">
                  {HEALTH_FIT_MAP[f].label}
                </Pill>
              ))}
            </div>
          )}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/recipes/${r.id}`}
      className={cn("group flex h-full flex-col rounded-2xl bg-card p-2 shadow-card transition-colors hover:bg-muted/40 active:bg-muted", variant === "rail" && "w-[172px] shrink-0 snap-start", className)}
    >
      <div className="relative">
        <RecipeThumb recipe={r} size="hero" className="h-32 rounded-[18px]" />
        <span className="absolute top-2 left-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-card px-2 py-0.5 text-[11px] leading-4 font-semibold text-charcoal shadow-card">{cuisine.label}</span>
      </div>
      <div className="flex flex-1 flex-col gap-2 px-1.5 pt-2.5 pb-1.5">
        <p className="text-callout line-clamp-2 leading-snug font-semibold">{r.name}</p>
        <div className="mt-auto space-y-2">
          {meta}
          {pending && (
            <Pill tone="caution" className="self-start">
              Pending review
            </Pill>
          )}
        </div>
      </div>
    </Link>
  )
}
