"use client"

// Google Calendar (Phase 2, §14.4) and wearables / health platforms (Phase 3, §42.23).
import { useState } from "react"
import { Activity, CalendarDays, HeartPulse, Watch } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import type { FeatureId } from "@/lib/features"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IconTile, PageBody, PageHeader, Section } from "@/components/app/page"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"

interface Integration {
  id: string
  name: string
  icon: typeof Activity
  description: string
  feature: FeatureId
  phase: 2 | 3
  reads: string[]
  writes: string[]
}

const INTEGRATIONS: Integration[] = [
  { id: "google_calendar", name: "Google Calendar", icon: CalendarDays, description: "Add meals and prep tasks to your calendar", feature: "google_calendar", phase: 2, reads: ["Free/busy times, to avoid scheduling meals during meetings"], writes: ["Events titled “Lunch”, “Prep dinner” — never health details"] },
  { id: "health_connect", name: "Health Connect", icon: HeartPulse, description: "Android steps, activity and weight", feature: "wearables", phase: 3, reads: ["Steps and active minutes", "Weight (if you choose)"], writes: [] },
  { id: "apple_health", name: "Apple Health", icon: Activity, description: "iPhone activity and weight", feature: "wearables", phase: 3, reads: ["Steps and workouts", "Weight (if you choose)"], writes: [] },
  { id: "fitbit", name: "Fitbit", icon: Watch, description: "Activity and sleep from your Fitbit", feature: "wearables", phase: 3, reads: ["Steps, active minutes and sleep"], writes: [] },
]

export default function IntegrationsPage() {
  const integrations = useApp((s) => s.settings.integrations)
  const updateSettings = useApp((s) => s.updateSettings)
  const [pending, setPending] = useState<Integration | null>(null)

  const setConnected = (id: string, v: boolean) => updateSettings({ integrations: { ...integrations, [id]: v } })

  const groups: { phase: 2 | 3; title: string }[] = [
    { phase: 2, title: "Calendar" },
    { phase: 3, title: "Health apps and wearables" },
  ]

  return (
    <>
      <PageHeader back="/profile" title="Connected apps" />
      <PageBody>
        {groups.map((g) => (
          <Section key={g.phase} title={g.title} badge={<PhaseBadge phase={g.phase} />}>
            <PremiumGate feature={g.phase === 2 ? "google_calendar" : "wearables"} compact>
              <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
                {INTEGRATIONS.filter((i) => i.phase === g.phase).map((i) => {
                  const on = integrations[i.id]
                  return (
                    <div key={i.id} className="flex min-h-[68px] items-center gap-3 px-4 py-3">
                      <IconTile>
                        <i.icon aria-hidden />
                      </IconTile>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium">{i.name}</p>
                        <p className="text-caption text-muted-foreground">{on ? "Connected" : i.description}</p>
                      </div>
                      <Button
                        size="sm"
                        variant={on ? "outline" : "secondary"}
                        onClick={() => {
                          if (on) {
                            setConnected(i.id, false)
                            toast(`${i.name} disconnected`, { description: "Imported data stays unless you delete it." })
                          } else setPending(i)
                        }}
                      >
                        {on ? "Disconnect" : "Connect"}
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

      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect {pending?.name}?</DialogTitle>
            <DialogDescription>NutriPlan will ask {pending?.name} for permission to:</DialogDescription>
          </DialogHeader>
          {pending && (
            <div className="text-callout space-y-3 rounded-xl bg-muted p-4">
              <div>
                <p className="font-semibold">Read</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">{pending.reads.map((r) => <li key={r}>{r}</li>)}</ul>
              </div>
              {pending.writes.length > 0 && (
                <div>
                  <p className="font-semibold">Write</p>
                  <ul className="mt-1 list-disc space-y-0.5 pl-5 text-muted-foreground">{pending.writes.map((r) => <li key={r}>{r}</li>)}</ul>
                </div>
              )}
              </div>
          )}
          <p className="text-caption -mt-2 text-muted-foreground">You can disconnect at any time. Prototype: no real connection is made.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Not now</Button>
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
