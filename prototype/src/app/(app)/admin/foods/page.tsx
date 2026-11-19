"use client"

// Admin food records (§8, §28.1). Edits are saved as drafts that need review before they're published.
import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, SearchX } from "lucide-react"
import { toast } from "sonner"
import { FOODS, REVIEW_STATUS_LABEL } from "@/lib/data/foods"
import { useApp } from "@/lib/store"
import type { AdminState, Food } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EmptyState, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, type PillTone } from "@/components/app/page"
import { Field, PillGroup, Segmented } from "@/components/app/controls"
import { InfoNote } from "@/components/app/alerts"
import { FoodTile } from "@/components/log/food-tile"

type Filter = "all" | "needs_review" | "drafts"
type Draft = AdminState["foodOverrides"][string]
const TONE: Record<string, PillTone> = { reviewed: "sage", pending: "caution", unreviewed: "outline", none: "outline" }

export default function AdminFoodsPage() {
  const overrides = useApp((s) => s.admin?.foodOverrides ?? {})
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<Filter>("all")
  const [editing, setEditing] = useState<Food | null>(null)

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return FOODS.filter((f) => !term || f.name.toLowerCase().includes(term) || f.nameBn.includes(term) || f.id.includes(term)).filter((f) =>
      filter === "drafts" ? !!overrides[f.id] : filter === "needs_review" ? f.reviewStatus !== "reviewed" : true,
    )
  }, [q, filter, overrides])

  return (
    <>
      <PageHeader back="/admin" title="Foods" subtitle={`${FOODS.length} records · illustrative data`} />
      <PageBody>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-grey" aria-hidden />
            <Input aria-label="Search foods" placeholder="Search name, Bangla name or id" className="pl-10" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Segmented label="Filter" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "needs_review", label: "Needs review" }, { value: "drafts", label: "Drafts" }]} />
        </div>

        <Section title={`${list.length} ${list.length === 1 ? "food" : "foods"}`}>
          {list.length === 0 ? (
            <EmptyState icon={<SearchX />} title={filter === "drafts" ? "No draft edits" : "No matching foods"} description={filter === "drafts" ? "Edits you save become drafts here until they're reviewed." : "Try another name, Bangla name or id."} />
          ) : (
          <ListGroup>
            {list.map((f) => {
              const status = f.reviewStatus ?? "none"
              return (
                <ListRow
                  key={f.id}
                  onClick={() => setEditing(f)}
                  icon={<FoodTile foodId={f.id} size="xs" />}
                  iconTone="white"
                  title={f.name}
                  description={
                    <>
                      <span lang="bn">{f.nameBn}</span> · {f.state}
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="tabular">~{f.per100g.energyKcal} kcal/100 g</span>
                        {overrides[f.id] ? <Pill tone="terracotta">Draft</Pill> : <Pill tone={TONE[status]}>{REVIEW_STATUS_LABEL[status]}</Pill>}
                      </span>
                    </>
                  }
                />
              )
            })}
          </ListGroup>
          )}
        </Section>
      </PageBody>

      {editing && <EditFoodSheet key={editing.id} food={editing} draft={overrides[editing.id]} onClose={() => setEditing(null)} />}
    </>
  )
}

function EditFoodSheet({ food, draft, onClose }: { food: Food; draft?: Draft; onClose: () => void }) {
  const updateAdmin = useApp((s) => s.updateAdmin)
  const overrides = useApp((s) => s.admin?.foodOverrides ?? {})
  const [d, setD] = useState({
    name: draft?.name ?? food.name,
    nameBn: draft?.nameBn ?? food.nameBn,
    cost: String(draft?.costPer100gBdt ?? food.costPer100gBdt ?? ""),
    confidence: draft?.confidence ?? food.confidence,
    prepNotes: draft?.prepNotes ?? food.prepNotes ?? "",
    energy: String(draft?.per100g?.energyKcal ?? food.per100g.energyKcal),
    protein: String(draft?.per100g?.proteinG ?? food.per100g.proteinG),
    sodium: String(draft?.per100g?.sodiumMg ?? food.per100g.sodiumMg ?? ""),
  })
  const num = (s: string) => (s.trim() === "" ? undefined : Number(s))
  const invalid = [d.energy, d.protein].some((v) => !(Number(v) >= 0)) || !d.name.trim()

  const save = () => {
    const next: Draft = {
      name: d.name.trim(),
      nameBn: d.nameBn.trim(),
      costPer100gBdt: num(d.cost),
      confidence: d.confidence,
      prepNotes: d.prepNotes.trim() || undefined,
      per100g: { energyKcal: Number(d.energy), proteinG: Number(d.protein), sodiumMg: num(d.sodium) },
      reviewStatus: "pending",
      editedAt: new Date().toISOString(),
    }
    updateAdmin({ foodOverrides: { ...overrides, [food.id]: next } })
    toast.success("Draft saved", { description: "Sent for review. Live values don't change until it's approved." })
    onClose()
  }
  const discard = () => {
    const rest = { ...overrides }
    delete rest[food.id]
    updateAdmin({ foodOverrides: rest })
    toast("Draft discarded")
    onClose()
  }

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Edit {food.name}</SheetTitle>
          <SheetDescription>
            {food.state} · per 100 g · {food.dataSource}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto px-5 pt-1 pb-6">
          <InfoNote className="p-3.5">Changes become a draft for review (source verification → professional review → approval). Nothing updates automatically.</InfoNote>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" htmlFor="fn">
              <Input id="fn" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} />
            </Field>
            <Field label="Bangla name" htmlFor="fbn">
              <Input id="fbn" lang="bn" value={d.nameBn} onChange={(e) => setD({ ...d, nameBn: e.target.value })} />
            </Field>
            <Field label="Energy (kcal)" htmlFor="fe">
              <Input id="fe" type="number" inputMode="decimal" value={d.energy} onChange={(e) => setD({ ...d, energy: e.target.value })} />
            </Field>
            <Field label="Protein (g)" htmlFor="fp">
              <Input id="fp" type="number" inputMode="decimal" value={d.protein} onChange={(e) => setD({ ...d, protein: e.target.value })} />
            </Field>
            <Field label="Sodium (mg)" htmlFor="fs" hint="Leave empty if unknown">
              <Input id="fs" type="number" inputMode="decimal" value={d.sodium} onChange={(e) => setD({ ...d, sodium: e.target.value })} />
            </Field>
            <Field label="Price (৳/100 g)" htmlFor="fc">
              <Input id="fc" type="number" inputMode="decimal" value={d.cost} onChange={(e) => setD({ ...d, cost: e.target.value })} />
            </Field>
          </div>
          <Field label="Data confidence">
            <PillGroup label="Confidence" value={d.confidence} onChange={(v) => setD({ ...d, confidence: v })} options={[{ value: "high", label: "High" }, { value: "moderate", label: "Moderate" }, { value: "low", label: "Low" }]} />
          </Field>
          <Field label="Preparation notes" htmlFor="fnotes">
            <Textarea id="fnotes" rows={2} value={d.prepNotes} onChange={(e) => setD({ ...d, prepNotes: e.target.value })} />
          </Field>
          <Button size="lg" className="w-full" disabled={invalid} onClick={save}>
            Save draft for review
          </Button>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href={`/foods/${food.id}`}>View food page</Link>
            </Button>
            {draft && (
              <Button variant="outline" className="flex-1" onClick={discard}>
                Discard draft
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
