"use client"

import Link from "next/link"
import { ChefHat, ChevronRight, Refrigerator } from "lucide-react"
import { EmptyState, ListGroup, PageBody, PageHeader, Pill, Section } from "@/components/app/page"
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
        <Section title="Marked to prepare" description="Meals you chose to prepare ahead in the next 7 days.">
          {marked.length === 0 ? (
            <EmptyState icon={<ChefHat />} title="Nothing marked yet" description="Open a meal in your plan and choose “Prepare later” to collect it here." />
          ) : (
            <ListGroup>
              {marked.map((m) => {
                const r = lookup(m.recipeId)
                if (!r) return null
                return (
                  <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <RecipeThumb recipe={r} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-body line-clamp-2 font-medium">{r.name}</p>
                      <p className="text-caption text-muted-foreground">
                        {MEAL_LABEL[m.mealType]} · {formatDay(m.date)}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => togglePrepLater(m.id)}>
                      Remove
                    </Button>
                  </div>
                )
              })}
            </ListGroup>
          )}
        </Section>

        <Section title="Batch-cook this week" description="Meals that repeat — cook once, eat twice.">
          {batch.length === 0 ? (
            <p className="text-callout rounded-2xl border border-dashed border-input bg-card px-4 py-3 text-muted-foreground">No repeated meals in the next 7 days.</p>
          ) : (
            <ListGroup>
              {batch.map(({ recipe, meals }) => (
                <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50">
                  <RecipeThumb recipe={recipe} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-body line-clamp-2 font-medium">{recipe.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Pill tone="sage">{meals.length}× this week</Pill>
                      <span className="tabular text-caption text-muted-foreground">Cook {meals.reduce((s, m) => s + m.servings, 0)} servings at once</span>
                    </div>
                    {recipe.storage && (
                      <p className="text-caption mt-2 flex gap-1.5 text-muted-foreground">
                        <Refrigerator className="mt-px size-4 shrink-0" /> {recipe.storage}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="mt-3 size-[18px] shrink-0 text-muted-grey" aria-hidden />
                </Link>
              ))}
            </ListGroup>
          )}
        </Section>

        <CautionNote title="Storing cooked food safely">
          Cool cooked food and refrigerate within 2 hours. Eat rice, fish and meat dishes within 2 days and reheat until steaming hot all the way through. Don&apos;t reheat rice more than once. This is general food-safety advice.
        </CautionNote>
      </PageBody>
    </>
  )
}
