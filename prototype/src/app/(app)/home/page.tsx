"use client"

import Link from "next/link"
import { Bell, CalendarRange, ChartLine, ClipboardCheck, MessageCircle, Plus, ShoppingBasket, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, HeaderIconButton, ListGroup, ListRow, PageBody, Pill, Section, SectionLink, Surface } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote, NutrientBar } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
import { ProfileSwitcher } from "@/components/app/profile-switcher"
import { InstallPrompt } from "@/components/app/pwa"
import { ChildHome } from "@/components/child/child-home"
import { TodayTimeline } from "@/components/home/today-timeline"
import { NextStepCard } from "@/components/home/next-step"
import { useApp, useActivePlan, useActiveProfile, useSelfProfile } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { adultTargets } from "@/lib/nutrition"
import { formatDay, todayISO } from "@/lib/date"
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
      <div className="px-gutter pt-4 pb-3">
        <div className="flex items-center gap-2.5">
          <p className="text-overline flex-1 text-muted-foreground">{formatDay(todayISO(), { weekday: "long", day: "numeric", month: "long" })}</p>
          <HeaderIconButton href="/notifications" label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
            <Bell className="size-[19px]" />
            {unread > 0 && <span className="absolute top-2 right-2.5 size-2 rounded-full bg-terracotta ring-2 ring-card" aria-hidden />}
          </HeaderIconButton>
          <ProfileSwitcher />
        </div>
        <h1 className="text-display mt-2">
          {hello}
          {profile?.relation === "self" ? `, ${profile.name.split(" ")[0]}` : ""}
        </h1>
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
  return (
    <PageBody className="pt-1">
      <Section title={t("dailySummary")} action={<SectionLink href="/log">Details</SectionLink>}>
        <Surface padding="lg">
          {targets.supported ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-caption text-muted-foreground">Eaten so far · estimate</p>
                  <p className="text-metric mt-1">
                    ~{Math.round(totals.energyKcal).toLocaleString("en-US")}
                    <span className="text-callout ml-1 font-normal tracking-normal text-muted-foreground">kcal</span>
                  </p>
                  {entries.length > 0 && (
                    <p className="tabular text-caption mt-0.5 text-muted-foreground">
                      Likely {Math.round(range.low).toLocaleString("en-US")}–{Math.round(range.high).toLocaleString("en-US")} kcal
                    </p>
                  )}
                </div>
                {meals.length > 0 && (
                  <Pill tone="sage">
                    {logged} of {meals.length} meals recorded
                  </Pill>
                )}
              </div>
              <div className="mt-5 space-y-4">
                <NutrientBar label="Energy" value={totals.energyKcal} low={targets.energy.low} high={targets.energy.high} unit="kcal" estimate />
                <NutrientBar label="Protein" value={totals.proteinG} low={targets.proteinG.low} high={targets.proteinG.high} unit="g" estimate />
                <NutrientBar label="Fiber" value={totals.fiberG} low={targets.fiberMinG} unit="g" kind="min" estimate />
              </div>
              <div className="mt-4 border-t border-border/70 pt-3">
                <EstimateNote>Counts recorded meals only{notLogged > 0 ? ` — ${notLogged} planned meal${notLogged === 1 ? "" : "s"} not recorded yet` : ""}.</EstimateNote>
              </div>
            </>
          ) : (
            <InfoNote title="Targets set with your care team">{targets.reason ?? "We don't show calorie targets for this profile."}</InfoNote>
          )}
        </Surface>
      </Section>

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
