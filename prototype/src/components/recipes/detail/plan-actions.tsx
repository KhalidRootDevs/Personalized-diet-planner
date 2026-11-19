"use client"

import { useState } from "react"
import { toast } from "sonner"
import { BadgeCheck, CalendarPlus, Wand2 } from "lucide-react"
import { Pill, Surface } from "@/components/app/page"
import { ChoiceCard } from "@/components/app/controls"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useActivePlan, useActiveProfile, useApp } from "@/lib/store"
import { MEAL_LABEL, VARIATION_LABEL, mockProposeVariation, validateVariation, type VariationKind, type VariationResult } from "@/lib/planning"
import { formatDay, todayISO } from "@/lib/date"
import { revalidateAfterChange, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"

function signed(n: number, unit: string) {
  const v = Math.round(n)
  if (v === 0) return `±0 ${unit}`
  return `${v > 0 ? "+" : "−"}${Math.abs(v)} ${unit}`
}

/** Add to plan (§10, §25.2 step 8): replaces an upcoming meal and re-validates the day. */
export function AddToPlan({ recipe, className }: { recipe: Recipe | null; className?: string }) {
  const plan = useActivePlan()
  const replaceMeal = useApp((s) => s.replaceMeal)
  const [open, setOpen] = useState(false)
  const [mealId, setMealId] = useState<string | null>(null)
  const lookup = useRecipeLookup()
  if (!recipe)
    return (
      <Button size="lg" className={cn("w-full", className)} disabled>
        <CalendarPlus className="size-5" /> Save your version first
      </Button>
    )
  const slots = (plan?.meals ?? []).filter((m) => m.date >= todayISO() && !m.outcome && recipe.mealTypes.some((t) => t === m.mealType || (t.includes("snack") && m.mealType.includes("snack")))).slice(0, 10)
  const personal = recipe.reviewStatus === "personal"

  return (
    <>
      <Button size="lg" className={cn("w-full", className)} onClick={() => setOpen(true)} disabled={!plan}>
        <CalendarPlus className="size-5" /> {plan ? "Add to plan" : "No active plan"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to your plan</DialogTitle>
            <DialogDescription>Choose a meal to replace. Daily totals, checks and your shopping list are recalculated.</DialogDescription>
          </DialogHeader>
          {personal && <InfoNote>It passed your allergy and diet checks. It will show as &quot;Your recipe · not reviewed&quot; in your plan.</InfoNote>}
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
                const check = revalidateAfterChange(mealId)
                toast(`${recipe.name} added to your plan`, { description: check?.summary })
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

/** AI-assisted variation (§9.3 Approach B): a mock model proposes structured changes; the engine validates them. */
export function VariationFlow({ recipe, blocked, onSave }: { recipe: Recipe; blocked: string | null; onSave: (r: Recipe) => void }) {
  const profile = useActiveProfile()
  const [kind, setKind] = useState<VariationKind | null>(null)
  const [result, setResult] = useState<VariationResult | null>(null)
  if (blocked) return <InfoNote>{blocked}</InfoNote>
  if (!profile) return null
  return (
    <div className="space-y-3">
      <div className="space-y-2" role="radiogroup" aria-label="Variation">
        {(Object.keys(VARIATION_LABEL) as VariationKind[]).map((k) => (
          <ChoiceCard
            key={k}
            selected={kind === k}
            onSelect={() => {
              setKind(k)
              setResult(null)
            }}
            icon={<Wand2 />}
            title={VARIATION_LABEL[k].title}
            description={VARIATION_LABEL[k].hint}
          />
        ))}
      </div>
      <Button variant="secondary" className="w-full" disabled={!kind} onClick={() => kind && setResult(validateVariation(mockProposeVariation(recipe, kind), recipe, profile))}>
        Suggest a variation
      </Button>
      {result && !result.ok && <CautionNote title="Not shown">{result.reason}</CautionNote>}
      {result && result.ok && (
        <Surface className="space-y-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Pill tone="caution">AI suggestion · not reviewed</Pill>
            <Pill tone="sage" icon={<BadgeCheck />}>
              Passed your safety rules
            </Pill>
          </div>
          <p className="text-body font-semibold">{result.recipe.name}</p>
          <p className="text-callout text-muted-foreground">{result.rationale}</p>
          <p className="tabular text-callout">
            Per serving: {signed(result.delta.energyKcal, "kcal")} · protein {signed(result.delta.proteinG, "g")} · fat {signed(result.delta.fatG, "g")} · fiber {signed(result.delta.fiberG, "g")}
          </p>
          <EstimateNote>The AI only proposed the change. Our nutrition engine checked allergens, diet and quantities and recalculated nutrition from the food database.</EstimateNote>
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => onSave(result.recipe)}>Save to library</Button>
            <Button variant="outline" onClick={() => setResult(null)}>
              Discard
            </Button>
          </div>
        </Surface>
      )}
    </div>
  )
}
