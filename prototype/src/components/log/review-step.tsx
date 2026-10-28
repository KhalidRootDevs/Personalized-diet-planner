"use client"

import { Plus } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { MacroTiles } from "@/components/log/macro-tiles"
import { EstimateNote } from "@/components/app/nutrition"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { PhotoPlaceholder } from "@/components/log/entry-card"
import { StickyAction } from "@/components/log/input-steps"
import { Section, Surface } from "@/components/app/page"
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
      <div className="px-gutter flex-1 space-y-7 pt-3 pb-8">
        {hasPhoto && (
          <Surface padding="none" className="overflow-hidden">
            <div className="relative">
              <PhotoPlaceholder src={photoUrl} className="h-48 w-full rounded-none" />
              <span className="text-caption absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 font-semibold">
                {items.length} food{items.length === 1 ? "" : "s"} suggested · estimate
              </span>
            </div>
            <div className="p-4">
              <p className="text-headline">Check what we found</p>
              <p className="text-caption mt-0.5 text-muted-foreground">Suggestions from your photo. Fix anything that&apos;s wrong.</p>
            </div>
          </Surface>
        )}
        {!hasPhoto && aiProposed && <InfoNote title="Check what we found">We matched your words to foods in our database. Fix anything that&apos;s wrong.</InfoNote>}

        {(hits.length > 0 || infant.length > 0) && (
          <div className="space-y-3">
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
          </div>
        )}

        <Section title={`Foods (${items.length})`} description={aiProposed ? "Food and portion confidence are shown separately." : undefined}>
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
            {items.map((it, idx) => (
              <ItemEditor
                key={it.id}
                variant="row"
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
                <button type="button" className="text-callout flex min-h-[56px] w-full items-center gap-3 px-4 font-semibold text-forest transition-colors hover:bg-muted/50">
                  <span className="grid size-8 place-items-center rounded-full border border-dashed border-forest/40">
                    <Plus className="size-4" />
                  </span>
                  Add a food we missed
                </button>
              }
            />
          </div>
          {aiProposed && !isChild && items.some((i) => i.quantityConfidence === "low" && !i.confirmedByUser) && (
            <CautionNote title="Some portions are hard to judge">Adjust them if you can — a rough guess is fine.</CautionNote>
          )}
        </Section>

        {askOil && (
          <Section title="How much oil or ghee was used?" description="Photos can't show oil, and it changes the estimate a lot.">
            <Chips options={OIL} value={oil} onChange={setOil} />
          </Section>
        )}
        {askSugar && (
          <Section title="Was sugar added to your tea?">
            <Chips
              options={[
                { id: "yes", label: "Yes" },
                { id: "no", label: "No" },
              ]}
              value={sugar === undefined ? undefined : sugar ? "yes" : "no"}
              onChange={(v) => setSugar(v === "yes")}
            />
          </Section>
        )}

        {isChild ? (
          <Section title="How it went">
            <Surface className="space-y-5">
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
              <fieldset className="space-y-2">
                <legend className="text-callout mb-2 font-medium">How much was eaten?</legend>
                <Chips
                  options={[
                    { id: "yes", label: "Enjoyed it" },
                    { id: "somewhat", label: "A little" },
                    { id: "no", label: "Not today" },
                  ]}
                  value={child.accepted}
                  onChange={(accepted) => setChild({ ...child, accepted: accepted as ChildInfo["accepted"] })}
                />
                <p className="text-caption text-muted-foreground">Let your baby decide how much. It can take many tries to accept a new food.</p>
              </fieldset>
              <div className="space-y-1.5">
                <Label htmlFor="reaction">Any reaction?</Label>
                <Textarea id="reaction" rows={2} value={child.reaction} onChange={(e) => setChild({ ...child, reaction: e.target.value })} placeholder="e.g. none observed, mild rash around mouth" />
              </div>
              <label className="text-callout flex items-start gap-3">
                <Checkbox className="mt-0.5" checked={child.firstTime} onCheckedChange={(v) => setChild({ ...child, firstTime: v === true })} />
                First time trying this — add to the introduction tracker
              </label>
            </Surface>
          </Section>
        ) : (
          <Section title="Estimate for this meal">
            <Surface padding="lg">
              <p className="text-metric">
                ~{Math.round(n.energyKcal)}
                <span className="text-callout ml-1 font-normal tracking-normal text-muted-foreground">kcal</span>
              </p>
              <p className="tabular text-caption mt-0.5 text-muted-foreground">
                Likely {Math.round(n.energyKcal * (1 - u))}–{Math.round(n.energyKcal * (1 + u))} kcal
              </p>
              <MacroTiles className="mt-4" values={n} />
              <div className="mt-4 border-t border-border/70 pt-3">
                <EstimateNote>Calculated from our food database after you confirm. The range reflects portion uncertainty.</EstimateNote>
              </div>
            </Surface>
          </Section>
        )}

        <Section title="Details">
          <Surface className="space-y-4">
            {!isChild && openMeals.length > 0 && (
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
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="when">When did {isChild ? `${profile.name} eat` : "you eat"}?</Label>
              <Input id="when" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="tabular w-36" />
            </div>
            {!isChild && source !== "saved" && (
              <label className="text-callout flex items-center gap-3 border-t border-border/70 pt-4">
                <Checkbox checked={saveAsUsual} onCheckedChange={(v) => setSaveAsUsual(v === true)} />
                Save as a usual meal for quicker logging
              </label>
            )}
          </Surface>
        </Section>
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
          className={cn("text-callout h-9 rounded-full border px-4 font-medium transition-colors", value === o.id ? "border-lime bg-lime text-charcoal" : "border-border/80 bg-card text-charcoal hover:bg-muted")}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
