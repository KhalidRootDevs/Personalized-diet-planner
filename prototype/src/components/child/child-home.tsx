"use client"

import Link from "next/link"
import { Baby, ChevronRight, Hand, Milk, Ruler, ShieldAlert, Stethoscope, Utensils } from "lucide-react"
import { RECIPES } from "@/lib/data/recipes"
import { ageInMonths } from "@/lib/nutrition"
import { useApp } from "@/lib/store"
import { formatDay } from "@/lib/date"
import type { Profile } from "@/lib/types"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { Section } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ProfileAvatar } from "@/components/app/profile-switcher"
import { RESPONSIVE_FEEDING, SAFETY_ESSENTIALS, feedingStage } from "./feeding"

/**
 * Baby / young-child dashboard (§12, §12.8, §42.10, §44.9). Caregiver language,
 * milestones and textures — never calories, adult targets or scores.
 */
export function ChildHome({ profile }: { profile: Profile }) {
  const allIntroduced = useApp((s) => s.introduced)
  const allGrowth = useApp((s) => s.growth)
  const introduced = allIntroduced.filter((f) => f.profileId === profile.id)
  const growth = allGrowth.filter((g) => g.profileId === profile.id)
  const months = ageInMonths(profile.dateOfBirth)
  const stage = feedingStage(months)
  const recipes = RECIPES.filter((r) => r.profile === "infant" && (r.minAgeMonths ?? 0) <= months)
  const latestGrowth = [...growth].sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastIntro = [...introduced].sort((a, b) => b.date.localeCompare(a.date))[0]
  const milk = profile.feeding === "formula" ? "Formula" : profile.feeding === "both" ? "Breast milk and formula" : "Breast milk"

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-sage/70 p-4">
        <div className="flex items-center gap-3">
          <ProfileAvatar profile={profile} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm text-forest">
              <Baby className="size-4" /> {months} months old <FeatureBadge feature="baby_module" />
            </p>
            <p className="font-serif text-2xl leading-tight">{stage.title}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-charcoal/90">{stage.focus}</p>
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-card/80 p-2.5">
            <dt className="text-xs text-muted-foreground">Feeding opportunities</dt>
            <dd className="font-medium">{stage.opportunities}</dd>
          </div>
          <div className="rounded-xl bg-card/80 p-2.5">
            <dt className="text-xs text-muted-foreground">Textures</dt>
            <dd className="font-medium">{stage.textures}</dd>
          </div>
        </dl>
      </div>

      <CautionNote title="Guidance pending clinical review">
        This baby-feeding content is a prototype. Before launch, every rule and recipe is reviewed by pediatric nutrition professionals (§43 1.20). Ask your clinician about your baby&apos;s individual needs.
      </CautionNote>

      <Section title="Today's feeding plan">
        <ul className="space-y-2">
          <li className="flex items-center gap-3 rounded-xl border bg-card p-3">
            <div className="grid size-11 place-items-center rounded-lg bg-sage text-forest">
              <Milk className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{milk}</p>
              <p className="text-sm text-muted-foreground">Continue your baby&apos;s usual milk feeds, on demand.</p>
            </div>
          </li>
          {stage.solidsPlanned ? (
            recipes.slice(0, months < 7 ? 2 : 3).map((r, i) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/50">
                  <RecipeThumb recipe={r} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground">Feeding opportunity {i + 1}</p>
                    <p className="truncate font-medium">{r.name}</p>
                    <p className="text-sm text-muted-foreground">{r.texture}</p>
                  </div>
                  <ChevronRight className="size-4 text-muted-grey" />
                </Link>
              </li>
            ))
          ) : (
            <li>
              <InfoNote title="No solid foods yet">Most babies are ready for first foods around 6 months, when they can sit with support and show interest in food. Every baby is different.</InfoNote>
            </li>
          )}
        </ul>
        <p className="text-xs text-muted-foreground">Offer small amounts and follow your baby&apos;s cues. There is no amount your baby has to finish.</p>
      </Section>

      <Section title="Follow your baby's cues">
        <div className="grid grid-cols-2 gap-2">
          {RESPONSIVE_FEEDING.map((c) => (
            <div key={c.cue} className="rounded-xl border bg-card p-3">
              <p className="flex items-center gap-1.5 font-medium">
                <Hand className="size-4 text-forest" /> {c.cue}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{c.examples}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">Feed patiently and never force your baby to finish a serving.</p>
      </Section>

      <Section title="Tracking">
        <div className="space-y-2">
          <Link href="/child/foods" className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/50">
            <div className="grid size-10 place-items-center rounded-lg bg-sage text-forest">
              <Utensils className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Food introduction tracker</p>
              <p className="text-sm text-muted-foreground">
                {introduced.length} foods introduced{lastIntro ? ` · latest: ${lastIntro.foodName}` : ""}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-grey" />
          </Link>
          <Link href="/child/growth" className="flex items-center gap-3 rounded-xl border bg-card p-3 hover:bg-muted/50">
            <div className="grid size-10 place-items-center rounded-lg bg-sage text-forest">
              <Ruler className="size-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Growth measurements</p>
              <p className="text-sm text-muted-foreground">
                {latestGrowth ? `${latestGrowth.weightKg ?? "–"} kg · ${latestGrowth.lengthCm ?? "–"} cm on ${formatDay(latestGrowth.date, { day: "numeric", month: "short" })}` : "No measurements yet"}
              </p>
            </div>
            <ChevronRight className="size-4 text-muted-grey" />
          </Link>
        </div>
      </Section>

      <Section title="Safety essentials">
        <ul className="space-y-2">
          {SAFETY_ESSENTIALS.map((s) => (
            <li key={s.title} className="flex gap-3 rounded-xl border bg-card p-3 text-sm">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-safety" aria-hidden />
              <div>
                <p className="font-medium">{s.title}</p>
                <p className="text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ul>
        <Link href="/safety/emergency" className="flex items-center gap-3 rounded-xl border border-safety/25 bg-safety-surface p-3 text-sm">
          <Stethoscope className="size-5 text-safety" />
          <span className="flex-1">
            <span className="font-semibold text-safety">Breathing difficulty, swelling or choking?</span>
            <span className="block text-charcoal/90">Open emergency guidance</span>
          </span>
          <ChevronRight className="size-4 text-safety" />
        </Link>
      </Section>
    </div>
  )
}
