"use client"

import Link from "next/link"
import { useState } from "react"
import { Baby, Plus, Store, UtensilsCrossed, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, HeaderIconButton, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
import { ProfileSwitcher } from "@/components/app/profile-switcher"
import { EntryCard } from "@/components/log/entry-card"
import { PlannedVsActual } from "@/components/log/planned-vs-actual"
import { useApp, useActivePlan, useActiveProfile } from "@/lib/store"
import { addDays, formatDay, fromISO, todayISO } from "@/lib/date"
import { adultTargets } from "@/lib/nutrition"
import { dayRange, entriesFor } from "@/lib/area-b-log"
import { cn } from "@/lib/utils"

/** Food Log tab: daily journal, totals and planned vs actual (§41.4, §41.5). */
export default function FoodLogPage() {
  const profile = useActiveProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const today = todayISO()
  const [date, setDate] = useState(today)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))

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
            <HeaderIconButton href="/log/new" label="Log a meal" className="border-forest bg-forest text-ivory hover:bg-[#1d3f30]">
              <Plus className="size-5" />
            </HeaderIconButton>
          </>
        }
      />
      <div className="px-gutter grid grid-cols-7 gap-1.5 pt-1 pb-3" role="tablist" aria-label="Choose day">
        {days.map((d) => {
          const active = d === date
          const has = journal.some((e) => e.profileId === profile.id && e.consumedAt.startsWith(d))
          return (
            <button
              key={d}
              role="tab"
              aria-selected={active}
              aria-label={formatDay(d)}
              onClick={() => setDate(d)}
              className={cn("flex h-[68px] flex-col items-center justify-center gap-1 rounded-2xl transition-colors", active ? "bg-forest text-primary-foreground" : "text-charcoal hover:bg-muted")}
            >
              <span className={cn("text-[11px] font-medium", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{d === today ? "Today" : fromISO(d).toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="tabular text-headline leading-none">{fromISO(d).getDate()}</span>
              <span className={cn("size-1 rounded-full", has ? (active ? "bg-primary-foreground" : "bg-forest") : "bg-transparent")} aria-hidden />
            </button>
          )
        })}
      </div>

      <PageBody>
        {child ? (
          <InfoNote title="Caregiver food diary">
            We record what {profile.name} tried, the texture and how it went — not calories. New foods also appear in the{" "}
            <Link href="/child/foods" className="font-medium text-forest underline underline-offset-2">
              introduction tracker
            </Link>
            .
          </InfoNote>
        ) : (
          targets && (
            <Section title={date === today ? "Today so far" : formatDay(date)}>
              {targets.supported ? (
                <Surface padding="lg">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-caption text-muted-foreground">Eaten · estimate</p>
                      <p className="text-metric mt-1">
                        ~{Math.round(range.mid.energyKcal).toLocaleString("en-US")}
                        <span className="text-callout ml-1 font-normal tracking-normal text-muted-foreground">kcal</span>
                      </p>
                      {entries.length > 0 && (
                        <p className="tabular text-caption mt-0.5 text-muted-foreground">
                          Likely {Math.round(range.low).toLocaleString("en-US")}–{Math.round(range.high).toLocaleString("en-US")} kcal
                        </p>
                      )}
                    </div>
                    <Pill tone="sage">
                      {entries.length} {entries.length === 1 ? "entry" : "entries"}
                    </Pill>
                  </div>
                  <div className="mt-5">
                    <NutrientBar label="Energy" value={range.mid.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate />
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <StatTile label="Protein" value={`~${Math.round(range.mid.proteinG)}`} unit="g" className="px-2.5" />
                    <StatTile label="Carbs" value={`~${Math.round(range.mid.carbsG)}`} unit="g" className="px-2.5" />
                    <StatTile label="Fat" value={`~${Math.round(range.mid.fatG)}`} unit="g" className="px-2.5" />
                    <StatTile label="Fiber" value={`~${Math.round(range.mid.fiberG)}`} unit="g" className="px-2.5" />
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
              )}
            </Section>
          )
        )}

        <Section title="Entries" badge={<FeatureBadge feature="journal_photo" />}>
          {entries.length ? (
            <div className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card">
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
