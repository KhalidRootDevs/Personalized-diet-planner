"use client"

import { useEffect, useRef, useState } from "react"
import { BadgeCheck, Barcode, ChevronRight, History, Mic, ScanLine, Search, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { RecipeThumb } from "@/components/app/recipe-thumb"
import { RECIPES } from "@/lib/data/recipes"
import { foodNutrients, recipeNutrition, violatesHardConstraints } from "@/lib/nutrition"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { FoodSearchList } from "@/components/log/food-picker"
import { ListGroup, ListRow, Pill, StickyFooter, Surface } from "@/components/app/page"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { parseMealText } from "@/lib/area-b-text"
import { BARCODE_PRODUCT, VERIFIED_PRODUCTS } from "@/lib/vision-mock"
import { MEAL_LABEL } from "@/lib/planning"
import { useApp } from "@/lib/store"
import { itemFromFood } from "@/lib/area-b-log"
import type { JournalItem, MealType, Profile, Recipe, SavedMeal } from "@/lib/types"

/** Manual search (§41.2): pick several foods, then review portions together. */
export function SearchStep({ items, setItems, profile, onNext }: { items: JournalItem[]; setItems: (i: JournalItem[]) => void; profile?: Profile; onNext: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="px-gutter flex-1 space-y-4 pt-3 pb-6">
        <p className="text-callout text-muted-foreground">Tap each food you had. You&apos;ll set portions on the next screen.</p>
        <FoodSearchList
          profile={profile}
          autoFocus
          selectedIds={items.map((i) => i.foodId)}
          onPick={(id) => {
            const has = items.find((i) => i.foodId === id)
            setItems(has ? items.filter((i) => i.foodId !== id) : [...items, itemFromFood(id)])
          }}
        />
      </div>
      <StickyAction disabled={!items.length} onClick={onNext} label={items.length ? `Review ${items.length} item${items.length > 1 ? "s" : ""}` : "Pick at least one food"} />
    </div>
  )
}

const EXAMPLES = ["Two roti, one egg and tea", "Rice, rui fish and dal", "দুইটা রুটি আর ডিম", "Khichuri with an omelette"]

/** Text logging (§42.3.1): the parser only proposes items; the user confirms on review. */
export function TextStep({ onParsed, initial = "", source = "text" }: { onParsed: (items: JournalItem[], source: "text" | "voice") => void; initial?: string; source?: "text" | "voice" }) {
  const [text, setText] = useState(initial)
  const [miss, setMiss] = useState(false)
  const run = () => {
    const items = parseMealText(text)
    if (!items.length) return setMiss(true)
    onParsed(items, source)
  }
  return (
    <div className="px-gutter space-y-5 pt-3 pb-8">
      <Textarea className="min-h-32 rounded-2xl p-4" value={text} onChange={(e) => {
          setText(e.target.value)
          setMiss(false)
        }} rows={4} placeholder="e.g. Two roti, one boiled egg and a cup of tea" aria-label="Describe what you ate" autoFocus={!initial} />
      <div>
        <p className="text-overline mb-2 text-muted-foreground">Examples</p>
        <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button key={ex} onClick={() => setText(ex)} className="text-callout h-9 rounded-full bg-card shadow-card px-3.5 transition-colors hover:bg-muted" lang={/[ঀ-৿]/.test(ex) ? "bn" : undefined}>
            {ex}
          </button>
        ))}
        </div>
      </div>
      {miss && <CautionNote title="We couldn't match those foods">Try simpler names (rice, dal, egg) or use search instead.</CautionNote>}
      <Button className="w-full" size="lg" disabled={!text.trim()} onClick={run}>
        <Sparkles /> Find foods
      </Button>
      <p className="text-caption text-center text-muted-foreground">You&apos;ll check every item and portion before anything is saved.</p>
    </div>
  )
}

/** Voice logging (§42.3, Phase 2). Simulated transcription; same confirmation path as text. */
export function VoiceStep({ onParsed }: { onParsed: (items: JournalItem[], source: "text" | "voice") => void }) {
  const [state, setState] = useState<"idle" | "listening" | "done">("idle")
  const [transcript, setTranscript] = useState("")
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  return (
    <div className="px-gutter space-y-4 pt-3 pb-8">
      <p className="text-callout flex items-center gap-2 text-muted-foreground">
        <FeatureBadge feature="voice_logging" /> Speak in English or Bangla.
      </p>
      <PremiumGate feature="voice_logging">
        {state !== "done" ? (
          <div className="flex flex-col items-center gap-5 py-12">
            <button
              onClick={() => {
                setState("listening")
                timer.current = window.setTimeout(() => {
                  setTranscript("Two roti, one egg and a cup of tea")
                  setState("done")
                }, 1600)
              }}
              disabled={state === "listening"}
              className="grid size-28 place-items-center rounded-full bg-lime text-charcoal shadow-float ring-8 ring-sage transition-transform active:scale-95 disabled:animate-pulse"
              aria-label={state === "listening" ? "Listening" : "Start speaking"}
            >
              <Mic className="size-9" />
            </button>
            <p className="text-callout text-muted-foreground" aria-live="polite">
              {state === "listening" ? "Listening… (demo)" : "Tap and say what you ate"}
            </p>
          </div>
        ) : (
          <div className="-mx-[var(--gutter)] space-y-3">
            <div className="px-gutter">
              <InfoNote title="Here's what we heard">Edit anything that&apos;s wrong, then find foods.</InfoNote>
            </div>
            <TextStep key={transcript} initial={transcript} source="voice" onParsed={onParsed} />
          </div>
        )}
      </PremiumGate>
    </div>
  )
}

/**
 * Barcode logging (§42.3, Phase 2). A verified product resolves to a reviewed food-DB record and
 * goes to the normal review step. An unverified product's label data is shown for reference only
 * and is not used for calculation until it's reviewed (§42.21) — no invented numbers.
 */
export function BarcodeStep({ profile, onSearchInstead, onVerified }: { profile?: Profile; onSearchInstead: () => void; onVerified: (items: JournalItem[]) => void }) {
  const [scanned, setScanned] = useState<"verified" | "unverified" | null>(null)
  const [productIdx, setProductIdx] = useState(0)
  const [scanning, setScanning] = useState(false)
  const hits = BARCODE_PRODUCT.listedAllergens.filter((a) => profile?.allergies.includes(a as never))
  const p = BARCODE_PRODUCT.per100g
  const product = VERIFIED_PRODUCTS[productIdx]
  const food = FOOD_MAP[product.foodId]
  const per = foodNutrients(product.foodId, product.servingGrams)
  const verifiedHits = (food?.allergens ?? []).filter((a) => profile?.allergies.includes(a))
  const scan = (kind: "verified" | "unverified") => {
    setScanning(true)
    window.setTimeout(() => {
      setScanning(false)
      setScanned(kind)
    }, 1000)
  }
  return (
    <div className="px-gutter space-y-4 pt-3 pb-8">
      <p className="text-callout flex items-center gap-2 text-muted-foreground">
        <FeatureBadge feature="barcode_logging" /> Scan a packaged food.
      </p>
      <PremiumGate feature="barcode_logging">
        {!scanned ? (
          <div className="space-y-4">
            <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[24px] bg-charcoal text-ivory">
              <ScanLine className="size-16 opacity-80" aria-hidden />
              {scanning && <div className="absolute inset-x-8 top-1/2 h-0.5 animate-pulse bg-terracotta motion-reduce:animate-none" aria-hidden />}
              <p className="text-caption absolute bottom-4 opacity-80">Camera preview (demo)</p>
            </div>
            <Button className="w-full" size="lg" disabled={scanning} onClick={() => scan("verified")}>
              <Barcode /> {scanning ? "Scanning…" : "Simulate a scan"}
            </Button>
            <Button variant="ghost" className="w-full" disabled={scanning} onClick={() => scan("unverified")}>
              Simulate an unknown product
            </Button>
          </div>
        ) : scanned === "verified" ? (
          <div className="space-y-3">
            {verifiedHits.length > 0 && (
              <SafetyAlert title={`Contains ${verifiedHits.map((h) => ALLERGEN_LABELS[h] ?? h).join(", ")}`}>This product contains an ingredient recorded as an allergy in your profile.</SafetyAlert>
            )}
            <Surface>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-headline">{product.name}</p>
                  <p className="text-caption text-muted-foreground">
                    {product.brand} · {product.servingLabel}
                  </p>
                </div>
                <Pill tone="sage" icon={<BadgeCheck />}>
                  Verified
                </Pill>
              </div>
              <p className="text-overline mt-4 text-muted-foreground">Per serving · from our reviewed database</p>
              <p className="tabular text-callout mt-1">
                ~{Math.round(per.energyKcal)} kcal · protein ~{Math.round(per.proteinG)} g · carbs ~{Math.round(per.carbsG)} g · fat ~{Math.round(per.fatG)} g
              </p>
              <p className="text-caption mt-2 text-muted-foreground">
                Matched to “{food?.name}”. Allergens: {food?.allergens.length ? food.allergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ") : "none listed"}.
              </p>
            </Surface>
            <Button
              className="w-full"
              size="lg"
              onClick={() => onVerified([{ ...itemFromFood(product.foodId, product.servingGrams, product.servingLabel), displayName: product.name, quantityConfidence: "high", identificationConfidence: "high" }])}
            >
              Review and log
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => {
                setProductIdx((i) => (i + 1) % VERIFIED_PRODUCTS.length)
                setScanned(null)
              }}
            >
              Scan another
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {hits.length > 0 && (
              <SafetyAlert title={`Label lists ${hits.map((h) => ALLERGEN_LABELS[h] ?? h).join(", ")}`}>This product contains an ingredient recorded as an allergy in your profile.</SafetyAlert>
            )}
            <Surface>
              <p className="text-headline">{BARCODE_PRODUCT.name}</p>
              <p className="text-caption text-muted-foreground">{BARCODE_PRODUCT.brand} · serving {BARCODE_PRODUCT.servingGrams} g</p>
              <p className="text-overline mt-4 text-muted-foreground">Label, per 100 g</p>
              <p className="tabular text-callout mt-1">
                {p.energyKcal} kcal · protein {p.proteinG} g · carbs {p.carbsG} g · fat {p.fatG} g
              </p>
              <p className="text-caption mt-2 text-muted-foreground">Allergens on label: {BARCODE_PRODUCT.listedAllergens.map((a) => ALLERGEN_LABELS[a] ?? a).join(", ")}</p>
            </Surface>
            <CautionNote title="Not verified yet">
              This product isn&apos;t in our reviewed food database, and its label data is incomplete. We&apos;ve sent it for review. For now, log the closest food from search.
            </CautionNote>
            <Button variant="outline" className="w-full" onClick={onSearchInstead}>
              Search a similar food
            </Button>
          </div>
        )}
      </PremiumGate>
    </div>
  )
}

/**
 * Recipe entry (§42.3.1): log a library or personal recipe. Ingredients are scaled per serving
 * on the review step and stay editable. Allergen conflicts are flagged here and again on review.
 */
export function RecipePickStep({ profile, onPick }: { profile: Profile; onPick: (r: Recipe) => void }) {
  const userRecipes = useApp((s) => s.userRecipes)
  const [q, setQ] = useState("")
  const isChild = profile.type !== "adult"
  const list = [...userRecipes, ...RECIPES]
    .filter((r) => (isChild ? r.profile !== "adult" : r.profile === "adult"))
    .filter((r) => !q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase()) || r.nameBn.includes(q.trim()))
  return (
    <div className="px-gutter space-y-4 pt-3 pb-8">
      <p className="text-callout text-muted-foreground">Pick the dish you ate. You&apos;ll set how many servings and adjust ingredients next.</p>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-muted-grey" aria-hidden />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search recipes — khichuri, dal…" className="pl-11" aria-label="Search recipes" />
      </div>
      <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl bg-card shadow-card">
        {list.length === 0 && <li className="text-callout p-4 text-muted-foreground">No matching recipe. Try search or describe the dish instead.</li>}
        {list.map((r) => {
          const conflict = violatesHardConstraints(r, profile)
          return (
            <li key={r.id}>
              <button onClick={() => onPick(r)} className="flex min-h-[60px] w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50 active:bg-muted">
                <RecipeThumb recipe={r} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-body font-medium">{r.name}</p>
                  <p className="text-caption mt-0.5 text-muted-foreground">
                    {r.reviewStatus === "personal" ? "Your recipe · not reviewed" : r.reviewStatus === "pending" ? "Pending review" : "Reviewed recipe"}
                    {!isChild && <span className="tabular"> · ~{Math.round(recipeNutrition(r, 1).energyKcal)} kcal per serving</span>}
                  </p>
                  {conflict && <p className="text-caption mt-0.5 font-medium text-safety">{conflict}</p>}
                </div>
                <ChevronRight className="size-[18px] shrink-0 text-muted-grey" aria-hidden />
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Saved meals and meal memory (§42.3.2). Meals similar to this time of day come first. */
export function SavedStep({ mealType, onPick }: { mealType: MealType; onPick: (m: SavedMeal) => void }) {
  const saved = useApp((s) => s.savedMeals)
  const sorted = [...saved].sort((a, b) => Number(b.mealType === mealType) - Number(a.mealType === mealType) || b.timesConfirmed - a.timesConfirmed)
  const memory = sorted.find((m) => m.mealType === mealType && m.timesConfirmed >= 3)
  return (
    <div className="px-gutter space-y-5 pt-3 pb-8">
      <p className="text-callout flex items-center gap-2 text-muted-foreground">
        <FeatureBadge feature="saved_meals" /> Meals you&apos;ve saved or log often.
      </p>
      {memory && (
        <button onClick={() => onPick(memory)} className="w-full rounded-2xl bg-sage/70 p-4 text-left transition-colors hover:bg-sage">
          <p className="text-overline flex items-center gap-1.5 text-forest">
            <History className="size-3.5" /> Meal memory
          </p>
          <p className="text-headline mt-2">
            You often have &ldquo;{memory.name}&rdquo; for {MEAL_LABEL[mealType].toLowerCase()}.
          </p>
          <p className="text-callout mt-0.5 text-charcoal/80">Log it again? You can change portions next.</p>
        </button>
      )}
      {sorted.length === 0 ? (
        <p className="text-callout text-muted-foreground">No saved meals yet. Tick &ldquo;Save as a usual meal&rdquo; when you confirm an entry.</p>
      ) : (
        <ListGroup label="All saved meals">
          {sorted.map((m) => (
            <ListRow
              key={m.id}
              onClick={() => onPick(m)}
              icon={<History />}
              title={m.name}
              description={
                <>
                  <span className="line-clamp-1 block">{m.items.map((i) => FOOD_MAP[i.foodId]?.name ?? i.foodId).join(", ")}</span>
                  <span className="block">
                    {MEAL_LABEL[m.mealType]} · logged {m.timesConfirmed}×
                  </span>
                </>
              }
            />
          ))}
        </ListGroup>
      )}
    </div>
  )
}

export function StickyAction({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <StickyFooter>
      <Button className="w-full" size="lg" disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </StickyFooter>
  )
}
