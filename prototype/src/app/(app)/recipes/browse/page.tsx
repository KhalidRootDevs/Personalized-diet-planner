"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react"
import { BackButton, EmptyState, PageBody } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RecipeCard } from "@/components/recipes/bank/recipe-card"
import { HiddenPanel } from "@/components/recipes/bank/tiles"
import { FilterSheet } from "@/components/recipes/bank/filter-sheet"
import { isChildProfile, ownStage, useBrowse } from "@/components/recipes/bank/use-bank"
import { useActiveProfile } from "@/lib/store"
import {
  AGE_GROUP_MAP,
  CUISINE_MAP,
  DIET_FILTERS,
  HEALTH_FIT_MAP,
  MEAL_GROUPS,
  SORTS,
  activeFilterCount,
  filtersFromParams,
  filtersToQuery,
  type BankFilters,
  type SortId,
} from "@/lib/recipe-bank"
import { cn } from "@/lib/utils"

/** Recipe bank results (§9, §42.11). Filters live in the URL so Home, Plan and the coach can deep-link. */
export default function BrowsePage() {
  // useSearchParams needs a Suspense boundary on a prerendered route (Next 16).
  return (
    <Suspense fallback={<BrowseHeader q="" onQ={() => {}} filterCount={0} onFilters={() => {}} chips={[]} />}>
      <Browse />
    </Suspense>
  )
}

type ActiveChip = { key: string; label: string; remove: (f: BankFilters) => BankFilters }

function without<T>(list: T[] | undefined, v: T): T[] | undefined {
  const next = list?.filter((x) => x !== v)
  return next?.length ? next : undefined
}

function chipsFor(f: BankFilters, child: boolean): ActiveChip[] {
  const out: ActiveChip[] = []
  for (const m of f.meals ?? []) out.push({ key: `meal-${m}`, label: MEAL_GROUPS.find((g) => g.id === m)?.label ?? m, remove: (x) => ({ ...x, meals: without(x.meals, m) }) })
  for (const c of f.cuisines ?? []) out.push({ key: `cuisine-${c}`, label: CUISINE_MAP[c]?.label ?? c, remove: (x) => ({ ...x, cuisines: without(x.cuisines, c) }) })
  if (!child) for (const a of f.ages ?? []) out.push({ key: `age-${a}`, label: AGE_GROUP_MAP[a]?.label ?? a, remove: (x) => ({ ...x, ages: without(x.ages, a) }) })
  for (const h of f.fits ?? []) out.push({ key: `fit-${h}`, label: HEALTH_FIT_MAP[h]?.label ?? h, remove: (x) => ({ ...x, fits: without(x.fits, h) }) })
  for (const d of f.diets ?? []) out.push({ key: `diet-${d}`, label: DIET_FILTERS.find((x) => x.id === d)?.label ?? d, remove: (x) => ({ ...x, diets: without(x.diets, d) }) })
  if (f.maxMinutes) out.push({ key: "max", label: `Under ${f.maxMinutes} min`, remove: (x) => ({ ...x, maxMinutes: undefined }) })
  if (f.difficulty) out.push({ key: "difficulty", label: f.difficulty === "easy" ? "Easy" : "Medium", remove: (x) => ({ ...x, difficulty: undefined }) })
  return out
}

function titleFor(f: BankFilters, child: boolean): string {
  const parts: string[] = []
  if (f.cuisines?.length === 1) parts.push(CUISINE_MAP[f.cuisines[0]]?.label)
  if (f.meals?.length === 1) parts.push(MEAL_GROUPS.find((g) => g.id === f.meals![0])?.label ?? "")
  if (!child && f.ages?.length === 1 && parts.length < 2) parts.push(`For ${AGE_GROUP_MAP[f.ages[0]]?.label.toLowerCase()}`)
  if (f.fits?.length === 1 && parts.length < 2) parts.push(HEALTH_FIT_MAP[f.fits[0]]?.label)
  if (f.cuisines && f.cuisines.length > 1 && !parts.length) parts.push("World cuisines")
  const t = parts.filter(Boolean).slice(0, 2).join(" · ")
  if (t) return t
  return f.q ? `Results for “${f.q}”` : "All recipes"
}

function Browse() {
  const router = useRouter()
  const sp = useSearchParams()
  const profile = useActiveProfile()
  const child = isChildProfile(profile)
  const filters = useMemo(() => filtersFromParams(new URLSearchParams(sp.toString())), [sp])
  const { results, hidden } = useBrowse(filters)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [view, setView] = useState<"grid" | "list">("grid")

  const apply = (next: BankFilters) => router.replace(`/recipes/browse${filtersToQuery(next)}`, { scroll: false })

  // Search text is local while typing and synced to the URL after a short pause.
  const urlQ = filters.q ?? ""
  const [q, setQ] = useState(urlQ)
  const [syncedQ, setSyncedQ] = useState(urlQ)
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ)
    if (urlQ !== q.trim()) setQ(urlQ)
  }
  useEffect(() => {
    const v = q.trim()
    if (v === (filters.q ?? "")) return
    const t = setTimeout(() => apply({ ...filters, q: v || undefined }), 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply is a stable wrapper around router.replace
  }, [q, filters])

  const chips = chipsFor(filters, child)
  const filterCount = activeFilterCount(child ? { ...filters, ages: undefined } : filters)
  const stage = AGE_GROUP_MAP[ownStage(profile)]
  const conditionFit = filters.fits?.some((f) => HEALTH_FIT_MAP[f]?.kind === "condition")
  const clearAll = () => {
    setQ("")
    apply({ sort: filters.sort })
  }

  return (
    <>
      <BrowseHeader
        q={q}
        onQ={setQ}
        filterCount={filterCount}
        onFilters={() => setSheetOpen(true)}
        chips={chips.map((c) => ({ key: c.key, label: c.label, onRemove: () => apply(c.remove(filters)) }))}
        quick={chips.length === 0 && !child ? MEAL_GROUPS.slice(0, 4).map((m) => ({ key: m.id, label: m.label, onAdd: () => apply({ ...filters, meals: [m.id] }) })) : undefined}
      />

      <PageBody className="space-y-5 pt-3">
        <div className="space-y-3">
          <div>
            <h1 className="text-title">{titleFor(filters, child)}</h1>
            <p className="text-callout tabular mt-0.5 text-muted-foreground" aria-live="polite">
              {results.length} recipe{results.length === 1 ? "" : "s"}
              {child ? ` for ${profile?.name}, ${stage.range}` : !filters.ages?.length ? ` · for ${stage.label.toLowerCase()}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filters.sort ?? "recommended"} onValueChange={(v) => apply({ ...filters, sort: v as SortId })}>
              <SelectTrigger aria-label="Sort recipes" className="text-callout h-11 rounded-full border-transparent bg-card pr-3.5 pl-4 font-medium text-charcoal shadow-card">
                <span className="text-muted-foreground">Sort:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex h-11 items-center gap-1 rounded-full bg-muted p-1" role="group" aria-label="Layout">
              {(
                [
                  { id: "grid", label: "Grid view", icon: LayoutGrid },
                  { id: "list", label: "List view", icon: List },
                ] as const
              ).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-label={label}
                  aria-pressed={view === id}
                  onClick={() => setView(id)}
                  className={cn("grid size-9 place-items-center rounded-full transition-colors", view === id ? "bg-card text-charcoal shadow-card" : "text-muted-foreground hover:text-charcoal")}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </button>
              ))}
            </div>
          </div>
        </div>

        {child && <InfoNote title="Pending clinical review">Showing only foods suitable for {profile?.name}’s age. Infant and child recipes would be published only after pediatric review (§12, §43).</InfoNote>}
        {conditionFit && !child && (
          <InfoNote title="General guidance, not treatment">These recipes follow simple, reviewed rules. Your allergies and medical rules from your profile are always applied. Follow your care team’s advice.</InfoNote>
        )}

        {results.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="No recipes match"
            description={filterCount || filters.q ? "Try removing a filter or searching for something else." : "No recipes are available for this profile yet."}
            action={
              (filterCount > 0 || !!filters.q) && (
                <Button variant="secondary" onClick={clearAll}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : view === "grid" ? (
          <ul className="grid grid-cols-2 gap-3">
            {results.map((r) => (
              <li key={r.id}>
                <RecipeCard recipe={r} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.id}>
                <RecipeCard recipe={r} variant="wide" />
              </li>
            ))}
          </ul>
        )}

        <HiddenPanel hidden={hidden} name={profile?.relation === "self" ? undefined : profile?.name} />
      </PageBody>

      <FilterSheet open={sheetOpen} onOpenChange={setSheetOpen} value={filters} onApply={apply} child={child} />
    </>
  )
}

/** Sticky search header: back, search field, Filters button with a count, then the active-filter chips. */
function BrowseHeader({
  q,
  onQ,
  filterCount,
  onFilters,
  chips,
  quick,
}: {
  q: string
  onQ: (v: string) => void
  filterCount: number
  onFilters: () => void
  chips: { key: string; label: string; onRemove: () => void }[]
  quick?: { key: string; label: string; onAdd: () => void }[]
}) {
  return (
    <header className="sticky top-0 z-20 bg-background/92 pt-safe backdrop-blur-md">
      <div className="flex items-center gap-2 pt-2 pr-[calc(var(--gutter)-4px)] pb-2 pl-3">
        <BackButton href="/recipes" />
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Search recipes</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-grey" aria-hidden />
          <input
            type="search"
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder="Search recipes"
            enterKeyHint="search"
            className="text-body h-11 w-full rounded-full bg-card pr-10 pl-11 text-charcoal shadow-card outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 [&::-webkit-search-cancel-button]:hidden"
          />
          {q && (
            <button type="button" onClick={() => onQ("")} aria-label="Clear search" className="absolute top-1/2 right-1 grid size-9 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted">
              <X className="size-4" aria-hidden />
            </button>
          )}
        </label>
        <button
          type="button"
          onClick={onFilters}
          aria-label={filterCount ? `Filters, ${filterCount} active` : "Filters"}
          className={cn("relative grid size-11 shrink-0 place-items-center rounded-full shadow-card transition-colors", filterCount ? "bg-lime text-charcoal" : "bg-card text-charcoal hover:bg-muted")}
        >
          <SlidersHorizontal className="size-[19px]" aria-hidden />
          {filterCount > 0 && <span className="tabular absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full bg-forest px-1 text-[11px] font-semibold text-white ring-2 ring-background">{filterCount}</span>}
        </button>
      </div>
      {(chips.length > 0 || (quick && quick.length > 0)) && (
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-gutter pt-0.5 pb-3" role="list" aria-label={chips.length ? "Active filters" : "Quick filters"}>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              role="listitem"
              onClick={c.onRemove}
              aria-label={`Remove filter: ${c.label}`}
              className="text-callout inline-flex h-9 shrink-0 items-center gap-1 rounded-full border border-lime bg-lime pr-2 pl-3.5 font-medium whitespace-nowrap text-charcoal transition-colors hover:bg-lime-card"
            >
              {c.label}
              <X className="size-4" aria-hidden />
            </button>
          ))}
          {chips.length === 0 &&
            quick?.map((c) => (
              <button
                key={c.key}
                type="button"
                role="listitem"
                onClick={c.onAdd}
                className="text-callout inline-flex h-9 shrink-0 items-center rounded-full bg-card px-3.5 font-medium whitespace-nowrap text-charcoal shadow-card transition-colors hover:bg-muted"
              >
                {c.label}
              </button>
            ))}
        </div>
      )}
    </header>
  )
}
