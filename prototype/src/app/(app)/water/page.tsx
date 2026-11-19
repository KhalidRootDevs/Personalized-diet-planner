"use client"

import Link from "next/link"
import { Bell, CupSoda, Droplets, GlassWater, Info, Minus, Sun, Undo2, Utensils, Milk } from "lucide-react"
import { IconTile, ListGroup, ListRow, PageBody, PageHeader, Section, Surface } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { Splash } from "@/components/app/shell"
import { GlassRow, WaterGlass, useWater, waterStatus } from "@/components/water/water"
import { useActiveProfile, useApp } from "@/lib/store"
import { addDays, todayISO } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

/** Hydration (§6.7): one glass at a time toward a general range, paced across the day. */
export default function WaterPage() {
  const profile = useActiveProfile()
  if (!profile) return <Splash />
  if (profile.type === "infant") return <InfantWater profile={profile} />
  return <WaterTracker profile={profile} />
}

function WaterTracker({ profile }: { profile: Profile }) {
  const { glasses, guide, add, splash } = useWater(profile)
  const reminderOn = useApp((s) => s.settings.reminders?.water?.enabled ?? false)
  const status = waterStatus(glasses, guide, undefined, profile.schedule?.wake, profile.schedule?.sleep)
  const child = profile.type === "child"
  const ml = guide.kind === "range" ? guide.glassMl : 250
  const outdoors = !!profile.work?.outdoorsOrHeat
  const toneStyle = {
    start: "bg-sky-tint text-sky-text",
    on_pace: "bg-sage text-lime-text",
    nudge: "bg-sky-tint text-sky-text",
    in_range: "bg-lime text-charcoal",
    above: "bg-amber-tint text-amber-text",
    individual: "bg-muted text-charcoal",
  }[status.tone]

  return (
    <>
      <PageHeader back title={child ? `${profile.name}'s water` : "Water"} subtitle={guide.kind === "range" ? `General range ${guide.lowGlasses}–${guide.highGlasses} glasses (~${ml} ml each)` : "Amount set by your care team"} />
      <PageBody>
        {/* Hero: the glass, today's count and where it stands */}
        <Surface padding="lg" className="relative overflow-hidden bg-gradient-to-b from-sky-tint/80 to-card">
          <span className="absolute -top-10 -left-10 size-36 rounded-full bg-white/50" aria-hidden />
          <div className="relative flex items-center gap-5">
            <WaterGlass glasses={glasses} guide={guide} splash={splash} />
            <div className="min-w-0 flex-1">
              <p className="text-overline text-sky-text">Today</p>
              <p className="tabular mt-1 text-[48px] leading-none font-bold tracking-tight">{glasses}</p>
              <p className="text-callout mt-1 font-medium text-muted-foreground">{guide.kind === "range" ? `of ${guide.lowGlasses}–${guide.highGlasses} glasses` : glasses === 1 ? "glass" : "glasses"}</p>
              <p className="text-caption tabular mt-0.5 text-muted-foreground">≈ {((glasses * ml) / 1000).toLocaleString("en-US", { maximumFractionDigits: 1 })} L from water</p>
              {guide.kind === "range" && (
                <ul className="text-caption mt-3 space-y-1 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-4 border-t-2 border-dashed border-sky-text/50" aria-hidden /> Range starts at {guide.lowGlasses}
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="h-2.5 w-4 rounded-sm bg-water" aria-hidden /> Full glass = {guide.highGlasses}
                  </li>
                </ul>
              )}
            </div>
            <button type="button" onClick={() => add(-1, { toast: false })} disabled={!glasses} aria-label="Remove a glass" className="absolute top-0 right-0 grid size-10 place-items-center rounded-full bg-card shadow-card transition-colors hover:bg-muted disabled:opacity-40">
              <Minus className="size-5" />
            </button>
          </div>
          <div className={cn("relative mt-4 rounded-2xl px-4 py-3", toneStyle)} aria-live="polite">
            <p className="text-callout font-semibold">{status.headline}</p>
            <p className="text-caption mt-0.5 opacity-90">{status.detail}</p>
          </div>
        </Surface>

        {/* Quick add */}
        <div className="grid grid-cols-3 gap-2.5">
          <QuickAdd icon={<GlassWater />} label="Glass" sub={`~${ml} ml`} onClick={() => add(1)} primary />
          <QuickAdd icon={<CupSoda />} label="Bottle" sub={`~${ml * 2} ml`} onClick={() => add(2)} />
          <QuickAdd icon={<Undo2 />} label="Undo" sub="Last glass" onClick={() => add(-1, { toast: false })} disabled={!glasses} />
        </div>

        {guide.kind === "range" ? (
          <Section title="Tap to fill" description="Each glass is one tap. The marked glasses are your general range.">
            <GlassRow glasses={glasses} guide={guide} onSet={(n) => add(n - glasses, { toast: n > glasses })} />
            <PaceBar glasses={glasses} low={guide.lowGlasses} high={guide.highGlasses} pace={status.pace} />
          </Section>
        ) : (
          <InfoNote title="Your amount is individual">{guide.note} You can still record glasses here to share with your care team.</InfoNote>
        )}

        <WeekChart profile={profile} low={guide.kind === "range" ? guide.lowGlasses : undefined} high={guide.kind === "range" ? guide.highGlasses : undefined} />

        <Section title={child ? "Helping them drink enough" : "Easy ways to drink enough"}>
          <ListGroup>
            <ListRow icon={<Utensils />} iconTone="lime" title="A glass with every meal" description={child ? "Offer water with meals and snacks." : "Three meals is already three glasses."} />
            <ListRow icon={<Sun />} iconTone="amber" title={outdoors ? "Extra in the heat at work" : "More in hot weather"} description={outdoors ? "Working outdoors or in heat: drink regularly, before you feel very thirsty." : "Bangladesh summers and humid days raise what you need."} />
            <ListRow icon={<Milk />} iconTone="sky" title="Other drinks count too" description={child ? "Milk counts. Avoid sugary drinks and juice as a habit." : "Milk, tea and soups add fluid. Sugary drinks are best kept occasional."} />
            <ListRow
              href="/profile/notifications"
              icon={<Bell />}
              iconTone="terracotta"
              title="Water reminders"
              description={reminderOn ? "On · gentle nudges through the day" : "Off · turn on gentle nudges"}
            />
          </ListGroup>
        </Section>

        <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
          <Info className="mt-px size-4 shrink-0" /> {guide.note} If you have kidney or heart problems, follow your care team&apos;s fluid advice.
        </p>
      </PageBody>
    </>
  )
}

function QuickAdd({ icon, label, sub, onClick, primary, disabled }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; primary?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3.5 transition-transform active:scale-95 disabled:opacity-40 [&_svg]:size-6",
        primary ? "bg-water text-white shadow-[0_10px_24px_-12px_rgba(14,165,233,0.9)]" : "bg-card text-charcoal shadow-card",
      )}
    >
      <span className={cn("grid size-11 place-items-center rounded-full", primary ? "bg-white/20" : "bg-sky-tint text-sky-text")}>{icon}</span>
      <span className="text-callout font-semibold">{primary ? `+ ${label}` : label}</span>
      <span className={cn("text-caption", primary ? "text-white/85" : "text-muted-foreground")}>{sub}</span>
    </button>
  )
}

/** Progress along the range with a "steady pace" marker. Labelled in text, not color alone. */
function PaceBar({ glasses, low, high, pace }: { glasses: number; low: number; high: number; pace: number }) {
  const max = high + 2
  const pct = (n: number) => `${Math.min(100, (n / max) * 100)}%`
  return (
    <div className="mt-4 rounded-2xl bg-card p-4 shadow-card">
      <div className="text-caption flex justify-between text-muted-foreground">
        <span>Steady pace by now: ~{pace}</span>
        <span className="tabular font-semibold text-charcoal">{glasses} recorded</span>
      </div>
      <div className="relative mt-3 h-3 rounded-full bg-muted">
        <span className="absolute inset-y-0 rounded-full bg-sky-tint" style={{ left: pct(low), width: `calc(${pct(high)} - ${pct(low)})` }} aria-hidden />
        <span className="absolute inset-y-0 left-0 rounded-full bg-water transition-[width] duration-500" style={{ width: pct(glasses) }} aria-hidden />
        <span className="absolute -top-1 h-5 w-0.5 rounded-full bg-charcoal/60" style={{ left: pct(pace) }} aria-hidden />
      </div>
      <div className="text-caption tabular relative mt-1.5 h-4 text-muted-foreground">
        <span className="absolute -translate-x-1/2" style={{ left: pct(low) }}>
          {low}
        </span>
        <span className="absolute -translate-x-1/2" style={{ left: pct(high) }}>
          {high}
        </span>
      </div>
    </div>
  )
}

function WeekChart({ profile, low, high }: { profile: Profile; low?: number; high?: number }) {
  const water = useApp((s) => s.water)
  const today = todayISO()
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
  const values = days.map((d) => water?.[`${profile.id}:${d}`] ?? 0)
  const max = Math.max(high ?? 8, ...values) + 1
  const inRange = low ? values.filter((v) => v >= low).length : 0
  return (
    <Section title="This week" description={low ? `In the general range on ${inRange} of 7 days` : "Glasses recorded each day"}>
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="relative flex h-36 items-end gap-2" role="img" aria-label={`Glasses per day this week: ${values.join(", ")}`}>
          {low && high && (
            <span className="absolute inset-x-0 rounded-md bg-sky-tint/70" style={{ bottom: `${(low / max) * 100}%`, height: `${((high - low) / max) * 100}%` }} aria-hidden />
          )}
          {values.map((v, i) => (
            <div key={days[i]} className="relative flex h-full flex-1 flex-col items-center justify-end">
              <span className="tabular text-caption mb-1 font-semibold">{v || ""}</span>
              <span className={cn("w-full max-w-7 rounded-t-lg rounded-b-sm", i === 6 ? "bg-water" : "bg-water/55")} style={{ height: `${Math.max(v ? 4 : 0, (v / max) * 100)}%` }} />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          {days.map((d, i) => (
            <span key={d} className={cn("text-caption flex-1 text-center", i === 6 ? "font-semibold text-charcoal" : "text-muted-foreground")}>
              {i === 6 ? "Today" : new Date(d + "T00:00").toLocaleDateString("en-US", { weekday: "short" })}
            </span>
          ))}
        </div>
        {low && high && (
          <p className="text-caption mt-3 flex items-center gap-1.5 text-muted-foreground">
            <span className="h-2.5 w-4 rounded-sm bg-sky-tint" aria-hidden /> General range {low}–{high} glasses
          </p>
        )}
      </div>
    </Section>
  )
}

function InfantWater({ profile }: { profile: Profile }) {
  const { guide } = useWater(profile)
  return (
    <>
      <PageHeader back title={`${profile.name}'s drinks`} />
      <PageBody>
        <Surface tone="lime" padding="lg" className="flex items-start gap-3">
          <IconTile tone="sky">
            <Droplets />
          </IconTile>
          <div>
            <p className="text-headline">Milk is the main drink</p>
            <p className="text-callout mt-1 text-charcoal/80">{guide.note}</p>
          </div>
        </Surface>
        <InfoNote title="No water target for babies">We don&apos;t count glasses for babies. Follow your baby&apos;s cues and your health worker&apos;s advice.</InfoNote>
        <Link href="/child" className="text-callout font-semibold text-forest">
          Back to feeding
        </Link>
      </PageBody>
    </>
  )
}
