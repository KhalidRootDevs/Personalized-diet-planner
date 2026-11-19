"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Baby, Bell, CalendarCheck, Check, ChefHat, ChevronRight, ClipboardCheck, Settings, ShoppingBasket, Utensils } from "lucide-react"
import { addDays, formatDay, formatTime, todayISO } from "@/lib/date"
import { useApp } from "@/lib/store"
import { runReminders } from "@/lib/reminders"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/lib/types"
import { EmptyState, HeaderIconButton, IconTile, PageBody, PageHeader, Section, SectionLink, type IconTone } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"

// Same surface as ListGroup, rendered as a list for semantics.
const GROUP = "divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card"

function iconFor(n: AppNotification): { icon: React.ReactNode; tone: IconTone } {
  if (n.href?.startsWith("/plan/prep")) return { icon: <ChefHat />, tone: "amber" }
  if (n.href?.startsWith("/plan/shopping")) return { icon: <ShoppingBasket />, tone: "lime" }
  if (n.href?.startsWith("/child")) return { icon: <Baby />, tone: "sage" }
  if (n.href?.startsWith("/progress")) return { icon: <ClipboardCheck />, tone: "sky" }
  if (n.href?.startsWith("/plan")) return { icon: <Utensils />, tone: "lime" }
  if (n.href?.startsWith("/log")) return { icon: <CalendarCheck />, tone: "terracotta" }
  return { icon: <Bell />, tone: "sage" }
}

function dayLabel(day: string) {
  const today = todayISO()
  if (day === today) return "Today"
  if (day === addDays(today, -1)) return "Yesterday"
  return formatDay(day, { weekday: "long", day: "numeric", month: "short" })
}

const localDay = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? iso.slice(0, 10) : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const localTime = (iso: string) => {
  const d = new Date(iso)
  return isNaN(d.getTime()) ? formatTime(iso.slice(11, 16)) : formatTime(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`)
}

function Item({ n }: { n: AppNotification }) {
  const router = useRouter()
  const markRead = useApp((s) => s.markNotificationRead)
  const open = () => {
    markRead(n.id)
    if (n.href) router.push(n.href)
  }
  return (
    <li className="relative">
      <button type="button" onClick={open} className={cn("flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/50 active:bg-muted", !n.read && "pr-14")}>
        <IconTile tone={n.read ? "muted" : iconFor(n).tone}>{iconFor(n).icon}</IconTile>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={cn("text-body min-w-0 flex-1", n.read ? "font-medium" : "font-semibold")}>
              {n.title}
              {!n.read && <span className="sr-only"> (unread)</span>}
            </p>
            {!n.read && <span className="size-2 shrink-0 rounded-full bg-terracotta" aria-hidden />}
          </div>
          <p className="text-caption mt-0.5 text-muted-foreground">{n.body}</p>
          <p className="tabular text-caption mt-1.5 text-muted-foreground/90">{localTime(n.createdAt)}</p>
        </div>
        {n.href && n.read && <ChevronRight className="mt-2.5 size-[18px] shrink-0 text-muted-grey" aria-hidden />}
      </button>
      {!n.read && (
        <button type="button" onClick={() => markRead(n.id)} className="absolute top-3 right-2 grid size-10 place-items-center rounded-full text-forest hover:bg-sage" aria-label={`Mark “${n.title}” as read`}>
          <Check className="size-[18px]" />
        </button>
      )}
    </li>
  )
}

/** Notification inbox (§26), grouped by day. Reminder preferences live in Profile → Reminders. */
export default function NotificationsPage() {
  const notifications = useApp((s) => s.notifications)
  const markAll = useApp((s) => s.markNotificationsRead)
  const hydrated = useApp((s) => s.hydrated)

  // Derive any reminders that came due since the app was last open.
  useEffect(() => {
    if (hydrated) runReminders()
  }, [hydrated])

  const sorted = [...notifications].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const unread = sorted.filter((n) => !n.read).length
  const days = Array.from(new Set(sorted.map((n) => localDay(n.createdAt))))

  return (
    <>
      <PageHeader
        title="Notifications"
        back="/home"
        action={
          <HeaderIconButton href="/profile/notifications" label="Notification settings">
            <Settings className="size-[19px]" />
          </HeaderIconButton>
        }
      />
      <PageBody>
        {sorted.length === 0 ? (
          <EmptyState icon={<Bell />} title="You're all caught up" description="Meal reminders and updates will appear here." />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-callout flex items-center gap-2 text-muted-foreground">
                {unread ? `${unread} unread` : "All read"} <FeatureBadge feature="reminders" />
              </p>
              {unread > 0 && <SectionLink onClick={markAll}>Mark all read</SectionLink>}
            </div>
            {days.map((d) => (
              <Section key={d} title={dayLabel(d)}>
                <ul className={GROUP}>
                  {sorted
                    .filter((n) => localDay(n.createdAt) === d)
                    .map((n) => (
                      <Item key={n.id} n={n} />
                    ))}
                </ul>
              </Section>
            ))}
          </>
        )}
        <div className="text-center">
          <SectionLink href="/profile/notifications">Choose which reminders you get</SectionLink>
        </div>
      </PageBody>
    </>
  )
}
