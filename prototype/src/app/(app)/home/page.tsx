"use client"

import Link from "next/link"
import { Beef, Bell, CalendarDays, CalendarRange, ChartLine, ClipboardCheck, MessageCircle, Plus, ShoppingBasket, Sparkles, Wheat, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, HeaderIconButton, IconTile, ListGroup, ListRow, PageBody, Section, SectionLink, Surface, type IconTone } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote, Ring } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
import { ProfileSwitcher } from "@/components/app/profile-switcher"
import { InstallPrompt } from "@/components/app/pwa"
import { ChildHome } from "@/components/child/child-home"
import { TodayTimeline } from "@/components/home/today-timeline"
import { NextStepCard } from "@/components/home/next-step"
import { useApp, useActivePlan, useActiveProfile, useSelfProfile } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { adultTargets } from "@/lib/nutrition"
import { todayISO } from "@/lib/date"
import { dayRange, entriesFor } from "@/lib/area-b-log"
import { recordConfidence } from "@/lib/area-d-stats"

/** Home (§44.6): greeting → daily summary → meal timeline → one next step → secondary details. */
export default function HomePage() {
  const profile = useActiveProfile()
  const self = useSelfProfile()
  const unread = useApp((s) => s.notifications.filter((n) => !n.read).length)
  const t = useT()
  const hour = new Date().getHours()
  const hello = hour < 12 ? t("goodMorning") : hour < 17 ? t("goodAfternoon") : t("goodEvening")

  const header = (
    <header className="sticky top-0 z-20 bg-background/92 pt-safe backdrop-blur-md">
      <div className="px-gutter flex items-center gap-3 pt-4 pb-3">
        <ProfileSwitcher />
        <div className="min-w-0 flex-1">
          <p className="text-caption text-muted-foreground">{hello}</p>
          <h1 className="text-headline truncate">{profile?.relation === "self" ? profile.name : (profile?.name ?? "")}</h1>
        </div>
        <HeaderIconButton href="/plan" label="Plan calendar">
          <CalendarDays className="size-[19px]" />
        </HeaderIconButton>
        <HeaderIconButton href="/notifications" label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
          <Bell className="size-[19px]" />
          {unread > 0 && <span className="absolute top-2.5 right-3 size-2 rounded-full bg-terracotta ring-2 ring-card" aria-hidden />}
        </HeaderIconButton>
      </div>
    </header>
  )

  if (profile && profile.type !== "adult") {
    return (
      <>
        {header}
        <ChildHome profile={profile} />
      </>
    )
  }

  return (
    <>
      {header}
      <InstallPrompt />
      {self ? <AdultHome /> : null}
    </>
  )
}

function AdultHome() {
  const self = useSelfProfile()!
  const plan = useActivePlan()
  const journal = useApp((s) => s.journal)
  const t = useT()
  const today = todayISO()
  const entries = entriesFor(journal, self.id, today)
  const range = dayRange(entries)
  const totals = range.mid
  const targets = adultTargets(self)
  const meals = (plan?.meals ?? []).filter((m) => m.date === today)
  const notLogged = meals.filter((m) => !m.outcome).length
  const conf = recordConfidence(journal, plan, self.id, today)

  const logged = meals.length - notLogged
  const n = (v: number) => Math.round(v).toLocaleString("en-US")
  return (
    <PageBody className="space-y-6 pt-1">
      {targets.supported ? (
        <section aria-label={t("dailySummary")} className="space-y-3">
          <Surface tone="lime" padding="lg" className="relative overflow-hidden">
            <span className="absolute -top-10 -right-10 size-36 rounded-full bg-white/25" aria-hidden />
            <div className="relative flex items-center gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-caption inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 font-medium">
                  <Zap className="size-3.5" aria-hidden /> Eaten today · estimate
                </p>
                <p className="mt-3 text-[34px] leading-none font-bold tracking-tight tabular">
                  ~{n(totals.energyKcal)}
                  <span className="text-callout ml-1 font-medium tracking-normal text-charcoal/70">kcal</span>
                </p>
                <p className="text-caption mt-1.5 text-charcoal/75 tabular">
                  Day range {n(targets.energy.low)}–{n(targets.energy.high)} kcal
                </p>
              </div>
              <Ring value={logged} max={meals.length} size={112} stroke={12} color="var(--charcoal)" label={`${logged} of ${meals.length} planned meals recorded today`}>
                <p className="text-[22px] leading-none font-bold tabular">{logged}</p>
                <p className="text-[11px] font-medium text-charcoal/75">of {meals.length} recorded</p>
              </Ring>
            </div>
          </Surface>
          <div className="grid grid-cols-2 gap-3">
            <MacroTile icon={<Beef />} tone="sky" label="Protein" value={totals.proteinG} target={`${n(targets.proteinG.low)}–${n(targets.proteinG.high)} g`} />
            <MacroTile icon={<Wheat />} tone="amber" label="Fiber" value={totals.fiberG} target={`at least ${n(targets.fiberMinG)} g`} />
          </div>
          <EstimateNote>Counts recorded meals only{notLogged > 0 ? ` — ${notLogged} planned meal${notLogged === 1 ? "" : "s"} not recorded yet` : ""}.</EstimateNote>
        </section>
      ) : (
        <Surface padding="lg">
          <InfoNote title="Targets set with your care team">{targets.reason ?? "We don't show calorie targets for this profile."}</InfoNote>
        </Surface>
      )}

      <Button asChild size="lg" className="w-full">
        <Link href="/log/new">
          <Plus className="size-5" /> {t("logMeal")}
        </Link>
      </Button>

      <Section title={t("todaysPlan")} action={plan && <SectionLink href="/plan">Full plan</SectionLink>}>
        {plan ? (
          <TodayTimeline meals={meals} entries={entries} />
        ) : (
          <EmptyState
            icon={<CalendarRange />}
            title="No active meal plan"
            description="Create a 3- or 7-day plan built around your schedule, budget and food preferences."
            action={
              <Button asChild variant="outline">
                <Link href="/plan/generate">Create a plan</Link>
              </Button>
            }
          />
        )}
      </Section>

      <NextStepCard meals={meals} />

      <Section title="More for you">
        <ListGroup>
          <ListRow href="/progress/weekly-review" icon={<ClipboardCheck />} title="Weekly review" description="How the week went and one focus for next week" />
          <ListRow href="/progress" icon={<ChartLine />} title="Trends" description="Intake, meals and weight over time" />
          <ListRow href="/plan/shopping" icon={<ShoppingBasket />} title="Shopping list" description="Built from this week's plan" />
          <ListRow
            href="/coach"
            icon={<MessageCircle />}
            title={
              <>
                Ask the coach <FeatureBadge feature="coach" />
              </>
            }
            description="Answers from your own plan and log"
          />
          <ListRow
            href="/progress/insights"
            icon={<Sparkles />}
            title={
              <>
                Record confidence <FeatureBadge feature="confidence" />
              </>
            }
            description={`Today: ${conf.level.toLowerCase()} · how complete your record is`}
          />
        </ListGroup>
      </Section>
    </PageBody>
  )
}

function MacroTile({ icon, tone, label, value, target }: { icon: React.ReactNode; tone: IconTone; label: string; value: number; target: string }) {
  return (
    <Link href="/log" className="rounded-2xl bg-card p-4 shadow-card transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-2">
        <p className="text-callout font-medium">{label}</p>
        <IconTile tone={tone} size="sm">
          {icon}
        </IconTile>
      </div>
      <p className="mt-2 text-[24px] leading-none font-bold tracking-tight tabular">
        ~{Math.round(value)}
        <span className="text-caption ml-1 font-medium tracking-normal text-muted-foreground">g</span>
      </p>
      <p className="text-caption mt-1 text-muted-foreground tabular">{target}</p>
    </Link>
  )
}
