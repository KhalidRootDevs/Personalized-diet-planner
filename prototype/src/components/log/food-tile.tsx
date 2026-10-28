import { RecipeThumb } from "@/components/app/recipe-thumb"
import { FOOD_MAP } from "@/lib/data/foods"
import type { Food, Recipe } from "@/lib/types"

// Illustrated food tiles (§44.11, UI-SPEC §4.11) until real food photography exists.
const BY_CATEGORY: Record<Food["category"], Pick<Recipe, "swatch" | "icon">> = {
  grain: { swatch: "ivory", icon: "Wheat" },
  pulse: { swatch: "sage", icon: "Soup" },
  fish: { swatch: "sage", icon: "Fish" },
  meat: { swatch: "terracotta", icon: "Drumstick" },
  egg: { swatch: "ivory", icon: "Egg" },
  dairy: { swatch: "ivory", icon: "GlassWater" },
  vegetable: { swatch: "sage", icon: "Carrot" },
  fruit: { swatch: "terracotta", icon: "Apple" },
  fat: { swatch: "ivory", icon: "CookingPot" },
  mixed_dish: { swatch: "sage", icon: "CookingPot" },
  drink: { swatch: "terracotta", icon: "Coffee" },
  sweet: { swatch: "terracotta", icon: "Utensils" },
}

export function FoodTile({ foodId, name, size = "sm", className }: { foodId: string; name?: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const food = FOOD_MAP[foodId]
  const look = food ? BY_CATEGORY[food.category] : { swatch: "ivory" as const, icon: "Utensils" }
  return <RecipeThumb recipe={{ ...look, name: name ?? food?.name ?? "Food" }} size={size} className={className} />
}
