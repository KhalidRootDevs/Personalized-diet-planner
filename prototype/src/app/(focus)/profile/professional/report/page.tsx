"use client"

// Printable appointment report (§42.24 "Appointment report export", FR-059). Generated from the
// user's own records as estimates and ranges; it is not a clinical document or diagnosis.
import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Printer } from "lucide-react"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { lastNDays, mealsInRange, periodSummary } from "@/lib/area-d-stats"
import { adherence } from "@/lib/nutrition"
import { profileAgeLabel } from "@/components/app/profile-switcher"
import { ALLERGEN_LABELS } from "@/lib/data/foods"
import { RECIPE_MAP } from "@/lib/data/recipes"
import { formatDay } from "@/lib/date"
import { track } from "@/lib/analytics"
import { CONDITION_LABEL, DIET_LABEL, GOAL_LABEL } from "@/components/profile/options"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader, StickyFooter } from "@/components/app/page"

export default function ReportPage() {
  return (
    <Suspense>
      <Report />
    </Suspense>
  )
}

const PRINT_CSS = `@media print {
  body * { visibility: hidden !important; }
  #nutriplan-report, #nutriplan-report * { visibility: visible !important; }
  #nutriplan-report { position: absolute; inset: 0 auto auto 0; width: 100%; padding: 24px; }
  .no-print { display: none !important; }
}`

function Report() {
  useAreaDSync()
  const params = useSearchParams()
  const n = Math.min(90, Math.max(7, Number(params.get("days")) || 30))
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const weighIns = useAreaD((s) => s.weighIns)
  const feedback = useAreaD((s) => s.mealFeedback)
  const notes = useAreaD((s) => s.professionalNotes)
  const hideWeight = useAreaD((s) => s.progressPrefs.hideWeight)
  const audit = useAreaD((s) => s.audit)
  const [questions, setQuestions] = useState("")
  const done = useRef(false)

  useEffect(() => {
    if (done.current) return
    done.current = true
    audit("Appointment report generated", `${n}-day report`)
    track("professional_report_opened", { days: n })
  }, [audit, n])

  if (!self) return null
  const days = lastNDays(n)
  const sum = periodSummary(journal, plan, self.id, days)
  const ad = adherence(mealsInRange(plan, days))
  const weights = weighIns.filter((w) => w.profileId === self.id && w.weightKg && w.date >= days[0])
  const liked = Array.from(new Set(feedback.filter((f) => f.enjoyed === "yes").map((f) => RECIPE_MAP[f.recipeId]?.name).filter(Boolean)))
  const k = (x: number) => Math.round(x).toLocaleString("en-US")

  return (
    <div className="flex min-h-dvh flex-1 flex-col lg:min-h-full">
      <style>{PRINT_CSS}</style>
      <div className="no-print">
        <PageHeader back="/profile/professional" title="Appointment report" subtitle={`Last ${n} days`} />
      </div>
      <article id="nutriplan-report" className="px-gutter flex-1 space-y-5 pt-2 pb-8 text-charcoal">
        <header className="border-b border-border pb-3">
          <p className="text-overline text-muted-foreground">NutriPlan · nutrition record summary</p>
          <h1 className="text-title mt-1">{self.name}</h1>
          <p className="text-caption text-muted-foreground tabular">
            {formatDay(days[0], { day: "numeric", month: "short", year: "numeric" })} – {formatDay(days[days.length - 1], { day: "numeric", month: "short", year: "numeric" })} · generated {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </header>

        <ReportSection title="Profile">
          <Row label="Age" value={profileAgeLabel(self)} />
          <Row label="Goal" value={GOAL_LABEL[self.goal ?? ""] ?? "Not set"} />
          <Row label="Food allergies" value={self.allergies.map((a) => ALLERGEN_LABELS[a]).join(", ") || "None recorded"} />
          <Row label="Diet" value={self.diet.map((d) => DIET_LABEL[d] ?? d).join(", ") || "No preference recorded"} />
          <Row label="Conditions (self-reported)" value={self.conditions.map((c) => CONDITION_LABEL[c] ?? c).join(", ") || "None recorded"} />
        </ReportSection>

        <ReportSection title="Recorded intake (estimates)">
          <Row label="Days with meals logged" value={`${sum.loggedDays} of ${n}`} />
          <Row label="Energy on logged days" value={sum.energyHigh ? `~${k(sum.energyLow)}–${k(sum.energyHigh)} kcal / day` : "Not enough data"} />
          <Row label="Planned energy (plan days)" value={sum.plannedEnergy ? `~${k(sum.plannedEnergy)} kcal / day` : "–"} />
          <Row label="Protein on logged days" value={sum.loggedDays ? `~${Math.round(sum.protein)} g / day` : "–"} />
          <Row label="Fiber on logged days" value={sum.loggedDays ? `~${Math.round(sum.fiber)} g / day` : "–"} />
          <p className="text-caption pt-1 text-muted-foreground">Values are estimates from logged meals and the food database; photo-based portions carry extra uncertainty. Unlogged meals are not counted.</p>
        </ReportSection>

        <ReportSection title="Record completeness">
          <Row label="Well-recorded days" value={`${sum.wellRecorded} of ${n}`} />
          <Row label="Days without records" value={`${sum.notEnough}`} />
          <Row label="Entries (from photos)" value={`${sum.entries} (${sum.photoEntries})`} />
          <p className="text-caption pt-1 text-muted-foreground">Gaps in records should not be read as low intake.</p>
        </ReportSection>

        <ReportSection title="Planned meals">
          <Row label="Recorded outcomes" value={`${ad.resolved}`} />
          <Row label="Eaten as planned / changed / replaced" value={`${ad.asPlanned} / ${ad.modified} / ${ad.replaced}`} />
          <Row label="Skipped" value={`${ad.skipped}`} />
        </ReportSection>

        {!hideWeight && weights.length > 0 && (
          <ReportSection title="Weight (self-recorded)">
            {weights.map((w) => (
              <Row key={w.id} label={formatDay(w.date, { day: "numeric", month: "short" })} value={`${w.weightKg} kg`} />
            ))}
          </ReportSection>
        )}

        {(liked.length > 0 || notes.length > 0) && (
          <ReportSection title="Preferences and notes">
            {liked.length > 0 && <Row label="Meals enjoyed" value={liked.join(", ")} />}
            {notes.map((nt) => (
              <Row key={nt.id} label={`Note from ${nt.author}`} value={nt.text} />
            ))}
          </ReportSection>
        )}

        <ReportSection title="Questions for my appointment">
          <Textarea className="no-print" value={questions} onChange={(e) => setQuestions(e.target.value)} placeholder="Write questions to bring with you…" aria-label="Questions for my appointment" />
          <p className="hidden whitespace-pre-line print:block">{questions || "—"}</p>
        </ReportSection>

        <p className="text-caption border-t border-border pt-3 text-muted-foreground">
          This summary is generated from self-recorded data. It is not a diagnosis, has not been professionally reviewed, and does not show nutrient status. Clinical testing may be needed to assess deficiencies.
        </p>
      </article>
      <div className="no-print">
        <StickyFooter>
          <Button size="lg" onClick={() => window.print()}>
            <Printer className="size-[18px]" /> Print or save as PDF
          </Button>
        </StickyFooter>
      </div>
    </div>
  )
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h2 className="text-headline mb-1.5">{title}</h2>
      <div className="divide-y divide-border/70">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-callout flex items-baseline justify-between gap-4 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular text-right font-medium">{value}</span>
    </div>
  )
}
