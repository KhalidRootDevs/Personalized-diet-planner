"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Bell, Cake, ChevronRight, ClipboardCheck, Crown, Globe, Link2, LogOut, Pencil, Plus, Ruler, Scale, Settings, ShieldCheck, Stethoscope, Target, TriangleAlert, UserRound } from "lucide-react"
import { useApp, useSelfProfile } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { HeaderIconButton, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Section, SectionLink, Surface } from "@/components/app/page"
import { PhaseBadge, TierPill } from "@/components/app/badges"
import { ProfileAvatar, profileAgeLabel } from "@/components/app/profile-switcher"
import { ALLERGENS, GOAL_LABEL } from "@/components/profile/options"
import { cn } from "@/lib/utils"

export default function ProfilePage() {
  const router = useRouter()
  const self = useSelfProfile()
  const user = useApp((s) => s.user)
  const profiles = useApp((s) => s.profiles)
  const tier = useApp((s) => s.tier)
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
              {self.allergies.length > 0 && (
                <KeyValue
                  label={
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="size-4 text-forest" aria-hidden /> Allergy protection
                    </span>
                  }
                  value={self.allergies.map((a) => ALLERGENS.find((x) => x.value === a)?.label ?? a).join(", ")}
                />
              )}
            </div>
          </Surface>
        )}

        <Link href="/subscription" className="flex items-center gap-3.5 rounded-2xl bg-charcoal p-4 text-white transition-colors hover:bg-charcoal/90">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-lime text-charcoal">
            <Crown className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-semibold">{tier === "free" ? "Explore Premium" : "Your subscription"}</p>
            <p className="text-caption text-white/75">{tier === "free" ? "Coach, smarter swaps, family planning and more" : "Manage plan and billing"}</p>
          </div>
          <TierPill className="bg-white/15 text-white" />
          <ChevronRight className="size-[18px] shrink-0 text-white/70" aria-hidden />
        </Link>

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
            <ListRow href="/admin/reviews" icon={<ClipboardCheck />} iconTone="muted" title="Clinical review queue" description="Staff view (prototype)" />
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
