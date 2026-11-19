"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ChevronDown, Search, ShieldCheck, SlidersHorizontal } from "lucide-react"
import { IconTile } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { RecipeCard } from "@/components/recipes/bank/recipe-card"
import { AGE_PHOTO, CUISINE_ART, FIT_ICON, MEAL_PHOTO, cuisinePhoto } from "@/components/recipes/bank/visuals"
import { cn } from "@/lib/utils"
import type { AgeGroupInfo, CuisineInfo, HealthFitInfo, MealGroupId } from "@/lib/recipe-bank"
import type { Recipe } from "@/lib/types"

const plural = (n: number, one = "recipe", many = "recipes") => `${n} ${n === 1 ? one : many}`

/** Search pill on the landing: submits to /recipes/browse?q=… ; the trailing button opens all filters. */
export function BankSearch({ placeholder = "Search dishes, ingredients, বাংলা" }: { placeholder?: string }) {
  const router = useRouter()
  const [q, setQ] = useState("")
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        const v = q.trim()
        router.push(v ? `/recipes/browse?q=${encodeURIComponent(v)}` : "/recipes/browse")
      }}
      className="flex items-center gap-2"
    >
      <label className="relative flex-1">
        <span className="sr-only">Search recipes</span>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-grey" aria-hidden />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          enterKeyHint="search"
          className="text-body h-12 w-full rounded-full bg-card pr-4 pl-11 text-charcoal shadow-card outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
      <Link href="/recipes/browse" aria-label="All recipes and filters" className="grid size-12 shrink-0 place-items-center rounded-full bg-card text-charcoal shadow-card transition-colors hover:bg-muted">
        <SlidersHorizontal className="size-5" aria-hidden />
      </Link>
    </form>
  )
}

/** Big photo tile for a meal of the day. */
export function MealTile({ id, label, count }: { id: MealGroupId; label: string; count: number }) {
  return (
    <Link href={`/recipes/browse?meal=${id}`} className="group relative block h-32 overflow-hidden rounded-2xl bg-muted shadow-card" aria-label={`${label}, ${plural(count)}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static prototype assets */}
      <img src={MEAL_PHOTO[id]} alt="" className="absolute inset-0 size-full object-cover transition-transform duration-200 ease-out group-hover:scale-[1.03] motion-reduce:transition-none" />
      <span className="absolute inset-0 bg-linear-to-t from-charcoal/80 via-charcoal/20 to-transparent" aria-hidden />
      <span className="absolute inset-x-3 bottom-2.5 text-white">
        <span className="text-headline block leading-tight">{label}</span>
        <span className="tabular text-caption block text-white/90">{plural(count)}</span>
      </span>
    </Link>
  )
}

/** Cuisine card for the horizontal rail: photo (or illustrated tile), name, blurb, count; P3 for non-local. */
export function CuisineCard({ cuisine: c, count }: { cuisine: CuisineInfo; count: number }) {
  const photo = cuisinePhoto(c.id)
  const art = CUISINE_ART[c.id]
  const Icon = art.icon
  return (
    <Link href={`/recipes/browse?cuisine=${c.id}`} className="flex w-[152px] shrink-0 snap-start flex-col rounded-2xl bg-card p-2 shadow-card transition-colors hover:bg-muted/40 active:bg-muted">
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element -- static prototype assets
        <img src={photo} alt="" className="h-24 w-full rounded-[18px] object-cover" />
      ) : (
        <span className={cn("relative grid h-24 w-full place-items-center overflow-hidden rounded-[18px]", art.tone)} aria-hidden>
          <span className="absolute -right-5 -bottom-6 size-20 rounded-full bg-white/35" />
          <Icon className="relative size-10 opacity-85" strokeWidth={1.6} />
        </span>
      )}
      <div className="flex flex-1 flex-col px-1.5 pt-2.5 pb-1">
        <p className="text-callout flex items-center gap-1.5 font-semibold">
          <span className="truncate">{c.label}</span>
          {!c.local && <FeatureBadge feature="world_cuisines" />}
        </p>
        <p className="text-caption mt-0.5 line-clamp-2 min-h-9 text-muted-foreground">{c.blurb}</p>
        <p className="tabular text-caption mt-1.5 font-semibold text-forest">{plural(count)}</p>
      </div>
    </Link>
  )
}

/** Life-stage tile: round photo, label, age range. */
export function AgeTile({ group: a, count }: { group: AgeGroupInfo; count: number }) {
  return (
    <Link href={`/recipes/browse?age=${a.id}`} className="flex flex-col items-center rounded-2xl bg-card px-2 pt-3 pb-2.5 text-center shadow-card transition-colors hover:bg-muted/40 active:bg-muted" aria-label={`${a.label}, ${a.range}, ${plural(count)}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static prototype assets */}
      <img src={AGE_PHOTO[a.id]} alt="" className="size-14 rounded-full object-cover ring-2 ring-sage" />
      <span className="text-callout mt-2 font-semibold">{a.label}</span>
      <span className="tabular text-caption text-muted-foreground">{a.range}</span>
    </Link>
  )
}

/** Health-fit tile (2-column grid): icon, label, one-line meaning, optional P2 badge for condition fits. */
export function FitTile({ fit: h, count }: { fit: HealthFitInfo; count: number }) {
  const { icon: Icon, tone } = FIT_ICON[h.id]
  return (
    <Link href={`/recipes/browse?fit=${h.id}`} className="flex h-full flex-col rounded-2xl bg-card p-3 shadow-card transition-colors hover:bg-muted/40 active:bg-muted">
      <div className="flex items-start justify-between gap-2">
        <IconTile tone={tone}>
          <Icon />
        </IconTile>
        {h.kind === "condition" && <FeatureBadge feature="condition_recipes" />}
      </div>
      <p className="text-callout mt-2.5 font-semibold">{h.label}</p>
      <p className="text-caption mt-0.5 line-clamp-2 text-muted-foreground">{h.short}</p>
      <p className="tabular text-caption mt-auto pt-1.5 font-semibold text-forest">{plural(count)}</p>
    </Link>
  )
}

/** Horizontal, snap-scrolling rail of recipe cards. */
export function RecipeRail({ recipes, label }: { recipes: Recipe[]; label: string }) {
  return (
    <ul aria-label={label} className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 overflow-x-auto px-[var(--gutter)] pt-0.5 pb-2">
      {recipes.map((r) => (
        <li key={r.id} className="flex">
          <RecipeCard recipe={r} variant="rail" />
        </li>
      ))}
    </ul>
  )
}

/** Horizontal rail wrapper for arbitrary cards (cuisines). */
export function Rail({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div role="list" aria-label={label} className="no-scrollbar -mx-[var(--gutter)] flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 overflow-x-auto px-[var(--gutter)] pt-0.5 pb-2 [&>*]:shrink-0">
      {children}
    </div>
  )
}

/**
 * "N hidden for your safety": lists recipes removed by the profile's hard constraints with the reason.
 * Information only: there is deliberately no way to show them.
 */
export function HiddenPanel({ hidden, name }: { hidden: { recipe: Recipe; reason: string }[]; name?: string }) {
  if (!hidden.length) return null
  return (
    <details className="group rounded-2xl bg-card shadow-card">
      <summary className="flex min-h-[60px] cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <IconTile tone="sage">
          <ShieldCheck />
        </IconTile>
        <span className="min-w-0 flex-1">
          <span className="text-body tabular block font-medium">{hidden.length} hidden for your safety</span>
          <span className="text-caption block text-muted-foreground">Because of {name ? `${name}'s` : "your"} allergies, diet, age or medical rules</span>
        </span>
        <ChevronDown className="size-[18px] shrink-0 text-muted-grey transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden />
      </summary>
      <ul className="divide-y divide-border/70 border-t border-border/70">
        {hidden.map(({ recipe, reason }) => (
          <li key={recipe.id} className="px-4 py-3">
            <p className="text-callout font-medium">{recipe.name}</p>
            <p className="text-caption mt-0.5 text-muted-foreground">{reason}</p>
          </li>
        ))}
      </ul>
      <p className="text-caption border-t border-border/70 px-4 py-3 text-muted-foreground">These stay hidden while the profile has these rules. Update allergies or diet in Profile if something is wrong.</p>
    </details>
  )
}
