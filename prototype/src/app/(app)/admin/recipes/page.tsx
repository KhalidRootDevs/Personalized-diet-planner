"use client"

// Admin recipe publishing (§9, §28.2). Approval records a named reviewer; infant recipes need a clinical reviewer.
import { useState } from "react"
import { ClipboardCheck } from "lucide-react"
import { toast } from "sonner"
import { RECIPES } from "@/lib/data/recipes"
import { useApp } from "@/lib/store"
import type { Recipe } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ListGroup, ListLink, ListRow, PageBody, PageHeader, Pill, Section, type PillTone } from "@/components/app/page"
import { Field, Segmented } from "@/components/app/controls"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"

type Status = Recipe["reviewStatus"]
const LABEL: Record<Status, string> = { approved: "Published", pending: "Awaiting review", personal: "User recipe" }
const TONE: Record<Status, PillTone> = { approved: "sage", pending: "caution", personal: "outline" }

export default function AdminRecipesPage() {
  const overrides = useApp((s) => s.admin?.recipeStatus ?? {})
  const updateAdmin = useApp((s) => s.updateAdmin)
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all")
  const [target, setTarget] = useState<Recipe | null>(null)
  const status = (r: Recipe): Status => overrides[r.id] ?? r.reviewStatus
  const list = RECIPES.filter((r) => filter === "all" || status(r) === filter)

  const setStatus = (r: Recipe, s: Status) => updateAdmin({ recipeStatus: { ...overrides, [r.id]: s } })

  return (
    <>
      <PageHeader back="/admin" title="Recipes" subtitle={`${RECIPES.length} verified-recipe candidates`} />
      <PageBody>
        <InfoNote title="Only published recipes appear in plans">In this prototype, status changes are saved in this browser only and don&apos;t change what other screens show.</InfoNote>
        <Segmented label="Filter" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "pending", label: "Awaiting review" }, { value: "approved", label: "Published" }]} />
        <Section title={`${list.length} recipes`}>
          <ListGroup>
            {list.map((r) => {
              const s = status(r)
              return (
                <ListRow
                  key={r.id}
                  icon={<RecipeThumb recipe={r} size="xs" />}
                  iconTone="white"
                  title={r.name}
                  description={
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Pill tone={TONE[s]}>{LABEL[s]}</Pill>
                        {r.profile !== "adult" && <Pill tone="neutral">{r.profile === "infant" ? `Infant · ${r.minAgeMonths ?? 6}+ mo` : "Child"}</Pill>}
                        {overrides[r.id] && <Pill tone="terracotta">Changed here</Pill>}
                      </span>
                      {s === "pending" ? (
                        <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setTarget(r)}>
                          Review
                        </Button>
                      ) : s === "approved" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="shrink-0"
                          onClick={() => {
                            setStatus(r, "pending")
                            toast("Unpublished", { description: `${r.name} returns to the review queue.` })
                          }}
                        >
                          Unpublish
                        </Button>
                      ) : null}
                    </span>
                  }
                />
              )
            })}
          </ListGroup>
        </Section>
        <ListLink href="/admin/reviews" icon={<ClipboardCheck />} iconTone="lime" title="Clinical review queue" description="Full review with safety checklists" />
      </PageBody>

      {target && (
        <ApproveDialog
          recipe={target}
          onClose={() => setTarget(null)}
          onApprove={(reviewer) => {
            setStatus(target, "approved")
            toast.success("Published", { description: `${target.name} approved by ${reviewer}.` })
            setTarget(null)
          }}
        />
      )}
    </>
  )
}

function ApproveDialog({ recipe, onClose, onApprove }: { recipe: Recipe; onClose: () => void; onApprove: (reviewer: string) => void }) {
  const [reviewer, setReviewer] = useState("")
  const [checked, setChecked] = useState(false)
  const clinical = recipe.profile !== "adult"
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve and publish?</DialogTitle>
          <DialogDescription>{recipe.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Reviewer name" htmlFor="rev">
            <Input id="rev" value={reviewer} onChange={(e) => setReviewer(e.target.value)} />
          </Field>
          <label className="text-callout flex items-start gap-3">
            <Checkbox checked={checked} onCheckedChange={(v) => setChecked(v === true)} className="mt-0.5" />
            <span className="text-muted-foreground">
              {clinical
                ? "I'm a qualified pediatric reviewer. Texture, choking hazards, honey, salt and sugar have been checked for this age band."
                : "Ingredients, allergen labels and computed nutrition have been checked."}
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!reviewer.trim() || !checked} onClick={() => onApprove(reviewer.trim())}>
            Approve
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
