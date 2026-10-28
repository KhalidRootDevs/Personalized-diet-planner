"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { History, ImageOff, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PageHeader, PageBody, Section, EmptyState } from "@/components/app/page"
import { EstimateNote, Macro } from "@/components/app/nutrition"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"
import { ItemEditor } from "@/components/log/item-editor"
import { FoodPickerSheet } from "@/components/log/food-picker"
import { PhotoPlaceholder } from "@/components/log/entry-card"
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
          <EmptyState icon={<History className="size-5" />} title="Entry not found" description="It may have been deleted." />
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
            <Button
              variant="ghost"
              size="icon"
              aria-label="Edit entry"
              onClick={() => {
                setDraft(entry.items)
                setEditing(true)
              }}
            >
              <Pencil />
            </Button>
          )
        }
      />
      <PageBody>
        {entry.hasPhoto && <PhotoPlaceholder className="aspect-[4/3] w-full" />}

        {hits.length > 0 && (
          <SafetyAlert title={`Contains ${Array.from(new Set(hits.map((h) => ALLERGEN_LABELS[h.allergen] ?? h.allergen))).join(", ")}`} emergency>
            This meal includes an allergen recorded in {isChild ? `${profile.name}'s` : "your"} profile.
          </SafetyAlert>
        )}

        {!isChild && (
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs text-muted-foreground">Estimated for this meal</p>
            <p className="tabular text-2xl font-semibold">
              ~{Math.round(r.mid.energyKcal)} kcal <span className="text-sm font-normal text-muted-foreground">({Math.round(r.low)}–{Math.round(r.high)})</span>
            </p>
            <div className="mt-3 grid grid-cols-4 gap-2">
              <Macro label="Protein" value={r.mid.proteinG} estimate />
              <Macro label="Carbs" value={r.mid.carbsG} estimate />
              <Macro label="Fat" value={r.mid.fatG} estimate />
              <Macro label="Fiber" value={r.mid.fiberG} estimate />
            </div>
            {entry.hiddenIngredients.oil && entry.hiddenIngredients.oil !== "none" && <p className="mt-2 text-xs text-muted-foreground">Includes {entry.hiddenIngredients.oil} cooking oil, as you told us.</p>}
            {entry.hiddenIngredients.sugar && <p className="mt-1 text-xs text-muted-foreground">Includes added sugar in tea.</p>}
            <EstimateNote className="mt-2" />
          </div>
        )}
        {isChild && entry.note && <InfoNote title="Notes">{entry.note}</InfoNote>}

        <Section title={editing ? "Edit foods" : "Foods"}>
          <div className="space-y-2">
            {editing ? (
              <>
                {draft.map((it, idx) => (
                  <ItemEditor key={it.id} item={it} profile={profile} hideNutrition={isChild} onChange={(n) => setDraft(draft.map((x, j) => (j === idx ? n : x)))} onRemove={() => setDraft(draft.filter((_, j) => j !== idx))} />
                ))}
                <FoodPickerSheet
                  profile={profile}
                  onPick={(fid) => setDraft([...draft, { ...itemFromFood(fid), confirmedByUser: true }])}
                  trigger={
                    <Button variant="outline" className="w-full border-dashed">
                      Add a food
                    </Button>
                  }
                />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={save} disabled={!draft.length}>
                    Save changes
                  </Button>
                </div>
              </>
            ) : (
              <ul className="divide-y rounded-xl border bg-card">
                {entry.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{i.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        {i.unitLabel ? `${i.unitLabel} · ` : ""}
                        {i.grams} g {FOOD_MAP[i.foodId]?.state === "cooked" ? "cooked" : ""}
                      </p>
                    </div>
                    {i.confirmedByUser && <span className="shrink-0 text-xs text-muted-foreground">Confirmed</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        {changed.length > 0 && !isChild && (
          <Section title="Your corrections">
            <ul className="space-y-1.5 rounded-xl border bg-card p-3 text-sm">
              {changed.map((i) => (
                <li key={i.id}>
                  <span className="text-muted-foreground">
                    AI suggested {FOOD_MAP[i.aiOriginal!.foodId]?.name ?? i.aiOriginal!.foodId}, {i.aiOriginal!.grams} g →
                  </span>{" "}
                  you confirmed {i.displayName}, {i.grams} g
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">The original suggestion is kept separately. Your confirmed foods are what we use.</p>
          </Section>
        )}

        <Section title="Record details">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-card p-3 text-sm">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{entry.analysisStatus === "confirmed" ? "Confirmed by you" : "Awaiting confirmation"}</dd>
            {entry.source === "photo" && (
              <>
                <dt className="text-muted-foreground">Image model</dt>
                <dd>{VERSIONS.model}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Food database</dt>
            <dd>{VERSIONS.foodDb}</dd>
            <dt className="text-muted-foreground">Calculation</dt>
            <dd>{VERSIONS.calculation}</dd>
            {entry.linkedPlannedMealId && (
              <>
                <dt className="text-muted-foreground">Plan link</dt>
                <dd>
                  <Link href={`/plan/meal/${entry.linkedPlannedMealId}`} className="text-forest underline underline-offset-2">
                    Planned meal
                  </Link>
                </dd>
              </>
            )}
          </dl>
        </Section>

        <div className="space-y-2">
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
              <Button variant="ghost" className="w-full text-muted-foreground">
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={onConfirm}>{confirm}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
