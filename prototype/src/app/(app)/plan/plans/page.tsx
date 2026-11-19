"use client"

import { ClipboardCheck } from "lucide-react"
import { usePendingAdjustments } from "@/lib/area-d-store"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Archive, BadgeCheck, Clock, Copy, Eye, Lightbulb, Pause, Play, Plus, RefreshCw, Send, ShieldAlert } from "lucide-react"
import { IconTile, KeyValue, ListGroup, ListLink, ListRow, PageBody, PageHeader, Pill, Section, Surface, type PillTone } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ValidationList } from "@/components/plan/validation-list"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet"
import { useApp, useSelfProfile } from "@/lib/store"
import { adherence, findRecipe } from "@/lib/nutrition"
import { addDays, formatDay, formatTime, startOfWeek, todayISO, uid } from "@/lib/date"
import { MEAL_LABEL, generatePlan, validatePlan, type PlanOptions } from "@/lib/planning"
import { cn } from "@/lib/utils"
import type { MealPlan, Profile } from "@/lib/types"

function planStatus(p: MealPlan): { label: string; tone: PillTone } {
  if (p.status === "active") return { label: "Active", tone: "forest" }
  if (p.status === "paused") return { label: "Paused", tone: "neutral" }
  if (p.status === "archived") return { label: "Past", tone: "neutral" }
  if (p.scheduledStart) return { label: `Starts ${formatDay(p.startDate, { day: "numeric", month: "short" })}`, tone: "sage" }
  if (p.review?.status === "pending") return { label: "In review", tone: "caution" }
  return { label: "Draft", tone: "outline" }
}

const canActivate = (p: MealPlan) => p.validation.safety && (!p.validation.requiresReview || p.review?.status === "approved")

function defaultSettings(p: MealPlan, self: Profile): PlanOptions {
  return p.settings ?? { durationDays: p.durationDays, startDate: p.startDate, mealsPerDay: 4, preset: "balanced", maxPrepMinutes: self.maxPrepMinutes ?? 30, times: {} }
}

/** Plan history and management (§10.4, §19.3) plus adaptive suggestions the user approves (§42.13). */
export default function PlansPage() {
  const plans = useApp((s) => s.plans)
  const activatePlan = useApp((s) => s.activatePlan)
  const setPlanStatus = useApp((s) => s.setPlanStatus)
  const updatePlan = useApp((s) => s.updatePlan)
  const addPlan = useApp((s) => s.addPlan)
  const pantry = useApp((s) => s.pantry)
  const twin = useApp((s) => s.twinPreferences)
  const self = useSelfProfile()
  const pendingAdjustments = usePendingAdjustments()
  const [viewing, setViewing] = useState<string | null>(null)
  const sorted = [...plans].sort((a, b) => order(a) - order(b) || b.createdAt.localeCompare(a.createdAt))
  const ctx = { pantry, twin: twin.filter((t) => t.active).map((t) => t.text) }
  const tomorrow = addDays(todayISO(), 1)

  const duplicate = (p: MealPlan) => {
    if (!self) return
    const shift = Math.round((new Date(`${tomorrow}T00:00:00`).getTime() - new Date(`${p.startDate}T00:00:00`).getTime()) / 86400000)
    const copy: MealPlan = {
      ...p,
      id: uid("plan"),
      title: `Copy of ${p.title}`,
      status: "draft",
      startDate: tomorrow,
      createdAt: new Date().toISOString(),
      scheduledStart: false,
      review: undefined,
      settings: p.settings ? { ...p.settings, startDate: tomorrow } : undefined,
      meals: p.meals.map((m) => ({ ...m, id: uid("meal"), date: addDays(m.date, shift), outcome: null, scheduleStatus: "upcoming", linkedJournalEntryId: undefined, prepLater: false })),
    }
    copy.validation = validatePlan(copy, self)
    addPlan(copy, false)
    toast("Plan duplicated as a draft", { description: `Starts ${formatDay(tomorrow)}. It's checked again against your current profile.` })
  }

  const revise = (p: MealPlan) => {
    if (!self) return
    const favorites = Array.from(new Set(p.meals.filter((m) => m.outcome === "eaten_as_planned").map((m) => m.recipeId)))
    const avoid = Array.from(new Set(p.meals.filter((m) => m.outcome === "skipped" || m.outcome === "replaced").map((m) => m.recipeId)))
    const next = generatePlan(self, { ...defaultSettings(p, self), startDate: tomorrow, favorites, avoid }, ctx)
    next.title = `Revised: ${p.title.replace(/^Revised: /, "")}`
    addPlan(next, false)
    toast("Revised draft created", { description: "Uses your current profile, favors meals you ate as planned and moves away from ones you skipped." })
  }

  return (
    <>
      <PageHeader
        title="My plans"
        back="/plan"
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/plan/generate">
              <Plus className="size-4" /> New plan
            </Link>
          </Button>
        }
      />
      <PageBody>
        {pendingAdjustments.length > 0 && (
          <Section title="Approved for your next plan" description="Changes you approved in the Weekly Review. They apply when you generate or revise a plan.">
            <ListGroup>
              {pendingAdjustments.map((a) => (
                <ListRow key={a.id} icon={<ClipboardCheck />} iconTone="lime" title={a.title} description={a.detail} />
              ))}
            </ListGroup>
          </Section>
        )}
        <ListLink href="/plan/settings" icon={<Clock />} iconTone="sky" title="Meal times & structure" description="Meals per day and when you eat" />
        <Section title="Suggested changes for next week" badge={<FeatureBadge feature="adaptive" />}>
          <PremiumGate feature="adaptive" compact>
            <AdaptiveSuggestions onView={setViewing} />
          </PremiumGate>
        </Section>

        <Section title="All plans">
          <ul className="space-y-3">
            {sorted.map((p) => {
              const a = adherence(p.meals)
              const st = planStatus(p)
              return (
                <li key={p.id}>
                  <Surface className={cn(p.status === "active" && "ring-2 ring-lime")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-body font-semibold">{p.title}</p>
                        <p className="text-caption text-muted-foreground">
                          {p.durationDays} days · {formatDay(p.startDate, { day: "numeric", month: "short" })} – {formatDay(addDays(p.startDate, p.durationDays - 1), { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          Goal: {p.goal.replace(/_/g, " ")} · created {formatDay(p.createdAt.slice(0, 10), { day: "numeric", month: "short" })}
                          {p.nextReviewDate && ` · review by ${formatDay(p.nextReviewDate, { day: "numeric", month: "short" })}`}
                        </p>
                      </div>
                      <Pill tone={st.tone}>{st.label}</Pill>
                    </div>
                    {p.framework && <p className="text-caption mt-2 text-muted-foreground">{p.framework.months}-month framework · week 1 of {p.framework.weeks.length}</p>}
                    {a.resolved > 0 && (
                      <p className="tabular text-callout mt-3 text-muted-foreground">
                        {a.completed} of {a.resolved} recorded meals eaten · {a.asPlanned} as planned, {a.modified + a.replaced} changed
                      </p>
                    )}
                    {p.review?.status === "approved" && (
                      <p className="text-callout mt-3 flex items-center gap-1.5 font-medium text-forest">
                        <BadgeCheck className="size-4" /> Reviewed by {p.review.reviewer}
                      </p>
                    )}
                    {!p.validation.safety && (
                      <p className="text-callout mt-3 flex items-center gap-1.5 font-medium text-safety">
                        <ShieldAlert className="size-4" /> Failed safety validation — can&apos;t be activated
                      </p>
                    )}
                    {p.validation.safety && p.validation.requiresReview && p.review?.status !== "approved" && (
                      <p className="text-callout mt-3 text-caution">
                        {p.review?.status === "pending" ? "Waiting for a professional's review before it can be activated." : p.review?.status === "changes_requested" ? `Changes requested: ${p.review.note ?? "see notes"}` : "Needs professional review before it can be activated."}
                      </p>
                    )}
                    {p.status === "paused" && <p className="text-callout mt-3 text-muted-foreground">Paused — reminders and Home suggestions are off until you resume.</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => setViewing(p.id)}>
                        <Eye className="size-4" /> View
                      </Button>
                      {(p.status === "draft" || p.status === "archived") && !p.scheduledStart && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!canActivate(p)}
                          onClick={() => {
                            activatePlan(p.id)
                            toast("Plan activated")
                          }}
                        >
                          <Play className="size-4" /> Activate
                        </Button>
                      )}
                      {p.status === "draft" && p.validation.requiresReview && p.validation.safety && (!p.review || p.review.status === "changes_requested") && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            updatePlan(p.id, { review: { status: "pending", submittedAt: new Date().toISOString() } })
                            toast("Sent for professional review")
                          }}
                        >
                          <Send className="size-4" /> Send for review
                        </Button>
                      )}
                      {p.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPlanStatus(p.id, "paused")
                            toast("Plan paused — reminders stop until you resume")
                          }}
                        >
                          <Pause className="size-4" /> Pause
                        </Button>
                      )}
                      {p.status === "paused" && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setPlanStatus(p.id, "active")
                            toast("Plan resumed")
                          }}
                        >
                          <Play className="size-4" /> Resume
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => duplicate(p)}>
                        <Copy className="size-4" /> Duplicate
                      </Button>
                      {p.status !== "archived" && !p.framework && (
                        <Button size="sm" variant="ghost" onClick={() => revise(p)}>
                          <RefreshCw className="size-4" /> Generate revised plan
                        </Button>
                      )}
                      {p.status !== "archived" && p.status !== "active" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            updatePlan(p.id, { status: "archived", scheduledStart: false })
                            toast("Plan archived")
                          }}
                        >
                          <Archive className="size-4" /> Archive
                        </Button>
                      )}
                    </div>
                  </Surface>
                </li>
              )
            })}
          </ul>
        </Section>
      </PageBody>
      <PlanSheet planId={viewing} onClose={() => setViewing(null)} />
    </>
  )
}

function order(p: MealPlan) {
  return { active: 0, paused: 1, draft: 2, archived: 3 }[p.status]
}

/** Read-only view of any plan: meals, inputs used, validation and explanation (§19.3). */
function PlanSheet({ planId, onClose }: { planId: string | null; onClose: () => void }) {
  const plan = useApp((s) => s.plans.find((p) => p.id === planId))
  const days = plan ? Array.from(new Set(plan.meals.map((m) => m.date))).sort() : []
  return (
    <Sheet open={!!plan} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetTitle className="px-5 pr-14">{plan?.title ?? "Plan"}</SheetTitle>
        <SheetDescription className="sr-only">Meals, inputs and validation for this plan.</SheetDescription>
        {plan && (
          <div className="space-y-6 overflow-y-auto px-5 pb-8">
            {plan.explanation && (
              <Section title="Why these meals">
                <ul className="text-callout list-disc space-y-1 pl-4">
                  {plan.explanation.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              </Section>
            )}
            {plan.inputs && (
              <Section title="Profile inputs used">
                <Surface padding="sm" className="divide-y divide-border/70 px-4">
                  {plan.inputs.map((i) => (
                    <KeyValue key={i.label} label={i.label} value={<span className="capitalize">{i.value}</span>} />
                  ))}
                </Surface>
              </Section>
            )}
            {plan.validation.checks && (
              <Section title="Validation">
                <ValidationList checks={plan.validation.checks} />
              </Section>
            )}
            <Section title="Meals">
              <div className="space-y-4">
                {days.map((d) => (
                  <ListGroup key={d} label={formatDay(d, { weekday: "long", day: "numeric", month: "short" })}>
                    {plan.meals
                      .filter((m) => m.date === d)
                      .sort((a, b) => a.time.localeCompare(b.time))
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
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

/** Journal-driven suggestions (§42.13). "Apply" rebuilds next week's draft; nothing changes until approved. */
function AdaptiveSuggestions({ onView }: { onView: (id: string) => void }) {
  const plan = useApp((s) => s.plans.find((p) => p.id === s.activePlanId))
  const plans = useApp((s) => s.plans)
  const pantry = useApp((s) => s.pantry)
  const twin = useApp((s) => s.twinPreferences)
  const addPlan = useApp((s) => s.addPlan)
  const updatePlan = useApp((s) => s.updatePlan)
  const profile = useSelfProfile()
  const [dismissed, setDismissed] = useState<string[]>([])
  if (!plan || !profile) return <p className="text-callout text-muted-foreground">Suggestions appear once you have an active plan.</p>

  const today = todayISO()
  const nextMonday = addDays(startOfWeek(today), 7)
  const past = plan.meals.filter((m) => m.date < today)
  const changedDinners = past.filter((m) => m.mealType === "dinner" && (m.outcome === "replaced" || m.outcome === "eaten_modified" || m.outcome === "skipped")).length
  const enjoyedBreakfasts = past.filter((m) => m.mealType === "breakfast" && m.outcome === "eaten_as_planned")
  const skippedSnacks = past.filter((m) => m.mealType.includes("snack") && m.outcome === "skipped").length
  const nextDraft = plans.find((p) => p.status === "draft" && p.startDate === nextMonday && p.adaptations)

  const suggestions = [
    changedDinners > 0 && { id: "quick_dinner", title: "Quicker dinners on workdays", why: `${changedDinners} dinner${changedDinners > 1 ? "s were" : " was"} changed or skipped recently. Dinners up to 20 minutes may fit your evenings better.` },
    enjoyedBreakfasts.length >= 2 && { id: "repeat_breakfast", title: "Keep breakfasts you enjoy", why: `You ate ${enjoyedBreakfasts.length} breakfasts as planned. We can repeat those instead of rotating.` },
    skippedSnacks >= 2 && { id: "fewer_snacks", title: "Drop the afternoon snack", why: `${skippedSnacks} snacks were skipped. With 3 meals, portions adjust so your day stays nourishing.` },
  ].filter((s): s is { id: string; title: string; why: string } => !!s && !dismissed.includes(s.id) && !nextDraft?.adaptations?.includes(s.id))

  const apply = (id: string) => {
    const adaptations = Array.from(new Set([...(nextDraft?.adaptations ?? []), id]))
    const base: PlanOptions = plan.settings ?? { durationDays: 7, startDate: nextMonday, mealsPerDay: 4, preset: "balanced", maxPrepMinutes: profile.maxPrepMinutes ?? 30, times: {} }
    const opts: PlanOptions = {
      ...base,
      durationDays: 7,
      frameworkMonths: undefined,
      startDate: nextMonday,
      slotMaxMinutes: adaptations.includes("quick_dinner") ? { dinner: 20 } : undefined,
      favorites: adaptations.includes("repeat_breakfast") ? Array.from(new Set(enjoyedBreakfasts.map((m) => m.recipeId))) : undefined,
      mealsPerDay: adaptations.includes("fewer_snacks") ? 3 : base.mealsPerDay,
    }
    const fresh = generatePlan(profile, opts, { pantry, twin: twin.filter((t) => t.active).map((t) => t.text) })
    const draft: MealPlan = { ...fresh, title: "Next week · adapted", adaptations }
    if (nextDraft) updatePlan(nextDraft.id, { ...draft, id: nextDraft.id })
    else addPlan(draft, false)
    const targetId = nextDraft?.id ?? draft.id
    toast(nextDraft ? "Next week's draft updated" : "Next week's draft created", {
      description: draft.validation.safety ? "Review it in My plans before activating." : "Some meals couldn't be filled with these limits — open it to see why.",
      action: { label: "View", onClick: () => onView(targetId) },
    })
    setDismissed([...dismissed, id])
  }

  return (
    <div className="space-y-3">
      {nextDraft && (
        <InfoNote title={`Next week's draft · ${nextDraft.adaptations?.length ?? 0} change${nextDraft.adaptations?.length === 1 ? "" : "s"} applied`}>
          Starts {formatDay(nextMonday)}.{" "}
          <button className="font-semibold text-forest underline underline-offset-2" onClick={() => onView(nextDraft.id)}>
            View it
          </button>
        </InfoNote>
      )}
      {suggestions.length === 0 && <p className="text-callout text-muted-foreground">No suggestions right now. They appear once your records show a pattern.</p>}
      {suggestions.map((s) => (
        <Surface key={s.id}>
          <div className="flex gap-3">
            <IconTile>
              <Lightbulb />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-body font-semibold">{s.title}</p>
              <p className="text-callout mt-0.5 text-muted-foreground">{s.why}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => apply(s.id)}>
                  Apply to next week
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed([...dismissed, s.id])}>
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </Surface>
      ))}
      {profile.conditions.length > 0 && <CautionNote title="Health conditions">Changes to targets for a health condition go through a professional, not automatic suggestions.</CautionNote>}
      <InfoNote>Suggestions never make your plan stricter because a target was missed. Nothing changes until you approve it.</InfoNote>
    </div>
  )
}
