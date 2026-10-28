"use client"

import { useState } from "react"
import { Check, ListChecks, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDay, todayISO, uid } from "@/lib/date"
import { useApp } from "@/lib/store"
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
import { EmptyState, IconTile, PageBody, PageHeader, Section, Surface } from "@/components/app/page"

const SUGGESTIONS = [
  { title: "Add a vegetable to dinner", description: "Easy way to add fiber and variety.", icon: "Carrot" },
  { title: "Pack a snack for work", description: "Helps on long workdays.", icon: "Apple" },
  { title: "Eat lunch away from the desk", description: "A short break can make meals more enjoyable.", icon: "Coffee" },
]

/** Habit Builder (§42.18). Small habits, no streaks, no penalties for missed days. */
export default function HabitsPage() {
  const habits = useApp((s) => s.habits)
  const toggleHabit = useApp((s) => s.toggleHabit)
  const addHabit = useApp((s) => s.addHabit)
  const removeHabit = useApp((s) => s.removeHabit)
  const [open, setOpen] = useState(false)
  const { allowed } = useFeature("habits")
  const days = lastNDays(7)
  const today = todayISO()

  const create = (h: { title: string; description: string; icon: string }) => {
    addHabit({ id: uid("h"), ...h, days: {} })
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

          <Section title="This week">
            <Surface tone="sage">
              <p className="text-callout">
                {habits.length ? (
                  <>
                    You checked off habits on <b className="tabular">{days.filter((d) => habits.some((h) => h.days[d])).length}</b> of 7 days. Small, repeated actions add up. Keep the habits that feel useful and drop the ones that don&apos;t.
                  </>
                ) : (
                  "Add a habit to see your weekly review here."
                )}
              </p>
            </Surface>
          </Section>
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
              {SUGGESTIONS.filter((s) => !habits.some((h) => h.title === s.title)).map((s) => (
                <button key={s.title} onClick={() => create(s)} className="flex min-h-[60px] w-full items-center gap-3 rounded-2xl bg-card shadow-card px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <IconTile size="sm" tone="amber">
                    <DataIcon name={s.icon} />
                  </IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="text-body block font-medium">{s.title}</span>
                    <span className="text-caption block text-muted-foreground">{s.description}</span>
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
