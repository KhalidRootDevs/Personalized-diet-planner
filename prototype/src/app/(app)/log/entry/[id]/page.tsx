"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { CircleCheck, History, ImageOff, Lock, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { EmptyState, HeaderIconButton, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { MacroTiles } from "@/components/log/macro-tiles"
import { recipePhoto } from "@/lib/data/photos"
import { ConfidenceChip, EstimateNote } from "@/components/app/nutrition"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { PhotoPlaceholder } from "@/components/log/entry-card"
import { FoodTile } from "@/components/log/food-tile"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { useActivePlan, useApp } from "@/lib/store"
import { MEAL_LABEL } from "@/lib/planning"
import { formatDay, todayISO } from "@/lib/date"
import { allergenHits, classifyOutcome, describeEdits, entryPhoto, entryRange, hiddenAllergenHits, itemFromFood, MEAL_ORDER, SOURCE_LABEL, VERSIONS } from "@/lib/area-b-log"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { JournalEntry, JournalItem, MealType } from "@/lib/types"

const AI_SOURCES: JournalEntry["source"][] = ["photo", "text", "voice", "restaurant"]

/**
 * Journal entry detail (§41.7). The original AI estimate is kept apart from what the user
 * confirmed; recalculation never rewrites confirmed foods. Every edit after saving is recorded
 * with a timestamp. Deleting the photo keeps the nutrition record.
 */
export default function EntryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const entry = useApp((s) => s.journal.find((e) => e.id === id))
  const profile = useApp((s) => s.profiles.find((p) => p.id === entry?.profileId))
  const updateEntry = useApp((s) => s.updateEntry)
  const deleteEntry = useApp((s) => s.deleteEntry)
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<JournalItem[]>([])
  const [draftMeal, setDraftMeal] = useState<MealType>("other")
  const [draftDate, setDraftDate] = useState("")
  const [draftTime, setDraftTime] = useState("")
  const [activePhoto, setActivePhoto] = useState(0)

  if (!entry || !profile)
    return (
      <>
        <PageHeader title="Entry" back="/log" />
        <PageBody>
          <EmptyState icon={<History />} title="Entry not found" description="It may have been deleted." />
        </PageBody>
      </>
    )

  const isChild = profile.type !== "adult"
  const items = editing ? draft : entry.items
  const r = entryRange({ ...entry, items })
  const changed = entry.items.filter((i) => i.aiOriginal && (i.aiOriginal.foodId !== i.foodId || i.aiOriginal.grams !== i.grams))
  const hits = allergenHits(entry.items, profile)
  const allergenNames = Array.from(new Set([...hits.map((h) => h.allergen), ...hiddenAllergenHits(entry.hiddenIngredients, profile)].map((a) => ALLERGEN_LABELS[a] ?? a)))
  const when = new Date(entry.consumedAt)
  const planned = plan?.meals.find((m) => m.id === entry.linkedPlannedMealId || m.linkedJournalEntryId === entry.id)
  // The user's own photos first; demo entries without a stored thumbnail fall back to a stand-in.
  const ownPhotos = entry.hasPhoto ? (entry.photos?.length ? entry.photos : entryPhoto(entry) ? [entryPhoto(entry)!] : []) : []
  const stockPhoto = entry.hasPhoto && !ownPhotos.length ? recipePhoto(entry.recipeId ?? planned?.recipeId) : undefined
  const showConfidence = AI_SOURCES.includes(entry.source)
  const h = entry.hiddenIngredients
  const hiddenNotes = [
    h.oil && h.oil !== "none" && `${h.oil === "little" ? "a little" : h.oil === "lots" ? "a lot of" : "moderate"} cooking oil or ghee`,
    h.coconutMilk && "coconut milk or cream",
    h.butter && "butter or ghee on bread",
    h.sugar && "added sugar",
    h.sauce && "a sauce or dressing",
  ].filter(Boolean) as string[]

  const startEdit = () => {
    setDraft(entry.items)
    setDraftMeal(entry.mealType)
    setDraftDate(entry.consumedAt.slice(0, 10))
    setDraftTime(entry.consumedAt.slice(11, 16))
    setEditing(true)
  }

  const save = () => {
    const next: JournalEntry = {
      ...entry,
      mealType: draftMeal,
      consumedAt: `${draftDate}T${draftTime}:00`,
      // aiOriginal stays on each item, so the AI estimate is never overwritten (§41.7).
      items: draft.map((i) => ({ ...i, confirmedByUser: true })),
    }
    const at = new Date().toISOString()
    const changes = describeEdits(entry, next)
    if (!changes.length) {
      setEditing(false)
      return
    }
    updateEntry({ ...next, history: [...(entry.history ?? []), ...changes.map((change) => ({ at, change }))] })
    // Corrections keep the planned meal's status in step (§14.6).
    const itemsChanged = JSON.stringify(entry.items.map((i) => [i.foodId, i.grams])) !== JSON.stringify(next.items.map((i) => [i.foodId, i.grams]))
    if (planned && itemsChanged) {
      const rec = lookup(planned.recipeId)
      const outcome = classifyOutcome(rec, planned.servings, next.items)
      if (outcome !== planned.outcome) useApp.getState().setMealOutcome(planned.id, outcome, entry.id)
    }
    setEditing(false)
    toast("Entry updated", { description: "Nutrition recalculated from your corrected foods. The change is in the edit history." })
  }

  const deletePhoto = () => {
    updateEntry({
      ...entry,
      hasPhoto: false,
      photoThumb: undefined,
      photos: undefined,
      history: [...(entry.history ?? []), { at: new Date().toISOString(), change: "Photo deleted — foods and nutrition kept" }],
    })
    toast("Photo deleted", { description: "Your nutrition record is kept." })
  }

  return (
    <>
      <PageHeader
        title={MEAL_LABEL[entry.mealType]}
        subtitle={`${formatDay(entry.consumedAt.slice(0, 10))} · ${when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${SOURCE_LABEL[entry.source]}`}
        back
        action={
          !editing && (
            <HeaderIconButton label="Edit entry" onClick={startEdit}>
              <Pencil className="size-[18px]" />
            </HeaderIconButton>
          )
        }
      />
      <PageBody>
        {ownPhotos.length > 0 && (
          <div className="space-y-2">
            <PhotoPlaceholder src={ownPhotos[Math.min(activePhoto, ownPhotos.length - 1)]} className="aspect-[4/3] w-full rounded-2xl" />
            {ownPhotos.length > 1 && (
              <div className="flex gap-2">
                {ownPhotos.map((p, i) => (
                  <button key={i} type="button" onClick={() => setActivePhoto(i)} aria-label={`Show photo ${i + 1}`} aria-pressed={i === activePhoto} className="rounded-xl">
                    <PhotoPlaceholder src={p} className={`size-14 ${i === activePhoto ? "ring-2 ring-lime" : ""}`} />
                  </button>
                ))}
              </div>
            )}
            <p className="text-caption text-muted-foreground">Private photo · stored without location data</p>
          </div>
        )}
        {!ownPhotos.length && entry.hasPhoto &&
          (stockPhoto ? (
            <PhotoPlaceholder src={stockPhoto} className="aspect-[4/3] w-full rounded-2xl" />
          ) : (
            <Surface tone="sage" padding="lg" className="flex items-center gap-4">
              <div className="flex shrink-0 -space-x-3">
                {entry.items.slice(0, 3).map((i) => (
                  <FoodTile key={i.id} foodId={i.foodId} name={i.displayName} size="md" className="ring-2 ring-sage" />
                ))}
              </div>
              <div className="min-w-0">
                <p className="text-callout flex items-center gap-1.5 font-semibold">
                  <Lock className="size-4 text-forest" aria-hidden /> Private photo
                </p>
                <p className="text-caption mt-0.5 text-muted-foreground">Kept on your account only, without location data.</p>
              </div>
            </Surface>
          ))}

        {allergenNames.length > 0 && (
          <SafetyAlert title={`Contains ${allergenNames.join(", ")}`} emergency>
            This meal includes an allergen recorded in {isChild ? `${profile.name}'s` : "your"} profile.
          </SafetyAlert>
        )}

        {!isChild && (
          <Surface padding="lg">
            <p className="text-caption text-muted-foreground">This meal · estimate</p>
            <p className="text-metric mt-1">
              ~{Math.round(r.mid.energyKcal)}
              <span className="text-callout ml-1 font-normal tracking-normal text-muted-foreground">kcal</span>
            </p>
            <p className="tabular text-caption mt-0.5 text-muted-foreground">
              Likely {Math.round(r.low)}–{Math.round(r.high)} kcal
            </p>
            <MacroTiles className="mt-4" values={r.mid} />
            {hiddenNotes.length > 0 && <p className="text-caption mt-3 text-muted-foreground">Includes {hiddenNotes.join(", ")}, as you told us.</p>}
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote />
            </div>
          </Surface>
        )}
        {isChild && entry.note && <InfoNote title="Notes">{entry.note}</InfoNote>}

        {editing && (
          <Section title="When">
            <Surface className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <Label>Meal</Label>
                <Select value={draftMeal} onValueChange={(v) => setDraftMeal(v as MealType)}>
                  <SelectTrigger className="w-44" aria-label="Meal">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MEAL_ORDER.map((t) => (
                      <SelectItem key={t} value={t}>
                        {MEAL_LABEL[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" type="date" max={todayISO()} value={draftDate} onChange={(e) => e.target.value && setDraftDate(e.target.value > todayISO() ? todayISO() : e.target.value)} className="tabular w-44" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="edit-time">Time</Label>
                <Input id="edit-time" type="time" value={draftTime} onChange={(e) => e.target.value && setDraftTime(e.target.value)} className="tabular w-36" />
              </div>
            </Surface>
          </Section>
        )}

        <Section title={editing ? "Edit foods" : `Foods (${entry.items.length})`}>
          {editing ? (
            <div className="space-y-4">
              <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
                {draft.map((it, idx) => (
                  <ItemEditor
                    key={it.id}
                    variant="row"
                    item={it}
                    profile={profile}
                    showConfidence={showConfidence}
                    hideNutrition={isChild}
                    onChange={(n) => setDraft(draft.map((x, j) => (j === idx ? n : x)))}
                    onRemove={() => setDraft(draft.filter((_, j) => j !== idx))}
                  />
                ))}
                <FoodPickerSheet
                  profile={profile}
                  onPick={(fid) => setDraft([...draft, { ...itemFromFood(fid), confirmedByUser: true }])}
                  trigger={
                    <button type="button" className="text-callout flex min-h-[56px] w-full items-center gap-3 px-4 font-semibold text-forest transition-colors hover:bg-muted/50">
                      <span className="grid size-8 place-items-center rounded-full border border-dashed border-forest/40">
                        <Plus className="size-4" />
                      </span>
                      Add a food
                    </button>
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={save} disabled={!draft.length}>
                  Save changes
                </Button>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              {entry.items.map((i) => (
                <li key={i.id} className="flex min-h-[60px] items-start gap-3 px-4 py-3">
                  <FoodTile foodId={i.foodId} name={i.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{i.displayName}</p>
                    <p className="tabular text-caption mt-0.5 text-muted-foreground">
                      {i.unitLabel ? `${i.unitLabel} · ` : ""}
                      {i.grams} g{FOOD_MAP[i.foodId]?.state === "cooked" ? " cooked" : ""}
                      {i.cookingMethod ? ` · ${i.cookingMethod}` : ""}
                    </p>
                    {showConfidence && (
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 [&_span>span]:whitespace-nowrap">
                        <span className="text-caption flex items-center gap-1.5 text-muted-foreground">
                          Food <ConfidenceChip level={i.identificationConfidence} />
                        </span>
                        <span className="text-caption flex items-center gap-1.5 text-muted-foreground">
                          Portion <ConfidenceChip level={i.quantityConfidence} />
                        </span>
                      </div>
                    )}
                    {i.confirmedByUser && (
                      <p className="text-caption mt-1.5 flex items-center gap-1 font-medium text-forest">
                        <CircleCheck className="size-3.5" aria-hidden /> Confirmed by you
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {changed.length > 0 && !isChild && (
          <Section title="Your corrections">
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              {changed.map((i) => (
                <li key={i.id} className="grid grid-cols-2 gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-overline text-muted-foreground">AI suggested</p>
                    <p className="text-callout mt-1 text-muted-foreground line-through decoration-muted-grey/60">
                      {FOOD_MAP[i.aiOriginal!.foodId]?.name ?? i.aiOriginal!.foodId}, {i.aiOriginal!.grams} g
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-overline text-forest">You confirmed</p>
                    <p className="text-callout mt-1 font-medium">
                      {i.displayName}, {i.grams} g
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="text-caption text-muted-foreground">The original suggestion is kept separately. Your confirmed foods are what we use.</p>
          </Section>
        )}

        {(entry.history?.length ?? 0) > 0 && (
          <Section title="Edit history">
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
              {[...(entry.history ?? [])].reverse().map((hh, i) => (
                <li key={`${hh.at}-${i}`} className="flex gap-3 px-4 py-3">
                  <History className="mt-0.5 size-4 shrink-0 text-muted-grey" aria-hidden />
                  <div className="min-w-0">
                    <p className="text-callout">{hh.change}</p>
                    <p className="tabular text-caption text-muted-foreground">
                      {new Date(hh.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title="Record details">
          <Surface padding="none" className="divide-y divide-border/70 px-4 py-1">
            <KeyValue label="Status" value={entry.analysisStatus === "confirmed" ? "Confirmed by you" : "Awaiting confirmation"} />
            {entry.source === "photo" && <KeyValue label="Image model" value={VERSIONS.model} />}
            <KeyValue label="Food database" value={VERSIONS.foodDb} />
            <KeyValue label="Calculation" value={VERSIONS.calculation} />
            {entry.recipeId && <KeyValue label="Recipe" value={lookup(entry.recipeId)?.name ?? "Recipe"} />}
            {entry.linkedPlannedMealId && (
              <KeyValue
                label="Plan link"
                value={
                  <Link href={`/plan/meal/${entry.linkedPlannedMealId}`} className="font-semibold text-forest underline-offset-4 hover:underline">
                    Planned meal
                  </Link>
                }
              />
            )}
          </Surface>
        </Section>

        <ListGroup>
          {entry.hasPhoto && (
            <ConfirmDialog
              trigger={(open) => <ListRow onClick={open} icon={<ImageOff />} iconTone="muted" title="Delete photo only" description="Foods and nutrition stay in your history" chevron={false} />}
              title="Delete this photo?"
              description="The photo is removed permanently. Your foods and nutrition for this meal stay in your history."
              confirm="Delete photo"
              onConfirm={deletePhoto}
            />
          )}
          <ConfirmDialog
            trigger={(open) => <ListRow onClick={open} icon={<Trash2 />} iconTone="safety" title={<span className="text-safety">Delete entry</span>} description="Removes this meal from your food log" chevron={false} />}
            title="Delete this entry?"
            description={`This removes the foods, nutrition${entry.hasPhoto ? " and photo" : ""} for this meal.${entry.linkedPlannedMealId ? " The planned meal goes back to “not recorded”." : ""}`}
            confirm="Delete entry"
            onConfirm={() => {
              deleteEntry(entry.id)
              toast("Entry deleted")
              router.replace("/log")
            }}
          />
        </ListGroup>
      </PageBody>
    </>
  )
}

function ConfirmDialog({ trigger, title, description, confirm, onConfirm }: { trigger: (open: () => void) => React.ReactNode; title: string; description: string; confirm: string; onConfirm: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-3">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button variant="destructive" onClick={onConfirm}>
                {confirm}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
