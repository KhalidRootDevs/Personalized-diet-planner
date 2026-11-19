// Age-band content for the infant and child feeding module (§2.1 table, §12.2). Illustrative copy —
// final rules require clinical review before launch (§4, §43 1.20). Caregiver language, textures and
// milestones only: no calories, adult targets or scores (§12.8, §42.10, §44.9).

export type StageId = "milk_only" | "starting" | "textures" | "variety" | "toddler" | "child"

export interface FeedingStage {
  id: StageId
  title: string
  focus: string
  solidsPlanned: boolean
  opportunities: string
  textures: string
  nextFoods: string[]
  /** Under 12 months: milk feeds stay central and "first foods" language applies. */
  baby: boolean
  /** Milk guidance for this stage, or null when it isn't part of the daily plan. */
  milkNote: string | null
  milestones: string[]
  /** Who the copy talks about. */
  who: "baby" | "toddler" | "child"
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
      baby: true,
      milkNote: "Continue your baby's usual milk feeds, on demand",
      milestones: ["Holds head steady", "Shows interest when others eat", "Starts to sit with support"],
      who: "baby",
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
      baby: true,
      milkNote: "Continue your baby's usual milk feeds, on demand",
      milestones: ["Sits with support", "Opens mouth for the spoon", "Moves food to the back of the mouth"],
      who: "baby",
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
      baby: true,
      milkNote: "Milk feeds stay central alongside meals",
      milestones: ["Sits without support", "Starts to chew soft lumps", "Picks up food with the whole hand"],
      who: "baby",
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
      baby: true,
      milkNote: "Milk feeds continue alongside meals",
      milestones: ["Pincer grasp for small soft pieces", "Drinks from an open cup with help", "Joins family mealtimes"],
      who: "baby",
    }
  if (months < 24)
    return {
      id: "toddler",
      title: "Eating with the family",
      focus: "Your toddler can share most family meals, set aside before adding salt or chilli and cut into small soft pieces.",
      solidsPlanned: true,
      opportunities: "3 meals and 1–2 snacks a day",
      textures: "Family foods, chopped small and soft",
      nextFoods: ["Family khichuri (before adding salt)", "Soft fish curry pieces (bones removed)", "Chopped seasonal fruit", "Egg and roti"],
      baby: false,
      milkNote: "Breastfeeding can continue if you both wish; milk is a drink alongside meals, not a replacement",
      milestones: ["Feeds self with fingers and starts using a spoon", "Drinks from an open cup", "Chews a wider range of textures"],
      who: "toddler",
    }
  return {
    id: "child",
    title: "Family meals",
    focus: "Your child eats family foods. Offer a variety at regular meal and snack times and let them decide how much to eat.",
    solidsPlanned: true,
    opportunities: "3 meals and 1–2 planned snacks a day",
    textures: "Family foods, cut to a safe size",
    nextFoods: ["Vegetables in a new shape or dish", "A new seasonal fruit", "Small fish curry", "Chickpea snack"],
    baby: false,
    milkNote: null,
    milestones: ["Uses a spoon and fork", "Serves small amounts with help", "Tries new foods after repeated tastes"],
    who: "child",
  }
}

export interface SafetyItem {
  title: string
  body: string
}

export function safetyEssentials(stage: FeedingStage): SafetyItem[] {
  const choking = { title: "Avoid choking hazards", body: stage.baby ? "No whole nuts, whole grapes, hard raw vegetables or round hard pieces. Mash, grind or cut foods to the right texture." : "Cut round foods like grapes lengthways, avoid whole nuts and hard sweets, and keep your child seated while eating." }
  const clean = { title: "Keep it clean and fresh", body: "Wash hands and utensils, use safe drinking water, and refrigerate leftovers within 2 hours." }
  if (stage.baby)
    return [
      { title: "No honey before 12 months", body: "Honey can cause infant botulism, even when cooked into food." },
      choking,
      { title: "No added salt or sugar", body: "Set aside your baby's portion before seasoning family food." },
      clean,
      { title: "Milk stays central", body: "Keep breastfeeding or formula going during the first year. Don't replace milk feeds with water." },
    ]
  return [
    choking,
    { title: "Go easy on salt and sugar", body: "Set aside your child's portion before adding extra salt or chilli, and keep sweets and soft drinks occasional." },
    clean,
    { title: "Fish bones and allergens", body: "Remove fish bones carefully. Keep avoiding any food your clinician has advised against." },
  ]
}

export function responsiveCues(stage: FeedingStage) {
  if (stage.who === "baby")
    return [
      { cue: "Hungry", examples: "Leans towards the spoon, opens mouth, gets excited when food appears." },
      { cue: "Full", examples: "Turns head away, closes mouth, pushes the spoon or food away, gets distracted." },
    ]
  return [
    { cue: "Hungry", examples: "Asks for food, points at food, comes to the table keen to eat." },
    { cue: "Full", examples: "Plays with food, says “no” or “finished”, wants to leave the table." },
  ]
}

/** Kept for compatibility with existing screens. */
export const SAFETY_ESSENTIALS = safetyEssentials(feedingStage(7))
export const RESPONSIVE_FEEDING = responsiveCues(feedingStage(7))

export const ALLERGENS_TO_INTRODUCE = ["Egg (well cooked)", "Peanut (smooth paste thinned, never whole)", "Fish (bones removed)", "Wheat (soft roti)", "Milk products (yogurt)"]
