"use client"

import { BadgeCheck, ChefHat, Clock, Flame, Globe, Hourglass, Timer, Users, Wallet } from "lucide-react"
import { IconTile, Pill, type IconTone } from "@/components/app/page"
import { PhaseBadge } from "@/components/app/badges"
import { AGE_GROUP_MAP, CUISINE_MAP, recipeAgeGroups, recipeCuisine, totalMinutes } from "@/lib/recipe-bank"
import { MEAL_LABEL } from "@/lib/planning"
import { fmt } from "@/lib/nutrition"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"
import { SPICE_LABEL, minutesLabel } from "./helpers"

/** Spice level as chilli (flame) icons plus a text label, so color is never the only signal. */
export function SpiceMeter({ level, className }: { level: 0 | 1 | 2 | 3; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center gap-1 rounded-full bg-coral-tint px-2.5 text-xs font-medium text-terracotta-text", className)} aria-label={`Spice level: ${SPICE_LABEL[level]}`}>
      <span className="flex" aria-hidden>
        {[1, 2, 3].map((i) => (
          <Flame key={i} className={cn("-mx-px size-3.5", i <= level ? "fill-terracotta text-terracotta" : "text-terracotta-text/35")} />
        ))}
      </span>
      {SPICE_LABEL[level]}
    </span>
  )
}

export function ReviewPill({ recipe }: { recipe: Recipe }) {
  if (recipe.reviewStatus === "approved")
    return (
      <Pill tone="sage" icon={<BadgeCheck />}>
        Reviewed
      </Pill>
    )
  if (recipe.reviewStatus === "pending")
    return (
      <Pill tone="caution" icon={<Hourglass />}>
        Pending review
      </Pill>
    )
  return <Pill tone="outline">{recipe.aiVariation ? "AI variation · not reviewed" : "Your recipe · not reviewed"}</Pill>
}

/** Cuisine, meal types, life stages, difficulty, spice and review status. */
export function RecipeChips({ recipe }: { recipe: Recipe }) {
  const cuisine = CUISINE_MAP[recipeCuisine(recipe)]
  const ages = recipeAgeGroups(recipe)
  const meals = Array.from(new Set(recipe.mealTypes.map((t) => (t.includes("snack") ? "Snack" : MEAL_LABEL[t]))))
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <ReviewPill recipe={recipe} />
      <Pill tone="lime" icon={<Globe />}>
        {cuisine.label}
        {!cuisine.local && <PhaseBadge phase={3} className="-mr-1.5 ml-0.5 h-[18px]" />}
      </Pill>
      {meals.map((m) => (
        <Pill key={m}>{m}</Pill>
      ))}
      {ages.map((a) => (
        <Pill key={a} tone="sage" icon={<Users />}>
          {AGE_GROUP_MAP[a].label} · {AGE_GROUP_MAP[a].range}
        </Pill>
      ))}
      <Pill icon={<ChefHat />}>
        <span className="capitalize">{recipe.difficulty}</span>
      </Pill>
      {recipe.spiceLevel !== undefined && <SpiceMeter level={recipe.spiceLevel} />}
    </div>
  )
}

function Fact({ icon, tone, label, value }: { icon: React.ReactNode; tone: IconTone; label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col items-center px-0.5 text-center">
      <IconTile tone={tone} size="sm">
        {icon}
      </IconTile>
      <p className="tabular text-callout mt-1.5 leading-tight font-semibold whitespace-nowrap">{value}</p>
      <p className="text-caption text-muted-foreground">{label}</p>
    </div>
  )
}

/** Prep · cook · total · serves · cost per serving, as one white card (UI-SPEC §5.3 key facts). */
export function QuickFacts({ recipe, cost }: { recipe: Recipe; cost: number }) {
  return (
    <div className="rounded-2xl bg-card px-2 py-3.5 shadow-card">
      <div className="grid grid-cols-5 divide-x divide-border/70">
        <Fact icon={<Clock />} tone="sky" label="Prep" value={minutesLabel(recipe.prepMinutes)} />
        <Fact icon={<Flame />} tone="terracotta" label="Cook" value={recipe.cookMinutes ? minutesLabel(recipe.cookMinutes) : "None"} />
        <Fact icon={<Timer />} tone="lime" label="Total" value={minutesLabel(totalMinutes(recipe))} />
        <Fact icon={<Users />} tone="sage" label="Serves" value={recipe.servings} />
        <Fact icon={<Wallet />} tone="amber" label="Cost each" value={`~${fmt.bdt(cost)}`} />
      </div>
      <p className="text-caption mt-3 border-t border-border/70 px-2 pt-2.5 text-muted-foreground">
        {recipe.yieldNote ? `Makes ${recipe.yieldNote}. ` : ""}Cost is an estimate from typical local prices{recipe.costPerServingBdt ? " (your own estimate)" : ""}.
      </p>
    </div>
  )
}
