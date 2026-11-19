"use client"

// Clinical rule library (§7.2–§7.3, §28.3). Each rule shows source, population, reviewer, approval status,
// version and next review date. Changes are submitted for review — rules never update automatically.
import { useState } from "react"
import { CalendarClock, Scale } from "lucide-react"
import { toast } from "sonner"
import { CLINICAL_RULES, RULE_STATUS_LABEL, type ClinicalRule } from "@/lib/data/admin"
import { formatDay, todayISO, uid } from "@/lib/date"
import { useApp } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { KeyValue, PageBody, PageHeader, Pill, Section, Surface, type PillTone } from "@/components/app/page"
import { Field } from "@/components/app/controls"
import { InfoNote } from "@/components/app/alerts"

const STATUS_TONE: Record<ClinicalRule["status"], PillTone> = { approved: "sage", in_review: "caution", draft: "outline", retired: "neutral" }

export default function RulesPage() {
  const changes = useApp((s) => s.admin?.ruleChanges ?? [])
  const [editing, setEditing] = useState<ClinicalRule | null>(null)

  return (
    <>
      <PageHeader back="/admin" title="Clinical rule library" subtitle={`${CLINICAL_RULES.length} rules · illustrative`} />
      <PageBody>
        <InfoNote>Guideline changes go through controlled review: source verification → professional review → safety review → approval. Approved versions stay in use until a new version is approved.</InfoNote>
        <Section title="Rules">
          <div className="space-y-3">
            {CLINICAL_RULES.map((r) => {
              const pending = changes.filter((c) => c.ruleId === r.id)
              const overdue = r.nextReview < todayISO()
              return (
                <Surface key={r.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-body font-semibold">{r.title}</p>
                    <Pill tone={STATUS_TONE[r.status]}>{RULE_STATUS_LABEL[r.status]}</Pill>
                  </div>
                  <p className="text-caption text-muted-foreground">{r.summary}</p>
                  <div className="divide-y divide-border/70">
                    <KeyValue label="Source" value={r.source} />
                    <KeyValue label="Population" value={r.population} />
                    <KeyValue label="Reviewer" value={r.reviewer} />
                    <KeyValue label="Version" value={`v${r.version}${r.approvedOn ? ` · approved ${formatDay(r.approvedOn, { day: "numeric", month: "short", year: "numeric" })}` : ""}`} />
                    <KeyValue label="Next review" value={<span className="inline-flex items-center gap-1.5">{overdue && <Pill tone="caution" icon={<CalendarClock />}>Overdue</Pill>}{formatDay(r.nextReview, { day: "numeric", month: "short", year: "numeric" })}</span>} />
                  </div>
                  {pending.length > 0 && (
                    <div className="rounded-xl bg-amber-tint px-3 py-2 text-caption text-amber-text">
                      {pending.length} change request{pending.length > 1 ? "s" : ""} submitted for review · latest: “{pending[pending.length - 1].summary}”
                    </div>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>
                    Submit change for review
                  </Button>
                </Surface>
              )
            })}
          </div>
        </Section>
      </PageBody>
      {editing && <ChangeSheet key={editing.id} rule={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function ChangeSheet({ rule, onClose }: { rule: ClinicalRule; onClose: () => void }) {
  const changes = useApp((s) => s.admin?.ruleChanges ?? [])
  const updateAdmin = useApp((s) => s.updateAdmin)
  const [summary, setSummary] = useState("")
  const [rationale, setRationale] = useState("")
  const [source, setSource] = useState("")
  const ok = summary.trim().length > 4 && source.trim().length > 2

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Propose a change</SheetTitle>
          <SheetDescription>
            {rule.title} · currently v{rule.version}
          </SheetDescription>
        </SheetHeader>
        <form
          className="space-y-4 px-5 pt-1 pb-6"
          onSubmit={(e) => {
            e.preventDefault()
            if (!ok) return
            updateAdmin({ ruleChanges: [...changes, { id: uid("rc"), ruleId: rule.id, summary: summary.trim(), rationale: rationale.trim(), source: source.trim(), submittedAt: new Date().toISOString(), status: "submitted" }] })
            toast.success("Submitted for review", { description: "The current approved version stays in use until a reviewer approves the change." })
            onClose()
          }}
        >
          <Field label="What should change?" htmlFor="rc-sum">
            <Input id="rc-sum" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Field>
          <Field label="Supporting source" htmlFor="rc-src" hint="Guideline, paper or policy, with version or year. Required.">
            <Input id="rc-src" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
          <Field label="Rationale" htmlFor="rc-why">
            <Textarea id="rc-why" rows={3} value={rationale} onChange={(e) => setRationale(e.target.value)} />
          </Field>
          <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
            <Scale className="mt-0.5 size-3.5 shrink-0" aria-hidden /> Population: {rule.population}. Reviewer: {rule.reviewer}.
          </p>
          <Button type="submit" size="lg" className="w-full" disabled={!ok}>
            Submit for review
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
