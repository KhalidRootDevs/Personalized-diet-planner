"use client"

// Configurable reminders (§26, Phase 1). Delivery channel on web is an open decision (§43.7);
// learning reminder timing is Phase 2 (§42.17) and always needs approval.
import { useState } from "react"
import { Baby, Bell, CalendarCheck, ChefHat, ClipboardList, Droplets, Mail, Moon, NotebookPen, Scale, ShoppingBasket, Sparkles, Sprout, UtensilsCrossed } from "lucide-react"
import { toast } from "sonner"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface, type IconTone } from "@/components/app/page"
import { Button } from "@/components/ui/button"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { Chip, ChoiceCard, PillGroup } from "@/components/app/controls"
import { MEAL_LABEL } from "@/lib/planning"
import { formatTime, todayISO } from "@/lib/date"
import { DEFAULT_QUIET, LEAD_OPTIONS, REMINDER_MEAL_TYPES, mealReminderOn, mealReminderTime, reminderSetting, timingSuggestions, type TimingSuggestion } from "@/lib/reminders"
import type { MealType } from "@/lib/types"

const REMINDERS: { key: string; tone: IconTone; icon: typeof Bell; title: string; text: string; time?: boolean; child?: boolean }[] = [
  { key: "meals", tone: "lime", icon: UtensilsCrossed, title: "Meal times", text: "A gentle nudge before each planned meal" },
  { key: "prep", tone: "terracotta", icon: ChefHat, title: "Prep ahead", text: "Soak, marinate or defrost the evening before", time: true },
  { key: "logging", tone: "sage", icon: NotebookPen, title: "Log your meals", text: "Only if something wasn't logged today", time: true },
  { key: "water", tone: "sky", icon: Droplets, title: "Water", text: "Hydration reminders during the day" },
  { key: "shopping", tone: "amber", icon: ShoppingBasket, title: "Shopping", text: "Before your usual shopping day" },
  { key: "plan_review", tone: "lime", icon: ClipboardList, title: "Plan review", text: "When your plan is about to end", time: true },
  { key: "progress_entry", tone: "sky", icon: Scale, title: "Progress check-in", text: "A weekly note on how things went — weight optional" },
  { key: "weekly_review", tone: "sage", icon: CalendarCheck, title: "Weekly review", text: "Look back at the week and plan the next" },
  { key: "child_review", tone: "lime", icon: Sprout, title: "Age-related review", text: "When your child reaches a new feeding stage", time: true, child: true },
  { key: "baby_feeding", tone: "terracotta", icon: Baby, title: "Baby feeding", text: "Follows your routine — never a rigid schedule", child: true },
]

export default function NotificationsSettingsPage() {
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const hasChild = useApp((s) => s.profiles.some((p) => p.relation === "child"))
  const plan = useActivePlan()
  const planTypes = REMINDER_MEAL_TYPES.filter((t) => plan?.meals.some((m) => m.mealType === t))
  const quiet = settings.quietHours ?? DEFAULT_QUIET
  const lead = settings.mealLeadMinutes ?? 15

  const setReminder = (key: string, patch: Partial<{ enabled: boolean; time: string }>) => updateSettings({ reminders: { ...settings.reminders, [key]: { ...reminderSetting(settings, key), ...patch } } })

  return (
    <>
      <PageHeader back="/profile" title="Reminders" />
      <PageBody>
        <Section title="How we reach you">
          <div role="radiogroup" className="space-y-2.5">
            <ChoiceCard selected={settings.reminderChannel === "push"} onSelect={() => updateSettings({ reminderChannel: "push" })} icon={<Bell className="size-5" />} title="App notifications" description="Works when NutriPlan is installed on your phone" />
            <ChoiceCard selected={settings.reminderChannel === "email"} onSelect={() => updateSettings({ reminderChannel: "email" })} icon={<Mail className="size-5" />} title="Email" description="A daily digest instead of individual alerts" />
          </div>
          <CautionNote title="Open decision (§43.7)">The Phase 1 reminder channel on web hasn&apos;t been decided. In this prototype every reminder lands in the in-app inbox (bell on Home).</CautionNote>
        </Section>

        <Section title="Reminders" badge={<PhaseBadge phase={1} />}>
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
            {REMINDERS.filter((r) => !r.child || hasChild).map(({ key, tone, icon: Icon, title, text, time }) => {
              const r = reminderSetting(settings, key)
              return (
                <div key={key} className="px-4 py-3">
                  <label className="flex min-h-10 cursor-pointer items-center gap-3">
                    <IconTile tone={tone}>
                      <Icon aria-hidden />
                    </IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="text-body block font-medium">{title}</span>
                      <span className="text-caption block text-muted-foreground">{text}</span>
                    </span>
                    <Switch checked={r.enabled} onCheckedChange={(v) => setReminder(key, { enabled: v })} aria-label={title} />
                  </label>
                  {r.enabled && key === "meals" && (
                    <div className="mt-3 ml-[52px] space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-caption font-medium text-charcoal">How early</p>
                        <PillGroup label="Reminder lead time" value={String(lead)} onChange={(v) => updateSettings({ mealLeadMinutes: Number(v) })} options={LEAD_OPTIONS.map((m) => ({ value: String(m), label: m === 60 ? "1 hour" : `${m} min` }))} />
                      </div>
                      {planTypes.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-caption font-medium text-charcoal">Which meals</p>
                          <div className="flex flex-wrap gap-2">
                            {planTypes.map((t) => {
                              const on = mealReminderOn(settings, t)
                              const sample = plan?.meals.find((m) => m.mealType === t)
                              return (
                                <Chip key={t} selected={on} onClick={() => updateSettings({ mealReminderToggles: { ...settings.mealReminderToggles, [t]: !on } })}>
                                  {MEAL_LABEL[t]}
                                  {on && sample && <span className="tabular font-normal">· {formatTime(mealReminderTime(settings, sample))}</span>}
                                </Chip>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {r.enabled && key !== "meals" && (
                    <div className="text-callout mt-2.5 ml-[52px] flex items-center gap-2 text-muted-foreground">
                      {time && /^\d{2}:\d{2}$/.test(r.time) ? (
                        <Input type="time" value={r.time} onChange={(e) => setReminder(key, { time: e.target.value })} className="h-10 w-[9.5rem]" aria-label={`${title} time`} />
                      ) : (
                        <span className="tabular inline-flex h-7 items-center rounded-full bg-muted px-3 text-xs font-medium text-charcoal">{r.time}</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <InfoNote>Reminder text never names a health condition. While a plan is paused, meal, prep and shopping reminders stop.</InfoNote>
        </Section>

        <Section title="Quiet hours">
          <ListGroup>
            <ListRow icon={<Moon />} iconTone="sky" title="Hold reminders overnight" description="They arrive when quiet hours end" trailing={<Switch checked={quiet.enabled} onCheckedChange={(v) => updateSettings({ quietHours: { ...quiet, enabled: v } })} aria-label="Quiet hours" />} />
            {quiet.enabled && (
              <div className="grid grid-cols-2 gap-3 px-4 py-3">
                <label className="space-y-1.5">
                  <span className="text-caption font-medium">From</span>
                  <Input type="time" value={quiet.start} onChange={(e) => e.target.value && updateSettings({ quietHours: { ...quiet, start: e.target.value } })} className="h-10" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-caption font-medium">Until</span>
                  <Input type="time" value={quiet.end} onChange={(e) => e.target.value && updateSettings({ quietHours: { ...quiet, end: e.target.value } })} className="h-10" />
                </label>
              </div>
            )}
          </ListGroup>
        </Section>

        <Section title="Learning reminders" badge={<PhaseBadge phase={2} />} description="Suggests better reminder times from your routine. You approve every change.">
          <PremiumGate feature="smart_reminders" variant="row">
            <LearningSuggestions />
          </PremiumGate>
        </Section>
      </PageBody>
    </>
  )
}

/** §42.17: suggest reminder timing from when meals are actually logged. Never applied silently. */
function LearningSuggestions() {
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const journal = useApp((s) => s.journal)
  const reschedule = useApp((s) => s.rescheduleMeal)
  const self = useSelfProfile()
  const plan = useActivePlan()
  const [kept, setKept] = useState<string[]>([])
  const suggestions = self && plan ? timingSuggestions(journal, plan.meals, settings, self.id).filter((s) => !kept.includes(`${s.mealType}:${s.suggested}`)) : []
  const overrides = Object.entries(settings.mealReminderTimes ?? {}) as [MealType, string][]

  const apply = (s: TimingSuggestion) => {
    const prev = settings.mealReminderTimes
    updateSettings({ mealReminderTimes: { ...settings.mealReminderTimes, [s.mealType]: s.suggested } })
    toast.success(`${MEAL_LABEL[s.mealType]} reminder moved to ${formatTime(s.suggested)}`, { action: { label: "Undo", onClick: () => updateSettings({ mealReminderTimes: prev }) } })
  }
  const moveMeals = (s: TimingSuggestion) => {
    const future = (plan?.meals ?? []).filter((m) => m.mealType === s.mealType && m.date >= todayISO() && !m.outcome && m.time === s.planned)
    const prev = future.map((m) => ({ id: m.id, date: m.date, time: m.time }))
    future.forEach((m) => reschedule(m.id, m.date, s.typical))
    toast.success(`${future.length} planned ${MEAL_LABEL[s.mealType].toLowerCase()}s moved to ${formatTime(s.typical)}`, { action: { label: "Undo", onClick: () => prev.forEach((p) => reschedule(p.id, p.date, p.time)) } })
  }

  return (
    <div className="space-y-3">
      {suggestions.length === 0 && <p className="text-callout rounded-2xl bg-card px-4 py-3 text-muted-foreground shadow-card">No timing changes to suggest. We look for a steady pattern over at least 5 logged meals first.</p>}
      {suggestions.map((s) => (
        <Surface key={s.mealType} tone="sage">
          <p className="text-overline flex items-center gap-1.5 text-forest">
            <Sparkles className="size-3.5" aria-hidden /> Suggested change
          </p>
          <p className="text-body mt-2">
            You usually log {MEAL_LABEL[s.mealType].toLowerCase()} around <span className="tabular font-semibold">{formatTime(s.typical)}</span> (planned {formatTime(s.planned)}, {s.samples} meals). Move your {MEAL_LABEL[s.mealType].toLowerCase()} reminder from {formatTime(s.current)} to {formatTime(s.suggested)}?
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline" onClick={() => setKept([...kept, `${s.mealType}:${s.suggested}`])}>
              Keep {formatTime(s.current)}
            </Button>
            <Button size="sm" onClick={() => apply(s)}>
              Use {formatTime(s.suggested)}
            </Button>
          </div>
          <Button size="sm" variant="ghost" className="mt-2 w-full" onClick={() => moveMeals(s)}>
            Also move planned {MEAL_LABEL[s.mealType].toLowerCase()}s to {formatTime(s.typical)}
          </Button>
          <p className="text-caption mt-2 text-muted-foreground">Timing changes are suggestions. Nothing changes without your approval.</p>
        </Surface>
      ))}
      {overrides.length > 0 && (
        <ListGroup label="Times you approved">
          {overrides.map(([t, time]) => (
            <ListRow
              key={t}
              title={`${MEAL_LABEL[t]} reminder`}
              description={`At ${formatTime(time)} instead of ${settings.mealLeadMinutes ?? 15} min before the meal`}
              trailing={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const next = { ...settings.mealReminderTimes }
                    delete next[t]
                    updateSettings({ mealReminderTimes: next })
                  }}
                >
                  Reset
                </Button>
              }
            />
          ))}
        </ListGroup>
      )}
    </div>
  )
}
