"use client"

import Link from "next/link"
import { useState } from "react"
import { Baby, Plus, Store, UtensilsCrossed, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader, PageBody, Section, ListLink, EmptyState } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote, Macro, NutrientBar } from "@/components/app/nutrition"
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
            <Button asChild size="icon" aria-label="Log a meal">
              <Link href="/log/new">
                <Plus />
              </Link>
            </Button>
          </>
        }
      />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-1 pb-2" role="tablist" aria-label="Choose day">
        {days.map((d) => {
          const active = d === date
          const has = journal.some((e) => e.profileId === profile.id && e.consumedAt.startsWith(d))
          return (
            <button
              key={d}
              role="tab"
              aria-selected={active}
              onClick={() => setDate(d)}
              className={cn("flex min-w-12 flex-1 flex-col items-center rounded-xl border px-2 py-2 transition-colors", active ? "border-forest bg-forest text-primary-foreground" : "bg-card hover:bg-muted/50")}
            >
              <span className={cn("text-[11px]", active ? "text-primary-foreground/80" : "text-muted-foreground")}>{d === today ? "Today" : fromISO(d).toLocaleDateString("en-US", { weekday: "short" })}</span>
              <span className="tabular text-base font-semibold">{fromISO(d).getDate()}</span>
              <span className={cn("mt-0.5 size-1.5 rounded-full", has ? (active ? "bg-primary-foreground" : "bg-forest") : "bg-transparent")} aria-hidden />
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
              <div className="space-y-4 rounded-2xl border bg-card p-4">
                {targets.supported ? (
                  <>
                    <div>
                      <p className="tabular text-2xl font-semibold">
                        ~{Math.round(range.mid.energyKcal).toLocaleString("en-US")} <span className="text-base font-normal text-muted-foreground">kcal</span>
                      </p>
                      {entries.length > 0 && (
                        <p className="tabular text-xs text-muted-foreground">
                          Likely between {Math.round(range.low).toLocaleString("en-US")} and {Math.round(range.high).toLocaleString("en-US")} kcal
                        </p>
                      )}
                    </div>
                    <NutrientBar label="Energy" value={range.mid.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate />
                    <div className="grid grid-cols-4 gap-2">
                      <Macro label="Protein" value={range.mid.proteinG} estimate />
                      <Macro label="Carbs" value={range.mid.carbsG} estimate />
                      <Macro label="Fat" value={range.mid.fatG} estimate />
                      <Macro label="Fiber" value={range.mid.fiberG} estimate />
                    </div>
                    <EstimateNote>
                      Totals cover {entries.length} logged meal{entries.length === 1 ? "" : "s"} only
                      {unrecorded > 0 ? ` — ${unrecorded} planned meal${unrecorded === 1 ? " is" : "s are"} not recorded yet, so the day may be incomplete.` : "."}
                    </EstimateNote>
                  </>
                ) : (
                  <InfoNote title="Targets set with your care team">{targets.reason}</InfoNote>
                )}
              </div>
            </Section>
          )
        )}

        <Section title="Entries" badge={<FeatureBadge feature="journal_photo" />}>
          {entries.length ? (
            <div className="space-y-2">
              {entries.map((e) => (
                <EntryCard key={e.id} entry={e} hideNutrition={child} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={child ? <Baby className="size-5" /> : <UtensilsCrossed className="size-5" />}
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
            <div className="space-y-2">
              <ListLink
                href="/log/simulator"
                icon={<Wand2 className="size-5" />}
                title={
                  <>
                    What if I eat this? <FeatureBadge feature="what_if" />
                  </>
                }
                description="See how a food would fit today before you eat it"
              />
              <ListLink
                href="/log/restaurant"
                icon={<Store className="size-5" />}
                title={
                  <>
                    Eating out <FeatureBadge feature="restaurant" />
                  </>
                }
                description="Restaurant estimates as ranges, plus ordering ideas"
              />
            </div>
          </Section>
        )}
      </PageBody>
    </>
  )
}
