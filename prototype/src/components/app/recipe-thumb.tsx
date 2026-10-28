import { cn } from "@/lib/utils"
import type { Recipe } from "@/lib/types"
import { DataIcon } from "./icon"

const SWATCH: Record<Recipe["swatch"], string> = {
  sage: "bg-sage text-forest",
  terracotta: "bg-[#f3e2d9] text-terracotta-text",
  ivory: "bg-[#efe9da] text-forest",
  forest: "bg-forest text-ivory",
}

/**
 * Photo fallback state (§44.11): until real food photography exists, every recipe
 * uses a consistent illustrated tile instead of stock imagery.
 */
export function RecipeThumb({ recipe, className, size = "md" }: { recipe: Pick<Recipe, "swatch" | "icon" | "name">; className?: string; size?: "sm" | "md" | "lg" | "hero" }) {
  const dims = { sm: "size-11 rounded-lg", md: "size-14 rounded-xl", lg: "size-20 rounded-xl", hero: "h-44 w-full rounded-2xl" }[size]
  const icon = { sm: "size-5", md: "size-6", lg: "size-8", hero: "size-14" }[size]
  return (
    <div className={cn("grid shrink-0 place-items-center", SWATCH[recipe.swatch], dims, className)} role="img" aria-label={`${recipe.name} (illustration)`}>
      <DataIcon name={recipe.icon} className={cn(icon, "opacity-80")} />
    </div>
  )
}
