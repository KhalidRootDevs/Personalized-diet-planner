/**
 * Food photography for the prototype (§44.11). Wikimedia Commons photos under CC0 / CC BY /
 * CC BY-SA — credits in public/food/CREDITS.md and Profile → App settings → Photo credits.
 * Placeholders only: production uses licensed photos of the actual recipes.
 */
export const RECIPE_PHOTO: Record<string, string> = {
  r_egg_roti: "/food/egg-roti.jpg",
  r_oats_milk: "/food/oats-mango.jpg",
  r_omelette_roti: "/food/omelette-roti.jpg",
  r_rice_fish_dal: "/food/rice-fish-dal.jpg",
  r_rice_chicken_dal: "/food/rice-chicken-dal.jpg",
  r_khichuri: "/food/khichuri.jpg",
  r_roti_chickpea: "/food/roti-chickpea.jpg",
  r_rice_beef: "/food/rice-beef.jpg",
  r_doi_fruit: "/food/doi-guava.jpg",
  r_banana_peanuts: "/food/banana-peanuts.jpg",
  r_tea_chickpea: "/food/tea-chickpea.jpg",
  r_inf_dal_puree: "/food/inf-dal.jpg",
  r_inf_pumpkin: "/food/inf-pumpkin.jpg",
  r_inf_banana: "/food/inf-banana.jpg",
  r_inf_egg: "/food/inf-egg.jpg",
  r_inf_khichuri: "/food/inf-khichuri.jpg",
}

/** Scene photos for heroes and category tiles. */
export const SCENE_PHOTO = {
  hero: "/food/hero-vegetables.jpg",
  fruits: "/food/fruits.jpg",
  salad: "/food/salad.jpg",
  bhorta: "/food/bhorta.jpg",
  rice: "/food/rice-fish-dal.jpg",
  breakfast: "/food/omelette-roti.jpg",
  snacks: "/food/tea-chickpea.jpg",
  baby: "/food/inf-banana.jpg",
} as const

export function recipePhoto(id?: string): string | undefined {
  return id ? RECIPE_PHOTO[id] : undefined
}
