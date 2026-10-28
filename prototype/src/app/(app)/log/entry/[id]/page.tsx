"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { History, ImageOff, Pencil, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { EmptyState, HeaderIconButton, KeyValue, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { EstimateNote } from "@/components/app/nutrition"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { PhotoPlaceholder } from "@/components/log/entry-card"
import { FoodTile } from "@/components/log/food-tile"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { useApp } from "@/lib/store"
import { MEAL_LABEL } from "@/lib/planning"
import { formatDay } from "@/lib/date"
import { allergenHits, entryRange, itemFromFood, SOURCE_LABEL, VERSIONS } from "@/lib/area-b-log"
import type { JournalItem } from "@/lib/types"

/**
 * Journal entry detail (§41.7). The original AI estimate is kept apart from what the user
 * confirmed; recalculation never rewrites confirmed foods. Deleting the photo keeps the nutrition record.
 */
export default function EntryPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const entry = useApp((s) => s.journal.find((e) => e.id === id))
  const profile = useApp((s) => s.profiles.find((p) => p.id === entry?.profileId))
  const updateEntry = useApp((s) => s.updateEntry)
  const deleteEntry = useApp((s) => s.deleteEntry)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<JournalItem[]>([])

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
  const when = new Date(entry.consumedAt)

  const save = () => {
    updateEntry({ ...entry, items: draft.map((i) => ({ ...i, confirmedByUser: true })) })
    setEditing(false)
    toast("Entry updated", { description: "Nutrition recalculated from your corrected foods." })
  }

  return (
    <>
      <PageHeader
        title={MEAL_LABEL[entry.mealType]}
        subtitle={`${formatDay(entry.consumedAt.slice(0, 10))} · ${when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · ${SOURCE_LABEL[entry.source]}`}
        back
        action={
          !editing && (
            <HeaderIconButton
              label="Edit entry"
              onClick={() => {
                setDraft(entry.items)
                setEditing(true)
              }}
            >
              <Pencil className="size-[18px]" />
            </HeaderIconButton>
          )
        }
      />
      <PageBody>
        {entry.hasPhoto && <PhotoPlaceholder className="aspect-[4/3] w-full rounded-2xl [&_svg]:size-8" />}

        {hits.length > 0 && (
          <SafetyAlert title={`Contains ${Array.from(new Set(hits.map((h) => ALLERGEN_LABELS[h.allergen] ?? h.allergen))).join(", ")}`} emergency>
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
            <div className="mt-4 grid grid-cols-4 gap-2">
              <StatTile label="Protein" value={`~${Math.round(r.mid.proteinG)}`} unit="g" className="px-2.5" />
              <StatTile label="Carbs" value={`~${Math.round(r.mid.carbsG)}`} unit="g" className="px-2.5" />
              <StatTile label="Fat" value={`~${Math.round(r.mid.fatG)}`} unit="g" className="px-2.5" />
              <StatTile label="Fiber" value={`~${Math.round(r.mid.fiberG)}`} unit="g" className="px-2.5" />
            </div>
            {(entry.hiddenIngredients.oil && entry.hiddenIngredients.oil !== "none") || entry.hiddenIngredients.sugar ? (
              <div className="text-caption mt-3 space-y-0.5 text-muted-foreground">
                {entry.hiddenIngredients.oil && entry.hiddenIngredients.oil !== "none" && <p>Includes {entry.hiddenIngredients.oil} cooking oil, as you told us.</p>}
                {entry.hiddenIngredients.sugar && <p>Includes added sugar in tea.</p>}
              </div>
            ) : null}
            <div className="mt-4 border-t border-border/70 pt-3">
              <EstimateNote />
            </div>
          </Surface>
        )}
        {isChild && entry.note && <InfoNote title="Notes">{entry.note}</InfoNote>}

        <Section title={editing ? "Edit foods" : `Foods (${entry.items.length})`}>
          {editing ? (
            <div className="space-y-4">
              <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
                {draft.map((it, idx) => (
                  <ItemEditor key={it.id} variant="row" item={it} profile={profile} hideNutrition={isChild} onChange={(n) => setDraft(draft.map((x, j) => (j === idx ? n : x)))} onRemove={() => setDraft(draft.filter((_, j) => j !== idx))} />
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
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
              {entry.items.map((i) => (
                <li key={i.id} className="flex min-h-[60px] items-center gap-3 px-4 py-3">
                  <FoodTile foodId={i.foodId} name={i.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="text-body font-medium">{i.displayName}</p>
                    <p className="tabular text-caption mt-0.5 text-muted-foreground">
                      {i.unitLabel ? `${i.unitLabel} · ` : ""}
                      {i.grams} g{FOOD_MAP[i.foodId]?.state === "cooked" ? " cooked" : ""}
                    </p>
                  </div>
                  {i.confirmedByUser && (
                    <Pill tone="sage" className="h-[22px] px-2 text-[11px]">
                      Confirmed
                    </Pill>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Section>

        {changed.length > 0 && !isChild && (
          <Section title="Your corrections">
            <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
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

        <Section title="Record details">
          <Surface tone="muted" padding="none" className="divide-y divide-border/70 px-4 py-1">
            <KeyValue label="Status" value={entry.analysisStatus === "confirmed" ? "Confirmed by you" : "Awaiting confirmation"} />
            {entry.source === "photo" && <KeyValue label="Image model" value={VERSIONS.model} />}
            <KeyValue label="Food database" value={VERSIONS.foodDb} />
            <KeyValue label="Calculation" value={VERSIONS.calculation} />
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

        <div className="space-y-3 pt-2">
          {entry.hasPhoto && (
            <ConfirmDialog
              trigger={
                <Button variant="outline" className="w-full">
                  <ImageOff /> Delete photo only
                </Button>
              }
              title="Delete this photo?"
              description="The photo is removed permanently. Your foods and nutrition for this meal stay in your history."
              confirm="Delete photo"
              onConfirm={() => {
                updateEntry({ ...entry, hasPhoto: false })
                toast("Photo deleted", { description: "Your nutrition record is kept." })
              }}
            />
          )}
          <ConfirmDialog
            trigger={
              <Button variant="outline" className="w-full text-safety hover:text-safety">
                <Trash2 /> Delete entry
              </Button>
            }
            title="Delete this entry?"
            description={`This removes the foods, nutrition${entry.hasPhoto ? " and photo" : ""} for this meal.${entry.linkedPlannedMealId ? " The planned meal goes back to “not recorded”." : ""}`}
            confirm="Delete entry"
            onConfirm={() => {
              deleteEntry(entry.id)
              toast("Entry deleted")
              router.replace("/log")
            }}
          />
        </div>
      </PageBody>
    </>
  )
}

function ConfirmDialog({ trigger, title, description, confirm, onConfirm }: { trigger: React.ReactNode; title: string; description: string; confirm: string; onConfirm: () => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
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
  )
}
