"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Sparkles } from "lucide-react"
import { ListGroup, ListRow, PageBody, PageHeader, Section, StatTile } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { generatePlan, buildShoppingList } from "@/lib/planning"
import { adherence, fmt } from "@/lib/nutrition"
import { addDays, formatDay, startOfWeek, todayISO } from "@/lib/date"

/** Weekly Nutrition Autopilot (§42.14): a prepared next week the user reviews and approves. */
export default function AutopilotPage() {
  return (
    <>
      <PageHeader title="Weekly Autopilot" back="/plan" action={<FeatureBadge feature="autopilot" />} />
      <PageBody>
        <PremiumGate feature="autopilot">
          <AutopilotContent />
        </PremiumGate>
      </PageBody>
    </>
  )
}

function AutopilotContent() {
  const router = useRouter()
  const profile = useSelfProfile()
  const current = useActivePlan()
  const pantry = useApp((s) => s.pantry)
  const addPlan = useApp((s) => s.addPlan)
  const [settings, setSettings] = useState({ keepFavorites: true, matchBudget: true, usePantry: true })
  const nextMonday = addDays(startOfWeek(todayISO()), 7)

  const draft = useMemo(
    () =>
      profile
        ? generatePlan(profile, {
            durationDays: 7,
            startDate: nextMonday,
            mealsPerDay: 4,
            preset: settings.usePantry ? "pantry" : settings.matchBudget ? "lowest_cost" : "balanced",
            maxPrepMinutes: profile.maxPrepMinutes ?? 30,
            times: {},
          })
        : null,
    [profile, nextMonday, settings.usePantry, settings.matchBudget],
  )
  if (!profile || !draft) return null
  const shop = buildShoppingList(draft.meals, 1, settings.usePantry ? pantry : [])
  const cost = shop.reduce((s, i) => s + i.costBdt, 0)
  const a = current ? adherence(current.meals) : null

  return (
    <div className="space-y-7">
      <div className="rounded-2xl bg-sage/70 p-5">
        <p className="text-overline flex items-center gap-1.5 text-forest">
          <Sparkles className="size-3.5" /> Ready to review
        </p>
        <p className="text-display mt-2">Week of {formatDay(nextMonday, { day: "numeric", month: "long" })}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatTile className="bg-card" label="Meals planned" value={draft.meals.length} hint="across 7 days" />
          <StatTile className="bg-card" label="Shopping" value={fmt.bdt(cost)} hint={profile.budgetPerWeekBdt ? `budget ${fmt.bdt(profile.budgetPerWeekBdt)}` : "estimate"} />
        </div>
      </div>

      {a && a.resolved > 0 && (
        <InfoNote title="What we learned this week">
          You recorded {a.resolved} meals; {a.asPlanned} were eaten as planned. We kept recipes you ate as planned and favored quicker options where meals were changed.
        </InfoNote>
      )}

      <Section title="Preferences">
        <ListGroup>
          {(
            [
              ["keepFavorites", "Repeat meals I enjoyed", "Keeps recipes you ate as planned"],
              ["matchBudget", "Stay within my weekly budget", "Prefers lower-cost safe options"],
              ["usePantry", "Use my pantry first", "Plans around what you already have"],
            ] as const
          ).map(([k, label, hint]) => (
            <ListRow
              key={k}
              title={<label htmlFor={k}>{label}</label>}
              description={hint}
              trailing={<Switch id={k} checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />}
            />
          ))}
        </ListGroup>
      </Section>

      <div className="space-y-2">
        <Button
          size="lg"
          className="w-full"
          disabled={!draft.validation.safety}
          onClick={() => {
            addPlan({ ...draft, title: "Autopilot week" }, false)
            toast("Saved to My plans — activate it when this week ends")
            router.push("/plan/plans")
          }}
        >
          Approve next week
        </Button>
        <Button variant="outline" className="w-full" onClick={() => router.push("/plan/generate")}>
          Customize instead
        </Button>
      </div>
      <p className="text-caption text-center text-muted-foreground">Autopilot never activates a plan without your approval, and never makes a week stricter because of missed targets.</p>
    </div>
  )
}
