"use client"

// Google Calendar (Phase 2, §14.4) and wearables / health platforms (Phase 3, §42.23).
import { useState } from "react"
import { Activity, CalendarDays, HeartPulse, RefreshCw, ShieldCheck, Watch } from "lucide-react"
import { toast } from "sonner"
import { useActivePlan, useApp } from "@/lib/store"
import type { FeatureId } from "@/lib/features"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { IconTile, PageBody, PageHeader, Pill, Section, Surface, type IconTone } from "@/components/app/page"
import { ChoiceCard } from "@/components/app/controls"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { calendarEvents } from "@/lib/calendar"
import { addDays, formatDay, formatTime, todayISO } from "@/lib/date"

interface Integration {
  id: string
  name: string
  icon: typeof Activity
  description: string
  feature: FeatureId
  phase: 2 | 3
  reads: string[]
  writes: string[]
  never?: string[]
  tone: IconTone
}

const INTEGRATIONS: Integration[] = [
  { id: "google_calendar", name: "Google Calendar", icon: CalendarDays, description: "Add meals and prep tasks to your calendar", feature: "google_calendar", phase: 2, tone: "sky", reads: ["Free/busy times, to avoid scheduling meals during meetings"], writes: ["Events titled “Lunch”, “Meal prep” — never health details"] },
  {
    id: "health_connect",
    name: "Health Connect",
    icon: HeartPulse,
    tone: "terracotta",
    description: "Android steps, activity and weight",
    feature: "wearables",
    phase: 3,
    reads: ["Steps and active minutes", "Weight (only if you choose)"],
    writes: [],
    never: ["Device calorie-burn estimates never raise your food targets automatically", "No heart, sleep or medical records"],
  },
  {
    id: "apple_health",
    name: "Apple Health",
    icon: Activity,
    tone: "lime",
    description: "iPhone activity and weight",
    feature: "wearables",
    phase: 3,
    reads: ["Steps and workouts", "Weight (only if you choose)"],
    writes: [],
    never: ["Device calorie-burn estimates never raise your food targets automatically", "No clinical records or medications"],
  },
  { id: "fitbit", name: "Fitbit", icon: Watch, description: "Activity and sleep from your Fitbit", feature: "wearables", phase: 3, tone: "amber", reads: ["Steps, active minutes and sleep"], writes: [], never: ["Device calorie-burn estimates never raise your food targets automatically"] },
]

export default function IntegrationsPage() {
  const integrations = useApp((s) => s.settings.integrations)
  const updateSettings = useApp((s) => s.updateSettings)
  const sync = useApp((s) => s.settings.calendarSync)
  const [pending, setPending] = useState<Integration | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const setConnected = (id: string, v: boolean) => updateSettings({ integrations: { ...useApp.getState().settings.integrations, [id]: v } })

  const groups: { phase: 2 | 3; title: string; description: string }[] = [
    { phase: 2, title: "Calendar", description: "Meals and prep tasks in Google Calendar, with neutral titles." },
    { phase: 3, title: "Health apps and wearables", description: "Steps and activity from Health Connect, Apple Health or Fitbit." },
  ]

  return (
    <>
      <PageHeader back="/profile" title="Connected apps" />
      <PageBody>
        {groups.map((g) => (
          <Section key={g.phase} title={g.title} badge={<PhaseBadge phase={g.phase} />} description={g.description}>
            <PremiumGate feature={g.phase === 2 ? "google_calendar" : "wearables"} variant="row">
              <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
                {INTEGRATIONS.filter((i) => i.phase === g.phase).map((i) => {
                  const on = integrations[i.id]
                  const isCal = i.id === "google_calendar"
                  return (
                    <div key={i.id} className="flex min-h-[68px] items-center gap-3 px-4 py-3">
                      <IconTile tone={i.tone}>
                        <i.icon aria-hidden />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{i.name}</p>
                        <p className="text-caption text-muted-foreground">
                          {on ? (isCal && sync?.lastSyncedAt ? `Connected · synced ${formatDay(sync.lastSyncedAt.slice(0, 10), { day: "numeric", month: "short" })}` : "Connected") : i.description}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant={on ? "outline" : "secondary"}
                        onClick={() => {
                          if (isCal) setCalendarOpen(true)
                          else if (on) {
                            setConnected(i.id, false)
                            toast(`${i.name} disconnected`, { description: "Imported data stays unless you delete it." })
                          } else setPending(i)
                        }}
                      >
                        {on ? (isCal ? "Manage" : "Disconnect") : "Connect"}
                      </Button>
                    </div>
                  )
                })}
              </div>
            </PremiumGate>
          </Section>
        ))}
        <InfoNote title="How we use wearable data">
          Activity from wearables is shown as a range. We never raise your food targets automatically from a device&apos;s calorie estimate — any change is a suggestion you approve.
        </InfoNote>
      </PageBody>

      <CalendarSheet open={calendarOpen} onOpenChange={setCalendarOpen} />

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {pending?.name}?</DialogTitle>
            <DialogDescription>NutriPlan will ask {pending?.name} for permission to:</DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="text-callout space-y-3 rounded-2xl bg-muted p-4">
              <div>
                <p className="font-semibold">Read</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                  {pending.reads.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
              {pending.writes.length > 0 && (
                <div>
                  <p className="font-semibold">Write</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                    {pending.writes.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              {pending.never && (
                <div>
                  <p className="font-semibold">Never</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">
                    {pending.never.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <p className="text-caption -mt-2 text-muted-foreground">You can disconnect at any time. Prototype: no real connection is made.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Not now
            </Button>
            <Button
              onClick={() => {
                if (pending) {
                  setConnected(pending.id, true)
                  toast.success(`${pending.name} connected`)
                }
                setPending(null)
              }}
            >
              Allow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/** Google Calendar: authorization with a sync preview, de-duplication choice and disconnect (§14.4). */
function CalendarSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const plan = useActivePlan()
  const connected = !!settings.integrations.google_calendar
  const [dedupe, setDedupe] = useState<"update" | "skip">(settings.calendarSync?.dedupe ?? "update")
  const today = todayISO()
  const events = plan && plan.status !== "paused" ? calendarEvents(plan.meals.filter((m) => m.date >= today && m.date <= addDays(today, 6)), { prepTime: settings.reminders.prep?.time }) : []
  const days = Array.from(new Set(events.map((e) => e.date)))

  const connect = () => {
    const now = new Date().toISOString()
    updateSettings({ integrations: { ...settings.integrations, google_calendar: true }, calendarSync: { dedupe, connectedAt: settings.calendarSync?.connectedAt ?? now, lastSyncedAt: now } })
    toast.success(connected ? "Calendar synced" : "Google Calendar connected", { description: `${events.length} events ${dedupe === "update" ? "created or updated" : "added where missing"}. Prototype: nothing is sent.` })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-title flex items-center gap-2">
            Google Calendar <PhaseBadge phase={2} />
          </SheetTitle>
          <SheetDescription>{connected ? "Connected. Review what's synced or disconnect." : "Here's what would be added for the next 7 days."}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-5">
          <Surface tone="muted" className="max-h-56 space-y-3 overflow-y-auto">
            <p className="text-overline text-muted-foreground">Sync preview · {events.length} events</p>
            {plan?.status === "paused" && <p className="text-callout text-muted-foreground">Your plan is paused, so no meal events are synced.</p>}
            {days.map((d) => (
              <div key={d}>
                <p className="text-caption font-semibold">{formatDay(d, { weekday: "long", day: "numeric", month: "short" })}</p>
                {events
                  .filter((e) => e.date === d)
                  .map((e) => (
                    <p key={e.uid} className="text-callout flex justify-between gap-3">
                      <span>{e.title}</span>
                      <span className="tabular text-muted-foreground">{formatTime(e.start)}</span>
                    </p>
                  ))}
              </div>
            ))}
          </Surface>
          <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-forest" aria-hidden />
            Titles stay neutral. Recipes, conditions, goals and allergies are never written to your calendar.
          </p>
          <div className="space-y-2.5" role="radiogroup" aria-label="When an event already exists">
            <p className="text-callout font-medium">When a NutriPlan event already exists</p>
            <ChoiceCard selected={dedupe === "update"} onSelect={() => setDedupe("update")} icon={<RefreshCw className="size-5" />} title="Update it" description="Changed times move the existing event — no duplicates" />
            <ChoiceCard selected={dedupe === "skip"} onSelect={() => setDedupe("skip")} icon={<CalendarDays className="size-5" />} title="Leave it as it is" description="Only add events that aren't there yet" />
          </div>
          {connected && settings.calendarSync?.lastSyncedAt && (
            <div className="flex items-center gap-2">
              <Pill tone="sage">Connected</Pill>
              <span className="text-caption text-muted-foreground">Last synced {formatDay(settings.calendarSync.lastSyncedAt.slice(0, 10))}</span>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Button size="lg" className="w-full" onClick={connect}>
              {connected ? "Sync now" : "Allow and connect"}
            </Button>
            {connected && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  updateSettings({ integrations: { ...settings.integrations, google_calendar: false }, calendarSync: { dedupe } })
                  toast("Google Calendar disconnected", { description: "Events already in your calendar stay until you delete them." })
                  onOpenChange(false)
                }}
              >
                Disconnect
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
