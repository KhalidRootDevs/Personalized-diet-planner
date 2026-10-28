"use client"

import Link from "next/link"
import { useState } from "react"
import { Baby, Plus, Store, UtensilsCrossed, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, HeaderIconButton, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { WeekStrip } from "@/components/app/week-strip"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote, Ring } from "@/components/app/nutrition"
import { cn } from "@/lib/utils"
import { InfoNote } from "@/components/app/alerts"
import { ProfileSwitcher } from "@/components/app/profile-switcher"
import { EntryCard } from "@/components/log/entry-card"
import { PlannedVsActual } from "@/components/log/planned-vs-actual"
import { useApp, useActivePlan, useActiveProfile } from "@/lib/store"
import { formatDay, todayISO } from "@/lib/date"
import { adultTargets } from "@/lib/nutrition"
import { dayRange, entriesFor } from "@/lib/area-b-log"

/** Food Log tab: daily journal, totals and planned vs actual (§41.4, §41.5). */
export default function FoodLogPage() {
  const profile = useActiveProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const today = todayISO()
  const [date, setDate] = useState(today)
  const n = (v: number) => Math.round(v).toLocaleString("en-US")

  if (!profile) return null
  const child = profile.type !== "adult"
  const entries = entriesFor(journal, profile.id, date)
  const range = dayRange(entries)
  const targets = child ? null : adultTargets(profile)
  const meals = child ? [] : (plan?.meals ?? []).filter((m) => m.date === date)
  const unrecorded = meals.filter((m) => !m.outcome).length

  return (
    <>
      <PageHeader
        large
        title="Food Log"
        subtitle={child ? `${profile.name}'s food diary` : "What you actually ate"}
        action={
          <>
            <ProfileSwitcher />
            <HeaderIconButton href="/log/new" label="Log a meal" className="bg-lime text-charcoal hover:bg-lime/85">
              <Plus className="size-5" />
            </HeaderIconButton>
          </>
        }
      />

      <PageBody className="space-y-6 pt-1">
        <WeekStrip value={date} onChange={(d) => setDate(d > today ? today : d)} marked={(d) => journal.some((e) => e.profileId === profile.id && e.consumedAt.startsWith(d))} />

        {child ? (
          <InfoNote title="Caregiver food diary">
            We record what {profile.name} tried, the texture and how it went — not calories. New foods also appear in the{" "}
            <Link href="/child/foods" className="font-medium text-forest underline underline-offset-2">
              introduction tracker
            </Link>
            .
          </InfoNote>
        ) : (
          targets &&
          (targets.supported ? (
            <Surface padding="lg" aria-label={date === today ? "Today's intake" : `Intake on ${formatDay(date)}`}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-headline">{date === today ? "Today's intake" : formatDay(date)}</h2>
                <Pill tone="sage">
                  {entries.length} {entries.length === 1 ? "entry" : "entries"}
                </Pill>
              </div>
              <div className="mt-4 flex items-center gap-5">
                <Ring
                  value={range.mid.energyKcal}
                  max={targets.energy.high}
                  size={124}
                  stroke={13}
                  color="var(--lime)"
                  track="var(--muted)"
                  label={`About ${n(range.mid.energyKcal)} kcal recorded. Day range ${n(targets.energy.low)} to ${n(targets.energy.high)} kcal`}
                >
                  <p className="text-[11px] font-medium text-muted-foreground">Eaten · est.</p>
                  <p className="text-[24px] leading-tight font-bold tracking-tight tabular">~{n(range.mid.energyKcal)}</p>
                  <p className="text-[11px] font-medium text-muted-foreground">kcal</p>
                </Ring>
                <dl className="min-w-0 flex-1 space-y-3">
                  <div>
                    <dt className="text-caption text-muted-foreground">Likely range</dt>
                    <dd className="text-headline tabular">{entries.length ? `${n(range.low)}–${n(range.high)}` : "—"} <span className="text-caption font-normal text-muted-foreground">kcal</span></dd>
                  </div>
                  <div>
                    <dt className="text-caption text-muted-foreground">Day range</dt>
                    <dd className="text-headline tabular">
                      {n(targets.energy.low)}–{n(targets.energy.high)} <span className="text-caption font-normal text-muted-foreground">kcal</span>
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3">
                <MacroColumn label="Protein" fill="bg-protein" value={range.mid.proteinG} top={targets.proteinG.high} target={`${n(targets.proteinG.low)}–${n(targets.proteinG.high)}`} />
                <MacroColumn label="Carbs" fill="bg-carbs" value={range.mid.carbsG} top={targets.carbsG.high} target={`${n(targets.carbsG.low)}–${n(targets.carbsG.high)}`} />
                <MacroColumn label="Fat" fill="bg-fat" value={range.mid.fatG} top={targets.fatG.high} target={`${n(targets.fatG.low)}–${n(targets.fatG.high)}`} />
                <MacroColumn label="Fiber" fill="bg-fiber" value={range.mid.fiberG} top={targets.fiberMinG * 1.25} target={`≥ ${n(targets.fiberMinG)}`} />
              </div>
              <div className="mt-4 border-t border-border/70 pt-3">
                <EstimateNote>
                  Counts logged meals only
                  {unrecorded > 0 ? ` — ${unrecorded} planned meal${unrecorded === 1 ? " is" : "s are"} not recorded yet, so the day may be incomplete.` : "."}
                </EstimateNote>
              </div>
            </Surface>
          ) : (
            <InfoNote title="Targets set with your care team">{targets.reason}</InfoNote>
          ))
        )}

        <Section title={date === today ? "Recently logged" : "Logged this day"} badge={<FeatureBadge feature="journal_photo" />}>
          {entries.length ? (
            <div className="space-y-3">
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} hideNutrition={child} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={child ? <Baby /> : <UtensilsCrossed />}
              title={date === today ? "Nothing logged yet today" : "Nothing logged this day"}
              description={child ? "Record a feed or a new food when you're ready." : "Snap a photo, search a food or just describe what you ate."}
              action={
                <Button asChild>
                  <Link href="/log/new">
                    <Plus /> Log a meal
                  </Link>
                </Button>
              }
            />
          )}
        </Section>

        {!child && meals.length > 0 && <PlannedVsActual meals={meals} entries={entries} />}

        {!child && (
          <Section title="Tools">
            <ListGroup>
              <ListRow
                href="/log/simulator"
                icon={<Wand2 />}
                iconTone="sky"
                title={
                  <>
                    What if I eat this? <FeatureBadge feature="what_if" />
                  </>
                }
                description="See how a food would fit today before you eat it"
              />
              <ListRow
                href="/log/restaurant"
                icon={<Store />}
                iconTone="amber"
                title={
                  <>
                    Eating out <FeatureBadge feature="restaurant" />
                  </>
                }
                description="Restaurant estimates as ranges, plus ordering ideas"
              />
            </ListGroup>
          </Section>
        )}
      </PageBody>
    </>
  )
}

/** Compact macro column (design-ref 3): label, colored bar, estimate and its general range (g). */
function MacroColumn({ label, fill, value, top, target }: { label: string; fill: string; value: number; top: number; target: string }) {
  const pct = Math.min(100, top > 0 ? (value / top) * 100 : 0)
  return (
    <div role="img" aria-label={`${label}: about ${Math.round(value)} g. General range ${target} g.`}>
      <p className="text-caption font-medium">{label}</p>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted" aria-hidden>
        <div className={cn("h-full rounded-full", fill)} style={{ width: `${Math.max(pct, value > 0 ? 6 : 0)}%` }} />
      </div>
      <p className="mt-1.5 text-[15px] leading-tight font-semibold tabular" aria-hidden>
        ~{Math.round(value)}
        <span className="text-[11px] font-normal text-muted-foreground"> g</span>
      </p>
      <p className="text-[11px] text-muted-foreground tabular" aria-hidden>
        {target} g
      </p>
    </div>
  )
}
