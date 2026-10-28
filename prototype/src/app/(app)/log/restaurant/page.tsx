"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Check, Store } from "lucide-react"
import { IconTile, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { useSelfProfile, useApp } from "@/lib/store"
import { foodNutrients } from "@/lib/nutrition"
import { nowHHMM, todayISO, uid } from "@/lib/date"
import { suggestMealType } from "@/lib/area-b-text"
import { allergenHits, itemFromFood } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"

// Restaurant dishes mapped to verified restaurant-style food records (§42.6, §42.22).
const DISHES = [
  { id: "biryani", name: "Kacchi / chicken biryani", foodId: "biryani_restaurant", grams: 450, tips: ["Share a plate or ask for a half portion", "Choose water instead of a soft drink", "Skip the extra ghee on top"] },
  { id: "plate", name: "Rice plate with fish curry and dal", foodId: "fried_fish", grams: 100, extra: [{ foodId: "rice_cooked", grams: 300 }, { foodId: "dal_cooked", grams: 150 }], tips: ["Ask for curry fish instead of fried", "Fill a quarter of the plate with vegetables", "Have dal for extra protein"] },
  { id: "paratha", name: "Paratha with vegetable bhaji", foodId: "paratha", grams: 140, extra: [{ foodId: "mixed_veg", grams: 120 }], tips: ["Choose roti if available", "Pair with dal or egg for protein"] },
  { id: "singara", name: "Singara and tea", foodId: "singara", grams: 120, extra: [{ foodId: "milk_tea", grams: 150 }], tips: ["One piece is a snack; two is closer to a meal", "Ask for less sugar in tea"] },
  { id: "beef", name: "Beef bhuna with rice", foodId: "beef_curry", grams: 150, extra: [{ foodId: "rice_cooked", grams: 300 }], tips: ["Ask for more vegetables on the side", "Bhuna is oil-rich — a smaller portion helps"] },
]

/**
 * Restaurant assistant (§42.22, Phase 3). Restaurant values are shown as wide ranges, never exact,
 * and suggestions are ordering ideas — not restriction.
 */
export default function RestaurantPage() {
  return (
    <>
      <PageHeader title={<span className="flex items-center gap-2">Eating out <FeatureBadge feature="restaurant" /></span>} back="/log" />
      <PageBody>
        <PremiumGate feature="restaurant">
          <Assistant />
        </PremiumGate>
      </PageBody>
    </>
  )
}

function Assistant() {
  const self = useSelfProfile()
  const [pick, setPick] = useState<string | null>(null)
  if (!self) return null
  const dish = DISHES.find((d) => d.id === pick)
  const parts = dish ? [{ foodId: dish.foodId, grams: dish.grams }, ...(dish.extra ?? [])] : []
  const kcal = parts.reduce((s, p) => s + foodNutrients(p.foodId, p.grams).energyKcal, 0)
  const protein = parts.reduce((s, p) => s + foodNutrients(p.foodId, p.grams).proteinG, 0)
  const hits = allergenHits(parts.map((p) => itemFromFood(p.foodId, p.grams)), self)

  return (
    <div className="space-y-7">
      <Section title="What are you ordering?" description="Restaurant portions and oil vary a lot, so estimates are ranges.">
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card" role="radiogroup">
          {DISHES.map((d) => (
            <li key={d.id}>
              <button
                role="radio"
                aria-checked={pick === d.id}
                onClick={() => setPick(d.id)}
                className={cn("flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50", pick === d.id && "bg-sage/35 hover:bg-sage/45")}
              >
                <IconTile tone={pick === d.id ? "forest" : "sage"}>
                  <Store />
                </IconTile>
                <span className="text-body flex-1 font-medium">{d.name}</span>
                <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]", pick === d.id ? "border-forest bg-forest text-ivory" : "border-input")}>
                  {pick === d.id && <Check className="size-3.5" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Section>

      {dish && (
        <>
          {hits.length > 0 && (
            <SafetyAlert title={`May contain ${Array.from(new Set(hits.map((h) => ALLERGEN_LABELS[h.allergen] ?? h.allergen))).join(", ")}`}>
              Ask the restaurant about ingredients. Kitchens can&apos;t always prevent cross-contact.
            </SafetyAlert>
          )}
          <Surface padding="lg">
            <p className="text-caption text-muted-foreground">Typical restaurant serving · estimate</p>
            <p className="tabular text-title mt-1">
              {(Math.round((kcal * 0.7) / 10) * 10).toLocaleString("en-US")}–{(Math.round((kcal * 1.35) / 10) * 10).toLocaleString("en-US")} kcal
            </p>
            <p className="tabular text-caption mt-1 text-muted-foreground">
              Protein about {Math.round(protein * 0.8)}–{Math.round(protein * 1.2)} g · {parts.map((p) => FOOD_MAP[p.foodId]?.name).join(" + ")}
            </p>
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote>Restaurant estimates are less certain than home meals.</EstimateNote>
            </div>
          </Surface>
          <Section title="Ideas when ordering">
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
              {dish.tips.map((t) => (
                <li key={t} className="text-callout flex gap-3 px-4 py-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </Section>
          <InfoNote title="Enjoy your meal">There&apos;s no need to eat less later to make up for eating out.</InfoNote>
          <Button
            className="w-full"
            size="lg"
            onClick={() => {
              useApp.getState().addEntry({
                id: uid("entry"),
                profileId: self.id,
                mealType: suggestMealType(),
                consumedAt: `${todayISO()}T${nowHHMM()}:00`,
                source: "restaurant",
                hasPhoto: false,
                items: parts.map((p) => ({ ...itemFromFood(p.foodId, p.grams), quantityConfidence: "low" as const, confirmedByUser: false })),
                hiddenIngredients: {},
                analysisStatus: "confirmed",
              })
              toast("Logged as an estimate", { description: "Adjust portions from the Food Log any time." })
              setPick(null)
            }}
          >
            Log this meal
          </Button>
        </>
      )}
    </div>
  )
}
