"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Plus, RefreshCw, Share2, ShoppingBasket, Trash2 } from "lucide-react"
import { EmptyState, HeaderIconButton, ListGroup, ListRow, PageBody, PageHeader, Pill, Surface } from "@/components/app/page"
import { Chip, Stepper } from "@/components/app/controls"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EstimateNote } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
import { FoodTile } from "@/components/log/food-tile"
import { useApp, useSelfProfile } from "@/lib/store"
import { useFeature } from "@/components/app/badges"
import { fmt } from "@/lib/nutrition"
import { friendlyGrams } from "@/lib/area-c-utils"
import { uid } from "@/lib/date"
import { cn } from "@/lib/utils"

/** Automatic shopping list (§16, FR-018) with grocery enhancements (§42.8). */
export default function ShoppingPage() {
  const items = useApp((s) => s.shopping)
  const people = useApp((s) => s.shoppingPeople)
  const setPeople = useApp((s) => s.setShoppingPeople)
  const toggle = useApp((s) => s.toggleShopping)
  const remove = useApp((s) => s.removeShopping)
  const add = useApp((s) => s.addShopping)
  const rebuild = useApp((s) => s.rebuildShopping)
  const upsertPantry = useApp((s) => s.upsertPantry)
  const pantry = useFeature("pantry")
  const profile = useSelfProfile()
  const [newItem, setNewItem] = useState("")
  const [hideBought, setHideBought] = useState(false)

  const total = items.reduce((s, i) => s + i.costBdt, 0)
  const left = items.filter((i) => !i.purchased).reduce((s, i) => s + i.costBdt, 0)
  const groups = Array.from(new Set(items.map((i) => i.category)))
  const budget = profile?.budgetPerWeekBdt

  const share = async () => {
    const text = groups
      .map((g) => `${g}\n${items.filter((i) => i.category === g && !i.purchased).map((i) => `• ${i.name}${i.grams ? ` — ${friendlyGrams(i.grams)}` : ""}`).join("\n")}`)
      .join("\n\n")
    try {
      if (navigator.share) await navigator.share({ title: "Shopping list", text })
      else {
        await navigator.clipboard.writeText(text)
        toast("List copied to clipboard")
      }
    } catch {}
  }

  const bought = items.filter((i) => i.purchased).length
  const overBudget = budget ? total > budget * people : false

  return (
    <>
      <PageHeader
        title="Shopping list"
        back="/plan"
        action={
          <HeaderIconButton label="Share list" onClick={share}>
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
                {bought} of {items.length} items bought
              </span>
              {budget && <span className="tabular">Budget {fmt.bdt(budget * people)} / week</span>}
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/60">
              <div className="h-full rounded-full bg-charcoal" style={{ width: `${items.length ? (bought / items.length) * 100 : 0}%` }} />
            </div>
          </div>
          {overBudget && <p className="text-caption mt-3 font-medium text-amber-text">This list is above your weekly budget. The lowest-cost plan style can help.</p>}
        </Surface>

        <ListGroup>
          <ListRow
            title="Cooking for"
            description="Scales every quantity"
            trailing={<Stepper label="people" value={people} suffix={people === 1 ? "person" : "people"} decDisabled={people <= 1} incDisabled={people >= 8} onDec={() => setPeople(people - 1)} onInc={() => setPeople(people + 1)} />}
          />
        </ListGroup>

        <div className="flex items-center justify-between gap-2">
          <Chip selected={hideBought} onClick={() => setHideBought(!hideBought)}>
            Hide bought
          </Chip>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              rebuild()
              toast("List refreshed from your plan")
            }}
          >
            <RefreshCw className="size-4" /> Refresh from plan
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState icon={<ShoppingBasket />} title="Nothing to buy" description="Activate a meal plan and its ingredients appear here automatically." />
        ) : (
          <div className="space-y-5">
            {groups.map((g) => {
              const list = items.filter((i) => i.category === g && !(hideBought && i.purchased))
              if (!list.length) return null
              return (
                <ListGroup key={g} label={g}>
                  {list.map((i) => (
                    <div key={i.id} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                      <Checkbox
                        id={i.id}
                        checked={i.purchased}
                        onCheckedChange={() => {
                          toggle(i.id)
                          if (!i.purchased && pantry.allowed && !i.manual) {
                            upsertPantry({ id: `pantry_${i.foodId}`, foodId: i.foodId, name: i.name, grams: i.grams })
                          }
                        }}
                      />
                      <FoodTile foodId={i.foodId ?? ""} name={i.name} size="sm" className="size-10" />
                      <label htmlFor={i.id} className="min-w-0 flex-1 cursor-pointer">
                        <span className={cn("text-body block font-medium", i.purchased && "text-muted-foreground line-through")}>{i.name}</span>
                        {i.grams > 0 && <span className="tabular text-caption block text-muted-foreground">~{fmt.bdt(i.costBdt)} estimate</span>}
                      </label>
                      {i.grams > 0 && <span className={cn("tabular text-callout shrink-0 font-medium", i.purchased && "text-muted-foreground")}>{friendlyGrams(i.grams)}</span>}
                      {i.manual && (
                        <button className="-mr-2 grid size-10 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)}>
                          <Trash2 className="size-[18px]" />
                        </button>
                      )}
                    </div>
                  ))}
                </ListGroup>
              )
            })}
          </div>
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

        {pantry.allowed && <InfoNote>Ticking an item also adds it to your pantry, so future lists skip what you already have.</InfoNote>}
        <EstimateNote>Quantities are rounded and prices are typical Dhaka market estimates.</EstimateNote>
      </PageBody>
    </>
  )
}
