"use client"

// Admin clinical-review queue (§28.1–§28.3, §13.4). Mock data; actions stay in this page's state.
import { useState } from "react"
import { BookOpenCheck, ChefHat, ClipboardList, FileWarning, History, Scale } from "lucide-react"
import { toast } from "sonner"
import { RECIPES } from "@/lib/data/recipes"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { PageBody, PageHeader } from "@/components/app/page"
import { InfoNote, SafetyAlert } from "@/components/app/alerts"

type Kind = "recipe" | "rule" | "plan" | "food"
type Decision = "approved" | "modify" | "rejected"

interface ReviewItem {
  id: string
  kind: Kind
  title: string
  summary: string
  population: string
  source: string
  submittedBy: string
  risk: "high" | "standard"
  checks: { label: string; ok: boolean }[]
  stage: string
}

const STAGES = ["Draft", "Source verification", "Professional review", "Safety review", "Approval", "Published"]

const KIND: Record<Kind, { label: string; icon: typeof ChefHat }> = {
  recipe: { label: "Recipe", icon: ChefHat },
  rule: { label: "Clinical rule", icon: Scale },
  plan: { label: "Plan", icon: ClipboardList },
  food: { label: "Food data", icon: BookOpenCheck },
}

const INITIAL: ReviewItem[] = [
  ...RECIPES.filter((r) => r.reviewStatus === "pending").map<ReviewItem>((r) => ({
    id: r.id,
    kind: "recipe",
    title: r.name,
    summary: `${r.texture ?? "Infant texture"} · from ${r.minAgeMonths ?? 6} months. ${r.safetyNotes[0] ?? ""}`,
    population: `Infants ${r.minAgeMonths ?? 6}–12 months`,
    source: "Internal recipe team · WHO complementary feeding guidance",
    submittedBy: "Content editor",
    risk: "high",
    checks: [
      { label: "No honey, whole nuts or added salt/sugar", ok: true },
      { label: "Texture matches age band", ok: true },
      { label: "Allergens labelled", ok: true },
      { label: "Nutrition computed from ingredient quantities", ok: true },
    ],
    stage: "Professional review",
  })),
  {
    id: "rule_ckd_protein_v2",
    kind: "rule",
    title: "CKD triage: route to professional review",
    summary: "Users reporting chronic kidney disease receive general guidance only; specialized protein/potassium targets require clinician input.",
    population: "Adults with self-reported CKD",
    source: "KDIGO 2024 (to verify)",
    submittedBy: "Nutrition professional",
    risk: "high",
    checks: [
      { label: "Source cited and verified", ok: false },
      { label: "Population defined", ok: true },
      { label: "Next review date set", ok: true },
    ],
    stage: "Source verification",
  },
  {
    id: "plan_flag_221",
    kind: "plan",
    title: "7-day plan flagged: pregnancy",
    summary: "Generated plan for a user who reported pregnancy. Engine passed safety checks; requires professional review before it is labelled reviewed.",
    population: "Pregnant adult (de-identified, user #221)",
    source: "Nutrition engine v0.3 · rules v1.4",
    submittedBy: "Validation layer",
    risk: "high",
    checks: [
      { label: "Allergen exclusions", ok: true },
      { label: "No restrictive calorie target", ok: true },
      { label: "Food-safety rules (raw fish, unpasteurized dairy)", ok: true },
    ],
    stage: "Professional review",
  },
  {
    id: "food_hilsa_update",
    kind: "food",
    title: "Hilsa (ilish), cooked: fat value update",
    summary: "Proposed change 14.0 g → 18.5 g fat per 100 g cooked, from new FCT data. Affects 6 recipes.",
    population: "All users",
    source: "Food Composition Table for Bangladesh (to verify edition)",
    submittedBy: "Content editor",
    risk: "standard",
    checks: [
      { label: "Raw vs cooked state specified", ok: true },
      { label: "Source edition recorded", ok: false },
      { label: "Affected recipes recalculated", ok: true },
    ],
    stage: "Source verification",
  },
]

export default function AdminReviewsPage() {
  const items = INITIAL
  const [decisions, setDecisions] = useState<Record<string, { decision: Decision; note: string; at: string }>>({})
  const [open, setOpen] = useState<ReviewItem | null>(null)
  const [note, setNote] = useState("")

  const pending = items.filter((i) => !decisions[i.id])
  const done = items.filter((i) => decisions[i.id])

  const decide = (d: Decision) => {
    if (!open) return
    setDecisions((x) => ({ ...x, [open.id]: { decision: d, note, at: new Date().toISOString() } }))
    toast.success(d === "approved" ? "Approved — published as a new version" : d === "modify" ? "Returned for changes" : "Rejected")
    setOpen(null)
    setNote("")
  }

  return (
    <>
      <PageHeader back="/profile" title="Clinical review" subtitle="Admin · prototype" />
      <PageBody>
        <InfoNote>Signed in as <strong>Clinical reviewer</strong>. Support agents can&apos;t open this queue, and content editors can&apos;t publish high-risk rules without review.</InfoNote>

        <Tabs defaultValue="queue">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="queue">Queue ({pending.length})</TabsTrigger>
            <TabsTrigger value="history">Decisions ({done.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-4 space-y-3">
            {pending.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">Nothing waiting for review.</p>}
            {pending.map((i) => {
              const K = KIND[i.kind]
              const failing = i.checks.filter((c) => !c.ok).length
              return (
                <button key={i.id} onClick={() => setOpen(i)} className="w-full rounded-xl border bg-card p-3 text-left hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sage text-forest">
                      <K.icon className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">{K.label} · {i.stage}</p>
                      <p className="font-medium">{i.title}</p>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{i.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-medium">
                        {i.risk === "high" && <span className="rounded-full bg-[#f3e2d9] px-2 py-0.5 text-terracotta-text">High risk</span>}
                        {failing > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-caution-surface px-2 py-0.5 text-caution"><FileWarning className="size-3" />{failing} check{failing > 1 ? "s" : ""} open</span>
                        ) : (
                          <span className="rounded-full bg-sage px-2 py-0.5 text-forest">Checks passed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </TabsContent>

          <TabsContent value="history" className="mt-4 space-y-2">
            {done.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No decisions yet.</p>}
            {done.map((i) => {
              const d = decisions[i.id]
              return (
                <div key={i.id} className="flex items-start gap-3 rounded-xl border bg-card p-3">
                  <History className="mt-0.5 size-4 shrink-0 text-muted-grey" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{i.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {d.decision === "approved" ? "Approved · v1.0 published · next review in 12 months" : d.decision === "modify" ? "Returned for changes" : "Rejected"}
                      {" · "}
                      {new Date(d.at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {d.note && <p className="mt-1 text-sm">&ldquo;{d.note}&rdquo;</p>}
                  </div>
                </div>
              )
            })}
          </TabsContent>
        </Tabs>
      </PageBody>

      <Dialog open={!!open} onOpenChange={(o) => { if (!o) { setOpen(null); setNote("") } }}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle>{open.title}</DialogTitle>
                <DialogDescription>{open.summary}</DialogDescription>
              </DialogHeader>
              <ol className="flex flex-wrap gap-1 text-[11px]">
                {STAGES.map((s) => {
                  const idx = STAGES.indexOf(open.stage)
                  const me = STAGES.indexOf(s)
                  return (
                    <li key={s} className={cn("rounded-full px-2 py-0.5", me < idx ? "bg-sage text-forest" : me === idx ? "bg-forest text-ivory" : "bg-muted text-muted-foreground")}>
                      {s}
                    </li>
                  )
                })}
              </ol>
              <dl className="space-y-1.5 text-sm">
                <div><dt className="inline text-muted-foreground">Population: </dt><dd className="inline">{open.population}</dd></div>
                <div><dt className="inline text-muted-foreground">Source: </dt><dd className="inline">{open.source}</dd></div>
                <div><dt className="inline text-muted-foreground">Submitted by: </dt><dd className="inline">{open.submittedBy}</dd></div>
              </dl>
              <ul className="space-y-1.5 rounded-xl bg-muted/60 p-3 text-sm">
                {open.checks.map((c) => (
                  <li key={c.label} className="flex gap-2">
                    <span className={cn("mt-0.5 grid size-4 shrink-0 place-items-center rounded-full text-[10px] font-bold", c.ok ? "bg-forest text-ivory" : "bg-caution text-white")} aria-hidden>
                      {c.ok ? "✓" : "!"}
                    </span>
                    <span>{c.label}<span className="sr-only">{c.ok ? " — passed" : " — open"}</span></span>
                  </li>
                ))}
              </ul>
              {open.checks.some((c) => !c.ok) && <SafetyAlert title="Can't approve yet">Open checks must pass before this can be published.</SafetyAlert>}
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reviewer note (required to modify or reject)" aria-label="Reviewer note" />
              <DialogFooter className="grid grid-cols-3 gap-2 sm:flex">
                <Button variant="outline" disabled={!note.trim()} onClick={() => decide("rejected")}>Reject</Button>
                <Button variant="outline" disabled={!note.trim()} onClick={() => decide("modify")}>Modify</Button>
                <Button disabled={open.checks.some((c) => !c.ok)} onClick={() => decide("approved")}>Approve</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
