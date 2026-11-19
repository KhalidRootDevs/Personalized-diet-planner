"use client"

import { useState } from "react"
import { Check, ListChecks, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { addDays, formatDay, startOfWeek, todayISO, uid } from "@/lib/date"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { track } from "@/lib/analytics"
import { adultTargets } from "@/lib/nutrition"
import { foodVariety, habitSuggestions, type InsightInput } from "@/lib/insights"
import { lastNDays } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DataIcon } from "@/components/app/icon"
import { FeatureBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { EmptyState, IconTile, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile, Surface } from "@/components/app/page"
import { Chip } from "@/components/app/controls"

const GENERIC = [
  { title: "Add a vegetable to dinner", description: "Easy way to add fiber and variety.", icon: "Carrot", reason: "A common first habit." },
  { title: "Pack a snack for work", description: "Helps on long workdays.", icon: "Apple", reason: "A common first habit." },
  { title: "Eat lunch away from the desk", description: "A short break can make meals more enjoyable.", icon: "Coffee", reason: "A common first habit." },
]

/** Habit Builder (§42.18). Small habits, no streaks, no penalties for missed days. */
export default function HabitsPage() {
  useAreaDSync()
  const self = useSelfProfile()
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const water = useApp((s) => s.water)
  const feedback = useAreaD((s) => s.mealFeedback)
  const checkIns = useAreaD((s) => s.checkIns)
  const healthOk = useConsent("health_data")
  const habits = useApp((s) => s.habits)
  const toggleHabit = useApp((s) => s.toggleHabit)
  const addHabit = useApp((s) => s.addHabit)
  const removeHabit = useApp((s) => s.removeHabit)
  const [open, setOpen] = useState(false)
  const { allowed } = useFeature("habits")
  const days = lastNDays(7)
  const today = todayISO()
  const input: InsightInput | null = self ? { journal, plan, profile: self, water, feedback, checkIns, days } : null
  const personal = input ? habitSuggestions(input, self && healthOk ? adultTargets(self) : null, habits.map((h) => h.title)) : []
  const suggestions = personal.length ? personal : GENERIC.filter((g) => !habits.some((h) => h.title === g.title))

  const create = (h: { title: string; description: string; icon: string; reason?: string }) => {
    addHabit({ id: uid("h"), title: h.title, description: h.reason ?? h.description, icon: h.icon, days: {} })
    setOpen(false)
    toast.success("Habit added")
  }

  return (
    <>
      <PageHeader
        title="Habits"
        back="/progress"
        action={
          <span className="flex items-center gap-2">
            <FeatureBadge feature="habits" />
            {allowed && habits.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <Plus /> Add
              </Button>
            )}
          </span>
        }
      />
      <PageBody>
        <PremiumGate feature="habits">
          <InfoNote>Focus on one or two small habits at a time. Missing a day is fine — just pick it up again.</InfoNote>

          {habits.length === 0 ? (
            <EmptyState
              icon={<ListChecks />}
              title="No habits yet"
              description="Pick one small habit that fits your week."
              action={
                <Button onClick={() => setOpen(true)}>
                  <Plus /> Add a habit
                </Button>
              }
            />
          ) : (
            <Section title="Your habits" description="Tap a day to check it off.">
              <div className="space-y-3">
                {habits.map((h) => {
                  const done = days.filter((d) => h.days[d]).length
                  return (
                    <Surface key={h.id}>
                      <div className="flex items-start gap-3">
                        <IconTile tone="lime">
                          <DataIcon name={h.icon} />
                        </IconTile>
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-medium">{h.title}</p>
                          <p className="text-caption mt-0.5 text-muted-foreground">Why: {h.description}</p>
                        </div>
                        <button
                          type="button"
                          className="-mt-1 -mr-2 grid size-10 shrink-0 place-items-center rounded-full text-muted-grey transition-colors hover:bg-muted hover:text-charcoal"
                          aria-label={`Remove ${h.title}`}
                          onClick={() => {
                            removeHabit(h.id)
                            toast("Habit removed")
                          }}
                        >
                          <Trash2 className="size-[18px]" />
                        </button>
                      </div>
                      <div className="mt-4 grid grid-cols-7 gap-1">
                        {days.map((d) => {
                          const on = !!h.days[d]
                          const isToday = d === today
                          return (
                            <button
                              key={d}
                              type="button"
                              onClick={() => toggleHabit(h.id, d)}
                              aria-pressed={on}
                              aria-label={`${formatDay(d, { weekday: "long" })}: ${on ? "done" : "not done"}`}
                              className="flex min-h-11 flex-col items-center gap-1.5"
                            >
                              <span className={cn("text-caption", isToday ? "font-semibold text-charcoal" : "text-muted-foreground")}>{formatDay(d, { weekday: "narrow" })}</span>
                              <span
                                className={cn(
                                  "grid size-8 place-items-center rounded-full border-[1.5px] transition-colors",
                                  on ? "border-lime bg-lime text-charcoal" : "border-input bg-card",
                                  isToday && "ring-2 ring-forest/25 ring-offset-2 ring-offset-card",
                                )}
                              >
                                {on && <Check className="size-4" strokeWidth={2.5} />}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                      <p className="text-caption mt-3 border-t border-border/70 pt-3 text-muted-foreground">
                        Done on <span className="tabular font-medium text-charcoal">{done}</span> of the last 7 days
                      </p>
                    </Surface>
                  )
                })}
              </div>
            </Section>
          )}

          {personal.length > 0 && (
            <Section title="Suggested for you" description="Picked from your recent records. Add one only if it fits.">
              <ListGroup>
                {personal.slice(0, 3).map((s) => (
                  <ListRow
                    key={s.title}
                    icon={<DataIcon name={s.icon} />}
                    iconTone="amber"
                    title={s.title}
                    description={`Why: ${s.reason}`}
                    trailing={
                      <Button size="sm" variant="secondary" onClick={() => create(s)}>
                        <Plus /> Add
                      </Button>
                    }
                  />
                ))}
              </ListGroup>
            </Section>
          )}

          {input && <HabitReviewSection input={input} />}
        </PremiumGate>
      </PageBody>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Add a habit</SheetTitle>
            <SheetDescription>Choose a suggestion or write your own.</SheetDescription>
          </SheetHeader>
          <div className="space-y-5 px-5 pt-2">
            <p className="text-overline text-muted-foreground">Suggestions</p>
            <div className="-mt-3 space-y-2">
              {suggestions.map((s) => (
                <button key={s.title} onClick={() => create(s)} className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl bg-card shadow-card px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <IconTile size="sm" tone="amber">
                    <DataIcon name={s.icon} />
                  </IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="text-body block font-medium">{s.title}</span>
                    <span className="text-caption block text-muted-foreground">{s.reason !== "A common first habit." ? `Why: ${s.reason}` : s.description}</span>
                  </span>
                  <Plus className="size-[18px] text-muted-grey" />
                </button>
              ))}
            </div>
            <CustomHabitForm onSave={create} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function CustomHabitForm({ onSave }: { onSave: (h: { title: string; description: string; icon: string }) => void }) {
  const [title, setTitle] = useState("")
  const [why, setWhy] = useState("")
  return (
    <form
      className="space-y-4 border-t border-border/70 pt-5"
      onSubmit={(e) => {
        e.preventDefault()
        if (!title.trim()) return
        onSave({ title: title.trim(), description: why.trim() || "Your own habit.", icon: "Salad" })
        setTitle("")
        setWhy("")
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="h-title">Your own habit</Label>
        <Input id="h-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Eat fruit after lunch" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="h-why">Why it matters to you (optional)</Label>
        <Textarea id="h-why" value={why} onChange={(e) => setWhy(e.target.value)} />
      </div>
      <Button type="submit" className="w-full" disabled={!title.trim()}>
        Add habit
      </Button>
    </form>
  )
}

/** Weekly habit review (§42.18): what went consistently, what was hard, and 1–2 priorities. No streaks or scores. */
function HabitReviewSection({ input }: { input: InsightInput }) {
  const habits = useApp((s) => s.habits)
  const reviews = useAreaD((s) => s.habitReviews)
  const saveReview = useAreaD((s) => s.saveHabitReview)
  const week = startOfWeek(todayISO())
  const saved = reviews.find((r) => r.weekStart === week)
  const days = input.days
  const doneCount = (id: string) => days.filter((d) => habits.find((h) => h.id === id)?.days[d]).length
  const consistent = habits.filter((h) => doneCount(h.id) >= 5)
  const autoStruggled = habits.filter((h) => doneCount(h.id) <= 2).map((h) => h.title)
  const [struggled, setStruggled] = useState<string[]>(saved?.struggled ?? autoStruggled)
  const [priorities, setPriorities] = useState<string[]>(saved?.priorities ?? [])
  const prevDays = days.map((d) => addDays(d, -7))
  const now = foodVariety(input)
  const before = foodVariety({ ...input, days: prevDays })
  const toggle = (list: string[], v: string, max?: number) => (list.includes(v) ? list.filter((x) => x !== v) : max && list.length >= max ? list : [...list, v])

  return (
    <Section title="Weekly habit review" description="A look back, not a scorecard. Missing days is part of building a habit.">
      <div id="review" className="scroll-mt-20 space-y-3">
        {saved && (
          <Surface tone="sage">
            <p className="text-overline text-lime-text">Your priorities this week</p>
            <p className="text-body mt-1 font-medium">{saved.priorities.join(" · ") || "Keep things as they are"}</p>
          </Surface>
        )}
        <Surface className="space-y-4">
          <div className="flex items-start gap-3">
            <IconTile tone="lime">
              <Check />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium">Went consistently</p>
              <p className="text-caption mt-0.5 text-muted-foreground">{consistent.length ? consistent.map((h) => h.title).join(", ") : "Nothing on most days yet — that's fine."}</p>
            </div>
          </div>
          <div className="border-t border-border/70 pt-4">
            <p className="text-overline text-muted-foreground">Your recorded food · this week vs last</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2">
              <StatTile label="Logged" value={now.loggedDays} unit="days" hint={`was ${before.loggedDays}`} />
              <StatTile label="Vegetables" value={now.groups.vegetable.days} unit="days" hint={`was ${before.groups.vegetable.days}`} />
              <StatTile label="Fruit" value={now.groups.fruit.days} unit="days" hint={`was ${before.groups.fruit.days}`} />
            </div>
            <p className="text-caption mt-2.5 text-muted-foreground">Based only on what was logged.</p>
          </div>
        </Surface>
        {habits.length > 0 && (
          <div className="pt-2">
            <p className="text-callout mb-2.5 font-semibold">Which felt hard this week?</p>
            <div className="flex flex-wrap gap-2">
              {habits.map((h) => (
                <Chip key={h.id} selected={struggled.includes(h.title)} onClick={() => setStruggled((x) => toggle(x, h.title))}>
                  {h.title}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <div className="pt-2">
          <p className="text-callout mb-2.5 flex items-center gap-2 font-semibold">
            Choose 1–2 priorities for next week <Pill tone="neutral">{priorities.length} of 2</Pill>
          </p>
          <div className="flex flex-wrap gap-2">
            {[...habits.map((h) => h.title), "Keep things as they are"].map((t) => (
              <Chip key={t} selected={priorities.includes(t)} onClick={() => setPriorities((x) => toggle(x, t, 2))}>
                {priorities.includes(t) && <Check />}
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <Button
          className="mt-2 w-full"
          disabled={priorities.length === 0}
          onClick={() => {
            saveReview({ weekStart: week, struggled, priorities })
            track("habit_review_saved", { priorities: priorities.length })
            toast.success("Habit review saved")
          }}
        >
          {saved ? "Update review" : "Save review"}
        </Button>
      </div>
    </Section>
  )
}
