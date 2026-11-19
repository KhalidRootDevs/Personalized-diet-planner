"use client"

import Link from "next/link"
import { Baby, ChevronRight, Clock, Hand, HeartHandshake, Milk, Ruler, ShieldAlert, Siren, Soup, Sparkles, Stethoscope, Utensils } from "lucide-react"
import { RECIPES } from "@/lib/data/recipes"
import { ageInMonths, violatesHardConstraints } from "@/lib/nutrition"
import { useApp } from "@/lib/store"
import { useAreaD, useAreaDSync } from "@/lib/area-d-store"
import { useConsent } from "@/lib/consent"
import { formatDay } from "@/lib/date"
import type { Profile } from "@/lib/types"
import { FeatureBadge } from "@/components/app/badges"
import { CautionNote, InfoNote } from "@/components/app/alerts"
import { IconTile, ListGroup, ListRow, Section, Surface } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { ProfileAvatar, profileAgeLabel } from "@/components/app/profile-switcher"
import { feedingStage, responsiveCues, safetyEssentials } from "./feeding"
import { growthReviewPrompt, newFoodCandidates } from "./child-checks"

/**
 * Baby / young-child dashboard (§12, §12.8, §42.10, §44.9). Caregiver language,
 * milestones and textures — never calories, adult targets or scores. Content is age-banded:
 * babies (<12 months) see milk feeds and first foods; toddlers and older children see family foods.
 * Renders its own screen body (gutter + section rhythm) so it can sit directly
 * under the Home header or the /child header.
 */
export function ChildHome({ profile }: { profile: Profile }) {
  useAreaDSync()
  const allIntroduced = useApp((s) => s.introduced)
  const allGrowth = useApp((s) => s.growth)
  const journal = useApp((s) => s.journal)
  const checked = useAreaD((s) => s.childFoodChecks)
  const canEdit = useConsent("child_data")
  const introduced = allIntroduced.filter((f) => f.profileId === profile.id)
  const growth = allGrowth.filter((g) => g.profileId === profile.id)
  const months = ageInMonths(profile.dateOfBirth)
  const stage = feedingStage(months)
  const who = stage.who
  // Baby → infant recipes; toddler/child → child recipes. Hard constraints (allergies, age, choking) always apply.
  const recipes = RECIPES.filter((r) => (stage.baby ? r.profile === "infant" : r.profile === "child") && (r.minAgeMonths ?? 0) <= months && !violatesHardConstraints(r, profile))
  const latestGrowth = [...growth].sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastIntro = [...introduced].sort((a, b) => b.date.localeCompare(a.date))[0]
  const milk = profile.feeding === "formula" ? "Formula" : profile.feeding === "both" ? "Breast milk and formula" : "Breast milk"
  const growthPrompt = growthReviewPrompt(growth)
  const newFoods = newFoodCandidates(journal, allIntroduced, profile.id, checked)
  const cues = responsiveCues(stage)

  return (
    <div className="px-gutter space-y-7 pt-1 pb-8">
      <Surface tone="sage" padding="lg" className="relative overflow-hidden">
        <span className="absolute -top-14 -right-12 size-44 rounded-full bg-lime-card/60" aria-hidden />
        <div className="relative flex items-center gap-3">
          <span className="rounded-full bg-white p-1 shadow-card">
            <ProfileAvatar profile={{ ...profile, avatarColor: "sage" }} size="lg" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-caption flex flex-wrap items-center gap-1.5 font-medium text-lime-text">
              <Baby className="size-4" /> {profile.name} · {profileAgeLabel(profile)} <FeatureBadge feature="baby_module" />
            </p>
            <p className="text-title mt-0.5">{stage.title}</p>
          </div>
        </div>
        {stage.solidsPlanned && recipes.length > 0 && (
          <div className="relative mt-4 flex items-center">
            <div className="flex -space-x-3">
              {recipes.slice(0, 4).map((r) => (
                <RecipeThumb key={r.id} recipe={r} size="sm" className="ring-[3px] ring-sage" />
              ))}
            </div>
            <p className="text-caption ml-3 text-charcoal/80">{stage.baby ? "First foods for this stage" : "Family foods for this stage"}</p>
          </div>
        )}
        <p className="text-callout relative mt-4 text-charcoal/90">{stage.focus}</p>
        <dl className="relative mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/85 px-3 py-2.5">
            <dt className="text-caption flex items-center gap-1 text-muted-foreground">
              <Clock className="size-3.5 text-water" aria-hidden /> {stage.baby ? "Feeding opportunities" : "Meals and snacks"}
            </dt>
            <dd className="text-callout mt-0.5 font-medium">{stage.opportunities}</dd>
          </div>
          <div className="rounded-xl bg-white/85 px-3 py-2.5">
            <dt className="text-caption flex items-center gap-1 text-muted-foreground">
              <Soup className="size-3.5 text-terracotta" aria-hidden /> Textures
            </dt>
            <dd className="text-callout mt-0.5 font-medium">{stage.textures}</dd>
          </div>
        </dl>
      </Surface>

      {!canEdit && (
        <InfoNote title="Read-only">
          You withdrew permission to store child information, so {profile.name}&apos;s profile can be viewed but not changed.{" "}
          <Link href="/profile/privacy" className="font-semibold text-forest underline underline-offset-2">
            Privacy settings
          </Link>
        </InfoNote>
      )}

      <CautionNote title="Guidance pending clinical review">
        This feeding content is a prototype. Before launch, every rule and recipe is reviewed by pediatric nutrition professionals. Ask your clinician about your {who}&apos;s individual needs.
      </CautionNote>

      <Section title={stage.baby ? "Today's feeding plan" : "Today's meals"} description={`Offer small amounts and follow your ${who}'s cues. There is no amount your ${who} has to finish.`}>
        <ol className="space-y-3">
          {stage.milkNote && (
            <li className="flex items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 shadow-card">
              <IconTile tone="sky" className="size-14 [&_svg]:size-6">
                <Milk />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold">{stage.baby ? milk : "Milk"}</p>
                <p className="text-caption mt-0.5 text-muted-foreground">{stage.milkNote}</p>
              </div>
            </li>
          )}
          {stage.solidsPlanned &&
            recipes.slice(0, months < 7 ? 2 : 3).map((r, i) => (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="flex items-center gap-3.5 rounded-2xl bg-card p-3 pr-4 shadow-card transition-colors hover:bg-muted/40">
                  <RecipeThumb recipe={r} size="md" />
                  <div className="min-w-0 flex-1">
                    <p className="text-caption text-muted-foreground">{stage.baby ? `Feeding opportunity ${i + 1}` : ["Meal idea", "Another meal idea", "Snack idea"][i] ?? "Idea"}</p>
                    <p className="text-body font-semibold">{r.name}</p>
                    {r.texture && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sage px-2 py-0.5 text-[11px] font-medium text-lime-text">
                        <Soup className="size-3" aria-hidden /> {r.texture}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />
                </Link>
              </li>
            ))}
        </ol>
        {!stage.solidsPlanned && (
          <InfoNote title="No solid foods yet">Most babies are ready for first foods around 6 months, when they can sit with support and show interest in food. Every baby is different.</InfoNote>
        )}
        {stage.solidsPlanned && recipes.length === 0 && <InfoNote>No reviewed ideas match {profile.name}&apos;s age and restrictions yet. Family meals set aside before seasoning work well.</InfoNote>}
      </Section>

      {newFoods.length > 0 && (
        <Section title="Is this a new food?">
          <ListGroup>
            <ListRow
              href="/child/foods#new-foods"
              icon={<Sparkles />}
              iconTone="amber"
              title={`${newFoods.map((f) => f.name).slice(0, 2).join(", ")}${newFoods.length > 2 ? ` +${newFoods.length - 2}` : ""}`}
              description="Logged recently but not in the food tracker yet"
            />
          </ListGroup>
        </Section>
      )}

      {growthPrompt && (
        <Section title="Worth a check">
          <Surface>
            <div className="flex gap-3">
              <IconTile tone="sky">
                <Stethoscope />
              </IconTile>
              <div className="min-w-0 flex-1">
                <p className="text-body font-medium">Discuss with your clinician</p>
                <p className="text-callout mt-1 text-muted-foreground">
                  {growthPrompt} Home measurements can be inaccurate, and this isn&apos;t a diagnosis. Your clinician can measure {profile.name} and compare with growth standards.
                </p>
                <p className="text-caption mt-2 text-muted-foreground">Please don&apos;t change how much you offer because of a single measurement.</p>
              </div>
            </div>
          </Surface>
        </Section>
      )}

      <Section title={`Follow your ${who}'s cues`} description={`Feed patiently and never force your ${who} to finish a serving.`}>
        <div className="grid grid-cols-2 gap-3">
          {cues.map((c, i) => (
            <Surface key={c.cue}>
              <IconTile size="sm" tone={i === 0 ? "amber" : "sky"}>
                {i === 0 ? <Hand /> : <HeartHandshake />}
              </IconTile>
              <p className="text-body mt-3 font-medium">{c.cue}</p>
              <p className="text-caption mt-1 text-muted-foreground">{c.examples}</p>
            </Surface>
          ))}
        </div>
      </Section>

      <Section title="Eating skills at this stage" description={`Every ${who} develops at their own pace. These are things you may notice, not a checklist.`}>
        <Surface>
          <ul className="space-y-2.5">
            {stage.milestones.map((m) => (
              <li key={m} className="text-callout flex gap-2.5">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-lime" aria-hidden />
                {m}
              </li>
            ))}
          </ul>
        </Surface>
      </Section>

      <Section title="Tracking">
        <ListGroup>
          <ListRow href="/child/foods" icon={<Utensils />} iconTone="lime" title={stage.baby ? "Food introduction" : "Foods tried"} description={`${introduced.length} foods so far${lastIntro ? ` · latest: ${lastIntro.foodName}` : ""}`} />
          <ListRow
            href="/child/growth"
            icon={<Ruler />}
            iconTone="sky"
            title="Growth measurements"
            description={latestGrowth ? `${latestGrowth.weightKg ?? "–"} kg · ${latestGrowth.lengthCm ?? "–"} cm on ${formatDay(latestGrowth.date, { day: "numeric", month: "short" })}` : "No measurements yet"}
          />
        </ListGroup>
      </Section>

      <Section title="Safety essentials">
        <div className="rounded-2xl border border-safety/20 bg-safety-surface">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <ShieldAlert className="size-5 text-safety" aria-hidden />
            <p className="text-callout font-semibold text-safety">Check before every meal</p>
          </div>
          <ul className="divide-y divide-safety/10">
            {safetyEssentials(stage).map((s) => (
              <li key={s.title} className="px-4 py-3">
                <p className="text-callout font-semibold text-charcoal">{s.title}</p>
                <p className="text-caption mt-0.5 text-charcoal/80">{s.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <ListGroup>
          <ListRow href="/safety/emergency" icon={<Siren />} iconTone="safety" title="Breathing difficulty, swelling or choking?" description="Open emergency guidance" />
        </ListGroup>
      </Section>
    </div>
  )
}
