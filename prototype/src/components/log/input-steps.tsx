"use client"

import { useEffect, useRef, useState } from "react"
import { Barcode, History, Mic, ScanLine, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { FeatureBadge, PremiumGate } from "@/components/app/badges"
import { FoodSearchList } from "@/components/log/food-picker"
import { ListGroup, ListRow, StickyFooter, Surface } from "@/components/app/page"
import { FOOD_MAP, ALLERGEN_LABELS } from "@/lib/data/foods"
import { parseMealText } from "@/lib/area-b-text"
import { BARCODE_PRODUCT } from "@/lib/vision-mock"
import { MEAL_LABEL } from "@/lib/planning"
import { useApp } from "@/lib/store"
import { itemFromFood } from "@/lib/area-b-log"
import type { JournalItem, MealType, Profile, SavedMeal } from "@/lib/types"

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
          <button key={ex} onClick={() => setText(ex)} className="text-callout h-9 rounded-full border border-border/80 bg-card px-3.5 transition-colors hover:bg-muted" lang={/[ঀ-৿]/.test(ex) ? "bn" : undefined}>
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
              className="grid size-28 place-items-center rounded-full bg-forest text-primary-foreground shadow-float ring-8 ring-sage/70 transition-transform active:scale-95 disabled:animate-pulse"
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
 * Barcode logging (§42.3, Phase 2). Packaged-product data is shown as label values and is not
 * used for calculation until it's verified in the food DB (§42.21) — no invented numbers.
 */
export function BarcodeStep({ profile, onSearchInstead }: { profile?: Profile; onSearchInstead: () => void }) {
  const [scanned, setScanned] = useState(false)
  const [scanning, setScanning] = useState(false)
  const hits = BARCODE_PRODUCT.listedAllergens.filter((a) => profile?.allergies.includes(a as never))
  const p = BARCODE_PRODUCT.per100g
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
              {scanning && <div className="absolute inset-x-8 top-1/2 h-0.5 animate-pulse bg-terracotta" aria-hidden />}
              <p className="text-caption absolute bottom-4 opacity-80">Camera preview (demo)</p>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={scanning}
              onClick={() => {
                setScanning(true)
                window.setTimeout(() => {
                  setScanning(false)
                  setScanned(true)
                }, 1200)
              }}
            >
              <Barcode /> {scanning ? "Scanning…" : "Simulate a scan"}
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
