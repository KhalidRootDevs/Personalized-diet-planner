"use client"

import { useState } from "react"
import { Minus, Plus, Replace, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfidenceChip } from "@/components/app/nutrition"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { FOOD_MAP } from "@/lib/data/foods"
import { foodNutrients } from "@/lib/nutrition"
import { infantFlags } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"
import type { JournalItem, Profile } from "@/lib/types"

const GRAMS = "__grams"

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
}: {
  item: JournalItem
  onChange: (item: JournalItem) => void
  onRemove?: () => void
  profile?: Profile
  showConfidence?: boolean
  hideNutrition?: boolean
}) {
  const food = FOOD_MAP[item.foodId]
  const units = food?.units ?? []
  const [unitLabel, setUnitLabel] = useState(() => initialUnit(item))
  const unit = units.find((u) => u.label === unitLabel)
  const count = unit ? Math.round((item.grams / unit.grams) * 2) / 2 : item.grams
  const n = foodNutrients(item.foodId, item.grams)
  const flag = infantFlags(item.foodId, profile)
  const lowId = showConfidence && item.identificationConfidence === "low"

  const setCount = (c: number) => {
    if (!unit) return
    const next = Math.max(0.5, c)
    onChange({ ...item, grams: Math.round(next * unit.grams), unitLabel: next === 1 ? unit.label : `${next} × ${unit.label}`, confirmedByUser: true })
  }

  return (
    <div className={cn("rounded-xl border bg-card p-3", lowId && "border-caution/40")}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium">{item.displayName}</p>
          <p className="text-xs text-muted-foreground">
            {food?.state === "cooked" ? "Cooked" : food?.state === "raw" ? "Raw" : food?.state === "dry" ? "Dry weight" : "Prepared"}
            {item.cookingMethod && ` · ${item.cookingMethod}`}
            {!hideNutrition && <span className="tabular"> · ~{Math.round(n.energyKcal)} kcal · {Math.round(n.proteinG)} g protein</span>}
          </p>
        </div>
        <FoodPickerSheet
          profile={profile}
          title="Change food"
          onPick={(foodId) => onChange({ ...item, foodId, displayName: FOOD_MAP[foodId]?.name ?? foodId, unitLabel: undefined, identificationConfidence: "high", confirmedByUser: true })}
          trigger={
            <Button variant="ghost" size="icon-sm" aria-label={`Change ${item.displayName}`}>
              <Replace />
            </Button>
          }
        />
        {onRemove && (
          <Button variant="ghost" size="icon-sm" aria-label={`Remove ${item.displayName}`} onClick={onRemove}>
            <Trash2 />
          </Button>
        )}
      </div>

      {showConfidence && !item.confirmedByUser && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            Food: <ConfidenceChip level={item.identificationConfidence} />
          </span>
          <span className="flex items-center gap-1">
            Portion: <ConfidenceChip level={item.quantityConfidence} />
          </span>
        </div>
      )}
      {lowId && <p className="mt-2 text-xs text-caution">We&apos;re not sure about this one — tap the swap icon if it&apos;s a different food.</p>}
      {flag && <p className="mt-2 text-xs font-medium text-safety">{flag}</p>}

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
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-sm" aria-label="Less" disabled={count <= 0.5} onClick={() => setCount(count - 0.5)}>
              <Minus />
            </Button>
            <span className="tabular w-9 text-center text-sm font-semibold" aria-live="polite">
              {count}
            </span>
            <Button variant="outline" size="icon-sm" aria-label="More" onClick={() => setCount(count + 0.5)}>
              <Plus />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              value={item.grams}
              onChange={(e) => onChange({ ...item, grams: Math.max(1, Number(e.target.value) || 0), unitLabel: undefined, confirmedByUser: true })}
              className="tabular w-20"
              aria-label="Grams"
            />
            <span className="text-sm text-muted-foreground">g</span>
          </div>
        )}
      </div>
      {unit && <p className="tabular mt-1 text-right text-xs text-muted-foreground">≈ {item.grams} g</p>}
    </div>
  )
}
