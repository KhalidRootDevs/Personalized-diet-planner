"use client"

import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { CalendarCheck, ShoppingBasket, Sparkles } from "lucide-react"
import { PageBody, PageHeader, Section } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
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
    <div className="space-y-6">
      <div className="rounded-2xl bg-sage p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-forest">
          <Sparkles className="size-4" /> Next week is ready to review
        </p>
        <p className="mt-1 font-serif text-2xl">Week of {formatDay(nextMonday, { day: "numeric", month: "long" })}</p>
        <ul className="mt-3 space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <CalendarCheck className="size-4 text-forest" /> {draft.meals.length} meals across 7 days
          </li>
          <li className="flex items-center gap-2">
            <ShoppingBasket className="size-4 text-forest" /> Shopping about <span className="tabular">{fmt.bdt(cost)}</span>
            {profile.budgetPerWeekBdt ? ` (budget ${fmt.bdt(profile.budgetPerWeekBdt)})` : ""}
          </li>
        </ul>
      </div>

      {a && a.resolved > 0 && (
        <InfoNote title="What we learned this week">
          You recorded {a.resolved} meals; {a.asPlanned} were eaten as planned. We kept recipes you ate as planned and favoured quicker options where meals were changed.
        </InfoNote>
      )}

      <Section title="Preferences">
        <div className="space-y-3 rounded-2xl border bg-card p-4">
          {(
            [
              ["keepFavorites", "Repeat meals I enjoyed"],
              ["matchBudget", "Stay within my weekly budget"],
              ["usePantry", "Use what's in my pantry first"],
            ] as const
          ).map(([k, label]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <Label htmlFor={k} className="font-normal">
                {label}
              </Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />
            </div>
          ))}
        </div>
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
      <p className="text-center text-xs text-muted-foreground">Autopilot never activates a plan without your approval, and never makes a week stricter because of missed targets.</p>
    </div>
  )
}
