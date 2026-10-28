"use client"

import Link from "next/link"
import { useState } from "react"
import { BookHeart, Clock, Flame, Plus, Search, ShieldCheck } from "lucide-react"
import { EmptyState, ListLink, PageBody, PageHeader, Pill, Section } from "@/components/app/page"
import { SCENE_PHOTO } from "@/lib/data/photos"
import { cn } from "@/lib/utils"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useActiveProfile, useApp } from "@/lib/store"
import { RECIPES } from "@/lib/data/recipes"
import { fmt, recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import type { Recipe } from "@/lib/types"

const FILTERS: { id: string; label: string; photo: string; test: (r: Recipe) => boolean }[] = [
  { id: "breakfast", label: "Breakfast", photo: SCENE_PHOTO.breakfast, test: (r) => r.mealTypes.includes("breakfast") },
  { id: "main", label: "Lunch & dinner", photo: SCENE_PHOTO.rice, test: (r) => r.mealTypes.includes("lunch") || r.mealTypes.includes("dinner") },
  { id: "snack", label: "Snacks", photo: SCENE_PHOTO.snacks, test: (r) => r.mealTypes.some((t) => t.includes("snack")) },
  { id: "quick", label: "Under 20 min", photo: "/food/banana-peanuts.jpg", test: (r) => r.prepMinutes + r.cookMinutes <= 20 },
  { id: "budget", label: "Budget", photo: "/food/khichuri.jpg", test: (r) => recipeCostPerServing(r) <= 60 },
  { id: "protein", label: "High protein", photo: "/food/rice-chicken-dal.jpg", test: (r) => r.tags.includes("high-protein") },
  { id: "veg", label: "Vegetarian", photo: SCENE_PHOTO.salad, test: (r) => r.tags.includes("vegetarian") || r.tags.includes("vegan") },
]

/** Category tile (design ref: round photo above a label). */
function CategoryTile({ label, photo, selected, onClick }: { label: string; photo: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn("flex w-[88px] shrink-0 flex-col items-center gap-1.5 rounded-2xl px-1.5 pt-2.5 pb-2 transition-colors", selected ? "bg-lime" : "bg-card shadow-card hover:bg-muted/50")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static prototype assets */}
      <img src={photo} alt="" className="size-14 rounded-full object-cover ring-2 ring-card" />
      <span className="line-clamp-2 min-h-7 text-center text-[12px] leading-[14px] font-medium text-charcoal">{label}</span>
    </button>
  )
}

/** Recipes tab (§9, §19): verified library, filtered by the active profile's hard constraints. */
export default function RecipesPage() {
  const profile = useActiveProfile()
  const userRecipes = useApp((s) => s.userRecipes)
  const [q, setQ] = useState("")
  const [filter, setFilter] = useState<string | null>(null)
  const infant = profile?.type !== "adult"

  const pool = RECIPES.filter((r) => (infant ? r.profile !== "adult" : r.profile === "adult"))
  const safe = profile ? pool.filter((r) => !violatesHardConstraints(r, profile)) : pool
  const hidden = pool.length - safe.length
  const query = q.trim().toLowerCase()
  const list = safe.filter((r) => {
    if (query && !(r.name.toLowerCase().includes(query) || r.nameBn.includes(q.trim()) || r.tags.some((t) => t.includes(query)))) return false
    if (filter) return FILTERS.find((f) => f.id === filter)!.test(r)
    return true
  })

  return (
    <>
      <PageHeader
        title="Recipes"
        large
        subtitle={infant ? `Age-appropriate foods for ${profile?.name}` : "Verified recipes that fit your profile"}
        action={
          !infant && (
            <Button asChild size="sm" variant="outline">
              <Link href="/recipes/new">
                <Plus className="size-4" /> Add
              </Link>
            </Button>
          )
        }
      />
      <PageBody>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3.5 size-[18px] -translate-y-1/2 text-muted-grey" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in English or বাংলা" className="h-12 rounded-full border-transparent bg-card pl-10 shadow-card" aria-label="Search recipes" />
          </div>
          {!infant && (
            <div className="no-scrollbar -mx-[var(--gutter)] flex gap-2.5 overflow-x-auto px-[var(--gutter)] py-1">
              <CategoryTile label="All" photo={SCENE_PHOTO.fruits} selected={filter === null} onClick={() => setFilter(null)} />
              {FILTERS.map((f) => (
                <CategoryTile key={f.id} label={f.label} photo={f.photo} selected={filter === f.id} onClick={() => setFilter(filter === f.id ? null : f.id)} />
              ))}
            </div>
          )}
        </div>

        {!infant && (
          <ListLink
            href="/recipes/library"
            icon={<BookHeart />}
            title={
              <>
                My recipe library <FeatureBadge feature="recipe_library" />
              </>
            }
            description={userRecipes.length ? `${userRecipes.length} of your own recipes` : "Save family recipes and see their nutrition"}
          />
        )}

        {infant && <InfoNote title="Pending clinical review">Infant recipes in this prototype are illustrative and would be published only after pediatric review (§12, §43).</InfoNote>}

        {list.length === 0 ? (
          <EmptyState icon={<Search />} title="No recipes match" description="Try another search or filter." />
        ) : (
          <Section
            title={
              <>
                {filter ? FILTERS.find((f) => f.id === filter)!.label : infant ? "First foods" : "All recipes"}
                <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1.5 text-[11px] font-semibold text-charcoal">{list.length}</span>
              </>
            }
          >
            <ul className="grid grid-cols-2 gap-3">
              {list.map((r) => {
                const n = recipeNutrition(r)
                return (
                  <li key={r.id}>
                    <Link href={`/recipes/${r.id}`} className="flex h-full flex-col rounded-2xl bg-card p-2 shadow-card transition-colors hover:bg-muted/40">
                      <RecipeThumb recipe={r} size="hero" className="h-32 rounded-[18px]" />
                      <div className="flex flex-1 flex-col px-1.5 pt-2.5 pb-1.5">
                        <p className="text-callout line-clamp-2 leading-snug font-semibold">{r.name}</p>
                        <p className="text-caption mt-0.5 line-clamp-1 text-muted-foreground" lang="bn">
                          {r.nameBn}
                        </p>
                        <div className="text-caption tabular mt-auto flex items-center gap-2.5 pt-2.5">
                          {infant ? (
                            <span className="truncate text-muted-foreground">{r.texture ?? ""}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-charcoal">
                              <Flame className="size-3.5 text-terracotta" aria-hidden />~{Math.round(n.energyKcal)} kcal
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-muted-foreground">
                            <Clock className="size-3.5 shrink-0" aria-hidden />
                            {r.prepMinutes + r.cookMinutes}m
                          </span>
                        </div>
                        {infant ? (
                          <Pill tone="caution" className="mt-2 self-start">
                            Pending review
                          </Pill>
                        ) : (
                          <p className="tabular text-caption mt-1.5 self-start rounded-full bg-sage px-2 py-0.5 font-semibold text-lime-text">{fmt.bdt(recipeCostPerServing(r))} / serving</p>
                        )}
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Section>
        )}

        {hidden > 0 && (
          <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-forest" /> {hidden} recipe{hidden > 1 ? "s are" : " is"} hidden because of {profile?.name}&apos;s allergies, diet or age.
          </p>
        )}
      </PageBody>
    </>
  )
}
