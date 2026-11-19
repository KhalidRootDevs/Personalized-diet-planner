"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, BookHeart, Cake, ChartColumn, Check, ClipboardCheck, Crown, Database, Droplet, Globe, Link2, Lock, LogOut, Pencil, Plus, Ruler, Scale, Settings, ShieldCheck, Sparkles, Stethoscope, Target, TrendingUp, TriangleAlert, UserRound, Users } from "lucide-react"
import { useApp, useSelfProfile } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { HeaderIconButton, IconTile, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, SectionLink, Surface, type IconTone } from "@/components/app/page"
import { PhaseBadge } from "@/components/app/badges"
import { TIERS } from "@/lib/features"
import type { Tier } from "@/lib/types"
import { ProfileAvatar, profileAgeLabel } from "@/components/app/profile-switcher"
import { ALLERGENS, GOAL_LABEL } from "@/components/profile/options"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const router = useRouter()
  const self = useSelfProfile()
  const user = useApp((s) => s.user)
  const profiles = useApp((s) => s.profiles)
  const signOut = useApp((s) => s.signOut)
  const dependents = profiles.filter((p) => p.relation !== "self")

  return (
    <>
      <PageHeader large title="Profile" />
      <PageBody className="pt-1">
        {self && (
          <Surface tone="lime" padding="lg" className="relative overflow-hidden">
            <span className="absolute -top-12 -right-12 size-40 rounded-full bg-white/25" aria-hidden />
            <span className="absolute -bottom-16 -left-10 size-32 rounded-full bg-white/15" aria-hidden />
            <div className="relative flex items-center gap-3.5">
              <span className="rounded-full bg-white p-1 shadow-card">
                <ProfileAvatar profile={{ ...self, avatarColor: "forest" }} size="lg" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-title truncate">{self.name}</p>
                <p className="text-callout truncate text-charcoal/75">{user?.email}</p>
              </div>
              <HeaderIconButton href="/profile/edit" label="Edit profile">
                <Pencil className="size-[18px]" />
              </HeaderIconButton>
            </div>
            <div className="relative mt-5 grid grid-cols-3 gap-2">
              <BodyStat icon={<Cake />} tone="text-terracotta" label="Age" value={profileAgeLabel(self).replace(" years", "")} unit="yrs" />
              <BodyStat icon={<Ruler />} tone="text-water" label="Height" value={self.heightCm ?? "—"} unit={self.heightCm ? "cm" : undefined} />
              <BodyStat icon={<Scale />} tone="text-forest" label="Weight" value={self.weightKg ?? "—"} unit={self.weightKg ? "kg" : undefined} />
            </div>
            <div className="relative mt-2 divide-y divide-border/70 rounded-xl bg-white/80 px-3">
              <KeyValue
                label={
                  <span className="flex items-center gap-1.5">
                    <Target className="size-4 text-forest" aria-hidden /> Goal
                  </span>
                }
                value={GOAL_LABEL[self.goal ?? ""] ?? "Not set"}
              />
              <KeyValue
                label={
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-4 text-forest" aria-hidden /> Allergies
                  </span>
                }
                value={self.allergies.length ? self.allergies.map((a) => ALLERGENS.find((x) => x.value === a)?.label ?? a).join(", ") : "None recorded"}
              />
            </div>
          </Surface>
        )}

        <Shortcuts />

        <SubscriptionSection />

        <Section title="Family" action={<SectionLink href="/profile/family">Manage</SectionLink>}>
          <ListGroup>
            {dependents.map((d) => (
              <ListRow key={d.id} href="/profile/family" icon={<ProfileAvatar profile={d} />} iconTone="white" title={d.name} description={`${profileAgeLabel(d)} · managed by you`} />
            ))}
            <ListRow href="/profile/family" icon={<Plus />} iconTone="lime" title={dependents.length ? "Add a profile" : "Add a child profile"} description={dependents.length ? undefined : "Baby feeding and child nutrition"} />
          </ListGroup>
        </Section>

        <Section title="Account">
          <ListGroup>
            <ListRow href="/profile/edit" icon={<UserRound />} iconTone="lime" title="Personal details" description="Body, goal, lifestyle, food and health" />
            <ListRow href="/profile/notifications" icon={<Bell />} iconTone="amber" title="Reminders" description="Meals, prep, logging and weekly review" />
            <ListRow href="/profile/privacy" icon={<ShieldCheck />} iconTone="sage" title="Privacy and data" description="Permissions, export and deletion" />
            <ListRow href="/profile/integrations" icon={<Link2 />} iconTone="sky" title={<>Connected apps <PhaseBadge phase={2} /></>} description="Calendar, health apps and wearables" />
            <ListRow href="/profile/professional" icon={<Stethoscope />} iconTone="terracotta" title={<>Share with a dietitian <PhaseBadge phase={3} /></>} description="Access controls and reports" />
            <ListRow href="/profile/settings" icon={<Settings />} iconTone="muted" title="App settings" description="Language, photo credits and prototype options" />
          </ListGroup>
        </Section>

        <Section title="Help and safety">
          <ListGroup>
            <ListRow href="/safety/emergency" icon={<TriangleAlert />} iconTone="safety" title="Emergency guidance" description="When to stop and get medical help" />
          </ListGroup>
        </Section>

        <Section title="Staff tools" description="Prototype views for the NutriPlan team">
          <ListGroup>
            <ListRow href="/admin/reviews" icon={<ClipboardCheck />} iconTone="muted" title="Clinical review queue" description="Approve rules and flagged plans" />
            <ListRow href="/admin/analytics" icon={<ChartColumn />} iconTone="muted" title="Analytics and safety metrics" description="Usage and safety signals (prototype data)" />
            <ListRow href="/admin" icon={<Database />} iconTone="muted" title="Admin console" description="Foods, recipes, rules and translations" />
          </ListGroup>
        </Section>

        <div className="space-y-4 pt-1">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => {
              signOut()
              router.replace("/welcome")
            }}
          >
            <LogOut className="size-[18px]" /> Sign out
          </Button>
          <p className="text-caption flex items-center justify-center gap-1.5 text-center text-muted-foreground">
            <Globe className="size-3.5" aria-hidden /> NutriPlan prototype · v0.1 · Bangladesh
          </p>
        </div>
      </PageBody>
    </>
  )
}

function BodyStat({ icon, tone, label, value, unit }: { icon: React.ReactNode; tone: string; label: string; value: React.ReactNode; unit?: string }) {
  return (
    <div className="rounded-xl bg-white/80 px-3 py-2.5">
      <p className="text-caption flex items-center gap-1 text-muted-foreground">
        <span className={cn("[&_svg]:size-3.5", tone)} aria-hidden>
          {icon}
        </span>
        {label}
      </p>
      <p className="tabular text-headline mt-0.5">
        {value}
        {unit && <span className="text-caption font-normal text-muted-foreground"> {unit}</span>}
      </p>
    </div>
  )
}

/** Four everyday destinations, so Profile is a hub and not only settings. */
function Shortcuts() {
  const items: { href: string; label: string; icon: React.ReactNode; tone: IconTone }[] = [
    { href: "/progress", label: "Progress", icon: <TrendingUp />, tone: "lime" },
    { href: "/water", label: "Water", icon: <Droplet />, tone: "sky" },
    { href: "/recipes/library", label: "My recipes", icon: <BookHeart />, tone: "terracotta" },
    { href: "/plan/plans", label: "My plans", icon: <Target />, tone: "amber" },
  ]
  return (
    <nav aria-label="Shortcuts" className="grid grid-cols-4 gap-2.5">
      {items.map((i) => (
        <Link key={i.href} href={i.href} className="flex flex-col items-center gap-2 rounded-2xl bg-card px-1 py-3.5 shadow-card transition-colors hover:bg-muted/40">
          <IconTile tone={i.tone}>{i.icon}</IconTile>
          <span className="text-caption font-medium text-charcoal">{i.label}</span>
        </Link>
      ))}
    </nav>
  )
}

const TIER_LOOK: Record<Tier, { tone: IconTone; card: string; icon: React.ReactNode }> = {
  free: { tone: "lime", card: "bg-card", icon: <Sparkles /> },
  premium: { tone: "forest", card: "bg-gradient-to-br from-lime-card to-sage", icon: <Crown /> },
  family: { tone: "forest", card: "bg-gradient-to-br from-lime-card to-sage", icon: <Users /> },
  professional: { tone: "forest", card: "bg-gradient-to-br from-lime-card to-sage", icon: <Stethoscope /> },
}

/** Current plan, what it includes and the next step (§30). Tiers and prices are the §43.7 proposal in features.ts. */
function SubscriptionSection() {
  const tierId = useApp((s) => s.tier)
  const cycle = useApp((s) => s.billingCycle)
  const tier = TIERS.find((t) => t.id === tierId) ?? TIERS[0]
  const premium = TIERS.find((t) => t.id === "premium")!
  const look = TIER_LOOK[tier.id]
  const free = tier.id === "free"
  const price = cycle === "yearly" ? `৳${tier.yearly.toLocaleString("en-US")} / year` : `৳${tier.monthly.toLocaleString("en-US")} / month`

  return (
    <Section title="Your subscription" action={<SectionLink href="/subscription">{free ? "Compare plans" : "Manage"}</SectionLink>}>
      <div className={cn("relative overflow-hidden rounded-2xl p-5 shadow-card", look.card)}>
        <span className="absolute -top-12 -right-12 size-36 rounded-full bg-lime/25" aria-hidden />
        <div className="relative flex items-center gap-3">
          <IconTile tone={look.tone} size="lg">
            {look.icon}
          </IconTile>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-title truncate">NutriPlan {tier.name}</p>
              <Pill tone={free ? "neutral" : "forest"}>{free ? "Current" : "Active"}</Pill>
            </div>
            <p className="text-callout text-muted-foreground">{free ? tier.tagline : `${price} · billed ${cycle}`}</p>
          </div>
        </div>

        <div className="relative mt-4 rounded-xl bg-white/80 p-3.5">
          <p className="text-overline text-lime-text">{free ? "Included in your plan" : "Your plan includes"}</p>
          <ul className="mt-2 space-y-2">
            {tier.features.slice(0, 4).map((f) => (
              <li key={f} className="text-callout flex items-start gap-2.5">
                <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lime text-charcoal">
                  <Check className="size-3" strokeWidth={3} aria-hidden />
                </span>
                {f}
              </li>
            ))}
          </ul>
        </div>

        {free && (
          <div className="relative mt-3 rounded-xl border border-dashed border-border bg-background/60 p-3.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-overline text-muted-foreground">With Premium</p>
              <p className="text-caption tabular font-semibold text-charcoal">from ৳{premium.monthly} / month</p>
            </div>
            <ul className="mt-2 space-y-2">
              {premium.features.slice(0, 3).map((f) => (
                <li key={f} className="text-callout flex items-start gap-2.5 text-charcoal/80">
                  <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-muted text-muted-grey">
                    <Lock className="size-3" aria-hidden />
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="relative mt-4 flex gap-2">
          <Button asChild size="lg" className="flex-1">
            <Link href="/subscription">{free ? "See Premium" : "Manage plan"}</Link>
          </Button>
        </div>

        <p className="text-caption relative mt-3 flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="size-4 shrink-0 text-forest" aria-hidden /> Allergy and safety protection is free on every plan.
        </p>
      </div>
    </Section>
  )
}
