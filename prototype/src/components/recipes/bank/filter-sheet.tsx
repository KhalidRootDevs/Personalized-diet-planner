"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Chip, ChipGroup, PillGroup } from "@/components/app/controls"
import { IconTile } from "@/components/app/page"
import { FeatureBadge } from "@/components/app/badges"
import { FIT_ICON } from "@/components/recipes/bank/visuals"
import { CHILD_FITS, useBrowse } from "@/components/recipes/bank/use-bank"
import { AGE_GROUPS, CUISINES, DIET_FILTERS, HEALTH_FITS, MEAL_GROUPS, activeFilterCount, type BankFilters } from "@/lib/recipe-bank"
import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"

const TIMES = [15, 30, 45, 60]

function toggle<T>(list: T[] | undefined, v: T): T[] | undefined {
  const next = list?.includes(v) ? list.filter((x) => x !== v) : [...(list ?? []), v]
  return next.length ? next : undefined
}

/** Bottom sheet with every bank filter. Edits a draft; "Show N recipes" applies it. */
export function FilterSheet({ open, onOpenChange, value, onApply, child }: { open: boolean; onOpenChange: (o: boolean) => void; value: BankFilters; onApply: (f: BankFilters) => void; child: boolean }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="gap-0 pb-0">
        {/* Radix unmounts closed content, so the draft resets from `value` each time the sheet opens. */}
        <FilterBody
          value={value}
          child={child}
          onApply={(f) => {
            onApply(f)
            onOpenChange(false)
          }}
        />
      </SheetContent>
    </Sheet>
  )
}

function FilterBody({ value, onApply, child }: { value: BankFilters; onApply: (f: BankFilters) => void; child: boolean }) {
  const [d, setD] = useState<BankFilters>(value)
  const { results } = useBrowse(d)
  const set = (patch: Partial<BankFilters>) => setD((cur) => ({ ...cur, ...patch }))
  const fits = HEALTH_FITS.filter((h) => !child || CHILD_FITS.includes(h.id))
  const count = activeFilterCount(child ? { ...d, ages: undefined } : d)

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-title">Filters</SheetTitle>
        <SheetDescription className="text-callout">Your allergies, diet and medical rules are always applied.</SheetDescription>
      </SheetHeader>

      <div className="space-y-7 px-5 pt-5 pb-6">
        <Group title="Meal">
          <ChipGroup label="Meal" options={MEAL_GROUPS.map((m) => ({ value: m.id, label: m.label }))} value={d.meals ?? []} onChange={(v) => set({ meals: v.length ? v : undefined })} />
        </Group>

        <Group title="Cuisine">
          <div role="group" aria-label="Cuisine" className="flex flex-wrap gap-2">
            {CUISINES.map((c) => {
              const on = !!d.cuisines?.includes(c.id)
              return (
                <Chip key={c.id} selected={on} onClick={() => set({ cuisines: toggle(d.cuisines, c.id) })}>
                  {on && <Check className="size-3.5" strokeWidth={2.5} />}
                  {c.label}
                  {!c.local && <FeatureBadge feature="world_cuisines" className="-mr-1 h-[18px] px-1.5" />}
                </Chip>
              )
            })}
          </div>
        </Group>

        {!child && (
          <Group title="Age group" note="Browsing for another age keeps your allergies applied. Open the child’s own profile for age-specific safety checks.">
            <ChipGroup label="Age group" options={AGE_GROUPS.map((a) => ({ value: a.id, label: a.label }))} value={d.ages ?? []} onChange={(v) => set({ ages: v.length ? v : undefined })} />
          </Group>
        )}

        <Group
          title="Health fit"
          note="General guidance, not treatment. Allergies and medical rules from the profile are always applied, whatever you pick here."
        >
          <div role="group" aria-label="Health fit" className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border/60">
            {fits.map((h) => {
              const on = !!d.fits?.includes(h.id)
              const { icon: Icon, tone } = FIT_ICON[h.id]
              return (
                <button
                  key={h.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set({ fits: toggle(d.fits, h.id) })}
                  className={cn("flex min-h-[60px] w-full items-center gap-3 px-4 py-3 text-left transition-colors", on ? "bg-sage" : "hover:bg-muted/50")}
                >
                  <IconTile tone={on ? "lime" : tone}>
                    <Icon />
                  </IconTile>
                  <span className="min-w-0 flex-1">
                    <span className="text-body flex items-center gap-2 font-medium">
                      {h.label}
                      {h.kind === "condition" && <FeatureBadge feature="condition_recipes" />}
                    </span>
                    <span className="text-caption block text-muted-foreground">{h.short}</span>
                  </span>
                  <span className={cn("grid size-[22px] shrink-0 place-items-center rounded-full border-[1.5px]", on ? "border-forest bg-forest text-white" : "border-input")}>
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              )
            })}
          </div>
        </Group>

        <Group title="Diet">
          <ChipGroup label="Diet" options={DIET_FILTERS.map((x) => ({ value: x.id, label: x.label }))} value={d.diets ?? []} onChange={(v) => set({ diets: v.length ? v : undefined })} />
        </Group>

        <Group title="Max time">
          <PillGroup
            label="Max time"
            options={[{ value: "any", label: "Any" }, ...TIMES.map((t) => ({ value: String(t), label: `${t} min` }))]}
            value={d.maxMinutes ? String(d.maxMinutes) : "any"}
            onChange={(v) => set({ maxMinutes: v === "any" ? undefined : Number(v) })}
          />
        </Group>

        <Group title="Difficulty">
          <PillGroup
            label="Difficulty"
            options={[
              { value: "any", label: "Any" },
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
            ]}
            value={d.difficulty ?? "any"}
            onChange={(v) => set({ difficulty: v === "any" ? undefined : (v as Recipe["difficulty"]) })}
          />
        </Group>
      </div>

      <div className="sticky bottom-0 flex gap-2 border-t border-border/70 bg-card px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Button variant="outline" size="lg" className="px-5" disabled={count === 0} onClick={() => setD({ q: d.q, sort: d.sort })}>
          Clear all
        </Button>
        <Button size="lg" className="tabular flex-1" onClick={() => onApply(d)}>
          {results.length === 0 ? "No recipes match" : `Show ${results.length} recipe${results.length === 1 ? "" : "s"}`}
        </Button>
      </div>
    </>
  )
}

function Group({ title, note, children }: { title: React.ReactNode; note?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-headline flex items-center gap-2">{title}</h3>
        {note && <p className="text-caption mt-0.5 text-muted-foreground">{note}</p>}
      </div>
      {children}
    </section>
  )
}
