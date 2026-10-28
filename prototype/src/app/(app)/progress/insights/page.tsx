"use client"

import Link from "next/link"
import { Info, Lightbulb } from "lucide-react"
import { formatDay } from "@/lib/date"
import { adultTargets } from "@/lib/nutrition"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { average, dayStats, lastNDays, recordConfidence } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { PageBody, PageHeader, Section } from "@/components/app/page"

const INSIGHTS = [
  {
    title: "Prepared breakfasts were more often eaten",
    body: "On days you prepared breakfast the night before, you recorded breakfast as eaten more often than on other days.",
    basis: "Based on 6 days of records",
  },
  {
    title: "Busy afternoons and skipped snacks",
    body: "Afternoon snacks were skipped more often on days with meetings after 3 PM in your schedule.",
    basis: "Based on 7 days of records",
  },
  {
    title: "Weekend dinners were later",
    body: "Dinners on Friday and Saturday were logged about an hour later than on weekdays.",
    basis: "Based on 2 weekends — an early pattern",
  },
]

const CONF_STYLE: Record<string, string> = {
  Complete: "bg-forest text-white",
  "Mostly complete": "bg-sage text-forest",
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
            <div className="space-y-2">
              {INSIGHTS.map((i) => (
                <Card key={i.title} className="gap-2">
                  <p className="flex items-center gap-2 font-medium">
                    <Lightbulb className="size-4 text-forest" /> {i.title}
                  </p>
                  <p className="text-sm">{i.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.basis}. This is a correlation, not proof of cause.
                  </p>
                </Card>
              ))}
            </div>
          </PremiumGate>
        </Section>

        <Section title="Nutrients to look at" badge={<FeatureBadge feature="nutrient_gaps" />}>
          <PremiumGate feature="nutrient_gaps" compact>
            {!targets?.supported ? (
              <InfoNote>Nutrient comparisons aren&apos;t available for this profile.</InfoNote>
            ) : loggedDays < 4 ? (
              <InfoNote>Log meals on at least 4 days to see nutrient patterns. A few entries aren&apos;t enough to draw conclusions.</InfoNote>
            ) : gaps.length === 0 ? (
              <InfoNote>Your recorded meals were close to your general targets for fiber, iron and calcium this week.</InfoNote>
            ) : (
              <div className="space-y-2">
                {gaps.map((g) => (
                  <Card key={g.name} className="gap-2">
                    <p className="font-medium">Your recorded meals may be low in {g.name}</p>
                    <p className="text-sm tabular text-muted-foreground">
                      About {Math.round(g.avg)} {g.unit} a day on logged days, compared with a general target of {Math.round(g.target)} {g.unit}.
                    </p>
                    <p className="text-sm">Foods that could help: {g.foods}.</p>
                  </Card>
                ))}
                <p className="text-xs text-muted-foreground">
                  Based on {loggedDays} logged days and estimated values. This is not a test of your nutrient status. If you&apos;re concerned, speak to a doctor or dietitian.
                </p>
              </div>
            )}
          </PremiumGate>
        </Section>

        <Section title="Your Nutrition Twin" badge={<FeatureBadge feature="twin" />}>
          <PremiumGate feature="twin" compact>
            <p className="text-sm text-muted-foreground">What NutriPlan has learned about your preferences. Turn off anything that&apos;s wrong — it won&apos;t be used for suggestions.</p>
            <div className="space-y-2">
              {twin.map((t) => (
                <Card key={t.id} className="flex-row items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-sm font-medium", !t.active && "text-muted-foreground")}>{t.text}</p>
                    <p className="text-xs text-muted-foreground">{t.evidence}</p>
                  </div>
                  <Switch checked={t.active} onCheckedChange={(v) => setTwinPreference(t.id, v)} aria-label={`Use: ${t.text}`} />
                </Card>
              ))}
            </div>
          </PremiumGate>
        </Section>

        <Section title="Record confidence" badge={<FeatureBadge feature="confidence" />}>
          <div id="confidence" className="scroll-mt-20 space-y-3">
            <Card className="gap-3">
              <div className="grid grid-cols-7 gap-1.5">
                {conf.map((c) => (
                  <div key={c.date} className="flex flex-col items-center gap-1">
                    <span className="text-[11px] text-muted-foreground">{formatDay(c.date, { weekday: "narrow" })}</span>
                    <span className={cn("grid h-8 w-full place-items-center rounded-md text-[10px] font-semibold", CONF_STYLE[c.level])} title={c.level}>
                      {c.level === "Not enough data" ? "–" : c.level === "Complete" ? "✓" : c.level === "Mostly complete" ? "~" : "½"}
                    </span>
                  </div>
                ))}
              </div>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>✓ Complete — all planned meals recorded</li>
                <li>~ Mostly complete — one meal missing or uncertain</li>
                <li>½ Partially complete — several meals missing</li>
                <li>– Not enough data</li>
              </ul>
            </Card>
            {conf.length > 0 && (
              <Card className="gap-1 text-sm">
                <p className="font-medium">Today</p>
                <p>
                  {conf[6].level}: <span className="tabular">{conf[6].logged}</span> meals confirmed
                  {conf[6].fromPhoto ? `, ${conf[6].fromPhoto} from photos` : ""}
                  {conf[6].missing ? `, ${conf[6].missing} planned meals not yet logged` : ""}.
                </p>
              </Card>
            )}
            <p className="flex gap-2 text-xs text-muted-foreground">
              <Info className="size-4 shrink-0" />
              <span>
                Record confidence shows how complete and certain your food records are, so you know how much to rely on totals and insights. It is not a health score.{" "}
                <Link href="/log" className="font-medium text-forest underline underline-offset-2">
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
