"use client"

// Configurable reminders (§26, Phase 1). Delivery channel on web is an open decision (§43.7);
// learning reminder timing is Phase 2 (§42.17) and always needs approval.
import { Bell, CalendarCheck, ChefHat, Droplets, Mail, NotebookPen, ShoppingBasket, Baby, Sparkles, UtensilsCrossed } from "lucide-react"
import { toast } from "sonner"
import { useApp } from "@/lib/store"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { IconTile, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { Button } from "@/components/ui/button"
import { PhaseBadge, PremiumGate } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { ChoiceCard } from "@/components/app/controls"

const REMINDERS: { key: string; icon: typeof Bell; title: string; text: string; time?: boolean }[] = [
  { key: "meals", icon: UtensilsCrossed, title: "Meal times", text: "A gentle nudge before each planned meal" },
  { key: "prep", icon: ChefHat, title: "Prep ahead", text: "Soak, marinate or defrost the evening before", time: true },
  { key: "logging", icon: NotebookPen, title: "Log your meals", text: "Only if something wasn't logged today", time: true },
  { key: "water", icon: Droplets, title: "Water", text: "Hydration reminders during the day" },
  { key: "shopping", icon: ShoppingBasket, title: "Shopping", text: "Before your usual shopping day" },
  { key: "weekly_review", icon: CalendarCheck, title: "Weekly review", text: "Look back at the week and plan the next" },
  { key: "baby_feeding", icon: Baby, title: "Baby feeding", text: "Meal and new-food reminders for your baby" },
]

export default function NotificationsSettingsPage() {
  const settings = useApp((s) => s.settings)
  const updateSettings = useApp((s) => s.updateSettings)
  const hasChild = useApp((s) => s.profiles.some((p) => p.relation === "child"))

  const setReminder = (key: string, patch: Partial<{ enabled: boolean; time: string }>) =>
    updateSettings({ reminders: { ...settings.reminders, [key]: { ...settings.reminders[key], ...patch } } })

  return (
    <>
      <PageHeader back="/profile" title="Reminders" />
      <PageBody>
        <Section title="How we reach you">
          <div role="radiogroup" className="space-y-2.5">
            <ChoiceCard selected={settings.reminderChannel === "push"} onSelect={() => updateSettings({ reminderChannel: "push" })} icon={<Bell className="size-5" />} title="App notifications" description="Works when NutriPlan is installed on your phone" />
            <ChoiceCard selected={settings.reminderChannel === "email"} onSelect={() => updateSettings({ reminderChannel: "email" })} icon={<Mail className="size-5" />} title="Email" description="A daily digest instead of individual alerts" />
          </div>
          <CautionNote title="Open decision (§43.7)">The Phase 1 reminder channel on web hasn&apos;t been decided. Both options are shown for review.</CautionNote>
        </Section>

        <Section title="Reminders" badge={<PhaseBadge phase={1} />}>
          <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
            {REMINDERS.filter((r) => r.key !== "baby_feeding" || hasChild).map(({ key, icon: Icon, title, text, time }) => {
              const r = settings.reminders[key] ?? { enabled: false, time: "" }
              return (
                <div key={key} className="px-4 py-3">
                  <label className="flex min-h-10 cursor-pointer items-center gap-3">
                    <IconTile>
                      <Icon aria-hidden />
                    </IconTile>
                    <span className="min-w-0 flex-1">
                      <span className="text-body block font-medium">{title}</span>
                      <span className="text-caption block text-muted-foreground">{text}</span>
                    </span>
                    <Switch checked={r.enabled} onCheckedChange={(v) => setReminder(key, { enabled: v })} aria-label={title} />
                  </label>
                  {r.enabled && (
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
          <InfoNote>Reminder text never names a health condition. Quiet hours: 22:00–07:00.</InfoNote>
        </Section>

        <Section title="Learning reminders" badge={<PhaseBadge phase={2} />}>
          <PremiumGate feature="smart_reminders" compact>
            <Surface tone="sage">
              <p className="text-overline flex items-center gap-1.5 text-forest">
                <Sparkles className="size-3.5" aria-hidden /> Suggested change
              </p>
              <p className="text-body mt-2">You usually log lunch around 14:10. Move your lunch reminder from 13:00 to 13:50?</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" onClick={() => toast("Kept at 13:00")}>Keep 13:00</Button>
                <Button size="sm" onClick={() => toast.success("Lunch reminder moved to 13:50")}>Use 13:50</Button>
              </div>
              <p className="text-caption mt-3 text-muted-foreground">Timing changes are suggestions. Nothing changes without your approval.</p>
            </Surface>
          </PremiumGate>
        </Section>
      </PageBody>
    </>
  )
}
