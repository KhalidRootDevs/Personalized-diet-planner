"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ArrowRight, CalendarRange, Copy, ListChecks, Package, Pencil, Plus, RefreshCw, Replace, Share2, ShieldCheck, ShoppingBasket, Trash2, Users, Wallet } from "lucide-react"
import { EmptyState, HeaderIconButton, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { Chip, Field, Segmented, Stepper } from "@/components/app/controls"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { EstimateNote } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
import { FoodTile } from "@/components/log/food-tile"
import { FeatureBadge, PhaseBadge, PremiumGate, useFeature } from "@/components/app/badges"
import { useActivePlan, useApp, useSelfProfile } from "@/lib/store"
import { fmt } from "@/lib/nutrition"
import { MEAL_LABEL } from "@/lib/planning"
import { friendlyGrams, useRecipeLookup } from "@/lib/area-c-utils"
import { alternativesFor, costFor, defaultScope, rebuildScoped, scopedMeals, substitutionImpact, type Alternative, type ShoppingScope } from "@/lib/shopping"
import { addDays, formatDay, formatTime, startOfWeek, todayISO, uid } from "@/lib/date"
import { cn } from "@/lib/utils"
import type { ShoppingItem } from "@/lib/types"

type ScopeMode = "plan" | "week" | "custom"

/** Automatic shopping list (§16, FR-018) with grocery enhancements (§42.8). */
export default function ShoppingPage() {
  const items = useApp((s) => s.shopping)
  const people = useApp((s) => s.shoppingPeople)
  const setPeople = useApp((s) => s.setShoppingPeople)
  const toggle = useApp((s) => s.toggleShopping)
  const remove = useApp((s) => s.removeShopping)
  const add = useApp((s) => s.addShopping)
  const hidden = useApp((s) => s.shoppingHidden ?? [])
  const setHidden = useApp((s) => s.setShoppingHidden)
  const storedScope = useApp((s) => s.shoppingScope)
  const setScopeStore = useApp((s) => s.setShoppingScope)
  const setItems = useApp((s) => s.setShoppingItems)
  const stockPantry = useApp((s) => s.stockPantryFromShopping)
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const pantry = useFeature("pantry")
  const profile = useSelfProfile()
  const [newItem, setNewItem] = useState("")
  const [hideBought, setHideBought] = useState(false)
  const [editing, setEditing] = useState<ShoppingItem | null>(null)
  const [mealsOpen, setMealsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const scope: ShoppingScope = storedScope ?? defaultScope(plan)
  const mode: ScopeMode = !storedScope ? "plan" : storedScope.from === todayISO() && storedScope.to === addDays(startOfWeek(todayISO()), 6) && !storedScope.excluded.length ? "week" : "custom"

  const applyScope = (next: ShoppingScope | null, current?: ShoppingItem[]) => {
    setScopeStore(next)
    const s = useApp.getState()
    setItems(rebuildScoped({ plan, scope: next ?? defaultScope(plan), people: s.shoppingPeople, pantry: s.pantry, current: current ?? s.shopping, lookup }))
  }
  const changePeople = (n: number) => {
    const current = useApp.getState().shopping // keep ticks and edits across the global rebuild
    setPeople(n)
    applyScope(storedScope, current)
  }

  // Global plan changes rebuild the whole list; re-apply the chosen dates/meals when the list opens.
  useEffect(() => {
    if (useApp.getState().shoppingScope) applyScope(useApp.getState().shoppingScope)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const visible = items.filter((i) => !hidden.includes(i.foodId) || i.manual)
  const total = visible.reduce((s, i) => s + i.costBdt, 0)
  const left = visible.filter((i) => !i.purchased).reduce((s, i) => s + i.costBdt, 0)
  const groups = Array.from(new Set(visible.map((i) => i.category)))
  const budget = profile?.budgetPerWeekBdt
  const bought = visible.filter((i) => i.purchased).length
  const boughtPlanItems = visible.filter((i) => i.purchased && !i.manual && i.grams > 0).length
  const overBudget = budget ? total > budget * people : false
  const hiddenItems = items.filter((i) => hidden.includes(i.foodId) && !i.manual)
  const meals = scopedMeals(plan, { ...scope, excluded: [] })

  const hide = (i: ShoppingItem) => {
    setHidden([...hidden, i.foodId])
    toast(`${i.name} removed from the list`, { description: "Your plan's recipes are unchanged.", action: { label: "Undo", onClick: () => setHidden(useApp.getState().shoppingHidden.filter((f) => f !== i.foodId)) } })
  }

  return (
    <>
      <PageHeader
        title="Shopping list"
        back="/plan"
        action={
          <HeaderIconButton label="Share list" onClick={() => setShareOpen(true)}>
            <Share2 className="size-[18px]" />
          </HeaderIconButton>
        }
      />
      <PageBody>
        <Surface tone="lime" padding="lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-caption inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-1 font-medium">
                <ShoppingBasket className="size-3.5" aria-hidden /> Estimated cost
              </p>
              <p className="text-metric mt-2 text-[32px] leading-9 font-bold">{fmt.bdt(total)}</p>
              <p className="tabular text-caption text-charcoal/75">{fmt.bdt(left)} still to buy</p>
            </div>
            {budget && (
              <Pill tone={overBudget ? "caution" : "neutral"} className={overBudget ? undefined : "bg-white/70"}>
                {overBudget ? "Above budget" : "Within budget"}
              </Pill>
            )}
          </div>
          <div className="mt-4">
            <div className="text-caption mb-1.5 flex justify-between text-charcoal/75">
              <span>
                {bought} of {visible.length} items bought
              </span>
              {budget && <span className="tabular">Budget {fmt.bdt(budget * people)} / week</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full bg-charcoal" style={{ width: `${visible.length ? (bought / visible.length) * 100 : 0}%` }} />
            </div>
          </div>
          {overBudget && <p className="text-caption mt-3 font-medium text-amber-text">This list is above your weekly budget. See lower-cost options below.</p>}
        </Surface>

        <Section title="What to shop for" description="Choose the days, or leave out meals you won't cook.">
          <Segmented
            label="Shopping range"
            value={mode}
            onChange={(v) => {
              if (v === "plan") applyScope(null)
              else if (v === "week") applyScope({ from: todayISO(), to: addDays(startOfWeek(todayISO()), 6), excluded: [] })
              else applyScope({ ...scope })
            }}
            options={[
              { value: "plan", label: "Rest of plan" },
              { value: "week", label: "This week" },
              { value: "custom", label: "Custom" },
            ]}
          />
          {mode === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="From" htmlFor="sh-from">
                <Input id="sh-from" type="date" value={scope.from} min={todayISO()} onChange={(e) => e.target.value && applyScope({ ...scope, from: e.target.value, to: scope.to < e.target.value ? e.target.value : scope.to })} />
              </Field>
              <Field label="To" htmlFor="sh-to">
                <Input id="sh-to" type="date" value={scope.to} min={scope.from} onChange={(e) => e.target.value && applyScope({ ...scope, to: e.target.value })} />
              </Field>
            </div>
          )}
          <ListGroup>
            <ListRow
              onClick={() => setMealsOpen(true)}
              icon={<CalendarRange />}
              iconTone="sky"
              title="Meals included"
              description={`${meals.length - scope.excluded.filter((id) => meals.some((m) => m.id === id)).length} of ${meals.length} meals · ${formatDay(scope.from, { day: "numeric", month: "short" })} – ${formatDay(scope.to, { day: "numeric", month: "short" })}`}
            />
            <ListRow
              title="Cooking for"
              description="Scales every quantity"
              trailing={
                <Stepper
                  label="people"
                  value={people}
                  suffix={people === 1 ? "person" : "people"}
                  decDisabled={people <= 1}
                  incDisabled={people >= 8}
                  onDec={() => changePeople(people - 1)}
                  onInc={() => changePeople(people + 1)}
                />
              }
            />
          </ListGroup>
        </Section>

        <div className="flex items-center justify-between gap-2">
          <Chip selected={hideBought} onClick={() => setHideBought(!hideBought)}>
            Hide bought
          </Chip>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              applyScope(storedScope)
              toast("List refreshed from your plan")
            }}
          >
            <RefreshCw className="size-4" /> Refresh from plan
          </Button>
        </div>

        {visible.length === 0 ? (
          <EmptyState icon={<ShoppingBasket />} title="Nothing to buy" description="Activate a meal plan or widen the dates, and ingredients appear here automatically." />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => {
              const list = visible.filter((i) => i.category === g && !(hideBought && i.purchased))
              if (!list.length) return null
              return (
                <ListGroup key={g} label={g}>
                  {list.map((i) => (
                    <div key={i.id} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                      <Checkbox id={i.id} checked={i.purchased} onCheckedChange={() => toggle(i.id)} aria-label={`${i.name}: ${i.purchased ? "bought" : "not bought"}`} />
                      <FoodTile foodId={i.foodId ?? ""} name={i.name} size="sm" className="size-10" />
                      <label htmlFor={i.id} className="min-w-0 flex-1 cursor-pointer">
                        <span className={cn("text-body block font-medium", i.purchased && "text-muted-foreground line-through")}>{i.name}</span>
                        <span className="text-caption flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
                          {i.purchased && <span className="font-medium text-forest no-underline">Bought</span>}
                          {i.grams > 0 && <span className="tabular">~{fmt.bdt(i.costBdt)} estimate</span>}
                          {i.substitutedFrom && <span>· replaces {i.substitutedFrom}</span>}
                          {i.edited && <span>· edited</span>}
                        </span>
                      </label>
                      {i.optional && <Pill tone="outline">Optional</Pill>}
                      {i.manual ? (
                        <button className="-mr-2 grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)}>
                          <Trash2 className="size-[18px]" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing(i)}
                          className={cn("tabular text-callout -mr-2 inline-flex h-10 shrink-0 items-center gap-1 rounded-full px-2.5 font-medium hover:bg-muted", i.purchased && "text-muted-foreground")}
                          aria-label={`Edit ${i.name}, ${friendlyGrams(i.grams)}`}
                        >
                          {friendlyGrams(i.grams)}
                          <Pencil className="size-3.5 text-muted-grey" aria-hidden />
                        </button>
                      )}
                    </div>
                  ))}
                </ListGroup>
              )
            })}
          </div>
        )}

        {hiddenItems.length > 0 && (
          <p className="text-callout text-center text-muted-foreground">
            {hiddenItems.length} item{hiddenItems.length > 1 ? "s" : ""} removed ({hiddenItems.map((i) => i.name).join(", ")}) ·{" "}
            <button className="font-semibold text-forest underline-offset-4 hover:underline" onClick={() => setHidden([])}>
              Restore
            </button>
          </p>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!newItem.trim()) return
            add({ id: uid("shop"), foodId: "", name: newItem.trim(), category: "Other items", grams: 0, purchased: false, costBdt: 0, manual: true })
            setNewItem("")
          }}
        >
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add an item, e.g. soap" aria-label="Add an item" />
          <Button type="submit" variant="outline" className="h-12 shrink-0">
            <Plus className="size-4" /> Add
          </Button>
        </form>

        {pantry.allowed && boughtPlanItems > 0 && (
          <Surface className="flex items-center gap-3">
            <Package className="size-5 shrink-0 text-amber-text" aria-hidden />
            <p className="text-callout min-w-0 flex-1">Done shopping? Move {boughtPlanItems} bought item{boughtPlanItems > 1 ? "s" : ""} into your pantry. Amounts are added to what you already have.</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                const n = stockPantry()
                toast.success(`${n} item${n > 1 ? "s" : ""} added to your pantry`)
              }}
            >
              Move
            </Button>
          </Surface>
        )}

        <BudgetSection items={visible} onApply={(i, alt) => applySub(i, alt)} />

        <EstimateNote>Quantities are rounded and prices are typical Dhaka market estimates.</EstimateNote>
      </PageBody>

      <ItemSheet item={editing} onClose={() => setEditing(null)} onHide={hide} onReplace={(i, alt) => applySub(i, alt)} />
      <MealsSheet open={mealsOpen} onOpenChange={setMealsOpen} scope={scope} onChange={(excluded) => applyScope({ ...scope, excluded })} />
      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} items={visible} groups={groups} />
    </>
  )

  function applySub(i: ShoppingItem, alt: Alternative) {
    if (!alt.foodId) return
    const prev = { ...i }
    const impact = substitutionImpact(i.foodId, alt.foodId, scopedMeals(plan, scope), lookup)
    useApp.getState().updateShopping(i.id, { foodId: alt.foodId, name: alt.name, costBdt: costFor(alt.foodId, i.grams), substitutedFrom: i.substitutedFrom ?? i.name })
    toast.success(`${i.name} → ${alt.name}`, {
      description: impact.length ? `${impact.length} meal${impact.length > 1 ? "s" : ""} recalculated with the new ingredient.` : "List updated.",
      action: { label: "Undo", onClick: () => useApp.getState().updateShopping(i.id, prev) },
    })
    setEditing(null)
  }
}

/* ───────────── Budget: lower-cost options (§16.3, §42.7) ───────────── */

function BudgetSection({ items, onApply }: { items: ShoppingItem[]; onApply: (i: ShoppingItem, alt: Alternative) => void }) {
  const profile = useSelfProfile()
  const options = items
    .filter((i) => !i.manual && !i.purchased && i.grams > 0)
    .flatMap((i) => alternativesFor(i, profile, "cheaper").slice(0, 3).map((alt) => ({ item: i, alt, saving: alt.delta ? -alt.delta.costBdt : Math.round(((i.costBdt / Math.max(1, i.grams)) * 100 - alt.costPer100gBdt) * (i.grams / 100)) })))
    .filter((o) => o.saving > 0)
    .sort((a, b) => Number(a.alt.lowerProtein) - Number(b.alt.lowerProtein) || b.saving - a.saving)
    .slice(0, 4)
  return (
    <Section title="Lower-cost options" badge={<FeatureBadge feature="budget_optimizer" />} description="Only re-ranks options that already pass your allergy and diet rules.">
      <PremiumGate feature="budget_optimizer" variant="row">
        {options.length === 0 ? (
          <p className="text-callout rounded-2xl bg-card px-4 py-3 text-muted-foreground shadow-card">No lower-cost swaps for this list right now.</p>
        ) : (
          <ListGroup>
            {options.map(({ item, alt, saving }) => (
              <div key={`${item.id}-${alt.name}`} className="space-y-2 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wallet className="size-4 shrink-0 text-amber-text" aria-hidden />
                  <p className="text-body min-w-0 flex-1 font-medium">
                    {item.name} <ArrowRight className="inline size-3.5 text-muted-grey" aria-hidden /> {alt.name}
                  </p>
                  <Pill tone="sage">saves ~{fmt.bdt(saving)}</Pill>
                </div>
                <AltMeta alt={alt} />
                {alt.foodId ? (
                  <Button size="sm" variant="secondary" onClick={() => onApply(item, alt)}>
                    Use {alt.name.toLowerCase()}
                  </Button>
                ) : (
                  <Pill tone="outline">Not yet verified · can&apos;t be used in a plan yet</Pill>
                )}
              </div>
            ))}
          </ListGroup>
        )}
        <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
          <ShieldCheck className="mt-px size-4 shrink-0 text-forest" aria-hidden />
          The cheapest option never replaces a food if it would leave your meals short on protein or other key nutrients; those swaps are flagged.
        </p>
      </PremiumGate>
    </Section>
  )
}

function AltMeta({ alt }: { alt: Alternative }) {
  return (
    <p className={cn("text-caption", alt.lowerProtein ? "text-caution" : "text-muted-foreground")}>
      {alt.delta && (
        <span className="tabular">
          {alt.delta.costBdt <= 0 ? "−" : "+"}
          {fmt.bdt(Math.abs(alt.delta.costBdt))} · {alt.delta.kcal >= 0 ? "+" : "−"}~{Math.abs(Math.round(alt.delta.kcal))} kcal · {alt.delta.proteinG >= 0 ? "+" : "−"}~{Math.abs(Math.round(alt.delta.proteinG))} g protein for this amount.{" "}
        </span>
      )}
      {alt.note}
    </p>
  )
}

/* ───────────── Item sheet: quantity, optional, replace, remove ───────────── */

function ItemSheet({ item, onClose, onHide, onReplace }: { item: ShoppingItem | null; onClose: () => void; onHide: (i: ShoppingItem) => void; onReplace: (i: ShoppingItem, alt: Alternative) => void }) {
  return (
    <Sheet open={!!item} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom">{item && <ItemSheetBody key={item.id} item={item} onClose={onClose} onHide={onHide} onReplace={onReplace} />}</SheetContent>
    </Sheet>
  )
}

function ItemSheetBody({ item, onClose, onHide, onReplace }: { item: ShoppingItem; onClose: () => void; onHide: (i: ShoppingItem) => void; onReplace: (i: ShoppingItem, alt: Alternative) => void }) {
  const update = useApp((s) => s.updateShopping)
  const profile = useSelfProfile()
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const scope = useApp((s) => s.shoppingScope) ?? defaultScope(plan)
  const [grams, setGrams] = useState(item.grams)
  const [replacing, setReplacing] = useState(false)
  const [pick, setPick] = useState<Alternative | null>(null)
  const step = grams >= 1000 ? 250 : grams >= 200 ? 50 : 10
  const alts = alternativesFor(item, profile, "unavailable")
  const impact = pick?.foodId ? substitutionImpact(item.foodId, pick.foodId, scopedMeals(plan, scope), lookup) : []

  if (replacing)
    return (
      <>
        <SheetHeader>
          <SheetTitle className="text-title flex items-center gap-2">
            Replace {item.name.toLowerCase()} <PhaseBadge phase={2} />
          </SheetTitle>
          <SheetDescription>Can&apos;t find it? Pick an alternative. Allergy and diet rules are applied first.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-5">
          {alts.length === 0 ? (
            <p className="text-callout text-muted-foreground">No safe alternative in the food database for this item.</p>
          ) : (
            <div className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card" role="radiogroup" aria-label="Alternatives">
              {alts.map((a) => (
                <button key={a.name} type="button" role="radio" aria-checked={pick?.name === a.name} disabled={!a.foodId} onClick={() => setPick(a)} className={cn("w-full space-y-1 px-4 py-3 text-left transition-colors disabled:opacity-70", pick?.name === a.name ? "bg-sage" : "hover:bg-muted/50")}>
                  <span className="flex items-center gap-2">
                    <span className="text-body flex-1 font-medium">{a.name}</span>
                    {!a.foodId && <Pill tone="outline">Not yet verified</Pill>}
                  </span>
                  <AltMeta alt={a} />
                </button>
              ))}
            </div>
          )}
          {pick?.foodId && (
            <Surface tone="muted" className="space-y-1.5">
              <p className="text-overline text-muted-foreground">Recalculated meals · {impact.length}</p>
              {impact.slice(0, 4).map(({ meal, recipe, before, after }) => (
                <p key={meal.id} className="text-caption">
                  <span className="font-medium">
                    {formatDay(meal.date, { weekday: "short" })} {MEAL_LABEL[meal.mealType].toLowerCase()}
                  </span>{" "}
                  · {recipe.name}:{" "}
                  <span className="tabular">
                    ~{Math.round(before.energyKcal)} → ~{Math.round(after!.energyKcal)} kcal, ~{Math.round(before.proteinG)} → ~{Math.round(after!.proteinG)} g protein
                  </span>
                </p>
              ))}
              {impact.length === 0 && <p className="text-caption text-muted-foreground">No planned meal in this range uses it.</p>}
              <p className="text-caption text-muted-foreground">Nutrition is recalculated from the food database — substitutes are never assumed equivalent.</p>
            </Surface>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => setReplacing(false)}>
              Back
            </Button>
            <Button disabled={!pick?.foodId} onClick={() => pick && onReplace(item, pick)}>
              Use {pick?.name.toLowerCase() ?? "alternative"}
            </Button>
          </div>
        </div>
      </>
    )

  return (
    <>
      <SheetHeader>
        <SheetTitle className="text-title">{item.name}</SheetTitle>
        <SheetDescription>{item.category}</SheetDescription>
      </SheetHeader>
      <div className="space-y-5 px-5">
        <Surface tone="muted" className="flex items-center justify-between gap-3">
          <div>
            <p className="text-callout font-medium">Quantity</p>
            <p className="tabular text-caption text-muted-foreground">~{fmt.bdt(costFor(item.foodId, grams))} estimate</p>
          </div>
          <Stepper label="grams" value={<span className="tabular">{friendlyGrams(grams)}</span>} decDisabled={grams <= step} onDec={() => setGrams(Math.max(step, grams - step))} onInc={() => setGrams(grams + step)} />
        </Surface>
        <ListGroup>
          <ListRow
            title="Optional ingredient"
            description="Buy it only if you want it — the meal works without it"
            trailing={<Switch checked={!!item.optional} onCheckedChange={(v) => update(item.id, { optional: v })} aria-label="Optional ingredient" />}
          />
          <ListRow onClick={() => setReplacing(true)} icon={<Replace />} iconTone="amber" title={<>Replace unavailable ingredient <PhaseBadge phase={2} /></>} description="Find an alternative; affected meals are recalculated" />
          <ListRow
            onClick={() => {
              onHide(item)
              onClose()
            }}
            icon={<Trash2 />}
            iconTone="muted"
            title="Remove from list"
            description="Already have it or don't need it — you can restore it"
          />
        </ListGroup>
        <Button
          size="lg"
          className="w-full"
          onClick={() => {
            update(item.id, { grams, costBdt: costFor(item.foodId, grams), edited: grams !== item.grams || item.edited })
            toast("Quantity updated")
            onClose()
          }}
        >
          Save
        </Button>
      </div>
    </>
  )
}

/* ───────────── Meals included ───────────── */

function MealsSheet({ open, onOpenChange, scope, onChange }: { open: boolean; onOpenChange: (o: boolean) => void; scope: ShoppingScope; onChange: (excluded: string[]) => void }) {
  const plan = useActivePlan()
  const lookup = useRecipeLookup()
  const meals = scopedMeals(plan, { ...scope, excluded: [] }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const days = Array.from(new Set(meals.map((m) => m.date)))
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-title">Meals included</SheetTitle>
          <SheetDescription>Untick meals you&apos;re not cooking (eating out, leftovers). The list updates straight away.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-5">
          {days.length === 0 && <p className="text-callout text-muted-foreground">No upcoming meals in this range.</p>}
          {days.map((d) => (
            <ListGroup key={d} label={formatDay(d, { weekday: "long", day: "numeric", month: "short" })}>
              {meals
                .filter((m) => m.date === d)
                .map((m) => {
                  const on = !scope.excluded.includes(m.id)
                  return (
                    <label key={m.id} className="flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-2.5">
                      <Checkbox checked={on} onCheckedChange={() => onChange(on ? [...scope.excluded, m.id] : scope.excluded.filter((x) => x !== m.id))} />
                      <span className="min-w-0 flex-1">
                        <span className="text-body block font-medium">{lookup(m.recipeId)?.name ?? "Meal"}</span>
                        <span className="text-caption block text-muted-foreground">
                          {MEAL_LABEL[m.mealType]} · {formatTime(m.time)}
                        </span>
                      </span>
                    </label>
                  )
                })}
            </ListGroup>
          ))}
          <Button size="lg" className="w-full" onClick={() => onOpenChange(false)}>
            <ListChecks className="size-4" /> Done
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/* ───────────── Share with family (§16.2) ───────────── */

function ShareSheet({ open, onOpenChange, items, groups }: { open: boolean; onOpenChange: (o: boolean) => void; items: ShoppingItem[]; groups: string[] }) {
  const [onlyLeft, setOnlyLeft] = useState(true)
  const [withQty, setWithQty] = useState(true)
  const text = [
    "Shopping list (NutriPlan)",
    ...groups.flatMap((g) => {
      const list = items.filter((i) => i.category === g && (!onlyLeft || !i.purchased))
      if (!list.length) return []
      return ["", g, ...list.map((i) => `• ${i.name}${withQty && i.grams ? ` — ${friendlyGrams(i.grams)}` : ""}${i.optional ? " (optional)" : ""}`)]
    }),
  ].join("\n")
  const canShare = typeof navigator !== "undefined" && !!navigator.share

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle className="text-title">Share with family</SheetTitle>
          <SheetDescription>Send the list to whoever is doing the shopping.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-5">
          <ListGroup>
            <ListRow title="Only items still to buy" trailing={<Switch checked={onlyLeft} onCheckedChange={setOnlyLeft} aria-label="Only items still to buy" />} />
            <ListRow title="Include quantities" trailing={<Switch checked={withQty} onCheckedChange={setWithQty} aria-label="Include quantities" />} />
          </ListGroup>
          <pre className="text-caption max-h-48 overflow-auto rounded-2xl bg-muted p-4 font-sans whitespace-pre-wrap">{text}</pre>
          <InfoNote>Only food names and amounts are shared — never health details, allergies or goals.</InfoNote>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(text)
                  toast("List copied — paste it into a message")
                  onOpenChange(false)
                } catch {
                  toast("Couldn't copy on this device")
                }
              }}
            >
              <Copy className="size-4" /> Copy text
            </Button>
            <Button
              disabled={!canShare}
              onClick={async () => {
                try {
                  await navigator.share({ title: "Shopping list", text })
                  onOpenChange(false)
                } catch {}
              }}
            >
              <Users className="size-4" /> Share…
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
