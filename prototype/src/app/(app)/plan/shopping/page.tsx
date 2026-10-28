"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Minus, Plus, RefreshCw, Share2, ShoppingBasket, Trash2 } from "lucide-react"
import { EmptyState, PageBody, PageHeader, Section } from "@/components/app/page"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { EstimateNote } from "@/components/app/nutrition"
import { InfoNote } from "@/components/app/alerts"
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

  return (
    <>
      <PageHeader
        title="Shopping list"
        back="/plan"
        action={
          <Button size="icon" variant="ghost" aria-label="Share list" onClick={share}>
            <Share2 />
          </Button>
        }
      />
      <PageBody>
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Estimated cost</p>
              <p className="tabular text-2xl font-semibold">{fmt.bdt(total)}</p>
              <p className="tabular text-xs text-muted-foreground">{fmt.bdt(left)} still to buy</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Cooking for</p>
              <div className="mt-1 flex items-center gap-2">
                <Button size="icon-sm" variant="outline" aria-label="Fewer people" disabled={people <= 1} onClick={() => setPeople(people - 1)}>
                  <Minus />
                </Button>
                <span className="tabular w-5 text-center font-semibold">{people}</span>
                <Button size="icon-sm" variant="outline" aria-label="More people" disabled={people >= 8} onClick={() => setPeople(people + 1)}>
                  <Plus />
                </Button>
              </div>
            </div>
          </div>
          {budget && (
            <p className={cn("mt-3 text-sm", total > budget * people ? "text-caution" : "text-muted-foreground")}>
              Weekly budget: {fmt.bdt(budget * people)}
              {total > budget * people ? " — this list is above your budget. Try the lowest-cost plan style." : " — within budget."}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={hideBought} onCheckedChange={(v) => setHideBought(!!v)} /> Hide bought items
          </label>
          <Button size="sm" variant="ghost" onClick={() => { rebuild(); toast("List refreshed from your plan") }}>
            <RefreshCw /> Refresh
          </Button>
        </div>

        {items.length === 0 ? (
          <EmptyState icon={<ShoppingBasket />} title="Nothing to buy" description="Activate a meal plan and its ingredients appear here automatically." />
        ) : (
          groups.map((g) => {
            const list = items.filter((i) => i.category === g && !(hideBought && i.purchased))
            if (!list.length) return null
            return (
              <Section key={g} title={g}>
                <ul className="divide-y rounded-2xl border bg-card">
                  {list.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 px-3 py-2.5">
                      <Checkbox
                        id={i.id}
                        checked={i.purchased}
                        onCheckedChange={() => {
                          toggle(i.id)
                          if (!i.purchased && pantry.allowed && !i.manual) {
                            upsertPantry({ id: `pantry_${i.foodId}`, foodId: i.foodId, name: i.name, grams: i.grams })
                          }
                        }}
                        className="size-5"
                      />
                      <label htmlFor={i.id} className={cn("min-w-0 flex-1", i.purchased && "text-muted-foreground line-through")}>
                        <span className="block text-sm">{i.name}</span>
                        {i.grams > 0 && <span className="tabular block text-xs text-muted-foreground">{friendlyGrams(i.grams)} · ~{fmt.bdt(i.costBdt)}</span>}
                      </label>
                      {i.manual && (
                        <Button size="icon-sm" variant="ghost" aria-label={`Remove ${i.name}`} onClick={() => remove(i.id)}>
                          <Trash2 />
                        </Button>
                      )}
                    </li>
                  ))}
                </ul>
              </Section>
            )
          })
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
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add an item (e.g. soap)" aria-label="Add an item" />
          <Button type="submit" variant="outline">
            Add
          </Button>
        </form>

        {pantry.allowed && <InfoNote>Ticking an item also adds it to your pantry so future lists skip what you already have.</InfoNote>}
        <EstimateNote>Quantities are rounded and prices are typical Dhaka market estimates.</EstimateNote>
      </PageBody>
    </>
  )
}
