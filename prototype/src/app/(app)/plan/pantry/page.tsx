"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { CalendarClock, CalendarPlus, Package, Plus, ShieldCheck, Trash2 } from "lucide-react"
import { FoodTile } from "@/components/log/food-tile"
import { EmptyState, ListGroup, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { Field, Stepper } from "@/components/app/controls"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { FOODS, FOOD_MAP } from "@/lib/data/foods"
import { RECIPES } from "@/lib/data/recipes"
import { MEAL_LABEL } from "@/lib/planning"
import { violatesHardConstraints } from "@/lib/nutrition"
import { addDays, formatDay, formatTime, todayISO, uid } from "@/lib/date"
import { friendlyGrams, useRecipeLookup } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"
import type { PantryItem, Recipe } from "@/lib/types"

const PANTRY_FOODS = FOODS.filter((f) => f.state !== "cooked" && f.state !== "prepared" && !f.id.startsWith("breast"))
// Raw pantry staple → the cooked form recipes use.
const COOKED_FORM: Record<string, string> = { rice_dry: "rice_cooked", lentils_dry: "dal_cooked" }

/** Pantry (§42.8.2): what you have shapes shopping lists and "use what I have" swaps. */
export default function PantryPage() {
  return (
    <>
      <PageHeader title="Pantry" back="/plan" action={<FeatureBadge feature="pantry" />} />
      <PageBody>
        <PremiumGate feature="pantry">
          <PantryContent />
        </PremiumGate>
      </PageBody>
    </>
  )
}

function PantryContent() {
  const pantry = useApp((s) => s.pantry)
  const upsert = useApp((s) => s.upsertPantry)
  const remove = useApp((s) => s.removePantry)
  const profile = useSelfProfile()
  const [foodId, setFoodId] = useState("")
  const [grams, setGrams] = useState("500")
  const [expires, setExpires] = useState("")
  const [editing, setEditing] = useState<PantryItem | null>(null)
  const [adding, setAdding] = useState<Recipe | null>(null)

  const soon = pantry.filter((p) => p.expiresOn && p.expiresOn <= addDays(todayISO(), 3) && p.grams > 0)
  const soonIds = new Set(soon.flatMap((p) => [p.foodId, COOKED_FORM[p.foodId], p.foodId === "egg_boiled" ? "omelette" : ""]).filter(Boolean))
  // Hard constraints first (allergy, diet), then pantry match — never the other way round (§25.2).
  const useSoon = profile ? RECIPES.filter((r) => r.profile === "adult" && r.reviewStatus === "approved" && !violatesHardConstraints(r, profile) && r.ingredients.some((i) => soonIds.has(i.foodId))).slice(0, 4) : []

  return (
    <div className="space-y-7">
      {soon.length > 0 && (
        <Section title="Use soon" description="These are close to their best-before date.">
          <ListGroup>
            {soon.map((p) => (
              <div key={p.id} className="flex min-h-[60px] items-center gap-3 px-4 py-3">
                <FoodTile foodId={p.foodId} name={p.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="text-body block font-medium">{p.name}</span>
                  <span className="tabular text-caption block text-muted-foreground">{friendlyGrams(p.grams)} left</span>
                </span>
                <Pill tone="caution" icon={<CalendarClock />}>
                  By {formatDay(p.expiresOn!, { day: "numeric", month: "short" })}
                </Pill>
              </div>
            ))}
          </ListGroup>
          {useSoon.length > 0 && (
            <>
              <p className="text-overline px-1 pt-2 text-muted-foreground">Recipes that use them</p>
              <div className="no-scrollbar -mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] pb-1">
                {useSoon.map((r) => (
                  <div key={r.id} className="flex w-44 shrink-0 flex-col rounded-2xl bg-card p-2 shadow-card">
                    <Link href={`/recipes/${r.id}`} className="block rounded-[18px] transition-colors hover:bg-muted/40">
                      <RecipeThumb recipe={r} size="hero" className="h-24 rounded-[18px]" />
                      <p className="text-callout line-clamp-2 min-h-10 px-1.5 pt-2.5 leading-snug font-semibold">{r.name}</p>
                    </Link>
                    <div className="mt-auto px-1 pt-2.5 pb-1">
                      <Button size="sm" variant="secondary" className="w-full" onClick={() => setAdding(r)}>
                        <CalendarPlus className="size-4" /> Add to plan
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      )}

      <Section
        title="In your kitchen"
        badge={pantry.length > 0 ? <span className="tabular grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1.5 text-[11px] font-semibold text-charcoal">{pantry.length}</span> : undefined}
        description="Tap an item to change the amount or date."
      >
        {pantry.length === 0 ? (
          <EmptyState icon={<Package />} title="Your pantry is empty" description="Add staples like rice, lentils and oil so shopping lists skip what you already have." />
        ) : (
          <ListGroup>
            {pantry.map((p) => (
              <div key={p.id} className="flex min-h-[60px] items-center gap-1 pr-2">
                <button type="button" onClick={() => setEditing(p)} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50">
                  <FoodTile foodId={p.foodId} name={p.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="text-body block font-medium">{p.name}</span>
                    <span className={cn("tabular text-caption block", soon.some((s) => s.id === p.id) ? "text-caution" : "text-muted-foreground")}>
                      {p.grams > 0 ? friendlyGrams(p.grams) : "Used up"}
                      {p.expiresOn && ` · best before ${formatDay(p.expiresOn, { day: "numeric", month: "short" })}`}
                    </span>
                  </span>
                </button>
                <button className="grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)}>
                  <Trash2 className="size-[18px]" />
                </button>
              </div>
            ))}
          </ListGroup>
        )}
      </Section>

      <Section title="Add an item">
        <Surface className="space-y-4">
          <div className="space-y-1.5">
            <Label>Food</Label>
            <Select value={foodId} onValueChange={setFoodId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose a food" />
              </SelectTrigger>
              <SelectContent>
                {PANTRY_FOODS.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} · {f.nameBn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="grams">Amount (g)</Label>
              <Input id="grams" inputMode="numeric" value={grams} onChange={(e) => setGrams(e.target.value.replace(/\D/g, ""))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="exp">Best before</Label>
              <Input id="exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
            </div>
          </div>
          <Button
            variant="secondary"
            className="w-full"
            disabled={!foodId || !Number(grams)}
            onClick={() => {
              const f = FOOD_MAP[foodId]
              const existing = pantry.find((p) => p.foodId === foodId)
              // Merge by food: add to what's there instead of creating a duplicate row.
              if (existing) upsert({ ...existing, grams: existing.grams + Number(grams), expiresOn: expires || existing.expiresOn })
              else upsert({ id: uid("pan"), foodId, name: f.name, grams: Number(grams), expiresOn: expires || undefined })
              toast(`${f.name} ${existing ? "topped up" : "added"} — shopping list updated`)
              setFoodId("")
              setExpires("")
            }}
          >
            <Plus className="size-4" /> Add to pantry
          </Button>
        </Surface>
      </Section>

      <InfoNote>Pantry items reduce your shopping list and power the &quot;What I have&quot; swap. Marking a planned meal as eaten uses up its ingredients here (undo puts them back). Allergy rules still apply to every suggestion.</InfoNote>

      <EditSheet item={editing} onClose={() => setEditing(null)} />
      <AddToPlanSheet recipe={adding} onClose={() => setAdding(null)} />
    </div>
  )
}

function EditSheet({ item, onClose }: { item: PantryItem | null; onClose: () => void }) {
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">{item && <EditBody key={item.id} item={item} onClose={onClose} />}</SheetContent>
    </Sheet>
  )
}

function EditBody({ item, onClose }: { item: PantryItem; onClose: () => void }) {
  const upsert = useApp((s) => s.upsertPantry)
  const [grams, setGrams] = useState(item.grams)
  const [expires, setExpires] = useState(item.expiresOn ?? "")
  const step = grams >= 1000 ? 250 : 50
  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-title">{item.name}</SheetTitle>
        <SheetDescription>Update what you have at home.</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-5">
        <Surface tone="muted" className="flex items-center justify-between gap-3">
          <p className="text-callout font-medium">Amount</p>
          <Stepper label="grams" value={<span className="tabular">{friendlyGrams(grams)}</span>} decDisabled={grams <= 0} onDec={() => setGrams(Math.max(0, grams - step))} onInc={() => setGrams(grams + step)} />
        </Surface>
        <Field label="Best before" htmlFor="edit-exp" hint="Leave empty for dry staples that keep.">
          <Input id="edit-exp" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} />
        </Field>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            upsert({ ...item, grams, expiresOn: expires || undefined })
            toast("Pantry updated — shopping list adjusted")
            onClose()
          }}
        >
          Save
        </Button>
      </div>
    </>
  )
}

/** Put a "use soon" recipe into a future slot of the active plan (replaces that meal, §42.8.2). */
function AddToPlanSheet({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const plan = useActivePlan()
  const replace = useApp((s) => s.replaceMeal)
  const lookup = useRecipeLookup()
  const today = todayISO()
  const slots = recipe && plan ? plan.meals.filter((m) => m.date >= today && m.date <= addDays(today, 3) && !m.outcome && m.scheduleStatus !== "paused" && recipe.mealTypes.includes(m.mealType) && m.recipeId !== recipe.id).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) : []
  return (
    <Sheet open={!!recipe} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-title">Add {recipe?.name}</SheetTitle>
          <SheetDescription>Pick a meal in the next few days to replace, so the ingredient is used before it expires.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-5">
          {!plan ? (
            <EmptyState icon={<CalendarPlus />} title="No active plan" description="Activate a meal plan first, then you can swap this recipe into it." />
          ) : slots.length === 0 ? (
            <EmptyState icon={<CalendarPlus />} title="No matching meal" description="There's no upcoming meal of this type to replace in the next 3 days." />
          ) : (
            <ListGroup>
              {slots.map((m) => {
                const current = lookup(m.recipeId)
                return (
                  <button
                    key={m.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => {
                      const prev = m.recipeId
                      replace(m.id, recipe!.id)
                      toast.success(`${MEAL_LABEL[m.mealType]} on ${formatDay(m.date, { weekday: "short" })} updated`, {
                        description: "Nutrition and the shopping list were recalculated.",
                        action: { label: "Undo", onClick: () => replace(m.id, prev) },
                      })
                      onClose()
                    }}
                  >
                    {current && <RecipeThumb recipe={current} size="xs" />}
                    <span className="min-w-0 flex-1">
                      <span className="text-body block font-medium">
                        {formatDay(m.date, { weekday: "short", day: "numeric" })} · {MEAL_LABEL[m.mealType]}
                      </span>
                      <span className="text-caption block text-muted-foreground">
                        {formatTime(m.time)} · replaces {current?.name ?? "meal"}
                      </span>
                    </span>
                  </button>
                )
              })}
            </ListGroup>
          )}
          <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
            <ShieldCheck className="mt-px size-4 shrink-0 text-forest" aria-hidden />
            Only recipes that pass your allergy and diet rules are suggested.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
