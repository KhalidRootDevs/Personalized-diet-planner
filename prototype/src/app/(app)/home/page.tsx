"use client"

import { useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Baby, Beef, Bell, CalendarDays, CalendarRange, ChartLine, ChefHat, ClipboardCheck, Droplet, MessageCircle, Minus, Pause, Play, Plus, ShoppingBasket, Sparkles, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmptyState, HeaderIconButton, IconTile, ListGroup, ListRow, PageBody, Section, SectionLink, Surface, type IconTone } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { EstimateNote, Ring } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
import { ProfileSwitcher } from "@/components/app/profile-switcher"
import { InstallPrompt } from "@/components/app/pwa"
import { ChildHome } from "@/components/child/child-home"
import { HomeEntryCard, HomeMealCard } from "@/components/home/meal-card"
import { WeekStrip } from "@/components/app/week-strip"
import { NextStepCard } from "@/components/home/next-step"
import { useApp, useActivePlan, useActiveProfile, usePausedPlan, useSelfProfile } from "@/lib/store"
import { useT } from "@/lib/i18n"
import { adultTargets, hydrationGuide } from "@/lib/nutrition"
import { addDays, formatDay, nowHHMM, todayISO } from "@/lib/date"
import { MEAL_LABEL } from "@/lib/planning"
import { useRecipeLookup } from "@/lib/area-c-utils"
import type { Profile } from "@/lib/types"
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
  const paused = usePausedPlan()
  const setPlanStatus = useApp((s) => s.setPlanStatus)
  const profiles = useApp((s) => s.profiles)
  const setActive = useApp((s) => s.setActiveProfile)
  const journal = useApp((s) => s.journal)
  const t = useT()
  const today = todayISO()
  const [day, setDay] = useState(() => (plan && plan.startDate > today ? plan.startDate : today))
  const isToday = day === today
  const todayEntries = entriesFor(journal, self.id, today)
  const totals = dayRange(todayEntries).mid
  const targets = adultTargets(self)
  const todayMeals = (plan?.meals ?? []).filter((m) => m.date === today)
  const notLogged = todayMeals.filter((m) => !m.outcome).length
  const logged = todayMeals.length - notLogged
  const conf = recordConfidence(journal, plan, self.id, today)

  const dayMeals = (plan?.meals ?? []).filter((m) => m.date === day).sort((a, b) => a.time.localeCompare(b.time))
  const dayEntries = entriesFor(journal, self.id, day)
  const linked = new Set(dayMeals.map((m) => m.linkedJournalEntryId).filter(Boolean))
  const extra = dayEntries.filter((e) => !linked.has(e.id) && !e.linkedPlannedMealId)
  const now = nowHHMM()
  const nextId = isToday ? dayMeals.find((m) => !m.outcome && m.time >= now)?.id : undefined
  const planDays = new Set((plan?.meals ?? []).map((m) => m.date))
  const lookupRecipe = useRecipeLookup()
  const waterReminder = useApp((s) => s.settings.reminders.water?.enabled)
  // Daily tasks beside meals (§42.16): prep for the next day's prep-ahead meals, and a water check-in.
  const tasks: { time: string; key: string; node: React.ReactNode }[] = []
  for (const m of (plan?.meals ?? []).filter((m) => m.date === addDays(day, 1) && m.prepLater && !m.outcome)) {
    const r = lookupRecipe(m.recipeId)
    if (r) tasks.push({ time: "19:30", key: `prep-${m.id}`, node: <TaskCard href="/plan/prep" icon={<ChefHat />} tone="amber" title="Prep for tomorrow" body={`${r.name} · ${MEAL_LABEL[m.mealType].toLowerCase()}`} time="7:30 PM" /> })
  }
  if (waterReminder) tasks.push({ time: "15:00", key: "water", node: <TaskCard href="/profile/notifications" icon={<Droplet />} tone="sky" title="Water check-in" body="A reminder you turned on · every 2 hours" time="3:00 PM" /> })

  const n = (v: number) => Math.round(v).toLocaleString("en-US")
  if (self.caregiverOnly) {
    const kids = profiles.filter((p) => p.relation !== "self")
    return (
      <PageBody className="space-y-5 pt-1">
        <Surface tone="lime" padding="lg">
          <p className="text-title">You’re set up as a caregiver</p>
          <p className="text-callout mt-1 text-charcoal/80">Switch to a child’s profile for feeding plans, or add your own nutrition profile when you’re ready.</p>
        </Surface>
        {kids.length > 0 && (
          <ListGroup>
            {kids.map((k) => (
              <ListRow key={k.id} onClick={() => setActive(k.id)} icon={<Baby />} iconTone="sage" title={k.name} description="Open feeding view" />
            ))}
          </ListGroup>
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href="/profile/edit">Add my own nutrition profile</Link>
        </Button>
      </PageBody>
    )
  }
  return (
    <PageBody className="space-y-5 pt-1">
      {targets.supported ? (
        <section aria-label={t("dailySummary")} className="space-y-3">
          <Link href="/log" className="block">
            <Surface tone="lime" padding="lg" className="relative overflow-hidden transition-transform active:scale-[0.99]">
              <span className="absolute -top-12 -right-12 size-40 rounded-full bg-white/25" aria-hidden />
              <div className="relative flex items-center gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-caption inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 font-medium">
                    <Zap className="size-3.5" aria-hidden /> Daily intake · estimate
                  </p>
                  <p className="mt-3 text-[22px] leading-tight font-bold tracking-tight">Today so far</p>
                  <p className="mt-1 text-[30px] leading-none font-bold tracking-tight tabular">
                    ~{n(totals.energyKcal)}
                    <span className="text-callout ml-1 font-medium tracking-normal text-charcoal/70">kcal</span>
                  </p>
                  <p className="text-caption mt-1.5 text-charcoal/75 tabular">
                    Day range {n(targets.energy.low)}–{n(targets.energy.high)} kcal
                  </p>
                </div>
                <Ring value={logged} max={todayMeals.length} size={108} stroke={12} color="var(--forest-green)" label={`${logged} of ${todayMeals.length} planned meals recorded today`}>
                  <div className="grid size-[64px] place-items-center rounded-full bg-white/70">
                    <div>
                      <p className="text-[22px] leading-none font-bold tabular">{logged}</p>
                      <p className="text-[11px] font-medium text-charcoal/75">of {todayMeals.length} meals</p>
                    </div>
                  </div>
                </Ring>
              </div>
            </Surface>
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <WaterTile profile={self} />
            <ProteinTile value={totals.proteinG} target={`${n(targets.proteinG.low)}–${n(targets.proteinG.high)} g`} />
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

      {plan ? (
        <section aria-label={t("todaysPlan")} className="space-y-3">
          <WeekStrip value={day} onChange={setDay} marked={(d) => planDays.has(d)} />
          <div className="flex min-h-7 items-center justify-between">
            <h2 className="text-headline">{isToday ? t("todaysPlan") : formatDay(day, { weekday: "long", day: "numeric", month: "short" })}</h2>
            <div className="flex items-center gap-3">
              {!isToday && (
                <button type="button" onClick={() => setDay(today)} className="text-callout font-semibold text-forest">
                  Today
                </button>
              )}
              <SectionLink href="/plan">Full plan</SectionLink>
            </div>
          </div>
          {dayMeals.length || extra.length ? (
            <ol className="space-y-3">
              {[
                ...dayMeals.map((m) => ({ time: m.time, key: m.id, node: <HomeMealCard meal={m} highlight={m.id === nextId} isToday={isToday} /> })),
                ...extra.map((e) => ({ time: e.consumedAt.slice(11, 16), key: e.id, node: <HomeEntryCard entry={e} /> })),
                ...tasks,
              ]
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((r) => (
                  <li key={r.key}>{r.node}</li>
                ))}
            </ol>
          ) : (
            <p className="text-callout rounded-2xl bg-card p-4 text-muted-foreground shadow-card">No meals planned for this day.</p>
          )}
        </section>
      ) : paused ? (
        <Section title={t("todaysPlan")}>
          <Surface padding="lg" className="flex items-center gap-3">
            <IconTile tone="amber" size="lg">
              <Pause />
            </IconTile>
            <div className="min-w-0 flex-1">
              <p className="text-headline">Plan paused</p>
              <p className="text-caption text-muted-foreground">{paused.title} · meals and reminders are on hold</p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => setPlanStatus(paused.id, "active")}>
              <Play className="size-4" /> Resume
            </Button>
          </Surface>
        </Section>
      ) : (
        <Section title={t("todaysPlan")}>
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
        </Section>
      )}

      <NextStepCard meals={todayMeals} />

      <Section title="More for you">
        <ListGroup>
          <ListRow href="/progress/weekly-review" icon={<ClipboardCheck />} iconTone="lime" title="Weekly review" description="How the week went and one focus for next week" />
          <ListRow href="/progress" icon={<ChartLine />} iconTone="sky" title="Trends" description="Intake, meals and weight over time" />
          <ListRow href="/plan/shopping" icon={<ShoppingBasket />} iconTone="amber" title="Shopping list" description="Built from this week's plan" />
          <ListRow
            href="/coach"
            icon={<MessageCircle />}
            iconTone="terracotta"
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
            iconTone="sage"
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

function TaskCard({ href, icon, tone, title, body, time }: { href: string; icon: React.ReactNode; tone: IconTone; title: string; body: string; time: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3 shadow-card transition-colors hover:bg-muted/40">
      <IconTile tone={tone}>{icon}</IconTile>
      <div className="min-w-0 flex-1">
        <p className="text-body font-semibold">{title}</p>
        <p className="text-caption truncate text-muted-foreground">{body}</p>
      </div>
      <span className="text-caption tabular shrink-0 text-muted-foreground">{time}</span>
    </Link>
  )
}

/** Water tile (§6.7). Records glasses; no universal fluid prescription when a condition needs individual advice. */
function WaterTile({ profile }: { profile: Profile }) {
  const today = todayISO()
  const glasses = useApp((s) => s.water?.[`${profile.id}:${today}`] ?? 0)
  const addWater = useApp((s) => s.addWater)
  const guide = hydrationGuide(profile)
  return (
    <div className="rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <p className="text-callout leading-tight font-medium">
          Drink
          <br />
          water
        </p>
        <IconTile tone="sky" size="sm">
          <Droplet />
        </IconTile>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p className="text-[26px] leading-none font-bold tracking-tight tabular">
          {glasses}
          <span className="text-caption ml-1 font-medium tracking-normal text-muted-foreground">glass{glasses === 1 ? "" : "es"}</span>
        </p>
        <div className="flex gap-1">
          <button type="button" onClick={() => addWater(profile.id, today, -1)} disabled={!glasses} aria-label="Remove a glass of water" className="grid size-8 place-items-center rounded-full bg-muted transition-colors hover:bg-border disabled:opacity-40">
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              addWater(profile.id, today, 1)
              toast(`Water recorded · ${glasses + 1} glass${glasses + 1 === 1 ? "" : "es"} today`)
            }}
            aria-label="Add a glass of water"
            className="grid size-8 place-items-center rounded-full bg-sky-tint text-sky-text transition-colors hover:bg-water/30"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>
      <p className="text-caption mt-1.5 text-muted-foreground">{guide.kind === "range" ? `General range ${guide.lowGlasses}–${guide.highGlasses} a day` : "Follow your care team's advice"}</p>
    </div>
  )
}

function ProteinTile({ value, target }: { value: number; target: string }) {
  return (
    <Link href="/log" className="rounded-2xl bg-card p-4 shadow-card transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-2">
        <p className="text-callout leading-tight font-medium">
          Protein
          <br />
          eaten
        </p>
        <IconTile tone="sage" size="sm">
          <Beef />
        </IconTile>
      </div>
      <p className="mt-2 text-[26px] leading-none font-bold tracking-tight tabular">
        ~{Math.round(value)}
        <span className="text-caption ml-1 font-medium tracking-normal text-muted-foreground">g</span>
      </p>
      <p className="text-caption mt-1.5 text-muted-foreground tabular">Range {target}</p>
    </Link>
  )
}
