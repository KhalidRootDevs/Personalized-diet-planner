"use client"

// Food detail (§8.1, §27.2, §42.6): per-100 g and per-local-unit values, raw/cooked state, allergens,
// provenance, confidence, review status and infant suitability. Values are illustrative prototype data.
import { useState } from "react"
import { useParams } from "next/navigation"
import { Baby, Database, Search, ShieldCheck } from "lucide-react"
import { ALLERGEN_LABELS, FOOD_MAP, REVIEW_STATUS_LABEL } from "@/lib/data/foods"
import { useActiveProfile, useApp } from "@/lib/store"
import { useTx } from "@/lib/i18n"
import type { Food, Nutrients } from "@/lib/types"
import { EmptyState, KeyValue, ListGroup, ListRow, PageBody, PageHeader, Pill, Section, Surface, type PillTone } from "@/components/app/page"
import { Segmented } from "@/components/app/controls"
import { ConfidenceChip, EstimateNote } from "@/components/app/nutrition"
import { CautionNote, InfoNote, SafetyAlert } from "@/components/app/alerts"
import { PhaseBadge } from "@/components/app/badges"
import { FoodTile } from "@/components/log/food-tile"

const STATE_LABEL: Record<Food["state"], string> = { raw: "Raw", cooked: "Cooked", dry: "Dry (uncooked)", prepared: "Prepared dish" }
const STATE_NOTE: Record<Food["state"], string> = {
  raw: "Values are for the raw food. Cooking changes weight and some nutrients.",
  cooked: "Values are for the cooked food, not the raw ingredient.",
  dry: "Values are for the dry, uncooked weight. Cooked weight is roughly 2–3× higher, so values per 100 g cooked are lower.",
  prepared: "Values are for the dish as typically prepared, including usual oil and spices.",
}
const REVIEW_TONE: Record<string, PillTone> = { reviewed: "sage", pending: "caution", unreviewed: "outline", none: "outline" }

const ROWS: { key: keyof Nutrients; label: string; unit: string; digits?: number }[] = [
  { key: "energyKcal", label: "Energy", unit: "kcal" },
  { key: "proteinG", label: "Protein", unit: "g", digits: 1 },
  { key: "carbsG", label: "Carbohydrates", unit: "g", digits: 1 },
  { key: "sugarsG", label: "of which sugars", unit: "g", digits: 1 },
  { key: "fatG", label: "Fat", unit: "g", digits: 1 },
  { key: "fiberG", label: "Fiber", unit: "g", digits: 1 },
  { key: "ironMg", label: "Iron", unit: "mg", digits: 1 },
  { key: "calciumMg", label: "Calcium", unit: "mg" },
  { key: "sodiumMg", label: "Sodium", unit: "mg" },
]

export default function FoodDetailPage() {
  const { id } = useParams<{ id: string }>()
  const tx = useTx()
  const food = FOOD_MAP[id]
  const profile = useActiveProfile()
  const draft = useApp((s) => s.admin?.foodOverrides?.[id])
  const [unitIdx, setUnitIdx] = useState("0")

  if (!food)
    return (
      <>
        <PageHeader title={tx("Food", "খাবার")} back />
        <PageBody>
          <EmptyState icon={<Search />} title={tx("Food not found", "খাবার পাওয়া যায়নি")} description={tx("This food isn't in the prototype database.", "এই খাবারটি প্রোটোটাইপ ডাটাবেসে নেই।")} />
        </PageBody>
      </>
    )

  const unit = food.units[Number(unitIdx)] ?? food.units[0]
  const factor = unit ? unit.grams / 100 : 0
  const conflicts = profile ? food.allergens.filter((a) => profile.allergies.includes(a)) : []
  const review = food.reviewStatus ?? "none"
  const isChild = profile && profile.type !== "adult"

  return (
    <>
      <PageHeader title={tx("Food details", "খাবারের তথ্য")} back />
      <PageBody>
        <Surface padding="lg" className="flex items-center gap-4">
          <FoodTile foodId={food.id} size="lg" />
          <div className="min-w-0 space-y-2">
            <p className="text-title">{food.name}</p>
            <p className="text-callout text-muted-foreground" lang="bn">
              {food.nameBn}
            </p>
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="neutral">{STATE_LABEL[food.state]}</Pill>
              {food.variant && <Pill tone={food.variant === "restaurant" ? "terracotta" : "sage"}>{food.variant === "restaurant" ? "Restaurant style" : "Home style"}</Pill>}
              <Pill tone={REVIEW_TONE[review]}>{REVIEW_STATUS_LABEL[review]}</Pill>
            </div>
          </div>
        </Surface>

        {conflicts.length > 0 && (
          <SafetyAlert title={tx("Contains an allergen on this profile", "এই প্রোফাইলের অ্যালার্জেন আছে")}>
            {conflicts.map((a) => ALLERGEN_LABELS[a]).join(", ")} — {tx("never included in plans, swaps or shopping lists for", "পরিকল্পনা, বদল বা বাজারের তালিকায় কখনো থাকবে না —")} {profile?.name}.
          </SafetyAlert>
        )}

        {draft && <InfoNote title={tx("Draft edit awaiting review", "খসড়া সম্পাদনা পর্যালোচনার অপেক্ষায়")}>{tx("An admin edit to this food is in review. The published values below stay in use until it's approved.", "এই খাবারের একটি সম্পাদনা পর্যালোচনায় আছে। অনুমোদনের আগ পর্যন্ত নিচের প্রকাশিত মানই ব্যবহার হবে।")}</InfoNote>}

        <Section title={tx("Nutrition", "পুষ্টিমান")} badge={<PhaseBadge phase={1} />} description={STATE_NOTE[food.state]}>
          {food.units.length > 0 && unit.grams > 0 && (
            <Segmented
              label="Portion"
              value={unitIdx}
              onChange={setUnitIdx}
              options={food.units.slice(0, 3).map((u, i) => ({ value: String(i), label: <span className="truncate">{u.label}</span> }))}
            />
          )}
          <Surface padding="none" className="overflow-hidden">
            <table className="text-callout w-full">
              <caption className="sr-only">Nutrients per 100 g and per {unit?.label}</caption>
              <thead className="bg-muted text-caption text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-2.5 text-left align-bottom font-medium">Nutrient</th>
                  <th scope="col" className="px-2 py-2.5 text-right align-bottom font-medium whitespace-nowrap">Per 100 g</th>
                  {unit && unit.grams > 0 && (
                    <th scope="col" className="px-4 py-2.5 text-right align-bottom font-medium">
                      <span className="block">{unit.label}</span>
                      <span className="tabular block whitespace-nowrap">{unit.grams} g</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/70">
                {ROWS.map((r) => {
                  const v = food.per100g[r.key]
                  return (
                    <tr key={r.key}>
                      <th scope="row" className={r.key === "sugarsG" ? "py-2.5 pr-2 pl-7 text-left font-normal text-muted-foreground" : "px-4 py-2.5 text-left font-medium"}>
                        {r.label}
                      </th>
                      <td className="tabular px-2 py-2.5 text-right whitespace-nowrap text-muted-foreground">{v === undefined ? <span className="text-muted-foreground">no data</span> : `${round(v, r.digits)} ${r.unit}`}</td>
                      {unit && unit.grams > 0 && <td className="tabular px-4 py-2.5 text-right font-semibold whitespace-nowrap">{v === undefined ? <span className="text-muted-foreground">–</span> : `~${round(v * factor, r.digits)} ${r.unit}`}</td>}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Surface>
          <EstimateNote>
            {unit?.estimate
              ? `"${unit.label}" is a household measure, so its weight (${unit.grams} g) is an estimate. Values per portion are approximate.`
              : "Values per portion are approximate."}{" "}
            Missing values are shown as &quot;no data&quot;, never guessed.
          </EstimateNote>
        </Section>

        <Section title={tx("Local portion units", "স্থানীয় পরিমাপ")}>
          <ListGroup>
            {food.units.map((u) => (
              <ListRow
                key={u.label}
                title={u.label}
                description={u.labelBn ? <span lang="bn">{u.labelBn}</span> : undefined}
                trailing={
                  <span className="flex items-center gap-2">
                    <span className="tabular text-callout">{u.grams} g</span>
                    {u.estimate ? <Pill tone="outline">Estimate</Pill> : <Pill tone="sage">Standard</Pill>}
                  </span>
                }
              />
            ))}
          </ListGroup>
        </Section>

        <Section title={tx("Allergens", "অ্যালার্জেন")}>
          {food.allergens.length ? (
            <div className="flex flex-wrap gap-2">
              {food.allergens.map((a) => (
                <Pill key={a} tone={conflicts.includes(a) ? "safety" : "neutral"}>
                  {ALLERGEN_LABELS[a]}
                  {conflicts.includes(a) ? " · on your profile" : ""}
                </Pill>
              ))}
            </div>
          ) : (
            <ListGroup>
              <ListRow
                icon={<ShieldCheck />}
                iconTone="sage"
                title={tx("No common allergens recorded", "সাধারণ কোনো অ্যালার্জেন নেই")}
                description={tx("Check labels and cross-contact for packaged or restaurant food.", "প্যাকেট বা রেস্টুরেন্টের খাবারে লেবেল দেখুন।")}
              />
            </ListGroup>
          )}
        </Section>

        <Section title={tx("For babies and young children", "শিশুদের জন্য")}>
          <InfantSuitability food={food} />
          {isChild && <p className="text-caption text-muted-foreground">{tx("Suggestions for children follow age, texture stage and your clinician's advice.", "শিশুদের পরামর্শ বয়স, টেক্সচার ও চিকিৎসকের পরামর্শ অনুযায়ী।")}</p>}
        </Section>

        <Section title={tx("Data source", "তথ্যের উৎস")}>
          <Surface className="space-y-1">
            <KeyValue label="Source" value={food.dataSource} />
            <KeyValue label="Confidence" value={<ConfidenceChip level={food.confidence} />} />
            <KeyValue label="Review status" value={REVIEW_STATUS_LABEL[review]} />
            {food.costPer100gBdt !== undefined && <KeyValue label="Price estimate" value={`~৳${food.costPer100gBdt} / 100 g`} />}
            {food.prepNotes && <p className="text-caption border-t border-border/70 pt-2 text-muted-foreground">{food.prepNotes}</p>}
          </Surface>
          <p className="text-caption flex items-start gap-1.5 text-muted-foreground">
            <Database className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {tx("Prototype values are illustrative, not from a validated food-composition table. Production uses versioned, reviewed food data (§8, §28).", "প্রোটোটাইপের মান উদাহরণমাত্র, যাচাইকৃত খাদ্য-উপাদান টেবিল থেকে নয়।")}
          </p>
        </Section>
      </PageBody>
    </>
  )
}

function InfantSuitability({ food }: { food: Food }) {
  if (food.id === "honey")
    return (
      <SafetyAlert title="Not before 12 months">
        Honey can cause infant botulism. Never give honey, even cooked in food, to babies under 12 months.
      </SafetyAlert>
    )
  return (
    <div className="space-y-2">
      {food.infantSafeFromMonths !== undefined ? (
        <ListGroup>
          <ListRow icon={<Baby />} iconTone="sky" title={`Suitable from about ${food.infantSafeFromMonths} months`} description="With a texture that matches the baby's stage (smooth → mashed → soft pieces), no added salt or sugar." />
        </ListGroup>
      ) : (
        <InfoNote>Not assessed for babies yet. It won&apos;t be suggested for infants until reviewed.</InfoNote>
      )}
      {food.chokingRisk && <CautionNote title="Choking risk for young children">Serve only in a safe form (mashed, finely chopped, seeds removed) and always supervise. Never give whole or hard pieces to babies.</CautionNote>}
      {(food.per100g.sodiumMg ?? 0) > 400 && <CautionNote title="High in salt">Not suitable for babies; salt isn&apos;t added to infant food.</CautionNote>}
    </div>
  )
}

function round(v: number, digits = 0): string {
  const f = 10 ** digits
  return (Math.round(v * f) / f).toLocaleString("en-US")
}
