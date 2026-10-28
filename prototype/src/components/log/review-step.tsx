"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { EstimateNote } from "@/components/app/nutrition"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { PhotoPlaceholder } from "@/components/log/entry-card"
import { StickyAction } from "@/components/log/input-steps"
import { ALLERGEN_LABELS } from "@/lib/data/foods"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime } from "@/lib/date"
import { entryNutrition, entryUncertainty } from "@/lib/nutrition"
import { allergenHits, infantFlags, itemFromFood } from "@/lib/area-b-log"
import { needsHiddenIngredientQuestion, hasSweetDrink } from "@/lib/vision-mock"
import { useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { JournalEntry, JournalItem, PlannedMeal, Profile } from "@/lib/types"

export type Oil = NonNullable<JournalEntry["hiddenIngredients"]["oil"]>
export interface ChildInfo {
  texture: string
  accepted: "yes" | "somewhat" | "no"
  reaction: string
  firstTime: boolean
}

export const TEXTURES = ["Smooth purée", "Mashed", "Soft lumps", "Soft finger food", "Chopped family food"]

const OIL: { id: Oil | "unsure"; label: string }[] = [
  { id: "none", label: "None" },
  { id: "little", label: "A little" },
  { id: "moderate", label: "Moderate" },
  { id: "lots", label: "A lot" },
  { id: "unsure", label: "Not sure" },
]

/**
 * Confirmation step (§41.3.4). Nothing is saved until the user confirms; nutrition is then
 * computed by the engine from the food DB. Hidden-ingredient questions only when they matter (§41.3.3).
 */
export function ReviewStep({
  profile,
  source,
  photoUrl,
  hasPhoto,
  items,
  setItems,
  oil,
  setOil,
  sugar,
  setSugar,
  linkedMealId,
  setLinkedMealId,
  openMeals,
  time,
  setTime,
  saveAsUsual,
  setSaveAsUsual,
  child,
  setChild,
  onConfirm,
}: {
  profile: Profile
  source: JournalEntry["source"]
  photoUrl?: string
  hasPhoto: boolean
  items: JournalItem[]
  setItems: (i: JournalItem[]) => void
  oil: Oil | "unsure" | undefined
  setOil: (o: Oil | "unsure") => void
  sugar: boolean | undefined
  setSugar: (s: boolean) => void
  linkedMealId: string
  setLinkedMealId: (id: string) => void
  openMeals: PlannedMeal[]
  time: string
  setTime: (t: string) => void
  saveAsUsual: boolean
  setSaveAsUsual: (v: boolean) => void
  child: ChildInfo
  setChild: (c: ChildInfo) => void
  onConfirm: () => void
}) {
  const lookup = useRecipeLookup()
  const isChild = profile.type !== "adult"
  const aiProposed = source === "photo" || source === "text" || source === "voice"
  const askOil = !isChild && aiProposed && needsHiddenIngredientQuestion(items)
  const askSugar = !isChild && aiProposed && hasSweetDrink(items)
  const hits = allergenHits(items, profile)
  const infant = isChild ? items.map((i) => ({ i, flag: infantFlags(i.foodId, profile) })).filter((x) => x.flag) : []

  const draft: JournalEntry = {
    id: "draft",
    profileId: profile.id,
    mealType: "other",
    consumedAt: "",
    source,
    hasPhoto,
    items,
    hiddenIngredients: { oil: oil === "unsure" ? "moderate" : oil, sugar },
    analysisStatus: "pending_confirmation",
  }
  const n = entryNutrition(draft)
  const u = entryUncertainty(draft) + (oil === "unsure" ? 0.05 : 0)

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 px-4 pb-6">
        {hasPhoto && (
          <div className="flex items-center gap-3">
            <PhotoPlaceholder src={photoUrl} className="size-20 shrink-0" />
            <div>
              <p className="font-semibold">Check what we found</p>
              <p className="text-sm text-muted-foreground">These are suggestions from your photo. Fix anything that&apos;s wrong.</p>
            </div>
          </div>
        )}
        {!hasPhoto && aiProposed && <InfoNote title="Check what we found">We matched your words to foods in our database. Fix anything that&apos;s wrong.</InfoNote>}

        {hits.length > 0 && (
          <SafetyAlert title={`Contains ${Array.from(new Set(hits.map((h) => ALLERGEN_LABELS[h.allergen] ?? h.allergen))).join(", ")}`} emergency>
            {hits.map((h) => h.item.displayName).join(", ")} {hits.length > 1 ? "contain" : "contains"} an allergen recorded in {isChild ? `${profile.name}'s` : "your"} profile. You can still record it. If there are signs of a reaction, get help now.
          </SafetyAlert>
        )}
        {infant.length > 0 && (
          <SafetyAlert title="Check this food for your baby's age">
            <ul className="list-disc pl-4">
              {infant.map(({ i, flag }) => (
                <li key={i.id}>
                  {i.displayName}: {flag}
                </li>
              ))}
            </ul>
          </SafetyAlert>
        )}

        <div className="space-y-2">
          {items.map((it, idx) => (
            <ItemEditor
              key={it.id}
              item={it}
              profile={profile}
              showConfidence={aiProposed}
              hideNutrition={isChild}
              onChange={(next) => setItems(items.map((x, j) => (j === idx ? next : x)))}
              onRemove={() => setItems(items.filter((_, j) => j !== idx))}
            />
          ))}
          <FoodPickerSheet
            profile={profile}
            onPick={(id) => setItems([...items, { ...itemFromFood(id), confirmedByUser: true }])}
            trigger={
              <Button variant="outline" className="w-full border-dashed">
                <Plus /> Add a food we missed
              </Button>
            }
          />
        </div>

        {askOil && (
          <fieldset className="space-y-2">
            <legend className="font-medium">How much oil or ghee was used?</legend>
            <p className="text-xs text-muted-foreground">Photos can&apos;t show oil, and it changes the estimate a lot.</p>
            <Chips options={OIL} value={oil} onChange={setOil} />
          </fieldset>
        )}
        {askSugar && (
          <fieldset className="space-y-2">
            <legend className="font-medium">Was sugar added to your tea?</legend>
            <Chips
              options={[
                { id: "yes", label: "Yes" },
                { id: "no", label: "No" },
              ]}
              value={sugar === undefined ? undefined : sugar ? "yes" : "no"}
              onChange={(v) => setSugar(v === "yes")}
            />
          </fieldset>
        )}

        {isChild ? (
          <div className="space-y-4 rounded-2xl border bg-card p-4">
            <div className="space-y-1.5">
              <Label>Texture</Label>
              <Select value={child.texture} onValueChange={(texture) => setChild({ ...child, texture })}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEXTURES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">How did it go?</legend>
              <Chips
                options={[
                  { id: "yes", label: "Enjoyed it" },
                  { id: "somewhat", label: "A little" },
                  { id: "no", label: "Not today" },
                ]}
                value={child.accepted}
                onChange={(accepted) => setChild({ ...child, accepted: accepted as ChildInfo["accepted"] })}
              />
              <p className="text-xs text-muted-foreground">Let your baby decide how much. It can take many tries to accept a new food.</p>
            </fieldset>
            <div className="space-y-1.5">
              <Label htmlFor="reaction">Any reaction?</Label>
              <Textarea id="reaction" rows={2} value={child.reaction} onChange={(e) => setChild({ ...child, reaction: e.target.value })} placeholder="e.g. none observed, mild rash around mouth" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={child.firstTime} onCheckedChange={(v) => setChild({ ...child, firstTime: v === true })} />
              First time trying this — add to the introduction tracker
            </label>
          </div>
        ) : (
          <>
            {openMeals.length > 0 && (
              <div className="space-y-1.5">
                <Label>Which planned meal was this?</Label>
                <Select value={linkedMealId} onValueChange={setLinkedMealId}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {openMeals.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {MEAL_LABEL[m.mealType]} · {formatTime(m.time)} — {lookup(m.recipeId)?.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="none">Not from my plan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="rounded-2xl bg-sage/60 p-4">
              <p className="text-xs text-muted-foreground">Estimate for this meal</p>
              <p className="tabular text-xl font-semibold">
                ~{Math.round(n.energyKcal)} kcal <span className="text-sm font-normal text-muted-foreground">({Math.round(n.energyKcal * (1 - u))}–{Math.round(n.energyKcal * (1 + u))})</span>
              </p>
              <p className="tabular text-sm text-muted-foreground">
                Protein ~{Math.round(n.proteinG)} g · Carbs ~{Math.round(n.carbsG)} g · Fat ~{Math.round(n.fatG)} g · Fiber ~{Math.round(n.fiberG)} g
              </p>
              <EstimateNote className="mt-2">Calculated from our food database after you confirm. The range reflects portion uncertainty.</EstimateNote>
            </div>
            {source !== "saved" && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox checked={saveAsUsual} onCheckedChange={(v) => setSaveAsUsual(v === true)} />
                Save as a usual meal for quicker logging
              </label>
            )}
          </>
        )}

        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="when">When did {isChild ? `${profile.name} eat` : "you eat"}?</Label>
          <Input id="when" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="tabular w-32" />
        </div>
        {aiProposed && !isChild && items.some((i) => i.quantityConfidence === "low" && !i.confirmedByUser) && (
          <CautionNote title="Some portions are hard to judge">Adjust them if you can — a rough guess is fine.</CautionNote>
        )}
      </div>
      <StickyAction label={isChild ? "Save to diary" : "Confirm and save"} disabled={!items.length} onClick={onConfirm} />
    </div>
  )
}

function Chips<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup">
      {options.map((o) => (
        <button
          key={o.id}
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={cn("min-h-10 rounded-full border px-4 text-sm transition-colors", value === o.id ? "border-forest bg-forest text-primary-foreground" : "bg-card hover:bg-muted/50")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
