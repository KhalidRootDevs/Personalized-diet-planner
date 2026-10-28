"use client"

import { useState } from "react"
import { Check, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { formatDay, todayISO, uid } from "@/lib/date"
import { useApp } from "@/lib/store"
import { lastNDays } from "@/lib/area-d-stats"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { DataIcon } from "@/components/app/icon"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { PageBody, PageHeader, Section } from "@/components/app/page"

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
            {habits.length > 0 && (
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
            <Card className="items-center gap-3 text-center">
              <p className="font-medium">No habits yet</p>
              <p className="text-sm text-muted-foreground">Pick one small habit that fits your week.</p>
              <Button onClick={() => setOpen(true)}>
                <Plus /> Add a habit
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {habits.map((h) => {
                const done = days.filter((d) => h.days[d]).length
                return (
                  <Card key={h.id} className="gap-3">
                    <div className="flex items-start gap-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sage text-forest">
                        <DataIcon name={h.icon} className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{h.title}</p>
                        <p className="text-sm text-muted-foreground">Why: {h.description}</p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={`Remove ${h.title}`}
                        onClick={() => {
                          removeHabit(h.id)
                          toast("Habit removed")
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between gap-1">
                      {days.map((d) => {
                        const on = !!h.days[d]
                        return (
                          <button
                            key={d}
                            onClick={() => toggleHabit(h.id, d)}
                            aria-pressed={on}
                            aria-label={`${formatDay(d, { weekday: "long" })}: ${on ? "done" : "not done"}`}
                            className="flex flex-1 flex-col items-center gap-1"
                          >
                            <span className={cn("text-[11px]", d === today ? "font-semibold text-charcoal" : "text-muted-foreground")}>{formatDay(d, { weekday: "narrow" })}</span>
                            <span className={cn("grid size-9 place-items-center rounded-full border", on ? "border-forest bg-forest text-white" : "border-input bg-card")}>{on && <Check className="size-4" />}</span>
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Done on <span className="tabular">{done}</span> of the last 7 days.
                    </p>
                  </Card>
                )
              })}
            </div>
          )}

          <Section title="This week" className="mt-6">
            <Card className="gap-2 text-sm">
              {habits.length ? (
                <p>
                  You checked off habits on <b className="tabular">{days.filter((d) => habits.some((h) => h.days[d])).length}</b> of 7 days. Small, repeated actions add up. Keep the habits that feel useful and drop the ones that don&apos;t.
                </p>
              ) : (
                <p>Add a habit to see your weekly review here.</p>
              )}
            </Card>
          </Section>
        </PremiumGate>
      </PageBody>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="mx-auto max-h-[90dvh] max-w-[440px] overflow-y-auto rounded-t-3xl pb-safe">
          <SheetHeader>
            <SheetTitle>Add a habit</SheetTitle>
            <SheetDescription>Choose a suggestion or write your own.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-4">
            <div className="space-y-2">
              {SUGGESTIONS.filter((s) => !habits.some((h) => h.title === s.title)).map((s) => (
                <button key={s.title} onClick={() => create(s)} className="flex w-full items-center gap-3 rounded-xl border bg-card p-3 text-left hover:bg-muted/50">
                  <DataIcon name={s.icon} className="size-5 text-forest" />
                  <span className="flex-1">
                    <span className="block text-sm font-medium">{s.title}</span>
                    <span className="block text-xs text-muted-foreground">{s.description}</span>
                  </span>
                  <Plus className="size-4 text-muted-grey" />
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
      className="space-y-3 border-t pt-4"
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
