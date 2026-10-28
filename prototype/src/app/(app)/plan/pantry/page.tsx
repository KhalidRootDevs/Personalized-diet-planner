"use client"

import Link from "next/link"
import { useState } from "react"
import { toast } from "sonner"
import { Package, Trash2 } from "lucide-react"
import { EmptyState, PageBody, PageHeader, Section } from "@/components/app/page"
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

  return (
    <div className="space-y-6">
      {soon.length > 0 && (
        <Section title="Use soon">
          <div className="space-y-2">
            {soon.map((p) => (
              <p key={p.id} className="text-sm">
                <strong>{p.name}</strong> <span className="text-muted-foreground">· best before {formatDay(p.expiresOn!)}</span>
              </p>
            ))}
          </div>
          {useSoon.length > 0 && (
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
              {useSoon.map((r) => (
                <Link key={r.id} href={`/recipes/${r.id}`} className="w-36 shrink-0 rounded-2xl border bg-card p-2">
                  <RecipeThumb recipe={r} size="hero" className="h-20" />
                  <p className="mt-1.5 line-clamp-2 text-xs font-medium">{r.name}</p>
                </Link>
              ))}
            </div>
          )}
        </Section>
      )}

      <Section title="In your kitchen">
        {pantry.length === 0 ? (
          <EmptyState icon={<Package />} title="Your pantry is empty" description="Add staples like rice, lentils and oil so shopping lists skip what you already have." />
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {pantry.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{p.name}</p>
                  <p className={cn("tabular text-xs", soonIds.has(p.foodId) ? "text-caution" : "text-muted-foreground")}>
                    {friendlyGrams(p.grams)}
                    {p.expiresOn && ` · best before ${formatDay(p.expiresOn)}`}
                  </p>
                </div>
                <Button size="icon-sm" variant="ghost" aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)}>
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Add an item">
        <div className="space-y-3 rounded-2xl border bg-card p-4">
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
        </div>
      </Section>

      <InfoNote>Pantry items reduce your shopping list and power the &quot;What I have&quot; swap. Allergy rules still apply to every suggestion.</InfoNote>
    </div>
  )
}
