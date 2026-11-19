// Imagery and icons for the recipe bank's browse tiles (§44.11). Photos are prototype placeholders.
import {
  Activity,
  Beef,
  Carrot,
  CookingPot,
  Croissant,
  Feather,
  Fish,
  Flower2,
  Gauge,
  HeartPulse,
  Leaf,
  Milk,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  Wheat,
  WheatOff,
  type LucideIcon,
} from "lucide-react"
import * as Photos from "@/lib/data/photos"
import type { IconTone } from "@/components/app/page"
import type { AgeGroupId, CuisineId, HealthFitId } from "@/lib/types"
import type { MealGroupId } from "@/lib/recipe-bank"

export const MEAL_PHOTO: Record<MealGroupId, string> = {
  breakfast: "/food/omelette-roti.jpg",
  lunch: "/food/rice-fish-dal.jpg",
  dinner: "/food/rice-chicken-dal.jpg",
  snack: "/food/tea-chickpea.jpg",
  drinks: "/food/doi-guava.jpg",
}

export const AGE_PHOTO: Record<AgeGroupId, string> = {
  infant: "/food/inf-banana.jpg",
  toddler: "/food/inf-khichuri.jpg",
  child: "/food/egg-roti.jpg",
  teen: "/food/oats-mango.jpg",
  adult: "/food/rice-fish-dal.jpg",
  older_adult: "/food/khichuri.jpg",
}

/** Local fallback until `CUISINE_PHOTO` exists in lib/data/photos; never use a photo of a different cuisine. */
const CUISINE_PHOTO_FALLBACK: Partial<Record<CuisineId, string>> = {
  bangladeshi: "/food/rice-fish-dal.jpg",
  indian: "/food/roti-chickpea.jpg",
  pakistani: "/food/rice-beef.jpg",
  mediterranean: "/food/salad.jpg",
}

export function cuisinePhoto(id: CuisineId): string | undefined {
  const shared = (Photos as { CUISINE_PHOTO?: Partial<Record<CuisineId, string>> }).CUISINE_PHOTO
  return shared?.[id] ?? CUISINE_PHOTO_FALLBACK[id]
}

/** Illustrated tile (tint + Lucide icon) for cuisines without a photo. */
export const CUISINE_ART: Record<CuisineId, { icon: LucideIcon; tone: string }> = {
  bangladeshi: { icon: Fish, tone: "bg-sage text-forest" },
  indian: { icon: CookingPot, tone: "bg-amber-tint text-amber-text" },
  pakistani: { icon: Beef, tone: "bg-coral-tint text-terracotta-text" },
  chinese: { icon: Soup, tone: "bg-coral-tint text-terracotta-text" },
  thai: { icon: Leaf, tone: "bg-lime-card text-lime-text" },
  japanese: { icon: Fish, tone: "bg-sky-tint text-sky-text" },
  italian: { icon: Pizza, tone: "bg-amber-tint text-amber-text" },
  mediterranean: { icon: Salad, tone: "bg-sage text-forest" },
  middle_eastern: { icon: Sandwich, tone: "bg-amber-tint text-amber-text" },
  mexican: { icon: Carrot, tone: "bg-coral-tint text-terracotta-text" },
  continental: { icon: Croissant, tone: "bg-sky-tint text-sky-text" },
}

export const FIT_ICON: Record<HealthFitId, { icon: LucideIcon; tone: IconTone }> = {
  high_protein: { icon: Beef, tone: "terracotta" },
  high_fiber: { icon: Wheat, tone: "lime" },
  iron_rich: { icon: Leaf, tone: "sage" },
  calcium_rich: { icon: Milk, tone: "sky" },
  lighter: { icon: Feather, tone: "amber" },
  gluten_free: { icon: WheatOff, tone: "amber" },
  diabetes_aware: { icon: Activity, tone: "sky" },
  heart_aware: { icon: HeartPulse, tone: "terracotta" },
  bp_aware: { icon: Gauge, tone: "sage" },
  pregnancy_friendly: { icon: Flower2, tone: "lime" },
  gentle_digestion: { icon: Soup, tone: "amber" },
  easy_to_chew: { icon: Utensils, tone: "sky" },
}
