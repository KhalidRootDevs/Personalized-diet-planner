"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ArrowRight, BookHeart, CookingPot, RefreshCw, ShoppingBasket, Undo2 } from "lucide-react"
import { ListGroup, Pill, Section } from "@/components/app/page"
import { Stepper } from "@/components/app/controls"
import { PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { FoodTile } from "@/components/log/food-tile"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FOOD_MAP } from "@/lib/data/foods"
import { ingredientAlternatives } from "@/lib/planning"
import { fmt, foodViolatesHardConstraints, recipeNutrition } from "@/lib/nutrition"
import { costFor } from "@/lib/shopping"
import { friendlyGrams, recipeEquipment } from "@/lib/area-c-utils"
import { useApp } from "@/lib/store"
import { uid } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { Profile, Recipe } from "@/lib/types"
import { STATE_LABEL, householdUnit, resolveSwaps, swapLabel } from "./helpers"

// Mirrors the shopping list's grouping labels (src/lib/planning.ts, not exported).
const CATEGORY_LABEL: Record<string, string> = {
  grain: "Grains & breads",
  pulse: "Lentils & pulses",
  fish: "Fish",
  meat: "Meat",
  egg: "Eggs",
  dairy: "Dairy",
  vegetable: "Vegetables",
  fruit: "Fruit",
  fat: "Oils, nuts & seeds",
  mixed_dish: "Prepared foods",
  drink: "Drinks",
  sweet: "Sweets",
}

const STATE_TONE: Record<string, string> = {
  raw: "bg-sky-tint text-sky-text",
  cooked: "bg-amber-tint text-amber-text",
  dry: "bg-muted text-charcoal",
  prepared: "bg-coral-tint text-terracotta-text",
}

/**
 * Ingredients tab (§9.1, §15.2, §8.4): servings scaling, a "have it" checklist, per-ingredient
 * alternatives and the recipe's written swaps. Every swap recalculates nutrition through the engine.
 */
export function IngredientsPanel({
  recipe,
  variant,
  servings,
  onServings,
  subs,
  onSubs,
  profile,
  blocked,
  onSaveVersion,
  costPerServing,
}: {
  recipe: Recipe
  /** Recipe with swaps applied. */
  variant: Recipe
  servings: number
  onServings: (n: number) => void
  subs: Record<number, string>
  onSubs: (s: Record<number, string>) => void
  profile: Profile | undefined
  /** True when the (swapped) recipe conflicts with the active profile: no shopping-list adds. */
  blocked: boolean
  onSaveVersion: () => void
  costPerServing: number
}) {
  const adult = recipe.profile === "adult"
  const [have, setHave] = useState<Record<number, boolean>>({})
  const [swapping, setSwapping] = useState<number | null>(null)
  const shopping = useApp((s) => s.shopping)
  const addShopping = useApp((s) => s.addShopping)
  const factor = servings / recipe.servings
  const total = recipeNutrition(variant, servings)
  const changed = Object.keys(subs).length > 0
  const missing = variant.ingredients.map((i, idx) => ({ i, idx })).filter(({ idx }) => !have[idx])

  const setSub = (idx: number, foodId: string | null) => {
    const next = { ...subs }
    if (foodId) next[idx] = foodId
    else delete next[idx]
    onSubs(next)
    setSwapping(null)
  }

  const addMissing = () => {
    const onList = new Set(shopping.filter((s) => !s.purchased).map((s) => s.foodId))
    let added = 0
    for (const { i } of missing) {
      if (onList.has(i.foodId)) continue
      const f = FOOD_MAP[i.foodId]
      const grams = Math.round(i.grams * factor)
      addShopping({ id: uid("shop_r"), foodId: i.foodId, name: f?.name ?? i.foodId, category: CATEGORY_LABEL[f?.category ?? "mixed_dish"], grams, purchased: false, optional: i.optional, costBdt: costFor(i.foodId, grams), manual: true })
      onList.add(i.foodId)
      added++
    }
    const skipped = missing.length - added
    toast(added ? `Added ${added} item${added === 1 ? "" : "s"} to your shopping list` : "Already on your shopping list", { description: skipped && added ? `${skipped} already on your list.` : undefined })
  }

  const swaps = resolveSwaps(recipe)

  return (
    <div className="space-y-7">
      <Section>
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-card px-4 py-3 shadow-card">
          <div className="min-w-0">
            <p className="text-body font-semibold">Servings</p>
            <p className="tabular text-caption text-muted-foreground">
              {adult ? `Whole recipe ~${fmt.kcal(total.energyKcal)} · ` : ""}about {fmt.bdt(costPerServing * servings)}
            </p>
          </div>
          <Stepper label="servings" value={servings} decDisabled={servings <= 1} incDisabled={servings >= 12} onDec={() => onServings(servings - 1)} onInc={() => onServings(servings + 1)} />
        </div>
        {servings !== recipe.servings && <p className="text-caption px-1 text-muted-foreground">Scaled from {recipe.servings} servings. Cooking times and seasoning may not scale exactly.</p>}

        <div className="flex items-center justify-between px-1 pt-1">
          <p className="text-caption text-muted-foreground">Tick what you already have</p>
          <p className="tabular text-caption font-medium">
            {variant.ingredients.length - missing.length} of {variant.ingredients.length}
          </p>
        </div>
        <ListGroup>
          {variant.ingredients.map((i, idx) => {
            const f = FOOD_MAP[i.foodId]
            const grams = i.grams * factor
            const unit = householdUnit(f, grams)
            const alts = adult && profile ? ingredientAlternatives(recipe.ingredients[idx].foodId, profile) : []
            const checked = !!have[idx]
            const swapped = !!subs[idx]
            return (
              <div key={`${idx}-${i.foodId}`} className={cn("px-4 py-3 transition-colors", checked && "bg-sage/40")}>
                <div className="flex items-center gap-3">
                  <Checkbox id={`ing-${idx}`} checked={checked} onCheckedChange={(v) => setHave({ ...have, [idx]: v === true })} aria-label={`I have ${f?.name ?? i.foodId}`} className="size-6 rounded-full" />
                  <FoodTile foodId={i.foodId} size="sm" />
                  <label htmlFor={`ing-${idx}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className={cn("text-body block leading-snug font-medium", checked && "text-muted-foreground line-through decoration-muted-grey")}>{f?.name ?? i.foodId}</span>
                    <span className="tabular text-caption mt-0.5 block text-muted-foreground">
                      <span className="font-semibold text-charcoal">{friendlyGrams(grams)}</span>
                      {unit && ` ${unit}`}
                      {i.note && ` · ${i.note}`}
                    </span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {f && <span className={cn("inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold", STATE_TONE[f.state])}>{STATE_LABEL[f.state]} weight</span>}
                      {i.optional && <span className="inline-flex h-5 items-center rounded-full border border-dashed border-input px-2 text-[11px] font-medium text-muted-foreground">Optional</span>}
                      {swapped && <span className="inline-flex h-5 items-center rounded-full bg-amber-tint px-2 text-[11px] font-semibold text-amber-text">Swapped · recalculated</span>}
                    </span>
                  </label>
                  {alts.length > 0 && (
                    <Button size="sm" variant="ghost" className="px-2.5" aria-expanded={swapping === idx} onClick={() => setSwapping(swapping === idx ? null : idx)}>
                      <RefreshCw className="size-4" /> Swap
                    </Button>
                  )}
                </div>
                {swapping === idx && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-[84px]">
                    {alts.map((a) => (
                      <button key={a} type="button" className={cn("h-9 rounded-full px-3 text-sm font-medium shadow-card", subs[idx] === a ? "bg-lime text-charcoal" : "bg-card")} onClick={() => setSub(idx, a)}>
                        {FOOD_MAP[a]?.name}
                      </button>
                    ))}
                    {swapped && (
                      <button type="button" className="h-9 rounded-full px-3 text-sm font-medium text-forest" onClick={() => setSub(idx, null)}>
                        Undo swap
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </ListGroup>
        <p className="text-caption px-1 text-muted-foreground">Weights are for the state shown: raw, dry (uncooked) or cooked. Nutrition is calculated for that state, so weigh it the same way.</p>
        {!blocked && missing.length > 0 && (
          <Button variant="secondary" className="w-full" onClick={addMissing}>
            <ShoppingBasket className="size-4" /> Add {missing.length === variant.ingredients.length ? "all" : `${missing.length} missing`} to shopping list
          </Button>
        )}
      </Section>

      {swaps.length > 0 && (
        <Section title="Swaps" description="Substitutions change the nutrition. Applying one recalculates it from the food database; swaps are never assumed equivalent.">
          <ul className="space-y-2">
            {swaps.map((s, k) => {
              const applicable = s.index !== null && s.toFoodId !== null
              const applied = applicable && subs[s.index!] === s.toFoodId
              const unsafe = applicable && profile ? foodViolatesHardConstraints(s.toFoodId!, profile) : null
              return (
                <li key={k} className={cn("rounded-2xl bg-card p-4 shadow-card", applied && "ring-2 ring-lime")}>
                  <div className="flex items-center gap-2">
                    <p className="text-body min-w-0 flex-1 font-semibold">
                      {swapLabel(s)} <ArrowRight className="inline size-4 align-[-2px] text-muted-grey" aria-label="to" /> {s.to}
                    </p>
                    {applied && <Pill tone="lime">Recalculated</Pill>}
                  </div>
                  <p className="text-callout mt-1 text-muted-foreground">{s.note}</p>
                  {unsafe ? (
                    <p className="text-caption mt-2 font-medium text-safety">Not available for {profile?.name}: {unsafe}</p>
                  ) : applicable ? (
                    <div className="mt-3">
                      {applied ? (
                        <Button size="sm" variant="outline" onClick={() => setSub(s.index!, null)}>
                          <Undo2 className="size-4" /> Undo swap
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => setSub(s.index!, s.toFoodId)}>
                          <RefreshCw className="size-4" /> Apply and recalculate
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="text-caption mt-2 text-muted-foreground">Cook&apos;s tip only. The nutrition shown isn&apos;t recalculated for this swap, so treat it as different from the estimate.</p>
                  )}
                </li>
              )
            })}
          </ul>
        </Section>
      )}

      {changed && (
        <div className="space-y-2">
          <InfoNote title="You changed this recipe">Nutrition, allergens and your profile&apos;s safety checks were recalculated for your version. See the Nutrition tab for the difference.</InfoNote>
          {adult && (
            <PremiumGate feature="recipe_library" variant="row">
              <Button variant="secondary" className="w-full" onClick={onSaveVersion}>
                <BookHeart className="size-4" /> Save my version to my library
              </Button>
            </PremiumGate>
          )}
        </div>
      )}

      <Section title="Equipment">
        <div className="flex flex-wrap gap-1.5">
          {recipeEquipment(recipe).map((e) => (
            <span key={e} className="text-callout inline-flex h-9 items-center gap-1.5 rounded-full bg-card px-3.5 font-medium shadow-card">
              <CookingPot className="size-4 text-lime-text" aria-hidden />
              {e}
            </span>
          ))}
        </div>
      </Section>
    </div>
  )
}
