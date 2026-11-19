"use client"

import { BadgeCheck, BookOpen, Flame, Hourglass, Refrigerator, UserRound, UtensilsCrossed } from "lucide-react"
import { ListGroup, ListRow, Pill, Section } from "@/components/app/page"
import { CUISINE_MAP, recipeCuisine } from "@/lib/recipe-bank"
import { recipeReheating, recipeSource } from "@/lib/area-c-utils"
import type { Recipe } from "@/lib/types"

const REVIEW: Record<Recipe["reviewStatus"], { title: string; text: string }> = {
  approved: { title: "Reviewed recipe", text: "Ingredients, quantities, allergens and safety notes were checked by the NutriPlan recipe team before publishing." },
  pending: { title: "Pending review", text: "Not yet professionally approved. It can be viewed and cooked, but it isn't added to plans until a reviewer approves it." },
  personal: { title: "Not reviewed", text: "Your own recipe or version. It passes your allergy and diet checks, but no professional has reviewed it." },
}

/** About tab: origin, serving, storage and reheating, source and review status (§9.1). */
export function AboutPanel({ recipe }: { recipe: Recipe }) {
  const cuisine = CUISINE_MAP[recipeCuisine(recipe)]
  const reheating = recipeReheating(recipe)
  const review = REVIEW[recipe.reviewStatus]
  return (
    <div className="space-y-7">
      <Section title="About this dish">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <p className="text-body">{recipe.about ?? recipe.description}</p>
          <p className="text-caption mt-3 text-muted-foreground">
            {cuisine.label} cuisine · <span lang="bn">{cuisine.labelBn}</span>
          </p>
          {recipe.reviewStatus === "personal" && recipe.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {recipe.tags.map((t) => (
                <Pill key={t}>{t}</Pill>
              ))}
            </div>
          )}
        </div>
      </Section>

      {(recipe.serveWith || recipe.storage || reheating) && (
        <Section title="Serving, storage and reheating">
          <ListGroup>
            {recipe.serveWith && <ListRow icon={<UtensilsCrossed />} iconTone="lime" title="Serve with" description={<span className="text-callout text-charcoal">{recipe.serveWith}</span>} />}
            {recipe.storage && <ListRow icon={<Refrigerator />} iconTone="sky" title="Storage" description={<span className="text-callout text-charcoal">{recipe.storage}</span>} />}
            {reheating && <ListRow icon={<Flame />} iconTone="terracotta" title="Reheating" description={<span className="text-callout text-charcoal">{reheating}</span>} />}
          </ListGroup>
        </Section>
      )}

      <Section title="Source and review">
        <ListGroup>
          <ListRow icon={<BookOpen />} iconTone="amber" title="Source" description={<span className="text-callout text-charcoal">{recipeSource(recipe)}</span>} />
          <ListRow
            icon={recipe.reviewStatus === "approved" ? <BadgeCheck /> : recipe.reviewStatus === "pending" ? <Hourglass /> : <UserRound />}
            iconTone={recipe.reviewStatus === "approved" ? "sage" : recipe.reviewStatus === "pending" ? "caution" : "muted"}
            title={review.title}
            description={<span className="text-callout text-charcoal">{review.text}</span>}
          />
        </ListGroup>
      </Section>
    </div>
  )
}
