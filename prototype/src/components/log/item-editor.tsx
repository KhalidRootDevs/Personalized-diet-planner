"use client"

import { useState } from "react"
import { CircleCheck, Minus, Plus, Replace, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfidenceChip } from "@/components/app/nutrition"
import { Chip } from "@/components/app/controls"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { FoodTile } from "@/components/log/food-tile"
import { FOOD_MAP } from "@/lib/data/foods"
import { foodNutrients } from "@/lib/nutrition"
import { infantFlags } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"
import type { JournalItem, Profile } from "@/lib/types"

const GRAMS = "__grams"
const NOT_SET = "__none"
export const COOKING_METHODS = ["Boiled", "Steamed", "Curry", "Bhuna", "Fried", "Deep-fried", "Grilled", "Baked", "Raw"]
const COOKABLE = new Set(["fish", "meat", "egg", "vegetable", "mixed_dish", "pulse"])

function initialUnit(item: JournalItem): string {
  const units = FOOD_MAP[item.foodId]?.units ?? []
  const byLabel = units.find((u) => item.unitLabel?.includes(u.label))
  if (byLabel) return byLabel.label
  const divisible = units.find((u) => Math.abs(item.grams / u.grams - Math.round((item.grams / u.grams) * 2) / 2) < 0.01)
  return divisible?.label ?? GRAMS
}

/**
 * One food in an entry with editable portion (§41.3.4). Identification and quantity
 * confidence are shown separately (§41.3, CLAUDE.md). Nutrition comes from the food DB.
 */
export function ItemEditor({
  item,
  onChange,
  onRemove,
  profile,
  showConfidence,
  hideNutrition,
  variant = "card",
}: {
  item: JournalItem
  onChange: (item: JournalItem) => void
  onRemove?: () => void
  profile?: Profile
  showConfidence?: boolean
  hideNutrition?: boolean
  /** "card" = standalone surface; "row" = a row inside a grouped list (UI-SPEC §4.4). */
  variant?: "card" | "row"
}) {
  const food = FOOD_MAP[item.foodId]
  const units = food?.units ?? []
  const [unitLabel, setUnitLabel] = useState(() => initialUnit(item))
  const unit = units.find((u) => u.label === unitLabel)
  const count = unit ? Math.round((item.grams / unit.grams) * 2) / 2 : item.grams
  const n = foodNutrients(item.foodId, item.grams)
  const flag = infantFlags(item.foodId, profile)
  const lowId = showConfidence && item.identificationConfidence === "low" && !item.confirmedByUser
  const candidates = (item.candidates ?? []).filter((id) => FOOD_MAP[id]).slice(0, 3)
  const cookable = food && COOKABLE.has(food.category)
  const pickFood = (foodId: string) => onChange({ ...item, foodId, displayName: FOOD_MAP[foodId]?.name ?? foodId, unitLabel: undefined, confirmedByUser: true })

  const setCount = (c: number) => {
    if (!unit) return
    const next = Math.max(0.5, c)
    onChange({ ...item, grams: Math.round(next * unit.grams), unitLabel: next === 1 ? unit.label : `${next} × ${unit.label}`, confirmedByUser: true })
  }

  return (
    <div className={cn(variant === "card" ? "rounded-2xl bg-card shadow-card p-4" : "px-4 py-4", lowId && (variant === "card" ? "border-caution/40 bg-caution-surface/30" : "bg-caution-surface/30"))}>
      <div className="flex items-start gap-3">
        <FoodTile foodId={item.foodId} name={item.displayName} />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-body font-medium">{item.displayName}</p>
          <p className="text-caption mt-0.5 text-muted-foreground">
            {food?.state === "cooked" ? "Cooked" : food?.state === "raw" ? "Raw" : food?.state === "dry" ? "Dry weight" : "Prepared"}
            {item.cookingMethod && ` · ${item.cookingMethod}`}
            {!hideNutrition && <span className="tabular"> · ~{Math.round(n.energyKcal)} kcal · {Math.round(n.proteinG)} g protein</span>}
          </p>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0">
          <FoodPickerSheet
            profile={profile}
            title="Change food"
            onPick={pickFood}
            trigger={
              <Button variant="ghost" size="icon-sm" className="text-charcoal" aria-label={`Change ${item.displayName}`}>
                <Replace />
              </Button>
            }
          />
          {onRemove && (
            <Button variant="ghost" size="icon-sm" className="text-charcoal" aria-label={`Remove ${item.displayName}`} onClick={onRemove}>
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      {showConfidence && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
          <span className="text-caption flex items-center gap-1.5 text-muted-foreground">
            Food <ConfidenceChip level={item.identificationConfidence} />
          </span>
          <span className="text-caption flex items-center gap-1.5 text-muted-foreground">
            Portion <ConfidenceChip level={item.quantityConfidence} />
          </span>
          {item.confirmedByUser && (
            <span className="text-caption inline-flex items-center gap-1 font-medium text-forest">
              <CircleCheck className="size-3.5" aria-hidden /> Confirmed by you
            </span>
          )}
        </div>
      )}
      {lowId && (
        <div className="mt-3 rounded-xl bg-card/80 p-3" role="group" aria-label={`Which food is ${item.displayName}?`}>
          <p className="text-callout font-semibold">We&apos;re not sure about this one. Which is it?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(candidates.length ? candidates : [item.foodId]).map((id) => (
              <Chip key={id} selected={false} onClick={() => pickFood(id)}>
                {FOOD_MAP[id]?.name ?? id}
              </Chip>
            ))}
            <FoodPickerSheet
              profile={profile}
              title="Pick the right food"
              onPick={pickFood}
              trigger={
                <button type="button" className="text-callout h-9 rounded-full px-3 font-semibold text-forest hover:underline">
                  Something else
                </button>
              }
            />
          </div>
        </div>
      )}
      {flag && <p className="text-caption mt-2 font-medium text-safety">{flag}</p>}

      <div className="mt-3 flex items-center gap-2">
        <Select
          value={unitLabel}
          onValueChange={(v) => {
            setUnitLabel(v)
            const u = units.find((x) => x.label === v)
            if (u) onChange({ ...item, grams: u.grams, unitLabel: u.label, confirmedByUser: true })
          }}
        >
          <SelectTrigger className="min-w-0 flex-1" aria-label="Portion unit">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {units.map((u) => (
              <SelectItem key={u.label} value={u.label}>
                {u.label} <span className="text-muted-foreground">({u.grams} g)</span>
              </SelectItem>
            ))}
            <SelectItem value={GRAMS}>Grams</SelectItem>
          </SelectContent>
        </Select>
        {unit ? (
          <div className="flex h-12 shrink-0 items-center rounded-xl border border-input bg-card px-1">
            <button type="button" className="grid size-10 place-items-center rounded-lg text-charcoal transition-colors hover:bg-muted disabled:opacity-40" aria-label="Less" disabled={count <= 0.5} onClick={() => setCount(count - 0.5)}>
              <Minus className="size-4" />
            </button>
            <span className="tabular text-body w-8 text-center font-semibold" aria-live="polite">
              {count}
            </span>
            <button type="button" className="grid size-10 place-items-center rounded-lg text-charcoal transition-colors hover:bg-muted" aria-label="More" onClick={() => setCount(count + 0.5)}>
              <Plus className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={item.grams}
              onChange={(e) => onChange({ ...item, grams: Math.max(1, Number(e.target.value) || 0), unitLabel: undefined, confirmedByUser: true })}
              className="tabular w-24"
              aria-label="Grams"
            />
            <span className="text-callout text-muted-foreground">g</span>
          </div>
        )}
      </div>
      {unit && <p className="tabular text-caption mt-1.5 text-right text-muted-foreground">≈ {item.grams} g</p>}
      {cookable && (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-caption text-muted-foreground">How it was cooked</span>
          <Select value={item.cookingMethod ?? NOT_SET} onValueChange={(v) => onChange({ ...item, cookingMethod: v === NOT_SET ? undefined : v, confirmedByUser: true })}>
            <SelectTrigger className="h-10 w-40" aria-label={`Cooking method for ${item.displayName}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NOT_SET}>Not specified</SelectItem>
              {COOKING_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
