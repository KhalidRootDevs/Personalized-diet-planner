import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"
import { recipePhoto } from "@/lib/data/photos"
import { DataIcon } from "./icon"

const SWATCH: Record<Recipe["swatch"], string> = {
  sage: "bg-sage text-forest",
  terracotta: "bg-coral-tint text-terracotta-text",
  ivory: "bg-amber-tint text-amber-text",
  forest: "bg-lime-card text-lime-text",
}

/**
 * Recipe image (§44.11). Shows the food photo when one exists; otherwise a colorful
 * illustrated tile. Small sizes are round dish photos, `hero` is a full-width cover.
 */
export function RecipeThumb({
  recipe,
  className,
  size = "md",
}: {
  recipe: Pick<Recipe, "swatch" | "icon" | "name"> & { id?: string; photo?: string }
  className?: string
  size?: "xs" | "sm" | "md" | "lg" | "hero"
}) {
  const dims = { xs: "size-9 rounded-full", sm: "size-12 rounded-full", md: "size-14 rounded-full", lg: "size-20 rounded-full", hero: "h-44 w-full rounded-2xl" }[size]
  const icon = { xs: "size-4", sm: "size-5", md: "size-6", lg: "size-8", hero: "size-14" }[size]
  const photo = recipe.photo ?? recipePhoto(recipe.id)
  if (photo)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- static prototype assets
      <img src={photo} alt={recipe.name} loading="lazy" decoding="async" className={cn("shrink-0 bg-muted object-cover", size !== "hero" && "ring-2 ring-card", dims, className)} />
    )
  return (
    <div className={cn("grid shrink-0 place-items-center", SWATCH[recipe.swatch], dims, className)} role="img" aria-label={`${recipe.name} (illustration)`}>
      <DataIcon name={recipe.icon} className={cn(icon, "opacity-80")} />
    </div>
  )
}
