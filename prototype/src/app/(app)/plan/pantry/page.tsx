"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Package, Trash2 } from "lucide-react"
import { EmptyState, ListGroup, PageBody, PageHeader, Pill, Section, Surface } from "@/components/app/page"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { InfoNote } from "@/components/app/alerts"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useApp, useSelfProfile } from "@/lib/store"
import { FOODS, FOOD_MAP } from "@/lib/data/foods"
import { RECIPES } from "@/lib/data/recipes"
import { violatesHardConstraints } from "@/lib/nutrition"
import { addDays, formatDay, todayISO, uid } from "@/lib/date"
import { friendlyGrams } from "@/lib/area-c-utils"
import { cn } from "@/lib/utils"

const PANTRY_FOODS = FOODS.filter((f) => f.state !== "cooked" && f.state !== "prepared" && !f.id.startsWith("breast"))

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

  const soon = pantry.filter((p) => p.expiresOn && p.expiresOn <= addDays(todayISO(), 3))
  const soonIds = new Set(soon.map((p) => p.foodId))
  const useSoon = profile
    ? RECIPES.filter((r) => r.profile === "adult" && !violatesHardConstraints(r, profile) && r.ingredients.some((i) => soonIds.has(i.foodId) || soonIds.has(i.foodId.replace("_boiled", "")))).slice(0, 3)
    : []

  const removeBtn = (id: string, name: string) => (
    <button className="-mr-2 grid size-10 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-muted" aria-label={`Remove ${name}`} onClick={() => remove(id)}>
      <Trash2 className="size-[18px]" />
    </button>
  )

  return (
    <div className="space-y-7">
      {soon.length > 0 && (
        <Section title="Use soon" description="These are close to their best-before date.">
          <ListGroup>
            {soon.map((p) => (
              <div key={p.id} className="flex min-h-[56px] items-center gap-3 px-4 py-2.5">
                <span className="text-body min-w-0 flex-1 font-medium">{p.name}</span>
                <Pill tone="caution">By {formatDay(p.expiresOn!, { day: "numeric", month: "short" })}</Pill>
              </div>
            ))}
          </ListGroup>
          {useSoon.length > 0 && (
            <>
              <p className="text-overline px-1 pt-2 text-muted-foreground">Recipes that use them</p>
              <div className="no-scrollbar -mx-[var(--gutter)] flex gap-3 overflow-x-auto px-[var(--gutter)] pb-1">
                {useSoon.map((r) => (
                  <Link key={r.id} href={`/recipes/${r.id}`} className="w-40 shrink-0 overflow-hidden rounded-2xl bg-card shadow-card transition-colors hover:bg-muted/40">
                    <RecipeThumb recipe={r} size="hero" className="h-24 rounded-none" />
                    <p className="text-callout line-clamp-2 p-3 font-medium">{r.name}</p>
                  </Link>
                ))}
              </div>
            </>
          )}
        </Section>
      )}

      <Section title="In your kitchen">
        {pantry.length === 0 ? (
          <EmptyState icon={<Package />} title="Your pantry is empty" description="Add staples like rice, lentils and oil so shopping lists skip what you already have." />
        ) : (
          <ListGroup>
            {pantry.map((p) => (
              <div key={p.id} className="flex min-h-[60px] items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{p.name}</p>
                  <p className={cn("tabular text-caption", soonIds.has(p.foodId) ? "text-caution" : "text-muted-foreground")}>
                    {friendlyGrams(p.grams)}
                    {p.expiresOn && ` · best before ${formatDay(p.expiresOn, { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                {removeBtn(p.id, p.name)}
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
            className="w-full"
            disabled={!foodId || !Number(grams)}
            onClick={() => {
              const f = FOOD_MAP[foodId]
              upsert({ id: uid("pan"), foodId, name: f.name, grams: Number(grams), expiresOn: expires || undefined })
              toast(`${f.name} added — shopping list updated`)
              setFoodId("")
              setExpires("")
            }}
          >
            Add to pantry
          </Button>
        </Surface>
      </Section>

      <InfoNote>Pantry items reduce your shopping list and power the &quot;What I have&quot; swap. Allergy rules still apply to every suggestion.</InfoNote>
    </div>
  )
}
