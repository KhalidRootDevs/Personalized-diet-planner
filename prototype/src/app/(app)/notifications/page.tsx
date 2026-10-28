"use client"

import Link from "next/link"
import { Bell, ChevronRight, Settings } from "lucide-react"
import { formatDay, formatTime, todayISO } from "@/lib/date"
import { useApp } from "@/lib/store"
import { cn } from "@/lib/utils"
import type { AppNotification } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { EmptyState, PageBody, PageHeader, Section } from "@/components/app/page"

function when(iso: string) {
  const day = iso.slice(0, 10)
  const time = formatTime(iso.slice(11, 16))
  return day === todayISO() ? `Today, ${time}` : `${formatDay(day)}, ${time}`
}

function Item({ n }: { n: AppNotification }) {
  const body = (
    <div className={cn("flex gap-3 rounded-xl border bg-card p-3", !n.read && "border-forest/30 bg-sage/30")}>
      <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-forest")} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-medium">
          {n.title}
          {!n.read && <span className="sr-only"> (unread)</span>}
        </p>
        <p className="text-sm text-muted-foreground">{n.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">{when(n.createdAt)}</p>
      </div>
      {n.href && <ChevronRight className="mt-1 size-4 shrink-0 text-muted-grey" />}
    </div>
  )
  return <li>{n.href ? <Link href={n.href}>{body}</Link> : body}</li>
}

/** Notification inbox (§26). Reminder preferences live in Profile → Notifications. */
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
          <Button asChild size="icon" variant="ghost" aria-label="Notification settings">
            <Link href="/profile/notifications">
              <Settings className="size-5" />
            </Link>
          </Button>
        }
      />
      <PageBody>
        {sorted.length === 0 ? (
          <EmptyState icon={<Bell className="size-6" />} title="You're all caught up" description="Meal reminders and updates will appear here." />
        ) : (
          <>
            {unread.length > 0 && (
              <Section title={`New (${unread.length})`} action={<Button variant="ghost" size="sm" onClick={markRead}>Mark all read</Button>}>
                <ul className="space-y-2">
                  {unread.map((n) => (
                    <Item key={n.id} n={n} />
                  ))}
                </ul>
              </Section>
            )}
            {read.length > 0 && (
              <Section title="Earlier">
                <ul className="space-y-2">
                  {read.map((n) => (
                    <Item key={n.id} n={n} />
                  ))}
                </ul>
              </Section>
            )}
          </>
        )}
        <Link href="/profile/notifications" className="block text-center text-sm font-medium text-forest underline underline-offset-2">
          Choose which reminders you get
        </Link>
      </PageBody>
    </>
  )
}
