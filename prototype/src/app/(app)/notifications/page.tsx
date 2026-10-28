"use client"

import Link from "next/link"
import { Bell, CalendarCheck, ChefHat, ChevronRight, ClipboardCheck, Settings, Utensils } from "lucide-react"
import { formatDay, formatTime, todayISO } from "@/lib/date"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/lib/types"
import { EmptyState, HeaderIconButton, IconTile, PageBody, PageHeader, Section, SectionLink } from "@/components/app/page"

// Same surface as ListGroup, rendered as a list for semantics.
const GROUP = "divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card"

function when(iso: string) {
  const day = iso.slice(0, 10)
  const time = formatTime(iso.slice(11, 16))
  return day === todayISO() ? `Today, ${time}` : `${formatDay(day, { weekday: "short", day: "numeric", month: "short" })}, ${time}`
}

function iconFor(n: AppNotification) {
  if (n.href?.startsWith("/plan/prep")) return <ChefHat />
  if (n.href?.startsWith("/progress")) return <ClipboardCheck />
  if (n.href?.startsWith("/plan")) return <Utensils />
  if (n.href?.startsWith("/log")) return <CalendarCheck />
  return <Bell />
}

function Item({ n }: { n: AppNotification }) {
  const body = (
    <div className={cn("flex gap-3 px-4 py-3.5 transition-colors", n.href && "hover:bg-muted/50 active:bg-muted")}>
      <IconTile tone={n.read ? "muted" : "sage"}>{iconFor(n)}</IconTile>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("text-body min-w-0 flex-1", n.read ? "font-medium" : "font-semibold")}>
            {n.title}
            {!n.read && <span className="sr-only"> (unread)</span>}
          </p>
          {!n.read && <span className="size-2 shrink-0 rounded-full bg-forest" aria-hidden />}
        </div>
        <p className="text-caption mt-0.5 text-muted-foreground">{n.body}</p>
        <p className="text-caption mt-1.5 text-muted-foreground/90">{when(n.createdAt)}</p>
      </div>
      {n.href && <ChevronRight className="mt-2.5 size-[18px] shrink-0 text-muted-grey" aria-hidden />}
    </div>
  )
  return <li>{n.href ? <Link href={n.href}>{body}</Link> : body}</li>
}

/** Notification inbox (§26). Reminder preferences live in Profile → Reminders. */
export default function NotificationsPage() {
  const notifications = useApp((s) => s.notifications)
  const markRead = useApp((s) => s.markNotificationsRead)
  const sorted = [...notifications].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const unread = sorted.filter((n) => !n.read)
  const read = sorted.filter((n) => n.read)

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
            {unread.length > 0 && (
              <Section title={`New · ${unread.length}`} action={<SectionLink onClick={markRead}>Mark all read</SectionLink>}>
                <ul className={GROUP}>
                    {unread.map((n) => (
                      <Item key={n.id} n={n} />
                    ))}
                </ul>
              </Section>
            )}
            {read.length > 0 && (
              <Section title="Earlier">
                <ul className={GROUP}>
                    {read.map((n) => (
                      <Item key={n.id} n={n} />
                    ))}
                </ul>
              </Section>
            )}
          </>
        )}
        <div className="text-center">
          <SectionLink href="/profile/notifications">Choose which reminders you get</SectionLink>
        </div>
      </PageBody>
    </>
  )
}
