"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Pencil, Sparkles } from "lucide-react"
import { ListGroup, ListRow, PageBody, PageHeader, Section, StatTile, Surface } from "@/components/app/page"
import { Chip } from "@/components/app/controls"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ValidationList } from "@/components/plan/validation-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { MEAL_LABEL, buildShoppingList, defaultMealsPerDay, generatePlan, type PlanOptions } from "@/lib/planning"
import { adherence, findRecipe, fmt } from "@/lib/nutrition"
import { addDays, formatDay, formatTime, startOfWeek, todayISO } from "@/lib/date"
import type { PlanPreset } from "@/lib/types"

/** Weekly Nutrition Autopilot (§42.14): review last week → ask what changed → preview → approve → scheduled. */
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

const CHANGES = [
  { id: "busier", label: "Busier schedule" },
  { id: "budget", label: "Tighter budget" },
  { id: "pantry", label: "Food at home to use up" },
  { id: "none", label: "Nothing changed" },
] as const
type ChangeId = (typeof CHANGES)[number]["id"]

function AutopilotContent() {
  const router = useRouter()
  const profile = useSelfProfile()
  const current = useActivePlan()
  const pantry = useApp((s) => s.pantry)
  const twin = useApp((s) => s.twinPreferences)
  const updateTwin = useApp((s) => s.updateTwinPreference)
  const addPlan = useApp((s) => s.addPlan)
  const startScheduled = useApp((s) => s.startScheduledPlans)
  const pushNotification = useApp((s) => s.pushNotification)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [changes, setChanges] = useState<ChangeId[]>([])
  const [settings, setSettings] = useState({ keepFavorites: true, matchBudget: true, usePantry: false })
  const [editing, setEditing] = useState<string | null>(null)
  const nextMonday = addDays(startOfWeek(todayISO()), 7)

  const favorites = useMemo(() => Array.from(new Set((current?.meals ?? []).filter((m) => m.outcome === "eaten_as_planned").map((m) => m.recipeId))), [current])
  const preset: PlanPreset = changes.includes("busier") ? "quick" : settings.usePantry || changes.includes("pantry") ? "pantry" : changes.includes("budget") ? "lowest_cost" : "balanced"
  const activeTwin = twin.filter((t) => t.active).map((t) => t.text)

  const draft = useMemo(() => {
    if (!profile || step !== 3) return null
    const opts: PlanOptions = {
      durationDays: 7,
      startDate: nextMonday,
      mealsPerDay: (current?.settings?.mealsPerDay ?? defaultMealsPerDay(profile)) as 3 | 4 | 5,
      preset,
      maxPrepMinutes: profile.maxPrepMinutes ?? 30,
      times: current?.settings?.times ?? {},
      weeklyBudgetBdt: settings.matchBudget || changes.includes("budget") ? profile.budgetPerWeekBdt : undefined,
      favorites: settings.keepFavorites ? favorites : undefined,
    }
    return generatePlan(profile, opts, { pantry, twin: activeTwin })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- regenerate only when inputs change
  }, [profile, step, nextMonday, preset, settings.matchBudget, settings.keepFavorites, changes, favorites, pantry, twin, current])

  if (!profile) return null
  const a = current ? adherence(current.meals) : null

  if (step === 1)
    return (
      <div className="space-y-7">
        <div className="rounded-2xl bg-sage/70 p-5">
          <p className="text-overline flex items-center gap-1.5 text-forest">
            <Sparkles className="size-3.5" /> Step 1 of 3 · Your week
          </p>
          <p className="text-display mt-2">Planning the week of {formatDay(nextMonday, { day: "numeric", month: "long" })}</p>
          {a && a.resolved > 0 ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <StatTile className="bg-card" label="Meals recorded" value={a.resolved} />
              <StatTile className="bg-card" label="Eaten as planned" value={a.asPlanned} hint={`${a.modified + a.replaced} changed · ${a.skipped} skipped`} />
            </div>
          ) : (
            <p className="text-callout mt-2">There aren&apos;t enough records from this week yet, so we&apos;ll lean on your profile.</p>
          )}
        </div>

        <Section title="What we've noticed" badge={<FeatureBadge feature="twin" />} description="Soft preferences from your records. Edit or switch off anything that's wrong — they never override safety rules.">
          <ListGroup>
            {twin.map((t) => (
              <ListRow
                key={t.id}
                title={
                  editing === t.id ? (
                    <Input autoFocus aria-label="Edit preference" value={t.text} onChange={(e) => updateTwin(t.id, { text: e.target.value })} onBlur={() => setEditing(null)} onKeyDown={(e) => e.key === "Enter" && setEditing(null)} />
                  ) : (
                    <span className={t.active ? "" : "text-muted-foreground"}>{t.text}</span>
                  )
                }
                description={t.evidence}
                trailing={
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" aria-label={`Edit: ${t.text}`} onClick={() => setEditing(editing === t.id ? null : t.id)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Switch checked={t.active} onCheckedChange={(v) => updateTwin(t.id, { active: v })} aria-label={`Use: ${t.text}`} />
                  </div>
                }
              />
            ))}
          </ListGroup>
        </Section>
        <Button size="lg" className="w-full" onClick={() => setStep(2)}>
          Continue
        </Button>
      </div>
    )

  if (step === 2)
    return (
      <div className="space-y-7">
        <div>
          <p className="text-overline text-muted-foreground">Step 2 of 3</p>
          <p className="text-display mt-1">Anything changed this week?</p>
        </div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="What changed">
          {CHANGES.map((c) => (
            <Chip
              key={c.id}
              selected={changes.includes(c.id)}
              onClick={() => setChanges(c.id === "none" ? ["none"] : changes.includes(c.id) ? changes.filter((x) => x !== c.id) : [...changes.filter((x) => x !== "none"), c.id])}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        <InfoNote>
          New allergy, health condition, weight or work hours?{" "}
          <Link href="/profile/edit" className="font-semibold text-forest underline underline-offset-2">
            Update your profile
          </Link>{" "}
          first, so the plan is checked against it.
        </InfoNote>

        <Section title="Preferences">
          <ListGroup>
            {(
              [
                ["keepFavorites", "Repeat meals I enjoyed", favorites.length ? `${favorites.length} recipes you ate as planned` : "No meals eaten as planned yet"],
                ["matchBudget", "Stay within my weekly budget", profile.budgetPerWeekBdt ? `Budget ${fmt.bdt(profile.budgetPerWeekBdt)}` : "No budget set in your profile"],
                ["usePantry", "Use my pantry first", `${pantry.length} items in your pantry`],
              ] as const
            ).map(([k, label, hint]) => (
              <ListRow key={k} title={<label htmlFor={k}>{label}</label>} description={hint} trailing={<Switch id={k} checked={settings[k]} onCheckedChange={(v) => setSettings({ ...settings, [k]: v })} />} />
            ))}
          </ListGroup>
        </Section>
        <div className="space-y-2">
          <Button size="lg" className="w-full" onClick={() => setStep(3)}>
            Preview next week
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setStep(1)}>
            Back
          </Button>
        </div>
      </div>
    )

  if (!draft) return null
  const shop = buildShoppingList(draft.meals, 1, settings.usePantry ? pantry : [])
  const cost = shop.reduce((s, i) => s + i.costBdt, 0)
  const days = Array.from(new Set(draft.meals.map((m) => m.date))).sort()
  const blocked = !draft.validation.safety

  const approve = () => {
    if (draft.validation.requiresReview) {
      addPlan({ ...draft, title: "Autopilot week", review: { status: "pending", submittedAt: new Date().toISOString() } }, false)
      toast("Sent for professional review", { description: "It will be scheduled once approved." })
      router.push("/plan/plans")
      return
    }
    addPlan({ ...draft, title: "Autopilot week", scheduledStart: true }, false)
    startScheduled()
    pushNotification({ title: "Next week's plan is scheduled", body: `Your Autopilot week starts ${formatDay(nextMonday)}. Your current plan stays active until then.`, href: "/plan/plans" })
    pushNotification({ title: "Shopping list for next week", body: `About ${fmt.bdt(cost)} of groceries (estimate). Shop before ${formatDay(nextMonday)}.`, href: "/plan/shopping" })
    pushNotification({ title: "Prep reminder", body: `Sunday evening: get a head start on ${formatDay(nextMonday, { weekday: "long" })}'s meals.`, href: "/plan/prep" })
    toast("Next week approved", { description: `Starts ${formatDay(nextMonday)} on your calendar. Reminders scheduled.` })
    router.push("/plan/plans")
  }

  return (
    <div className="space-y-7">
      <div>
        <p className="text-overline text-muted-foreground">Step 3 of 3 · Preview</p>
        <p className="text-display mt-1">Week of {formatDay(nextMonday, { day: "numeric", month: "long" })}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <StatTile label="Meals planned" value={draft.meals.length} hint="across 7 days" />
          <StatTile label="Shopping" value={fmt.bdt(cost)} hint={profile.budgetPerWeekBdt ? `budget ${fmt.bdt(profile.budgetPerWeekBdt)}` : "estimate"} />
        </div>
      </div>

      <Section title="Why these meals">
        <Surface>
          <ul className="text-callout list-disc space-y-1.5 pl-4">
            {(draft.explanation ?? []).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Surface>
      </Section>

      <Section title="Meals">
        <div className="space-y-4">
          {days.map((d) => (
            <ListGroup key={d} label={formatDay(d, { weekday: "long", day: "numeric", month: "short" })}>
              {draft.meals
                .filter((m) => m.date === d)
                .map((m) => {
                  const r = findRecipe(m.recipeId)
                  if (!r) return null
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                      <RecipeThumb recipe={r} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-caption text-muted-foreground">
                          {MEAL_LABEL[m.mealType]} · {formatTime(m.time)}
                          {m.servings !== 1 && ` · ${m.servings} servings`}
                          {favorites.includes(r.id) && settings.keepFavorites && " · you enjoyed this"}
                        </p>
                        <p className="text-body line-clamp-2 font-medium">{r.name}</p>
                      </div>
                    </div>
                  )
                })}
            </ListGroup>
          ))}
        </div>
      </Section>

      <Section title="Validation">
        <ValidationList checks={draft.validation.checks ?? []} />
        {draft.validation.requiresReview && <CautionNote title="Professional review required">This week goes to a professional before it can be scheduled.</CautionNote>}
      </Section>

      <div className="space-y-2">
        <Button size="lg" className="w-full" disabled={blocked} onClick={approve}>
          {draft.validation.requiresReview ? "Send for review" : "Approve and schedule"}
        </Button>
        <Button variant="outline" className="w-full" onClick={() => setStep(2)}>
          Back
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => router.push("/plan/generate")}>
          Customize instead
        </Button>
      </div>
      <p className="text-caption text-center text-muted-foreground">Your current plan stays active until next week starts. Autopilot never activates a plan without your approval, and never makes a week stricter because of missed targets.</p>
    </div>
  )
}
