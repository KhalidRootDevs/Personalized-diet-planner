"use client"

// Admin analytics and safety metrics (§31, §42.26, Phase 1 admin). Prototype: computed from this
// browser's local data for a single user, plus the consented event log. Safety metrics are listed
// individually rather than hidden inside an aggregate (§31.6).
import Link from "next/link"
import { Activity, Baby, BarChart3, CheckCircle2, Circle, ClipboardX, ShieldAlert, Siren, Stethoscope, TriangleAlert } from "lucide-react"
import { RECIPES } from "@/lib/data/recipes"
import { useApp } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { allergenHits, infantFlags, SOURCE_LABEL } from "@/lib/area-b-log"
import { lastNDays } from "@/lib/area-d-stats"
import { violatesHardConstraints } from "@/lib/nutrition"
import { EMERGENCY_SOURCE, REFERRAL_SOURCE } from "@/lib/coach"
import { Button } from "@/components/ui/button"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { PhaseBadge } from "@/components/app/badges"
import { KeyValue, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"

export default function AdminAnalyticsPage() {
  useAreaDSync()
  const s = useApp()
  const events = useAreaD((x) => x.events)
  const clearEvents = useAreaD((x) => x.clearEvents)
  const consentOn = useApp((x) => x.consents.find((c) => c.type === "analytics")?.granted ?? false)
  const self = s.profiles.find((p) => p.relation === "self")
  const selfEntries = s.journal.filter((e) => e.profileId === self?.id)
  const viewed = new Set(events.map((e) => e.name))
  const reviewedSummary = viewed.has("progress_viewed") || viewed.has("weekly_review_viewed") || viewed.has("insights_viewed")

  const funnel: { label: string; done: boolean | null }[] = [
    { label: "Account created", done: !!s.user },
    { label: "Onboarding completed", done: s.onboarded },
    { label: "First plan generated", done: s.plans.length > 0 },
    { label: "Plan activated", done: s.plans.some((p) => p.status === "active") },
    { label: "First meal logged", done: selfEntries.length > 0 },
    { label: "Nutrition summary reviewed", done: consentOn ? reviewedSummary : null },
  ]
  const coreDone = s.plans.length > 0 && selfEntries.length > 0 && reviewedSummary

  const d7 = new Set(lastNDays(7))
  const d30 = new Set(lastNDays(30))
  const daysLogged = (set: Set<string>) => new Set(selfEntries.filter((e) => set.has(e.consumedAt.slice(0, 10))).map((e) => e.consumedAt.slice(0, 10))).size
  const bySource = Object.entries(selfEntries.reduce<Record<string, number>>((acc, e) => ((acc[e.source] = (acc[e.source] ?? 0) + 1), acc), {})).sort((a, b) => b[1] - a[1])
  const plan = s.plans.find((p) => p.id === s.activePlanId)
  const pastMeals = (plan?.meals ?? []).filter((m) => d7.has(m.date))
  const withOutcome = pastMeals.filter((m) => m.outcome && m.outcome !== "unresolved").length

  // Safety (§31.6)
  const recipesBlocked = s.profiles.reduce((t, p) => t + RECIPES.filter((r) => (p.type === "adult" ? r.profile === "adult" : r.profile !== "adult") && violatesHardConstraints(r, p)).length, 0)
  const allergenWarnings = s.journal.reduce((t, e) => t + allergenHits(e.items, s.profiles.find((p) => p.id === e.profileId)).length, 0)
  const childFlags = s.journal.reduce((t, e) => {
    const p = s.profiles.find((x) => x.id === e.profileId)
    return t + (p && p.type !== "adult" ? e.items.filter((i) => infantFlags(i.foodId, p)).length : 0)
  }, 0)
  const emergencies = s.coach.filter((m) => m.sources?.includes(EMERGENCY_SOURCE)).length
  const referrals = s.coach.filter((m) => m.sources?.includes(REFERRAL_SOURCE)).length
  const reactions = s.introduced.filter((f) => f.reaction && f.reaction !== "None observed").length
  const unsafeActive = s.plans.filter((p) => p.status === "active" && (!p.validation.safety || p.validation.requiresReview)).length
  const emergencyViews = events.filter((e) => e.name === "emergency_guidance_viewed").length

  return (
    <>
      <PageHeader back="/profile" title={<span className="flex items-center gap-2">Analytics <PhaseBadge phase={1} /></span>} subtitle="Staff view (prototype)" />
      <PageBody>
        <CautionNote title="Prototype data">
          Computed from this browser only — one user, illustrative records. Production metrics come from the analytics pipeline across all users, with no personal or health details in events.
        </CautionNote>

        <Section title="Activation funnel" description="§31.2 · core workflow §42.26">
          <ListGroup>
            {funnel.map((f) => (
              <ListRow
                key={f.label}
                icon={f.done ? <CheckCircle2 /> : <Circle />}
                iconTone={f.done ? "lime" : "muted"}
                title={f.label}
                trailing={<Pill tone={f.done ? "sage" : "outline"}>{f.done === null ? "Needs analytics consent" : f.done ? "Reached" : "Not yet"}</Pill>}
              />
            ))}
          </ListGroup>
          <Surface tone={coreDone ? "sage" : "muted"}>
            <KeyValue label="Core workflow completed (plan → log → review)" value={coreDone ? "Yes" : "Not yet"} />
          </Surface>
        </Section>

        <Section title="Logging" description="§31.3, §41.12">
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Days logged (7)" value={daysLogged(d7)} unit="of 7" />
            <StatTile label="Days logged (30)" value={daysLogged(d30)} unit="of 30" />
            <StatTile label="Outcomes (7)" value={`${withOutcome}/${pastMeals.length}`} />
          </div>
          <ListGroup label="Entries by input">
            {bySource.map(([src, n]) => (
              <ListRow key={src} title={SOURCE_LABEL[src as keyof typeof SOURCE_LABEL] ?? src} trailing={<span className="tabular text-headline">{n}</span>} />
            ))}
          </ListGroup>
        </Section>

        <Section title="Safety metrics" description="§31.6 — each one is reviewed individually, never averaged away.">
          <ListGroup>
            <ListRow icon={<ShieldAlert />} iconTone="safety" title="Recipes blocked by allergy, age or diet rules" description="Across all profiles on this account" trailing={<span className="tabular text-headline">{recipesBlocked}</span>} />
            <ListRow icon={<TriangleAlert />} iconTone="caution" title="Allergen warnings on logged food" trailing={<span className="tabular text-headline">{allergenWarnings}</span>} />
            <ListRow icon={<Baby />} iconTone="caution" title="Child food-safety flags on logged food" trailing={<span className="tabular text-headline">{childFlags}</span>} />
            <ListRow icon={<Baby />} iconTone="sky" title="Child reactions recorded (for clinician)" trailing={<span className="tabular text-headline">{reactions}</span>} />
            <ListRow icon={<Siren />} iconTone="safety" title="Coach emergency routes" description={`Emergency guidance opened ${consentOn ? emergencyViews : "–"} times`} trailing={<span className="tabular text-headline">{emergencies}</span>} />
            <ListRow icon={<Stethoscope />} iconTone="sky" title="Coach professional referrals" trailing={<span className="tabular text-headline">{referrals}</span>} />
            <ListRow icon={<ClipboardX />} iconTone={unsafeActive ? "safety" : "lime"} title="Active plans without required approval" description="Must always be 0" trailing={<Pill tone={unsafeActive ? "safety" : "sage"}>{unsafeActive}</Pill>} />
          </ListGroup>
        </Section>

        <Section title="Event log" description="Only recorded while the user allows product analytics. Events carry enums and counts — never names, text or health details.">
          {!consentOn && <InfoNote>Product analytics is off for this user, so no new events are recorded. Turn it on in Profile → Privacy and data to see events here.</InfoNote>}
          {events.length === 0 ? (
            <p className="text-callout px-1 text-muted-foreground">No events yet.</p>
          ) : (
            <>
              <ListGroup>
                {[...events].reverse().slice(0, 20).map((e) => (
                  <ListRow
                    key={e.id}
                    icon={<Activity />}
                    iconTone="muted"
                    title={<span className="font-mono text-[13px]">{e.name}</span>}
                    description={
                      <span className="tabular">
                        {new Date(e.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {e.props && Object.keys(e.props).length > 0 && ` · ${Object.entries(e.props).map(([k, v]) => `${k}=${v}`).join(", ")}`}
                      </span>
                    }
                  />
                ))}
              </ListGroup>
              <Button variant="outline" className="w-full" onClick={clearEvents}>
                Clear event log
              </Button>
            </>
          )}
        </Section>

        <ListGroup>
          <ListRow href="/admin/reviews" icon={<BarChart3 />} iconTone="muted" title="Clinical review queue" description="Staff view (prototype)" />
        </ListGroup>
        <p className="text-caption px-1 text-muted-foreground">
          Benchmarks are set after observing real users (§42.26).{" "}
          <Link href="/profile" className="font-semibold text-forest underline underline-offset-2">
            Back to profile
          </Link>
        </p>
      </PageBody>
    </>
  )
}
