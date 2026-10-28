"use client"

import Link from "next/link"
import { ChefHat, Refrigerator, ShieldCheck } from "lucide-react"
import { EmptyState, PageBody, PageHeader, Section } from "@/components/app/page"
import { CautionNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { Button } from "@/components/ui/button"
import { useActivePlan, useApp } from "@/lib/store"
import { MEAL_LABEL } from "@/lib/planning"
import { addDays, formatDay, todayISO } from "@/lib/date"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { PlannedMeal, Recipe } from "@/lib/types"

/** Meal prep and batch cooking (§16.2) with storage and food-safety guidance. */
export default function PrepPage() {
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const togglePrepLater = useApp((s) => s.togglePrepLater)
  const horizon = addDays(todayISO(), 6)
  const upcoming = (plan?.meals ?? []).filter((m) => m.date >= todayISO() && m.date <= horizon && !m.outcome)
  const marked = upcoming.filter((m) => m.prepLater)

  // Recipes that repeat this week and are tagged batch-cook are good candidates.
  const byRecipe = new Map<string, PlannedMeal[]>()
  for (const m of upcoming) byRecipe.set(m.recipeId, [...(byRecipe.get(m.recipeId) ?? []), m])
  const batch = Array.from(byRecipe.entries())
    .map(([id, meals]) => ({ recipe: lookup(id), meals }))
    .filter((b): b is { recipe: Recipe; meals: PlannedMeal[] } => !!b.recipe && (b.meals.length > 1 || b.recipe.tags.includes("batch-cook")))
    .sort((a, b) => b.meals.length - a.meals.length)
    .slice(0, 4)

  return (
    <>
      <PageHeader title="Meal prep" back="/plan" />
      <PageBody>
        <Section title="Marked to prepare">
          {marked.length === 0 ? (
            <EmptyState icon={<ChefHat />} title="Nothing marked yet" description="Open a meal in your plan and choose “Prepare later” to collect it here." />
          ) : (
            <ul className="space-y-2">
              {marked.map((m) => {
                const r = lookup(m.recipeId)
                if (!r) return null
                return (
                  <li key={m.id} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                    <RecipeThumb recipe={r} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{r.name}</p>
                      <p className="text-xs text-muted-foreground">
                        For {MEAL_LABEL[m.mealType].toLowerCase()}, {formatDay(m.date)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => togglePrepLater(m.id)}>
                      Remove
                    </Button>
                  </li>
                )
              })}
            </ul>
          )}
        </Section>

        <Section title="Batch-cook this week">
          {batch.length === 0 ? (
            <p className="text-sm text-muted-foreground">No repeated meals in the next 7 days.</p>
          ) : (
            <ul className="space-y-2">
              {batch.map(({ recipe, meals }) => (
                <li key={recipe.id} className="rounded-2xl border bg-card p-3">
                  <Link href={`/recipes/${recipe.id}`} className="flex items-center gap-3">
                    <RecipeThumb recipe={recipe} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{recipe.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Appears {meals.length}× · cook {meals.reduce((s, m) => s + m.servings, 0)} servings at once
                      </p>
                    </div>
                  </Link>
                  {recipe.storage && (
                    <p className="mt-2 flex gap-2 text-xs text-muted-foreground">
                      <Refrigerator className="size-4 shrink-0" /> {recipe.storage}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <CautionNote title="Storing cooked food safely">
          Cool cooked food and refrigerate within 2 hours. Eat rice, fish and meat dishes within 2 days and reheat until steaming hot all the way through. Don&apos;t reheat rice more than once.
        </CautionNote>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" /> Storage guidance is general food-safety advice.
        </p>
      </PageBody>
    </>
  )
}
