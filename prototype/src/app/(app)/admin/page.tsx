"use client"

// Admin console home (§28, §31): content counts, review work and safety-metric placeholders.
// Staff-only in production (role-based access, §29); open in the prototype for stakeholder review.
import { BookOpenCheck, ChefHat, ClipboardCheck, Languages, Scale, ShieldAlert } from "lucide-react"
import { FOODS } from "@/lib/data/foods"
import { RECIPES } from "@/lib/data/recipes"
import { CLINICAL_RULES } from "@/lib/data/admin"
import { DICT } from "@/lib/i18n"
import { useApp } from "@/lib/store"
import { useTx } from "@/lib/i18n"
import { ListGroup, ListRow, PageBody, PageHeader, Pill, Section, StatTile } from "@/components/app/page"
import { InfoNote } from "@/components/app/alerts"
import { PhaseBadge } from "@/components/app/badges"

export default function AdminHomePage() {
  const tx = useTx()
  const admin = useApp((s) => s.admin)
  const recipeStatus = (id: string, base: string) => admin?.recipeStatus?.[id] ?? base
  const pendingRecipes = RECIPES.filter((r) => recipeStatus(r.id, r.reviewStatus) === "pending").length
  const foodsNeedingReview = FOODS.filter((f) => f.reviewStatus !== "reviewed").length
  const draftFoodEdits = Object.keys(admin?.foodOverrides ?? {}).length
  const rulesDue = CLINICAL_RULES.filter((r) => r.status !== "approved").length + (admin?.ruleChanges?.length ?? 0)
  const untranslated = Object.keys(DICT).filter((k) => (admin?.translationStatus?.[k] ?? "needs_review") !== "approved").length

  return (
    <>
      <PageHeader back="/profile" title={tx("Admin console", "অ্যাডমিন কনসোল")} subtitle="Staff view · prototype" />
      <PageBody>
        <InfoNote title="Prototype admin">In production this is a separate, role-restricted tool. Edits here are saved as drafts in this browser and never change live data without review (§28).</InfoNote>

        <Section title="Content" badge={<PhaseBadge phase={1} />}>
          <div className="grid grid-cols-2 gap-2">
            <StatTile label="Foods" value={FOODS.length} hint={`${foodsNeedingReview} not fully reviewed`} />
            <StatTile label="Recipes" value={RECIPES.length} hint={`${pendingRecipes} awaiting review`} />
            <StatTile label="Clinical rules" value={CLINICAL_RULES.length} hint={`${rulesDue} open items`} />
            <StatTile label="UI strings (bn)" value={Object.keys(DICT).length} hint={`${untranslated} need review`} />
          </div>
        </Section>

        <Section title="Safety metrics" description="Placeholders — production values come from analytics (§31).">
          <ListGroup>
            <ListRow icon={<ShieldAlert />} iconTone="safety" title="Allergen conflicts blocked" description="Plans, swaps and shopping lists · last 7 days" trailing={<Pill tone="outline">—</Pill>} />
            <ListRow icon={<ShieldAlert />} iconTone="caution" title="Infant-unsafe suggestions blocked" description="Honey, choking hazards, age-inappropriate textures" trailing={<Pill tone="outline">—</Pill>} />
            <ListRow icon={<ShieldAlert />} iconTone="caution" title="Plans held for professional review" description="Support level 3 conditions" trailing={<Pill tone="outline">—</Pill>} />
            <ListRow icon={<ShieldAlert />} iconTone="muted" title="Emergency guidance shown" description="Routed to emergency guidance, not meal changes" trailing={<Pill tone="outline">—</Pill>} />
          </ListGroup>
        </Section>

        <Section title="Manage">
          <ListGroup>
            <ListRow href="/admin/reviews" icon={<ClipboardCheck />} iconTone="lime" title="Clinical review queue" description="Approve, request changes or reject" />
            <ListRow href="/admin/foods" icon={<BookOpenCheck />} iconTone="sky" title="Foods" description={draftFoodEdits ? `${draftFoodEdits} draft edits awaiting review` : "Nutrients, local units, provenance"} />
            <ListRow href="/admin/recipes" icon={<ChefHat />} iconTone="amber" title="Recipes" description="Review status and publishing" />
            <ListRow href="/admin/rules" icon={<Scale />} iconTone="terracotta" title="Clinical rule library" description="Sources, versions and review dates" />
            <ListRow href="/admin/translations" icon={<Languages />} iconTone="sage" title="Translations" description="Bangla string review" />
          </ListGroup>
        </Section>
      </PageBody>
    </>
  )
}
