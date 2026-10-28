"use client"

import { useState } from "react"
import { toast } from "sonner"
import { IconTile, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { Scale } from "lucide-react"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodSearchList } from "@/components/log/food-picker"
import { ALLERGEN_LABELS } from "@/lib/data/foods"
import { useApp, useActivePlan, useSelfProfile } from "@/lib/store"
import { add, adultTargets, foodNutrients } from "@/lib/nutrition"
import { nowHHMM, todayISO, uid } from "@/lib/date"
import { MEAL_LABEL } from "@/lib/planning"
import { allergenHits, dayRange, entriesFor, itemFromFood, remainingMeals } from "@/lib/area-b-log"
import { suggestMealType } from "@/lib/area-b-text"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { JournalItem } from "@/lib/types"

const QUICK = ["singara", "biryani_restaurant", "rasgulla", "pitha", "sugary_drink", "banana"]

/** "What if I eat this?" (§42.4). Shows fit without judgement; never suggests skipping a later meal. */
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
  const journal = useApp((s) => s.journal)
  const lookup = useRecipeLookup()
  const [item, setItem] = useState<JournalItem | null>(null)
  if (!self) return null

  const today = todayISO()
  const targets = adultTargets(self)
  const day = dayRange(entriesFor(journal, self.id, today)).mid
  const rest = remainingMeals((plan?.meals ?? []).filter((m) => m.date === today), nowHHMM())
  const plannedRest = rest.reduce((acc, m) => {
    const r = lookup(m.recipeId)
    return r ? acc + r.ingredients.reduce((s, i) => s + foodNutrients(i.foodId, (i.grams * m.servings) / r.servings).energyKcal, 0) : acc
  }, 0)

  if (!item)
    return (
      <div className="space-y-7">
        <InfoNote>Pick a food to see how it would fit into today, alongside the meals you still have planned.</InfoNote>
        <Section title="Common choices">
          <div className="flex flex-wrap gap-2">
            {QUICK.map((id) => (
              <button key={id} onClick={() => setItem(itemFromFood(id))} className="text-callout h-9 rounded-full border border-border/80 bg-card px-4 font-medium transition-colors hover:bg-muted">
                {itemFromFood(id).displayName}
              </button>
            ))}
          </div>
        </Section>
        <Section title="Or search">
          <FoodSearchList profile={self} onPick={(id) => setItem(itemFromFood(id))} />
        </Section>
      </div>
    )

  const n = foodNutrients(item.foodId, item.grams)
  const after = add(day, n)
  const projected = after.energyKcal + plannedRest
  const hits = allergenHits([item], self)

  return (
    <div className="space-y-6">
      {hits.length > 0 && <SafetyAlert title={`Contains ${ALLERGEN_LABELS[hits[0].allergen] ?? hits[0].allergen}`}>This food includes an allergen recorded in your profile. We don&apos;t suggest it.</SafetyAlert>}
      <ItemEditor item={item} profile={self} onChange={setItem} />
      {targets.supported && (
        <Surface padding="lg" className="space-y-4">
          <p className="text-headline">If you have it now</p>
          <NutrientBar label="Energy today" value={after.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate planned={projected} />
          <NutrientBar label="Protein today" value={after.proteinG} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" estimate />
          <p className="text-caption border-t border-border/70 pt-3 text-muted-foreground">The thin marker shows today including your remaining planned meals (~{Math.round(plannedRest).toLocaleString("en-US")} kcal).</p>
        </Surface>
      )}
      <div className="text-callout flex gap-3 rounded-2xl bg-sage/70 p-4">
        <IconTile tone="white" size="sm">
          <Scale />
        </IconTile>
        <div className="min-w-0">
        {!targets.supported ? (
          <p>Your care team sets your targets, so we don&apos;t compare this food with a range.</p>
        ) : projected <= targets.energy.high ? (
          <p>
            This fits within your usual range for today, even with {rest.length ? `your planned ${rest.map((m) => MEAL_LABEL[m.mealType].toLowerCase()).join(" and ")}` : "nothing else planned"}.
          </p>
        ) : (
          <p>
            With your planned meals, today would come to about <span className="tabular font-medium">{Math.round(projected - targets.energy.high)} kcal</span> above your usual range. That&apos;s fine
            occasionally — keep your next meals as planned, or choose a smaller portion now if you&apos;d like.
          </p>
        )}
        {n.proteinG < 5 && n.energyKcal > 150 && <p className="mt-2">Having it with a protein food, like doi or an egg, can help you feel full for longer.</p>}
        </div>
      </div>
      <EstimateNote />
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => setItem(null)}>
          Try another
        </Button>
        <Button
          disabled={hits.length > 0}
          onClick={() => {
            useApp.getState().addEntry({
              id: uid("entry"),
              profileId: self.id,
              mealType: suggestMealType(),
              consumedAt: `${today}T${nowHHMM()}:00`,
              source: "manual",
              hasPhoto: false,
              items: [{ ...item, confirmedByUser: true }],
              hiddenIngredients: {},
              analysisStatus: "confirmed",
            })
            toast("Logged", { description: `${item.displayName} added to today's food log.` })
            setItem(null)
          }}
        >
          Log it
        </Button>
      </div>
    </div>
  )
}
