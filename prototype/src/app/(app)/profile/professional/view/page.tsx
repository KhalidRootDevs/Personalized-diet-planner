"use client"

// Simulated dietitian view (§42.24, FR-028, FR-059): shows only the scopes the user granted, and lets
// the "professional" add a recommendation that appears to the user. Every view is audited (§29.1).
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ClipboardList, Lock, NotebookPen, Scale, Send, ShieldCheck, Stethoscope } from "lucide-react"
import { toast } from "sonner"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { lastNDays, mealsInRange, periodSummary } from "@/lib/area-d-stats"
import { adherence } from "@/lib/nutrition"
import { entryTitle, SOURCE_LABEL } from "@/lib/area-b-log"
import { MEAL_LABEL } from "@/lib/planning"
import { formatDay } from "@/lib/date"
import { ALLERGEN_LABELS } from "@/lib/data/foods"
import { CONDITION_LABEL } from "@/components/profile/options"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState, IconTile, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { PhaseBadge } from "@/components/app/badges"

export default function ProfessionalViewPage() {
  useAreaDSync()
  const access = useApp((s) => s.settings.professionalAccess)
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const weighIns = useAreaD((s) => s.weighIns)
  const addNote = useAreaD((s) => s.addProfessionalNote)
  const audit = useAreaD((s) => s.audit)
  const [note, setNote] = useState("")
  const logged = useRef(false)

  useEffect(() => {
    if (access && !logged.current) {
      logged.current = true
      audit("Professional viewed records", access.scope, "professional")
    }
  }, [access, audit])

  if (!access || !self)
    return (
      <>
        <PageHeader back="/profile/professional" title="Dietitian view" />
        <PageBody>
          <EmptyState icon={<Lock />} title="No professional has access" description="Grant access first. You can revoke it at any time." action={<Button asChild><Link href="/profile/professional">Manage access</Link></Button>} />
        </PageBody>
      </>
    )

  const scope = access.scope.toLowerCase()
  const can = { plan: scope.includes("meal plans"), journal: scope.includes("journal"), progress: scope.includes("progress"), health: scope.includes("health") }
  const days = lastNDays(7)
  const sum = periodSummary(journal, plan, self.id, days)
  const ad = adherence(mealsInRange(plan, days))
  const recent = journal.filter((e) => e.profileId === self.id).sort((a, b) => b.consumedAt.localeCompare(a.consumedAt)).slice(0, 5)
  const weights = weighIns.filter((w) => w.profileId === self.id && w.weightKg).slice(-3)

  return (
    <>
      <PageHeader back="/profile/professional" title={<span className="flex items-center gap-2">Dietitian view <PhaseBadge phase={3} /></span>} subtitle={`As ${access.name} sees it`} />
      <PageBody>
        <InfoNote title="Prototype simulation">This screen shows what a verified professional would see with the access you granted. Viewing is recorded in your activity log.</InfoNote>

        <Section title="Shared journal · last 7 days">
          {can.journal ? (
            <>
              <Surface>
                <KeyValue label="Days with meals logged" value={`${sum.loggedDays} of 7`} />
                <KeyValue label="Recorded energy (logged days)" value={sum.energyHigh ? `~${Math.round(sum.energyLow).toLocaleString("en-US")}–${Math.round(sum.energyHigh).toLocaleString("en-US")} kcal` : "–"} />
                <KeyValue label="Recorded protein" value={sum.loggedDays ? `~${Math.round(sum.protein)} g / day` : "–"} />
                <KeyValue label="Well-recorded days" value={`${sum.wellRecorded} of 7`} />
              </Surface>
              <ListGroup label="Recent entries">
                {recent.map((e) => (
                  <ListRow key={e.id} icon={<NotebookPen />} iconTone="muted" title={<span className="truncate">{entryTitle(e)}</span>} description={`${formatDay(e.consumedAt.slice(0, 10), { weekday: "short", day: "numeric", month: "short" })} · ${MEAL_LABEL[e.mealType]} · ${SOURCE_LABEL[e.source]}`} />
                ))}
              </ListGroup>
            </>
          ) : (
            <NotShared what="food journal" />
          )}
        </Section>

        <Section title="Meal plan">
          {can.plan ? (
            <ListGroup>
              <ListRow icon={<ClipboardList />} iconTone="lime" title={plan?.title ?? "No active plan"} description={ad.resolved ? `${ad.completed} of ${ad.resolved} recorded planned meals eaten in some form · ${ad.skipped} skipped` : "No meal outcomes recorded this week"} />
            </ListGroup>
          ) : (
            <NotShared what="meal plans" />
          )}
        </Section>

        <Section title="Progress">
          {can.progress ? (
            <ListGroup>
              <ListRow icon={<Scale />} iconTone="sky" title="Recent weigh-ins" description={weights.length ? weights.map((w) => `${formatDay(w.date, { day: "numeric", month: "short" })}: ${w.weightKg} kg`).join(" · ") : "None recorded"} />
            </ListGroup>
          ) : (
            <NotShared what="progress and weight" />
          )}
        </Section>

        <Section title="Health information">
          {can.health ? (
            <Surface>
              <KeyValue label="Allergies" value={self.allergies.map((a) => ALLERGEN_LABELS[a]).join(", ") || "None recorded"} />
              <KeyValue label="Conditions" value={self.conditions.map((c) => CONDITION_LABEL[c] ?? c).join(", ") || "None recorded"} />
            </Surface>
          ) : (
            <NotShared what="health information" />
          )}
        </Section>

        <Section title="Add a recommendation" description="Appears to the client in their app. It never changes their plan automatically.">
          <Surface padding="lg" className="space-y-3">
            <div className="flex items-center gap-2">
              <IconTile tone="sky" size="sm">
                <Stethoscope />
              </IconTile>
              <p className="text-callout font-medium">{access.name}</p>
            </div>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Add a fruit to your afternoon snack on workdays." aria-label="Recommendation" />
            <Button
              className="w-full"
              disabled={note.trim().length < 5}
              onClick={() => {
                addNote(access.name, note.trim())
                audit("Professional recommendation added", "Note shared with you", "professional")
                setNote("")
                toast.success("Recommendation shared", { description: "It now appears under Notes from your dietitian." })
              }}
            >
              <Send className="size-[18px]" /> Share with client
            </Button>
          </Surface>
          <CautionNote title="Professional responsibility">Only a verified professional can mark a plan as professionally reviewed. Recommendations are their advice, not NutriPlan&apos;s.</CautionNote>
        </Section>
      </PageBody>
    </>
  )
}

function NotShared({ what }: { what: string }) {
  return (
    <p className="text-callout flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-muted-foreground">
      <ShieldCheck className="size-4 shrink-0" aria-hidden /> Not shared — you haven&apos;t given access to your {what}.
    </p>
  )
}
