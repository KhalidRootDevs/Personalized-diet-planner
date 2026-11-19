"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { ArrowRightLeft, Check, Search, Store } from "lucide-react"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FOOD_MAP, FOODS, ALLERGEN_LABELS } from "@/lib/data/foods"
import { useSelfProfile } from "@/lib/store"
import { foodNutrients } from "@/lib/nutrition"
import { parseMealText, suggestMealType } from "@/lib/area-b-text"
import { allergenHits, itemFromFood, setLogHandoff } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

type Part = { foodId: string; grams: number }
interface Dish {
  id: string
  name: string
  parts: Part[]
  tips: string[]
  alternatives?: string[]
}

// Restaurant dishes mapped to verified restaurant-style or home food records (§42.6, §42.22).
const DISHES: Dish[] = [
  { id: "biryani", name: "Kacchi / chicken biryani", parts: [{ foodId: "biryani_restaurant", grams: 450 }], tips: ["Share a plate or ask for a half portion", "Choose water instead of a soft drink", "Skip the extra ghee on top"], alternatives: ["half_biryani", "fish_curry_plate", "khichuri"] },
  { id: "half_biryani", name: "Half plate biryani with doi", parts: [{ foodId: "biryani_restaurant", grams: 250 }, { foodId: "doi", grams: 100 }], tips: ["Doi on the side adds protein and calcium"] },
  { id: "plate", name: "Rice plate with fried fish and dal", parts: [{ foodId: "fried_fish", grams: 100 }, { foodId: "rice_cooked", grams: 300 }, { foodId: "dal_cooked", grams: 150 }], tips: ["Ask for curry fish instead of fried", "Fill a quarter of the plate with vegetables", "Have dal for extra protein"], alternatives: ["fish_curry_plate"] },
  { id: "fish_curry_plate", name: "Rice plate with rui fish curry, dal and bhaji", parts: [{ foodId: "rui_fish", grams: 100 }, { foodId: "rice_cooked", grams: 250 }, { foodId: "dal_cooked", grams: 150 }, { foodId: "mixed_veg", grams: 100 }], tips: ["A balanced plate with protein, fiber and vegetables"] },
  { id: "paratha", name: "Paratha with vegetable bhaji", parts: [{ foodId: "paratha", grams: 140 }, { foodId: "mixed_veg", grams: 120 }], tips: ["Choose roti if available", "Pair with dal or egg for protein"], alternatives: ["roti_bhaji"] },
  { id: "roti_bhaji", name: "Roti with bhaji and dal", parts: [{ foodId: "roti", grams: 120 }, { foodId: "mixed_veg", grams: 150 }, { foodId: "dal_cooked", grams: 120 }], tips: ["Dal adds protein and fiber"] },
  { id: "singara", name: "Singara and tea", parts: [{ foodId: "singara", grams: 120 }, { foodId: "milk_tea", grams: 150 }], tips: ["One piece is a snack; two is closer to a meal", "Ask for less sugar in tea"], alternatives: ["chola_tea"] },
  { id: "chola_tea", name: "Spiced chola and tea", parts: [{ foodId: "chickpeas_cooked", grams: 120 }, { foodId: "milk_tea", grams: 150 }], tips: ["Chickpeas bring protein and fiber"] },
  { id: "beef", name: "Beef bhuna with rice", parts: [{ foodId: "beef_curry", grams: 150 }, { foodId: "rice_cooked", grams: 300 }], tips: ["Ask for more vegetables on the side", "Bhuna is oil-rich — a smaller portion helps"], alternatives: ["fish_curry_plate", "khichuri"] },
  { id: "khichuri", name: "Khichuri with egg", parts: [{ foodId: "khichuri", grams: 400 }, { foodId: "egg_boiled", grams: 50 }], tips: ["Ask for a side of salad or bhaji"] },
]
const DISH_MAP = Object.fromEntries(DISHES.map((d) => [d.id, d]))
const RESTAURANT_FOODS = FOODS.filter((f) => f.variant === "restaurant")

function estimate(parts: Part[]) {
  const kcal = parts.reduce((s, p) => s + foodNutrients(p.foodId, p.grams).energyKcal, 0)
  const protein = parts.reduce((s, p) => s + foodNutrients(p.foodId, p.grams).proteinG, 0)
  const r10 = (v: number) => (Math.round(v / 10) * 10).toLocaleString("en-US")
  // Restaurant portions and oil vary, so ranges are wide (§42.22).
  return { kcal, protein, kcalText: `${r10(kcal * 0.7)}–${r10(kcal * 1.35)} kcal`, proteinText: `${Math.round(protein * 0.8)}–${Math.round(protein * 1.2)} g` }
}

const hitsFor = (parts: Part[], p: Profile) => allergenHits(parts.map((x) => itemFromFood(x.foodId, x.grams)), p)

/**
 * Restaurant assistant (§42.22, Phase 3). Restaurant values are shown as wide ranges, never exact,
 * suggestions are ordering ideas — not restriction — and logging goes through the normal review.
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
  const router = useRouter()
  const [q, setQ] = useState("")
  const [pick, setPick] = useState<Dish | null>(null)
  if (!self) return null

  const term = q.trim().toLowerCase()
  const shown = term ? DISHES.filter((d) => d.name.toLowerCase().includes(term) || d.parts.some((p) => FOOD_MAP[p.foodId]?.name.toLowerCase().includes(term))) : DISHES.filter((d) => d.alternatives)
  const foodMatches = term ? RESTAURANT_FOODS.filter((f) => f.name.toLowerCase().includes(term) || f.nameBn.includes(q.trim())) : []
  const parsed = term ? parseMealText(q) : []

  const est = pick ? estimate(pick.parts) : null
  const hits = pick ? hitsFor(pick.parts, self) : []
  // Alternatives must pass hard constraints: never suggest a dish with a recorded allergen (§25.2).
  const alts = pick ? (pick.alternatives ?? []).map((id) => DISH_MAP[id]).filter((d) => d && !hitsFor(d.parts, self).length) : []

  const logIt = () => {
    if (!pick) return
    setLogHandoff({
      source: "restaurant",
      mealType: suggestMealType(),
      context: "From the eating-out assistant. Restaurant portions and oil vary, so check each item and portion.",
      items: pick.parts.map((p) => {
        const it = itemFromFood(p.foodId, p.grams)
        return { ...it, unitLabel: undefined, identificationConfidence: "moderate" as const, quantityConfidence: "low" as const, confirmedByUser: false, aiOriginal: { foodId: p.foodId, grams: p.grams } }
      }),
    })
    router.push("/log/new?handoff=1")
  }

  return (
    <div className="space-y-7">
      <Section title="What are you ordering?" description="Search a dish or type your order. Restaurant portions and oil vary a lot, so estimates are ranges.">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-grey" aria-hidden />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. biryani, singara, “paratha and tea”" className="pl-11" aria-label="Search or describe your order" />
        </div>
        <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card" role="radiogroup" aria-label="Dishes">
          {shown.map((d) => (
            <DishRow key={d.id} name={d.name} hint={estimate(d.parts).kcalText} selected={pick?.id === d.id} onClick={() => setPick(d)} />
          ))}
          {foodMatches
            .filter((f) => !shown.some((d) => d.parts.length === 1 && d.parts[0].foodId === f.id))
            .map((f) => {
              const d: Dish = { id: `food:${f.id}`, name: f.name, parts: [{ foodId: f.id, grams: f.units[f.units.length - 1]?.grams ?? 100 }], tips: ["A smaller portion or sharing is always an option"] }
              return <DishRow key={d.id} name={f.name} hint={`${f.units[f.units.length - 1]?.label ?? "Portion"} · ${estimate(d.parts).kcalText}`} selected={pick?.id === d.id} onClick={() => setPick(d)} />
            })}
          {parsed.length > 0 && (
            <DishRow
              name={`Your order: “${q.trim()}”`}
              hint={parsed.map((i) => i.displayName).join(", ")}
              selected={pick?.id === "custom"}
              onClick={() => setPick({ id: "custom", name: q.trim(), parts: parsed.map((i) => ({ foodId: i.foodId, grams: i.grams })), tips: ["Ask how the dish is cooked — curry or grilled usually uses less oil than fried"] })}
            />
          )}
          {term && !shown.length && !foodMatches.length && !parsed.length && <li className="text-callout p-4 text-muted-foreground">No match yet. Try a simpler name like biryani, paratha or tea.</li>}
        </ul>
      </Section>

      {pick && est && (
        <>
          {hits.length > 0 && (
            <SafetyAlert title={`May contain ${Array.from(new Set(hits.map((h) => ALLERGEN_LABELS[h.allergen] ?? h.allergen))).join(", ")}`}>
              Ask the restaurant about ingredients. Kitchens can&apos;t always prevent cross-contact.
            </SafetyAlert>
          )}
          <Surface padding="lg">
            <p className="text-caption text-muted-foreground">Typical restaurant serving · estimate</p>
            <p className="tabular text-title mt-1">{est.kcalText}</p>
            <p className="tabular text-caption mt-1 text-muted-foreground">
              Protein about {est.proteinText} · {pick.parts.map((p) => FOOD_MAP[p.foodId]?.name).join(" + ")}
            </p>
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote>Restaurant estimates are less certain than home meals. We don&apos;t know this restaurant&apos;s exact recipe.</EstimateNote>
            </div>
          </Surface>

          {alts.length > 0 && (
            <Section title="Other dishes to consider" description="Only if you'd like a change — ranges for a typical serving.">
              <ListGroup>
                {alts.map((a) => {
                  const e = estimate(a.parts)
                  const dk = e.kcal - est.kcal
                  const dp = e.protein - est.protein
                  return (
                    <ListRow
                      key={a.id}
                      onClick={() => setPick(a)}
                      icon={<ArrowRightLeft />}
                      iconTone="sky"
                      title={a.name}
                      description={
                        <span className="tabular">
                          {e.kcalText} · protein {e.proteinText}
                          {Math.abs(dk) >= 50 && ` · about ${Math.round(Math.abs(dk) / 10) * 10} kcal ${dk < 0 ? "less" : "more"}`}
                          {dp >= 5 && " · more protein"}
                        </span>
                      }
                    />
                  )
                })}
              </ListGroup>
            </Section>
          )}

          <Section title="Ideas when ordering">
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              {pick.tips.map((t) => (
                <li key={t} className="text-callout flex gap-3 px-4 py-3">
                  <Check className="mt-0.5 size-4 shrink-0 text-forest" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </Section>
          <InfoNote title="Enjoy your meal">There&apos;s no need to eat less later to make up for eating out.</InfoNote>
          <Button className="w-full" size="lg" onClick={logIt}>
            Review and log this meal
          </Button>
          <p className="text-caption -mt-4 text-center text-muted-foreground">You&apos;ll check the foods and portions before anything is saved.</p>
        </>
      )}
    </div>
  )
}

function DishRow({ name, hint, selected, onClick }: { name: string; hint: string; selected: boolean; onClick: () => void }) {
  return (
    <li>
      <button role="radio" aria-checked={selected} onClick={onClick} className={cn("flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50", selected && "bg-sage/35 hover:bg-sage/45")}>
        <IconTile tone={selected ? "forest" : "sage"}>
          <Store />
        </IconTile>
        <span className="min-w-0 flex-1">
          <span className="text-body block font-medium">{name}</span>
          <span className="tabular text-caption block text-muted-foreground">{hint}</span>
        </span>
        <span className={cn("grid size-6 shrink-0 place-items-center rounded-full border-[1.5px]", selected ? "border-lime bg-lime text-charcoal" : "border-input")}>{selected && <Check className="size-3.5" />}</span>
      </button>
    </li>
  )
}
