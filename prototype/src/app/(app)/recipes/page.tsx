"use client"

import Link from "next/link"
import { useMemo } from "react"
import { BookHeart, Plus, Scale, Search, ShieldCheck, Sparkles } from "lucide-react"
import { EmptyState, ListGroup, ListRow, PageBody, PageHeader, Section, SectionLink } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { RecipeCard } from "@/components/recipes/bank/recipe-card"
import { AgeTile, BankSearch, CuisineCard, FitTile, MealTile, Rail, RecipeRail } from "@/components/recipes/bank/tiles"
import { FIT_ICON } from "@/components/recipes/bank/visuals"
import { effectiveFilters, isChildProfile, ownStage } from "@/components/recipes/bank/use-bank"
import { useActiveProfile, useApp } from "@/lib/store"
import { RECIPES } from "@/lib/data/recipes"
import { recipeCostPerServing } from "@/lib/nutrition"
import {
  AGE_GROUPS,
  AGE_GROUP_MAP,
  CUISINES,
  CUISINE_MAP,
  HEALTH_FITS,
  HEALTH_FIT_MAP,
  MEAL_GROUPS,
  browseRecipes,
  countBy,
  recipeCuisine,
  recipeHealthFits,
  sortRecipes,
  suggestedFitsForProfile,
  totalMinutes,
  type MealGroupId,
} from "@/lib/recipe-bank"
import type { HealthFitId, Recipe } from "@/lib/types"

const RAIL_MAX = 10
const TILE_MEALS: MealGroupId[] = ["breakfast", "lunch", "dinner", "snack"]

/** Recipes tab (§9, §42.11, §27): the recipe bank. Every list is already filtered by the active profile's hard constraints. */
export default function RecipesPage() {
  const profile = useActiveProfile()
  const child = isChildProfile(profile)
  return (
    <>
      <PageHeader
        title="Recipes"
        large
        subtitle={child ? `Age-appropriate foods for ${profile?.name}` : "Verified recipes from home and around the world"}
        action={
          !child && (
            <Button asChild size="sm" variant="outline">
              <Link href="/recipes/new">
                <Plus className="size-4" /> Add
              </Link>
            </Button>
          )
        }
      />
      {child ? <ChildBank /> : <AdultBank />}
    </>
  )
}

function SafetyLine({ hidden, name }: { hidden: number; name?: string }) {
  if (!hidden) return null
  return (
    <p className="text-caption tabular flex items-start gap-1.5 text-muted-foreground">
      <ShieldCheck className="mt-px size-4 shrink-0 text-forest" aria-hidden /> {hidden} recipe{hidden > 1 ? "s are" : " is"} hidden because of {name ? `${name}'s` : "your"} allergies, diet or age.
    </p>
  )
}

function AdultBank() {
  const profile = useActiveProfile()
  const userRecipes = useApp((s) => s.userRecipes)

  const data = useMemo(() => {
    // Safe set at the person's own life stage; tiles and rails all draw from it.
    const own = browseRecipes(RECIPES, effectiveFilters({}, profile), profile)
    const base = own.results
    const meals = countBy(base, (r) => MEAL_GROUPS.filter((g) => g.types.some((t) => r.mealTypes.includes(t))).map((g) => g.id))
    const cuisines = countBy(base, (r) => [recipeCuisine(r)])
    const fitsOf = new Map(base.map((r) => [r.id, recipeHealthFits(r)]))
    const fits = countBy(base, (r) => fitsOf.get(r.id)!)
    const ages = Object.fromEntries(AGE_GROUPS.map((a) => [a.id, browseRecipes(RECIPES, { ages: [a.id] }, profile).results.length]))
    const want = suggestedFitsForProfile(profile)
    const suggested = want.length ? sortRecipes(base, "recommended", profile).filter((r) => fitsOf.get(r.id)!.some((f) => want.includes(f))) : []
    const quick = sortRecipes(base.filter((r) => totalMinutes(r) <= 20), "quickest")
    const budget = sortRecipes(base, "budget").filter((r) => recipeCostPerServing(r) <= 80)
    const protein = sortRecipes(base.filter((r) => fitsOf.get(r.id)!.includes("high_protein")), "protein")
    const world = base.filter((r) => !CUISINE_MAP[recipeCuisine(r)].local)
    return { base, hidden: own.hidden.length, meals, cuisines, fits, ages, want, suggested, quick, budget, protein, world }
  }, [profile])

  const cuisineList = CUISINES.filter((c) => (data.cuisines[c.id] ?? 0) > 0).sort((a, b) => Number(b.local) - Number(a.local))
  const nutrientFits = HEALTH_FITS.filter((h) => h.kind === "computed")
  const conditionFits = HEALTH_FITS.filter((h) => h.kind === "condition")
  const worldIds = CUISINES.filter((c) => !c.local).map((c) => c.id)

  return (
    <PageBody>
      <BankSearch />

      <Section title="Browse by meal">
        <div className="grid grid-cols-2 gap-3">
          {TILE_MEALS.map((id) => (
            <MealTile key={id} id={id} label={MEAL_GROUPS.find((g) => g.id === id)!.label} count={data.meals[id] ?? 0} />
          ))}
        </div>
      </Section>

      {data.want.length > 0 && <SuggestedSection fits={data.want} recipes={data.suggested} />}

      {data.quick.length > 0 && (
        <Section title="Quick, under 20 min" action={<SectionLink href="/recipes/browse?max=20&sort=quickest">See all</SectionLink>}>
          <RecipeRail label="Quick recipes" recipes={data.quick.slice(0, RAIL_MAX)} />
        </Section>
      )}

      {cuisineList.length > 0 && (
        <Section title="Cuisines" description="Bangladeshi favourites first, then dishes from around the world" action={<SectionLink href="/recipes/browse">See all</SectionLink>}>
          <Rail label="Cuisines">
            {cuisineList.map((c) => (
              <CuisineCard key={c.id} cuisine={c} count={data.cuisines[c.id] ?? 0} />
            ))}
          </Rail>
        </Section>
      )}

      {data.protein.length > 0 && (
        <Section title="High protein" action={<SectionLink href="/recipes/browse?fit=high_protein&sort=protein">See all</SectionLink>}>
          <RecipeRail label="High-protein recipes" recipes={data.protein.slice(0, RAIL_MAX)} />
        </Section>
      )}

      <Section title="For every age" description="Browsing another age keeps your allergies applied. Each child’s own profile adds age safety checks.">
        <div className="grid grid-cols-3 gap-2.5">
          {AGE_GROUPS.map((a) => (
            <AgeTile key={a.id} group={a} count={data.ages[a.id] ?? 0} />
          ))}
        </div>
      </Section>

      <Section title="Health needs" description="Labels are calculated from the ingredients, never just declared.">
        <div className="grid grid-cols-2 gap-3">
          {nutrientFits.map((h) => (
            <FitTile key={h.id} fit={h} count={data.fits[h.id] ?? 0} />
          ))}
        </div>
        <ListGroup
          className="pt-2"
          label={
            <span className="flex items-center gap-2">
              Condition-aware <FeatureBadge feature="condition_recipes" />
            </span>
          }
        >
          {conditionFits.map((h) => {
            const { icon: Icon, tone } = FIT_ICON[h.id]
            return (
              <ListRow
                key={h.id}
                href={`/recipes/browse?fit=${h.id}`}
                icon={<Icon />}
                iconTone={tone}
                title={h.label}
                description={h.short}
                trailing={<span className="tabular text-caption font-semibold text-muted-foreground">{data.fits[h.id] ?? 0}</span>}
              />
            )
          })}
        </ListGroup>
        <p className="text-caption text-muted-foreground">General guidance, not treatment. Your allergies and medical rules from your profile are always applied.</p>
      </Section>

      {data.budget.length > 0 && (
        <Section title="Budget-friendly" description="Estimated cost per serving" action={<SectionLink href="/recipes/browse?sort=budget">See all</SectionLink>}>
          <RecipeRail label="Budget-friendly recipes" recipes={data.budget.slice(0, RAIL_MAX)} />
        </Section>
      )}

      {data.world.length > 0 && (
        <Section title="New from around the world" badge={<FeatureBadge feature="world_cuisines" />} action={<SectionLink href={`/recipes/browse?cuisine=${worldIds.join(",")}`}>See all</SectionLink>}>
          <RecipeRail label="International recipes" recipes={data.world.slice(0, RAIL_MAX)} />
        </Section>
      )}

      <ListGroup>
        <ListRow
          href="/recipes/library"
          icon={<BookHeart />}
          iconTone="lime"
          title={
            <>
              My recipe library <FeatureBadge feature="recipe_library" />
            </>
          }
          description={userRecipes.length ? `${userRecipes.length} of your own recipes` : "Save family recipes and see their nutrition"}
        />
        <ListRow
          href="/recipes/compare"
          icon={<Scale />}
          iconTone="amber"
          title={
            <>
              Compare two meals <FeatureBadge feature="budget_optimizer" />
            </>
          }
          description="Cost and nutrition side by side"
        />
      </ListGroup>

      <SafetyLine hidden={data.hidden} name={profile?.relation === "self" ? undefined : profile?.name} />
    </PageBody>
  )
}

/** Shown only when the profile records a condition. Suggestions, never a prescription. */
function SuggestedSection({ fits, recipes }: { fits: HealthFitId[]; recipes: Recipe[] }) {
  return (
    <Section
      title={
        <>
          <Sparkles className="size-[18px] text-forest" aria-hidden /> Suggested for you
        </>
      }
      badge={<FeatureBadge feature="condition_recipes" />}
      description="Based on the health conditions in your profile. General guidance, not treatment."
    >
      <div className="no-scrollbar -mx-[var(--gutter)] flex gap-2 overflow-x-auto px-[var(--gutter)] py-0.5">
        {fits.map((f) => (
          <Link key={f} href={`/recipes/browse?fit=${f}`} className="text-callout inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-sage px-3.5 font-medium text-forest">
            {HEALTH_FIT_MAP[f].label}
          </Link>
        ))}
      </div>
      {recipes.length ? (
        <RecipeRail label="Suggested recipes" recipes={recipes.slice(0, RAIL_MAX)} />
      ) : (
        <p className="text-callout text-muted-foreground">No matching recipes yet. More reviewed recipes are being added.</p>
      )}
    </Section>
  )
}

/** Infant/child profile: only the child's own stage, no calories, pending clinical review (§12). */
function ChildBank() {
  const profile = useActiveProfile()
  const stage = ownStage(profile)
  const { results, hidden } = useMemo(() => browseRecipes(RECIPES, effectiveFilters({}, profile), profile), [profile])
  const stageInfo = AGE_GROUP_MAP[stage]
  const easyToChew = results.filter((r) => recipeHealthFits(r).includes("easy_to_chew"))

  return (
    <PageBody>
      <BankSearch placeholder="Search first foods" />
      <InfoNote title="Pending clinical review">Infant and child recipes in this prototype are illustrative and would be published only after pediatric review (§12, §43).</InfoNote>

      {results.length === 0 ? (
        <EmptyState icon={<Search />} title="No recipes for this age yet" description="Age-appropriate recipes are being reviewed." />
      ) : (
        <Section
          title={
            <>
              Foods for {profile?.name}
              <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1.5 text-[11px] font-semibold text-charcoal">{results.length}</span>
            </>
          }
          description={`${stageInfo.label}, ${stageInfo.range}. Textures and safety notes on every recipe.`}
          action={<SectionLink href="/recipes/browse">Filter</SectionLink>}
        >
          <ul className="grid grid-cols-2 gap-3">
            {results.map((r) => (
              <li key={r.id}>
                <RecipeCard recipe={r} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {easyToChew.length > 0 && easyToChew.length < results.length && (
        <Section title="Soft textures" action={<SectionLink href="/recipes/browse?fit=easy_to_chew">See all</SectionLink>}>
          <RecipeRail label="Soft-texture recipes" recipes={easyToChew.slice(0, RAIL_MAX)} />
        </Section>
      )}

      <SafetyLine hidden={hidden.length} name={profile?.name} />
    </PageBody>
  )
}
