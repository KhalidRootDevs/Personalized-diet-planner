"use client"

import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { BadgeCheck, CalendarPlus, Clock, Hourglass, Minus, NotebookPen, Plus, Refrigerator, Trash2, Users, Wand2 } from "lucide-react"
import { PageBody, PageHeader, Section } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote, Macro } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useActivePlan, useActiveProfile, useApp } from "@/lib/store"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { MEAL_LABEL } from "@/lib/planning"
import { fmt, recipeAllergens, recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import { formatDay, todayISO } from "@/lib/date"
import { friendlyGrams, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
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
          <p className="text-sm text-muted-foreground">This recipe isn&apos;t available.</p>
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

  return (
    <>
      <PageHeader title="" back />
      <PageBody className="pt-0">
        <RecipeThumb recipe={recipe} size="hero" />
        <div>
          <ReviewBadge status={recipe.reviewStatus} />
          <h1 className="mt-2 font-serif text-[28px] leading-tight">{recipe.name}</h1>
          <p className="text-muted-foreground" lang="bn">
            {recipe.nameBn}
          </p>
          <p className="mt-2 text-sm">{recipe.description}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-4" /> {recipe.prepMinutes} min prep · {recipe.cookMinutes} min cook
            </span>
            <span className="capitalize">{recipe.difficulty}</span>
            {recipe.texture && <span>{recipe.texture}</span>}
            {recipe.minAgeMonths && <span>From {recipe.minAgeMonths} months</span>}
          </div>
        </div>

        {conflict && (
          <SafetyAlert title={`Not suitable for ${profile?.name}`}>
            {conflict} This recipe can&apos;t be added to their plan.
          </SafetyAlert>
        )}

        {allergens.length > 0 && (
          <p className="text-sm">
            <span className="font-medium">Contains:</span> {allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ")}
          </p>
        )}

        <div className="flex items-center justify-between rounded-2xl border bg-card p-3">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Users className="size-4.5 text-forest" /> Servings
          </span>
          <div className="flex items-center gap-2">
            <Button size="icon-sm" variant="outline" aria-label="Fewer servings" disabled={s <= 1} onClick={() => setServings(s - 1)}>
              <Minus />
            </Button>
            <span className="tabular w-6 text-center font-semibold">{s}</span>
            <Button size="icon-sm" variant="outline" aria-label="More servings" disabled={s >= 12} onClick={() => setServings(s + 1)}>
              <Plus />
            </Button>
          </div>
        </div>

        <Section title="Nutrition per serving">
          <div className="grid grid-cols-4 gap-2 rounded-2xl border bg-card p-3">
            <Macro label="Energy" value={perServing.energyKcal} unit="kcal" estimate />
            <Macro label="Protein" value={perServing.proteinG} estimate />
            <Macro label="Carbs" value={perServing.carbsG} estimate />
            <Macro label="Fat" value={perServing.fatG} estimate />
          </div>
          <p className="tabular text-sm text-muted-foreground">
            Whole recipe ({s} servings): ~{fmt.kcal(total.energyKcal)} · about {fmt.bdt(recipeCostPerServing(recipe) * s)}
          </p>
          <EstimateNote>Calculated from each ingredient&apos;s cooked or raw weight in our food database. Changing ingredients recalculates these values.</EstimateNote>
        </Section>

        <Section title="Ingredients">
          <ul className="divide-y rounded-2xl border bg-card">
            {variant.ingredients.map((i) => {
              const f = FOOD_MAP[i.foodId]
              const grams = i.grams * factor
              const unit = f?.units.find((u) => Math.abs(grams / u.grams - Math.round(grams / u.grams)) < 0.15 && grams / u.grams >= 1)
              return (
                <li key={i.foodId} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span>
                    {f?.name ?? i.foodId}
                    {f && <span className="text-xs text-muted-foreground"> · {f.state}</span>}
                    {i.note && <span className="block text-xs text-muted-foreground">{i.note}</span>}
                  </span>
                  <span className="tabular shrink-0 text-right text-muted-foreground">
                    {friendlyGrams(grams)}
                    {unit && <span className="block text-xs">≈ {Math.round(grams / unit.grams)} × {unit.label.replace(/^1 /, "")}</span>}
                  </span>
                </li>
              )
            })}
          </ul>
        </Section>

        <Section title="Steps">
          <ol className="space-y-3">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="tabular grid size-6 shrink-0 place-items-center rounded-full bg-sage text-xs font-semibold text-forest">{i + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </Section>

        {recipe.safetyNotes.length > 0 && (
          <CautionNote title="Food safety">
            <ul className="list-disc pl-4">
              {recipe.safetyNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </CautionNote>
        )}
        {recipe.storage && (
          <p className="flex gap-2 text-sm text-muted-foreground">
            <Refrigerator className="size-4.5 shrink-0" /> {recipe.storage}
          </p>
        )}

        {recipe.profile === "adult" && hasOil && (
          <Section title="Variations" badge={<FeatureBadge feature="ai_recipe_variations" />}>
            <PremiumGate feature="ai_recipe_variations" compact>
              <button onClick={() => setLessOil(!lessOil)} aria-pressed={lessOil} className={cn("flex w-full items-center gap-3 rounded-2xl border bg-card p-3 text-left", lessOil && "border-forest bg-sage/40")}>
                <Wand2 className="size-5 text-forest" />
                <span className="flex-1">
                  <span className="block text-sm font-medium">Use half the oil</span>
                  <span className="block text-xs text-muted-foreground">Suggested variation · nutrition recalculated by the engine</span>
                </span>
              </button>
            </PremiumGate>
          </Section>
        )}

        {!conflict && (
          <div className="grid grid-cols-2 gap-2">
            {recipe.profile === "adult" && recipe.reviewStatus === "approved" && <AddToPlan recipe={recipe} />}
            <Button variant="outline" onClick={() => router.push(`/log/new?recipe=${recipe.id}`)} className={recipe.profile !== "adult" || recipe.reviewStatus !== "approved" ? "col-span-2" : ""}>
              <NotebookPen /> I ate this
            </Button>
          </div>
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
            <Trash2 /> Delete my recipe
          </Button>
        )}
      </PageBody>
    </>
  )
}

function ReviewBadge({ status }: { status: Recipe["reviewStatus"] }) {
  if (status === "approved")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sage px-2.5 py-0.5 text-xs font-medium text-forest">
        <BadgeCheck className="size-3.5" /> Verified recipe
      </span>
    )
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-caution-surface px-2.5 py-0.5 text-xs font-medium text-caution">
        <Hourglass className="size-3.5" /> Awaiting clinical review
      </span>
    )
  return <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Your recipe · not reviewed</span>
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
      <Button onClick={() => setOpen(true)} disabled={!plan}>
        <CalendarPlus /> Add to plan
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Add to your plan</DialogTitle>
            <DialogDescription>Choose a meal to replace. Daily totals and your shopping list are recalculated.</DialogDescription>
          </DialogHeader>
          {slots.length === 0 ? (
            <InfoNote>No upcoming {recipe.mealTypes.map((t) => MEAL_LABEL[t].toLowerCase()).join(" or ")} slots in your active plan.</InfoNote>
          ) : (
            <ul className="max-h-72 space-y-1.5 overflow-y-auto">
              {slots.map((m) => (
                <li key={m.id}>
                  <button onClick={() => setMealId(m.id)} aria-pressed={mealId === m.id} className={cn("w-full rounded-xl border p-2.5 text-left text-sm", mealId === m.id && "border-forest bg-sage/40")}>
                    <span className="font-medium">
                      {formatDay(m.date)} · {MEAL_LABEL[m.mealType]}
                    </span>
                    <span className="block text-xs text-muted-foreground">Currently: {lookup(m.recipeId)?.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button
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
