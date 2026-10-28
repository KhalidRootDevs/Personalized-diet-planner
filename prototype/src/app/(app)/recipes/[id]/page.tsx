"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { BadgeCheck, CalendarPlus, ChefHat, Clock, Flame, Hourglass, NotebookPen, Refrigerator, Trash2, Wand2 } from "lucide-react"
import { ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { ChoiceCard, Stepper } from "@/components/app/controls"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useActivePlan, useActiveProfile, useApp } from "@/lib/store"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { MEAL_LABEL } from "@/lib/planning"
import { fmt, recipeAllergens, recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import { formatDay, todayISO } from "@/lib/date"
import { friendlyGrams, useRecipeLookup } from "@/lib/area-c-utils"
import type { Recipe } from "@/lib/types"

/** Recipe screen (§9.4) with serving scaling (§9.5) and allergen checks (§13.6). */
export default function RecipePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const lookup = useRecipeLookup()
  const profile = useActiveProfile()
  const removeUserRecipe = useApp((s) => s.removeUserRecipe)
  const recipe = lookup(id)
  const [servings, setServings] = useState<number | null>(null)
  const [lessOil, setLessOil] = useState(false)

  if (!recipe) {
    return (
      <>
        <PageHeader title="Recipe" back="/recipes" />
        <PageBody>
          <p className="text-callout text-muted-foreground">This recipe isn&apos;t available.</p>
        </PageBody>
      </>
    )
  }

  const s = servings ?? recipe.servings
  const variant: Recipe = lessOil ? { ...recipe, ingredients: recipe.ingredients.map((i) => (FOOD_MAP[i.foodId]?.category === "fat" && i.foodId.endsWith("_oil") ? { ...i, grams: Math.round(i.grams / 2) } : i)) } : recipe
  const perServing = recipeNutrition(variant)
  const total = recipeNutrition(variant, s)
  const factor = s / recipe.servings
  const conflict = profile ? violatesHardConstraints(recipe, profile) : null
  const allergens = recipeAllergens(recipe)
  const hasOil = recipe.ingredients.some((i) => i.foodId.endsWith("_oil"))

  const canAdd = recipe.profile === "adult" && recipe.reviewStatus === "approved"

  return (
    <>
      <PageHeader title="Recipe" back />
      <PageBody className="pt-1">
        <div className="space-y-4">
          <RecipeThumb recipe={recipe} size="hero" />
          <div>
            <ReviewBadge status={recipe.reviewStatus} />
            <h2 className="text-display mt-3">{recipe.name}</h2>
            <p className="text-body mt-0.5 text-muted-foreground" lang="bn">
              {recipe.nameBn}
            </p>
            <p className="text-body mt-3">{recipe.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Pill icon={<Clock />}>{recipe.prepMinutes} min prep</Pill>
              <Pill icon={<Flame />}>{recipe.cookMinutes} min cook</Pill>
              <Pill icon={<ChefHat />} className="capitalize">
                {recipe.difficulty}
              </Pill>
              {recipe.texture && <Pill>{recipe.texture}</Pill>}
              {recipe.minAgeMonths && <Pill tone="sage">From {recipe.minAgeMonths} months</Pill>}
            </div>
          </div>
        </div>

        {conflict && (
          <SafetyAlert title={`Not suitable for ${profile?.name}`}>
            {conflict} This recipe can&apos;t be added to their plan.
          </SafetyAlert>
        )}

        {allergens.length > 0 && (
          <div className="text-callout flex flex-wrap items-center gap-1.5">
            <span className="mr-1 font-medium">Contains</span>
            {allergens.map((a) => (
              <Pill key={a} tone="terracotta">
                {ALLERGEN_LABELS[a] ?? a}
              </Pill>
            ))}
          </div>
        )}

        {!conflict && (
          <div className="space-y-2">
            {canAdd && <AddToPlan recipe={recipe} />}
            <Button variant={canAdd ? "outline" : "default"} size={canAdd ? "default" : "lg"} className="w-full" onClick={() => router.push(`/log/new?recipe=${recipe.id}`)}>
              <NotebookPen className="size-4" /> I ate this
            </Button>
          </div>
        )}

        <Section title="Nutrition per serving">
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Energy" value={`~${Math.round(perServing.energyKcal)}`} unit="kcal" />
            <StatTile label="Protein" value={`~${Math.round(perServing.proteinG)}`} unit="g" />
            <StatTile label="Carbohydrate" value={`~${Math.round(perServing.carbsG)}`} unit="g" />
            <StatTile label="Fat" value={`~${Math.round(perServing.fatG)}`} unit="g" />
          </div>
          <EstimateNote>Calculated from each ingredient&apos;s cooked or raw weight in our food database. Changing ingredients recalculates these values.</EstimateNote>
        </Section>

        <Section title="Ingredients">
          <ListGroup>
            <ListRow
              title="Servings"
              description={`Whole recipe ~${fmt.kcal(total.energyKcal)} · about ${fmt.bdt(recipeCostPerServing(recipe) * s)}`}
              trailing={<Stepper label="servings" value={s} decDisabled={s <= 1} incDisabled={s >= 12} onDec={() => setServings(s - 1)} onInc={() => setServings(s + 1)} />}
            />
            {variant.ingredients.map((i) => {
              const f = FOOD_MAP[i.foodId]
              const grams = i.grams * factor
              const unit = f?.units.find((u) => Math.abs(grams / u.grams - Math.round(grams / u.grams)) < 0.15 && grams / u.grams >= 1)
              return (
                <div key={i.foodId} className="flex items-start justify-between gap-4 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-body">{f?.name ?? i.foodId}</p>
                    <p className="text-caption text-muted-foreground">
                      {f && <span className="capitalize">{f.state}</span>}
                      {i.note && ` · ${i.note}`}
                    </p>
                  </div>
                  <div className="tabular shrink-0 text-right">
                    <p className="text-callout font-semibold">{friendlyGrams(grams)}</p>
                    {unit && (
                      <p className="text-caption text-muted-foreground">
                        ≈ {Math.round(grams / unit.grams)} × {unit.label.replace(/^1 /, "")}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </ListGroup>
          {s !== recipe.servings && <p className="text-caption px-1 text-muted-foreground">Scaled from {recipe.servings} servings. Cooking times and seasoning may not scale exactly.</p>}
        </Section>

        <Section title="Steps">
          <ol className="space-y-4">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3.5">
                <span className="tabular text-callout grid size-7 shrink-0 place-items-center rounded-full bg-forest font-semibold text-ivory">{i + 1}</span>
                <p className="text-body pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </Section>

        {(recipe.safetyNotes.length > 0 || recipe.storage) && (
          <Section title="Safety and storage">
            {recipe.safetyNotes.length > 0 && (
              <CautionNote title="Food safety">
                <ul className="list-disc space-y-0.5 pl-4">
                  {recipe.safetyNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </CautionNote>
            )}
            {recipe.storage && (
              <Surface tone="muted" className="text-callout flex gap-3">
                <Refrigerator className="mt-0.5 size-5 shrink-0 text-forest" />
                <span>{recipe.storage}</span>
              </Surface>
            )}
          </Section>
        )}

        {recipe.profile === "adult" && hasOil && (
          <Section title="Variations" badge={<FeatureBadge feature="ai_recipe_variations" />}>
            <PremiumGate feature="ai_recipe_variations" compact>
              <ChoiceCard mode="toggle" selected={lessOil} onSelect={() => setLessOil(!lessOil)} icon={<Wand2 />} title="Use half the oil" description="Suggested variation · nutrition recalculated by the engine" />
            </PremiumGate>
          </Section>
        )}

        {recipe.reviewStatus === "personal" && (
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => {
              removeUserRecipe(recipe.id)
              toast("Recipe deleted")
              router.replace("/recipes/library")
            }}
          >
            <Trash2 className="size-4" /> Delete my recipe
          </Button>
        )}
      </PageBody>
    </>
  )
}

function ReviewBadge({ status }: { status: Recipe["reviewStatus"] }) {
  if (status === "approved")
    return (
      <Pill tone="sage" icon={<BadgeCheck />}>
        Verified recipe
      </Pill>
    )
  if (status === "pending")
    return (
      <Pill tone="caution" icon={<Hourglass />}>
        Awaiting clinical review
      </Pill>
    )
  return <Pill>Your recipe · not reviewed</Pill>
}

function AddToPlan({ recipe }: { recipe: Recipe }) {
  const plan = useActivePlan()
  const replaceMeal = useApp((s) => s.replaceMeal)
  const [open, setOpen] = useState(false)
  const [mealId, setMealId] = useState<string | null>(null)
  const lookup = useRecipeLookup()
  const slots = (plan?.meals ?? []).filter((m) => m.date >= todayISO() && !m.outcome && recipe.mealTypes.some((t) => t === m.mealType || (t.includes("snack") && m.mealType.includes("snack")))).slice(0, 10)

  return (
    <>
      <Button size="lg" className="w-full" onClick={() => setOpen(true)} disabled={!plan}>
        <CalendarPlus className="size-5" /> Add to plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to your plan</DialogTitle>
            <DialogDescription>Choose a meal to replace. Daily totals and your shopping list are recalculated.</DialogDescription>
          </DialogHeader>
          {slots.length === 0 ? (
            <InfoNote>No upcoming {recipe.mealTypes.map((t) => MEAL_LABEL[t].toLowerCase()).join(" or ")} slots in your active plan.</InfoNote>
          ) : (
            <ul className="-mx-1 max-h-72 space-y-2 overflow-y-auto px-1">
              {slots.map((m) => (
                <li key={m.id}>
                  <ChoiceCard className="min-h-0 py-3" selected={mealId === m.id} onSelect={() => setMealId(m.id)} title={`${formatDay(m.date)} · ${MEAL_LABEL[m.mealType]}`} description={`Currently: ${lookup(m.recipeId)?.name ?? "—"}`} />
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button
              className="w-full"
              disabled={!mealId}
              onClick={() => {
                if (!mealId) return
                replaceMeal(mealId, recipe.id)
                toast(`${recipe.name} added to your plan`)
                setOpen(false)
              }}
            >
              Replace meal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
