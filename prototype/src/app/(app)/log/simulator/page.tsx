"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Plus, Scale } from "lucide-react"
import { IconTile, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet, FoodSearchList } from "@/components/log/food-picker"
import { FoodTile } from "@/components/log/food-tile"
import { ALLERGEN_LABELS, FOOD_MAP } from "@/lib/data/foods"
import { useApp, useActivePlan, useSelfProfile } from "@/lib/store"
import { add, adultTargets, foodNutrients, ZERO } from "@/lib/nutrition"
import { nowHHMM, todayISO } from "@/lib/date"
import { MEAL_LABEL } from "@/lib/planning"
import { allergenHits, dayRange, entriesFor, itemFromFood, listNames, remainingMeals, setLogHandoff } from "@/lib/area-b-log"
import { suggestMealType } from "@/lib/area-b-text"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { JournalItem } from "@/lib/types"

const QUICK = ["singara", "biryani_restaurant", "rasgulla", "pitha", "sugary_drink", "banana"]
// Uncertainty band by the food record's data confidence.
const BAND = { high: 0.1, moderate: 0.2, low: 0.3 } as const
const r0 = (v: number) => Math.round(v).toLocaleString("en-US")

function band(item: JournalItem, factor = 1) {
  const kcal = foodNutrients(item.foodId, item.grams * factor).energyKcal
  const u = BAND[FOOD_MAP[item.foodId]?.confidence ?? "moderate"]
  return { kcal, low: kcal * (1 - u), high: kcal * (1 + u) }
}

/**
 * "What if I eat this?" (§42.4). Shows fit without judgement for one or several foods, with
 * portion alternatives. Never suggests skipping a later meal. Nothing is logged unless the user
 * chooses to — and then it goes through the normal review and confirmation step.
 */
export default function SimulatorPage() {
  return (
    <>
      <PageHeader title={<span className="flex items-center gap-2">What if I eat this? <FeatureBadge feature="what_if" /></span>} back="/log" />
      <PageBody>
        <PremiumGate feature="what_if">
          <Simulator />
        </PremiumGate>
      </PageBody>
    </>
  )
}

function Simulator() {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const router = useRouter()
  const journal = useApp((s) => s.journal)
  const lookup = useRecipeLookup()
  const [items, setItems] = useState<JournalItem[]>([])
  if (!self) return null

  const today = todayISO()
  const targets = adultTargets(self)
  const day = dayRange(entriesFor(journal, self.id, today)).mid
  const rest = remainingMeals((plan?.meals ?? []).filter((m) => m.date === today), nowHHMM())
  const plannedRest = rest.reduce((acc, m) => {
    const r = lookup(m.recipeId)
    return r ? acc + r.ingredients.reduce((s, i) => s + foodNutrients(i.foodId, (i.grams * m.servings) / r.servings).energyKcal, 0) : acc
  }, 0)
  const addFood = (id: string) => setItems((list) => [...list, itemFromFood(id)])

  if (!items.length)
    return (
      <div className="space-y-7">
        <InfoNote>Pick one or more foods to see how they would fit into today, alongside the meals you still have planned. Nothing is logged unless you choose to.</InfoNote>
        <Section title="Common choices" description="Tap one to start. You can add more after.">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((id) => (
              <button key={id} onClick={() => addFood(id)} className="text-callout inline-flex h-11 items-center gap-2 rounded-full bg-card pr-4 pl-1.5 font-medium shadow-card transition-colors hover:bg-muted">
                <FoodTile foodId={id} size="xs" className="size-8" />
                {FOOD_MAP[id]?.name ?? id}
              </button>
            ))}
          </div>
        </Section>
        <Section title="Or search">
          <FoodSearchList profile={self} onPick={addFood} initialLimit={8} />
        </Section>
      </div>
    )

  const n = items.reduce((acc, i) => add(acc, foodNutrients(i.foodId, i.grams)), ZERO)
  const totalBand = items.map((i) => band(i)).reduce((a, b) => ({ kcal: a.kcal + b.kcal, low: a.low + b.low, high: a.high + b.high }), { kcal: 0, low: 0, high: 0 })
  const halfBand = items.map((i) => band(i, 0.5)).reduce((a, b) => ({ kcal: a.kcal + b.kcal, low: a.low + b.low, high: a.high + b.high }), { kcal: 0, low: 0, high: 0 })
  const after = add(day, n)
  const projected = after.energyKcal + plannedRest
  const hits = allergenHits(items, self)

  const logIt = () => {
    setLogHandoff({
      source: "manual",
      mealType: suggestMealType(),
      context: "From “What if I eat this?”. Check the portions you actually had before saving.",
      items: items.map((i) => ({ ...i, confirmedByUser: false })),
    })
    router.push("/log/new?handoff=1")
  }

  return (
    <div className="space-y-7">
      {hits.length > 0 && (
        <SafetyAlert title={`Contains ${Array.from(new Set(hits.map((h) => ALLERGEN_LABELS[h.allergen] ?? h.allergen))).join(", ")}`}>
          {listNames(hits.map((h) => h.item.displayName)).replace(/^./, (c) => c.toUpperCase())} include{hits.length === 1 ? "s" : ""} an allergen recorded in your profile. We don&apos;t suggest it.
        </SafetyAlert>
      )}
      <Section title={`Foods (${items.length})`}>
        <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
          {items.map((it, idx) => {
            const half = band(it, 0.5)
            return (
              <div key={it.id}>
                <ItemEditor variant="row" item={it} profile={self} onChange={(next) => setItems(items.map((x, j) => (j === idx ? next : x)))} onRemove={() => setItems(items.filter((_, j) => j !== idx))} />
                <p className="tabular text-caption -mt-2 px-4 pb-3 text-muted-foreground">
                  This portion ~{r0(band(it).low)}–{r0(band(it).high)} kcal · a half portion would be ~{r0(half.low)}–{r0(half.high)} kcal
                </p>
              </div>
            )
          })}
          <FoodPickerSheet
            profile={self}
            onPick={addFood}
            trigger={
              <button type="button" className="text-callout flex min-h-[56px] w-full items-center gap-3 px-4 font-semibold text-forest transition-colors hover:bg-muted/50">
                <span className="grid size-8 place-items-center rounded-full border border-dashed border-forest/40">
                  <Plus className="size-4" />
                </span>
                Add another food
              </button>
            }
          />
        </div>
      </Section>

      <Surface padding="lg">
        <p className="text-caption text-muted-foreground">Together · estimate</p>
        <p className="tabular text-title mt-1">
          ~{r0(totalBand.low)}–{r0(totalBand.high)} kcal
        </p>
        <p className="tabular text-caption mt-1 text-muted-foreground">
          Protein ~{r0(n.proteinG)} g · carbs ~{r0(n.carbsG)} g · fat ~{r0(n.fatG)} g
        </p>
        <p className="tabular text-callout mt-3 border-t border-border/70 pt-3">
          Half portions would be ~{r0(halfBand.low)}–{r0(halfBand.high)} kcal.
        </p>
      </Surface>

      {targets.supported && (
        <Surface padding="lg" className="space-y-4">
          <p className="text-headline">If you have {items.length === 1 ? "it" : "them"} now</p>
          <NutrientBar label="Energy today" value={after.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate planned={projected} />
          <NutrientBar label="Protein today" value={after.proteinG} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" estimate color="protein" />
          <p className="text-caption border-t border-border/70 pt-3 text-muted-foreground">The thin marker shows today including your remaining planned meals (~{r0(plannedRest)} kcal).</p>
        </Surface>
      )}
      <Surface tone="sage" className="text-callout flex gap-3">
        <IconTile tone="white" size="sm">
          <Scale />
        </IconTile>
        <div className="min-w-0">
          {!targets.supported ? (
            <p>Your care team sets your targets, so we don&apos;t compare this with a range.</p>
          ) : projected <= targets.energy.high ? (
            <p>This fits within your usual range for today, even with {rest.length ? `your planned ${rest.map((m) => MEAL_LABEL[m.mealType].toLowerCase()).join(" and ")}` : "nothing else planned"}.</p>
          ) : (
            <p>
              With your planned meals, today would come to about <span className="tabular font-medium">{r0(projected - targets.energy.high)} kcal</span> above your usual range. That&apos;s fine occasionally — keep
              your next meals as planned, or choose a smaller portion now if you&apos;d like. There&apos;s no need to skip a meal later.
            </p>
          )}
          {n.proteinG < 5 && n.energyKcal > 150 && <p className="mt-2">Having it with a protein food, like doi or an egg, can help you feel full for longer.</p>}
        </div>
      </Surface>
      <EstimateNote />
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => setItems([])}>
          Start over
        </Button>
        <Button disabled={hits.length > 0} onClick={logIt}>
          Review and log
        </Button>
      </div>
    </div>
  )
}
