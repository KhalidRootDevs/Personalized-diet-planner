"use client"

import Link from "next/link"
import { Baby, Check, ChefHat, ChevronRight, CookingPot, Flame, Refrigerator, Timer } from "lucide-react"
import { EmptyState, IconTile, ListGroup, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge } from "@/components/app/badges"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useActivePlan, useApp } from "@/lib/store"
import { MEAL_LABEL } from "@/lib/planning"
import { addDays, formatDay, todayISO } from "@/lib/date"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { INFANT_STORAGE, STORAGE_ADVICE, prepTasks } from "@/lib/shopping"
import { cn } from "@/lib/utils"
import type { PlannedMeal, Recipe } from "@/lib/types"

/** Meal prep and batch cooking (§16.4) with food-specific storage and reheating guidance. */
export default function PrepPage() {
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const togglePrepLater = useApp((s) => s.togglePrepLater)
  const prepDone = useApp((s) => s.prepDone ?? {})
  const toggleTask = useApp((s) => s.togglePrepTask)
  const hasChild = useApp((s) => s.profiles.some((p) => p.type !== "adult"))
  const today = todayISO()
  const horizon = addDays(today, 6)
  const paused = plan?.status === "paused"
  const upcoming = paused ? [] : (plan?.meals ?? []).filter((m) => m.date >= today && m.date <= horizon && !m.outcome)
  const marked = upcoming.filter((m) => m.prepLater)
  const tasks = paused ? [] : prepTasks(plan?.meals ?? [], lookup, today)
  const taskDays = Array.from(new Set(tasks.map((t) => t.day)))
  const done = tasks.filter((t) => prepDone[t.key]).length

  // Recipes that repeat this week and are tagged batch-cook are good candidates.
  const byRecipe = new Map<string, PlannedMeal[]>()
  for (const m of upcoming) byRecipe.set(m.recipeId, [...(byRecipe.get(m.recipeId) ?? []), m])
  const batch = Array.from(byRecipe.entries())
    .map(([id, meals]) => ({ recipe: lookup(id), meals }))
    .filter((b): b is { recipe: Recipe; meals: PlannedMeal[] } => !!b.recipe && (b.meals.length > 1 || b.recipe.tags.includes("batch-cook")))
    .sort((a, b) => b.meals.length - a.meals.length)
    .slice(0, 4)

  // Storage advice only for foods that are actually in this week's meals.
  const weekFoods = new Set(upcoming.flatMap((m) => lookup(m.recipeId)?.ingredients.map((i) => i.foodId) ?? []))
  const advice = STORAGE_ADVICE.filter((a) => a.foodIds.some((f) => weekFoods.has(f)))

  const dayTitle = (d: string) => (d === today ? "Today" : d === addDays(today, 1) ? "Tomorrow" : formatDay(d, { weekday: "long", day: "numeric", month: "short" }))

  return (
    <>
      <PageHeader title="Meal prep" back="/plan" />
      <PageBody>
        {paused && <InfoNote title="Your plan is paused">Prep tasks come back when you resume the plan.</InfoNote>}

        <Section title="This week's prep" badge={<FeatureBadge feature="shopping" />} description={tasks.length ? "Tick tasks off as you go." : undefined}>
          {tasks.length > 0 && (
            <Surface className="flex items-center gap-3">
              <IconTile tone="lime">
                <ChefHat />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="tabular text-body font-semibold">
                  {done} of {tasks.length} tasks done
                </p>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
                  <div className="h-full rounded-full bg-forest" style={{ width: `${(done / tasks.length) * 100}%` }} />
                </div>
              </div>
            </Surface>
          )}
          {tasks.length === 0 ? (
            <EmptyState icon={<ChefHat />} title="No prep needed" description="Nothing in the next 7 days needs washing, soaking or cooking ahead." />
          ) : (
            <div className="space-y-5">
              {taskDays.map((d) => (
                <ListGroup key={d} label={dayTitle(d)}>
                  {tasks
                    .filter((t) => t.day === d)
                    .map((t) => {
                      const on = !!prepDone[t.key]
                      return (
                        <label key={t.key} className="flex min-h-[60px] cursor-pointer items-start gap-3 px-4 py-3">
                          <Checkbox className="mt-0.5" checked={on} onCheckedChange={() => toggleTask(t.key)} aria-label={t.title} />
                          <span className="min-w-0 flex-1">
                            <span className={cn("text-body block font-medium", on && "text-muted-foreground line-through")}>{t.title}</span>
                            <span className="text-caption mt-0.5 block text-muted-foreground">{t.detail}</span>
                          </span>
                          {on && <Pill tone="sage">Done</Pill>}
                        </label>
                      )
                    })}
                </ListGroup>
              ))}
            </div>
          )}
        </Section>

        <Section title="Marked to prepare" description="Meals you chose to prepare ahead in the next 7 days.">
          {marked.length === 0 ? (
            <QuietEmpty icon={<Timer />} text="Open a meal in your plan and choose “Prepare later” to collect it here." />
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

        <Section title="Batch-cook this week" description="Meals that repeat — cook once, eat twice (within 2 days, or freeze).">
          {batch.length === 0 ? (
            <QuietEmpty icon={<CookingPot />} text="No repeated meals in the next 7 days." />
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

        {advice.length > 0 && (
          <Section title="Storing and reheating" description="For the foods in this week's meals.">
            <ListGroup>
              {advice.map((a) => (
                <div key={a.title} className="space-y-1.5 px-4 py-3.5">
                  <p className="text-body font-semibold">{a.title}</p>
                  <p className="text-caption flex gap-1.5 text-muted-foreground">
                    <Refrigerator className="mt-px size-4 shrink-0 text-sky-text" aria-hidden /> {a.storage}
                  </p>
                  <p className="text-caption flex gap-1.5 text-muted-foreground">
                    <Flame className="mt-px size-4 shrink-0 text-terracotta" aria-hidden /> {a.reheat}
                  </p>
                </div>
              ))}
            </ListGroup>
          </Section>
        )}

        {hasChild && (
          <Section title="Baby food storage">
            <Surface tone="sage" className="space-y-3">
              <div className="flex items-center gap-3">
                <IconTile tone="white">
                  <Baby />
                </IconTile>
                <p className="text-body font-semibold">Extra care for babies</p>
              </div>
              <ul className="text-callout space-y-2.5">
                {INFANT_STORAGE.map((t) => (
                  <li key={t} className="flex gap-2.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Surface>
          </Section>
        )}

        <CautionNote title="Storing cooked food safely">
          Cool cooked food and refrigerate within 2 hours (1 hour for rice). Reheat until steaming hot all the way through, and only once. This is general food-safety advice.
        </CautionNote>
      </PageBody>
    </>
  )
}

/** Small inline empty note for secondary sections (a full EmptyState would be too loud here). */
function QuietEmpty({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Surface tone="outline" className="flex items-center gap-3">
      <IconTile tone="muted">{icon}</IconTile>
      <p className="text-callout min-w-0 flex-1 text-muted-foreground">{text}</p>
    </Surface>
  )
}
