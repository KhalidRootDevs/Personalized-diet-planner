"use client"

import Link from "next/link"
import { CalendarClock, Coffee, Info, Moon, Sprout } from "lucide-react"
import { formatDay } from "@/lib/date"
import { adultTargets } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { average, dayStats, lastNDays, recordConfidence } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"

const INSIGHTS = [
  {
    title: "Prepared breakfasts were more often eaten",
    body: "On days you prepared breakfast the night before, you recorded breakfast as eaten more often than on other days.",
    basis: "Based on 6 days of records",
    icon: Coffee,
  },
  {
    title: "Busy afternoons and skipped snacks",
    body: "Afternoon snacks were skipped more often on days with meetings after 3 PM in your schedule.",
    basis: "Based on 7 days of records",
    icon: CalendarClock,
  },
  {
    title: "Weekend dinners were later",
    body: "Dinners on Friday and Saturday were logged about an hour later than on weekdays.",
    basis: "Based on 2 weekends — an early pattern",
    icon: Moon,
  },
]

const CONF_STYLE: Record<string, string> = {
  Complete: "bg-lime text-charcoal",
  "Mostly complete": "bg-lime-card text-charcoal",
  "Partially complete": "bg-muted text-charcoal",
  "Not enough data": "border border-dashed border-input text-muted-foreground",
}

/** Explained insights (§42.19), nutrient gaps (§42.12), Nutrition Twin (§42.15), confidence (§42.20). */
export default function InsightsPage() {
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const twin = useApp((s) => s.twinPreferences)
  const setTwinPreference = useApp((s) => s.setTwinPreference)

  const days = lastNDays(7)
  const stats = self ? dayStats(journal, plan, self.id, days) : []
  const loggedDays = stats.filter((s) => s.logged).length
  const targets = self ? adultTargets(self) : null
  const conf = self ? days.map((d) => ({ date: d, ...recordConfidence(journal, plan, self.id, d) })) : []

  // Only flag a possible gap with enough logged days; wording never implies deficiency (§42.12).
  const gaps =
    targets?.supported && loggedDays >= 4
      ? [
          { name: "fiber", avg: average(stats, "fiberG"), target: targets.fiberMinG, unit: "g", foods: "dal, vegetables, fruit and whole-wheat roti" },
          { name: "iron", avg: average(stats, "ironMg"), target: targets.ironMg, unit: "mg", foods: "lentils, spinach (lal shak), eggs and small fish" },
          { name: "calcium", avg: average(stats, "calciumMg"), target: targets.calciumMg, unit: "mg", foods: "small fish with bones (mola), milk, doi and leafy greens" },
        ].filter((g) => g.target > 0 && g.avg < g.target * 0.8)
      : []

  return (
    <>
      <PageHeader title="Insights" back="/progress" />
      <PageBody>
        <InfoNote title="How to read insights">
          Insights describe patterns in your own records. A pattern doesn&apos;t prove that one thing causes another, and records may be incomplete.
        </InfoNote>

        <Section title="Patterns in your week" badge={<FeatureBadge feature="insights" />}>
          <PremiumGate feature="insights" compact>
            <div className="space-y-3">
              {INSIGHTS.map((i, idx) => {
                const Icon = i.icon
                return (
                  <Surface key={i.title}>
                    <div className="flex gap-3">
                      <IconTile tone={(["amber", "sky", "terracotta"] as const)[idx % 3]}>
                        <Icon />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{i.title}</p>
                        <p className="text-callout mt-1 text-charcoal/85">{i.body}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Pill tone="neutral">Correlation, not cause</Pill>
                          <span className="text-caption text-muted-foreground">{i.basis}</span>
                        </div>
                      </div>
                    </div>
                  </Surface>
                )
              })}
            </div>
          </PremiumGate>
        </Section>

        <Section title="Nutrients to look at" badge={<FeatureBadge feature="nutrient_gaps" />}>
          <PremiumGate feature="nutrient_gaps" variant="row">
            {!targets?.supported ? (
              <InfoNote>Nutrient comparisons aren&apos;t available for this profile.</InfoNote>
            ) : loggedDays < 4 ? (
              <InfoNote>Log meals on at least 4 days to see nutrient patterns. A few entries aren&apos;t enough to draw conclusions.</InfoNote>
            ) : gaps.length === 0 ? (
              <InfoNote>Your recorded meals were close to your general targets for fiber, iron and calcium this week.</InfoNote>
            ) : (
              <>
                <div className="space-y-3">
                  {gaps.map((g) => (
                    <Surface key={g.name}>
                      <div className="flex gap-3">
                        <IconTile tone="sky">
                          <Sprout />
                        </IconTile>
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-medium">Your recorded meals may be low in {g.name}</p>
                          <p className="tabular text-caption mt-1 text-muted-foreground">
                            About {Math.round(g.avg)} {g.unit} a day on logged days · general target {Math.round(g.target)} {g.unit}
                          </p>
                          <p className="text-callout mt-2">Foods that could help: {g.foods}.</p>
                        </div>
                      </div>
                    </Surface>
                  ))}
                </div>
                <p className="text-caption px-1 text-muted-foreground">
                  Based on {loggedDays} logged days and estimated values. This is not a test of your nutrient status. If you&apos;re concerned, speak to a doctor or dietitian.
                </p>
              </>
            )}
          </PremiumGate>
        </Section>

        <Section title="Your Nutrition Twin" badge={<FeatureBadge feature="twin" />} description="What NutriPlan has learned about your preferences. Turn off anything that's wrong and it won't be used for suggestions.">
          <PremiumGate feature="twin" variant="row">
            <ListGroup>
              {twin.map((t) => (
                <ListRow
                  key={t.id}
                  title={<span className={cn(!t.active && "text-muted-foreground")}>{t.text}</span>}
                  description={t.evidence}
                  trailing={<Switch checked={t.active} onCheckedChange={(v) => setTwinPreference(t.id, v)} aria-label={`Use: ${t.text}`} />}
                />
              ))}
            </ListGroup>
            <p className="text-caption px-1 text-muted-foreground">A few entries are never conclusive. Preferences only count once they appear consistently.</p>
          </PremiumGate>
        </Section>

        <Section title="Record confidence" badge={<FeatureBadge feature="confidence" />} description="How complete and certain your food records are. Not a health score.">
          <div id="confidence" className="scroll-mt-20 space-y-3">
            <Surface>
              <div className="grid grid-cols-7 gap-1.5">
                {conf.map((c) => (
                  <div key={c.date} className="flex flex-col items-center gap-1.5">
                    <span className="text-caption text-muted-foreground">{formatDay(c.date, { weekday: "narrow" })}</span>
                    <span className={cn("text-callout grid size-9 place-items-center rounded-full font-semibold", CONF_STYLE[c.level])} title={c.level}>
                      {c.level === "Not enough data" ? "–" : c.level === "Complete" ? "✓" : c.level === "Mostly complete" ? "~" : "½"}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="text-caption mt-4 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border/70 pt-3 text-muted-foreground">
                <li><b className="font-semibold text-charcoal">✓</b> Complete</li>
                <li><b className="font-semibold text-charcoal">~</b> Mostly complete</li>
                <li><b className="font-semibold text-charcoal">½</b> Partially complete</li>
                <li><b className="font-semibold text-charcoal">–</b> Not enough data</li>
              </ul>
            </Surface>
            {conf.length > 0 && (
              <ListGroup>
                <ListRow
                  href="/log"
                  title={<>Today · {conf[6].level}</>}
                  description={
                    <span className="tabular">
                      {conf[6].logged} {conf[6].logged === 1 ? "meal" : "meals"} confirmed
                      {conf[6].fromPhoto ? ` · ${conf[6].fromPhoto} from photos` : ""}
                      {conf[6].missing ? ` · ${conf[6].missing} planned not yet logged` : ""}
                    </span>
                  }
                />
              </ListGroup>
            )}
            <p className="text-caption flex gap-2 px-1 text-muted-foreground">
              <Info className="mt-px size-4 shrink-0" />
              <span>
                Use it to judge how much to rely on totals and insights.{" "}
                <Link href="/log" className="font-semibold text-forest underline underline-offset-2">
                  Go to Food Log
                </Link>
              </span>
            </p>
          </div>
        </Section>
      </PageBody>
    </>
  )
}
