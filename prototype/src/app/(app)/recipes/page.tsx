"use client"

import Link from "next/link"
import { useState } from "react"
import { BookHeart, Plus, Search, ShieldCheck } from "lucide-react"
import { PageBody, PageHeader } from "@/components/app/page"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FeatureBadge } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useActiveProfile, useApp } from "@/lib/store"
import { RECIPES } from "@/lib/data/recipes"
import { fmt, recipeCostPerServing, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"

const FILTERS: { id: string; label: string; test: (r: Recipe) => boolean }[] = [
  { id: "breakfast", label: "Breakfast", test: (r) => r.mealTypes.includes("breakfast") },
  { id: "main", label: "Lunch & dinner", test: (r) => r.mealTypes.includes("lunch") || r.mealTypes.includes("dinner") },
  { id: "snack", label: "Snacks", test: (r) => r.mealTypes.some((t) => t.includes("snack")) },
  { id: "quick", label: "Under 20 min", test: (r) => r.prepMinutes + r.cookMinutes <= 20 },
  { id: "budget", label: "Budget", test: (r) => recipeCostPerServing(r) <= 60 },
  { id: "protein", label: "High protein", test: (r) => r.tags.includes("high-protein") },
  { id: "veg", label: "Vegetarian", test: (r) => r.tags.includes("vegetarian") || r.tags.includes("vegan") },
]

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
                <Plus /> Add
              </Link>
            </Button>
          )
        }
      />
      <PageBody>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search in English or বাংলা" className="pl-10" aria-label="Search recipes" />
        </div>

        {!infant && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(filter === f.id ? null : f.id)}
                aria-pressed={filter === f.id}
                className={cn("h-9 shrink-0 rounded-full border px-3.5 text-sm", filter === f.id ? "border-forest bg-forest text-primary-foreground" : "bg-card")}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {!infant && (
          <Link href="/recipes/library" className="flex items-center gap-3 rounded-2xl border bg-card p-3">
            <span className="grid size-10 place-items-center rounded-xl bg-sage text-forest">
              <BookHeart className="size-5" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium">My recipe library</span>
              <span className="block text-xs text-muted-foreground">{userRecipes.length ? `${userRecipes.length} of your own recipes` : "Save family recipes and see their nutrition"}</span>
            </span>
            <FeatureBadge feature="recipe_library" />
          </Link>
        )}

        {infant && (
          <InfoNote title="Pending clinical review">
            Infant recipes in this prototype are illustrative and would be published only after pediatric review (§12, §43).
          </InfoNote>
        )}

        <ul className="grid grid-cols-2 gap-3">
          {list.map((r) => {
            const n = recipeNutrition(r)
            return (
              <li key={r.id}>
                <Link href={`/recipes/${r.id}`} className="block rounded-2xl border bg-card p-2 hover:bg-muted/40">
                  <RecipeThumb recipe={r} size="hero" className="h-28" />
                  <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground" lang="bn">
                    {r.nameBn}
                  </p>
                  <p className="tabular mt-1 text-xs text-muted-foreground">
                    {infant ? (r.texture ?? "") : `~${Math.round(n.energyKcal)} kcal · ${fmt.bdt(recipeCostPerServing(r))}`} · {r.prepMinutes + r.cookMinutes} min
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
        {list.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No recipes match. Try another search or filter.</p>}

        {hidden > 0 && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="size-4 text-forest" /> {hidden} recipe{hidden > 1 ? "s are" : " is"} hidden because of {profile?.name}&apos;s allergies, diet or age.
          </p>
        )}
      </PageBody>
    </>
  )
}
