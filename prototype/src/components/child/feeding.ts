// Age-band content for the baby feeding module (§2.1 table, §12.2). Illustrative copy —
// final rules require clinical review before launch (§4, §43 1.20).

export interface FeedingStage {
  id: string
  title: string
  focus: string
  solidsPlanned: boolean
  opportunities: string
  textures: string
  nextFoods: string[]
}

export function feedingStage(months: number): FeedingStage {
  if (months < 6)
    return {
      id: "milk_only",
      title: "Milk feeding",
      focus: "Breast milk or infant formula meets your baby's needs. No solid-food meal plan yet.",
      solidsPlanned: false,
      opportunities: "Feed on demand",
      textures: "Milk only",
      nextFoods: [],
    }
  if (months < 7)
    return {
      id: "starting",
      title: "Starting complementary foods",
      focus: "Introducing first foods alongside breastfeeding or formula, when your baby shows signs of readiness.",
      solidsPlanned: true,
      opportunities: "Start with 1–2 small tastes a day",
      textures: "Smooth purées and soft mashes",
      nextFoods: ["Mashed pumpkin", "Smooth dal purée", "Mashed banana", "Well-cooked mashed egg"],
    }
  if (months < 9)
    return {
      id: "textures",
      title: "Building textures",
      focus: "Moving from smooth purées towards mashed foods with soft lumps, and adding variety.",
      solidsPlanned: true,
      opportunities: "Around 2–3 small meals a day, alongside milk feeds",
      textures: "Mashed with soft lumps",
      nextFoods: ["Soft khichuri mash", "Mashed fish (bones removed)", "Spinach mixed into dal", "Soft-cooked carrot"],
    }
  if (months < 12)
    return {
      id: "variety",
      title: "More variety",
      focus: "Increasing food variety and soft finger foods, with responsive feeding.",
      solidsPlanned: true,
      opportunities: "Around 3–4 meals a day, plus milk feeds",
      textures: "Chopped soft foods and soft finger foods",
      nextFoods: ["Soft roti pieces soaked in dal", "Mashed chicken", "Soft fruit pieces", "Yogurt (doi)"],
    }
  return {
    id: "family",
    title: "Moving to family foods",
    focus: "Transitioning to an age-appropriate family diet, prepared without added salt or sugar and cut safely.",
    solidsPlanned: true,
    opportunities: "3 meals and 1–2 snacks a day",
    textures: "Family foods, cut small and soft",
    nextFoods: ["Family khichuri (before adding salt)", "Soft fish curry pieces", "Chopped seasonal fruit", "Egg and roti"],
  }
}

export const SAFETY_ESSENTIALS = [
  { title: "No honey before 12 months", body: "Honey can cause infant botulism, even when cooked into food." },
  { title: "Avoid choking hazards", body: "No whole nuts, whole grapes, hard raw vegetables or round hard pieces. Mash, grind or cut foods to the right texture." },
  { title: "No added salt or sugar", body: "Set aside your baby's portion before seasoning family food." },
  { title: "Keep it clean and fresh", body: "Wash hands and utensils, use boiled and cooled water, and refrigerate leftovers within 2 hours." },
  { title: "Milk stays central", body: "Keep breastfeeding or formula going during the first year. Don't replace milk feeds with water." },
]

export const RESPONSIVE_FEEDING = [
  { cue: "Hungry", examples: "Leans towards the spoon, opens mouth, gets excited when food appears." },
  { cue: "Full", examples: "Turns head away, closes mouth, pushes the spoon or food away, gets distracted." },
]

export const ALLERGENS_TO_INTRODUCE = ["Egg (well cooked)", "Peanut (smooth paste thinned, never whole)", "Fish (bones removed)", "Wheat (soft roti)", "Milk products (yogurt)"]
