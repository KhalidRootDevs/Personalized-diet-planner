import type { Recipe } from "@/lib/types"

// Verified-recipe library (§9 Approach A). Content is illustrative for the prototype.
export const RECIPES: Recipe[] = [
  {
    id: "r_egg_roti", name: "Boiled eggs, roti & fruit", nameBn: "ডিম, রুটি ও ফল", description: "A quick, filling breakfast before work.",
    mealTypes: ["breakfast"], profile: "adult", prepMinutes: 5, cookMinutes: 10, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "egg_boiled", grams: 100 }, { foodId: "roti", grams: 80 }, { foodId: "banana", grams: 118 }],
    steps: ["Place eggs in a pan, cover with water and bring to a boil.", "Simmer 9–10 minutes until the yolk is fully set.", "Cool in cold water, peel and halve.", "Warm the rotis on a dry tawa for 30 seconds per side.", "Serve with a sliced banana."],
    safetyNotes: ["Cook eggs until the yolk is firm."], storage: "Boiled eggs keep 3 days refrigerated, unpeeled.", tags: ["halal", "quick", "budget", "office-friendly", "high-protein"], reviewStatus: "approved", swatch: "ivory", icon: "Egg",
  },
  {
    id: "r_oats_milk", name: "Oats with milk & mango", nameBn: "দুধ-ওটস ও আম", description: "Warm oats cooked in milk, topped with seasonal fruit.",
    mealTypes: ["breakfast"], profile: "adult", prepMinutes: 2, cookMinutes: 6, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "oats_dry", grams: 40 }, { foodId: "milk", grams: 200 }, { foodId: "mango", grams: 100 }],
    steps: ["Bring milk to a gentle simmer.", "Stir in the oats and cook 4–5 minutes, stirring often.", "Top with diced mango."],
    safetyNotes: [], tags: ["halal", "vegetarian", "quick"], reviewStatus: "approved", swatch: "terracotta", icon: "Soup",
  },
  {
    id: "r_omelette_roti", name: "Vegetable omelette & roti", nameBn: "সবজি অমলেট ও রুটি", description: "Onion, tomato and green chilli omelette with two rotis.",
    mealTypes: ["breakfast", "dinner"], profile: "adult", prepMinutes: 5, cookMinutes: 8, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "omelette", grams: 130 }, { foodId: "roti", grams: 80 }, { foodId: "soybean_oil", grams: 5 }],
    steps: ["Whisk two eggs with chopped onion, tomato and a pinch of salt.", "Heat 1 tsp oil and pour in the eggs.", "Cook until set, fold and serve with rotis."],
    safetyNotes: ["Cook eggs until no liquid egg remains."], tags: ["halal", "quick", "budget", "high-protein"], reviewStatus: "approved", swatch: "sage", icon: "Egg",
  },
  {
    id: "r_rice_fish_dal", name: "Rice, rui fish, dal & vegetables", nameBn: "ভাত, রুই মাছ, ডাল ও সবজি", description: "A classic home lunch: balanced, familiar and affordable.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 15, cookMinutes: 30, servings: 2, difficulty: "medium",
    ingredients: [{ foodId: "rice_cooked", grams: 400 }, { foodId: "rui_fish", grams: 140 }, { foodId: "dal_cooked", grams: 300 }, { foodId: "mixed_veg", grams: 200 }, { foodId: "mustard_oil", grams: 14 }],
    steps: ["Rinse rice and cook in plenty of water until tender; drain.", "Rub fish with turmeric and salt; lightly fry in 1 tbsp mustard oil and set aside.", "Make a light onion-tomato gravy, add the fish and simmer 8 minutes.", "Boil lentils with turmeric until soft; temper with garlic.", "Serve with the vegetable bhaji."],
    safetyNotes: ["Cook fish until it flakes easily.", "Check for small bones before serving."], storage: "Refrigerate within 2 hours; eat within 2 days. Reheat until steaming hot.", tags: ["halal", "budget", "batch-cook", "high-protein"], reviewStatus: "approved", swatch: "sage", icon: "Fish",
  },
  {
    id: "r_rice_chicken_dal", name: "Rice, chicken curry & dal", nameBn: "ভাত, মুরগি ও ডাল", description: "Home-style chicken curry with lentils.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 15, cookMinutes: 35, servings: 2, difficulty: "medium",
    ingredients: [{ foodId: "rice_cooked", grams: 400 }, { foodId: "chicken_curry", grams: 240 }, { foodId: "dal_cooked", grams: 240 }, { foodId: "spinach_shak", grams: 120 }],
    steps: ["Cook rice.", "Brown onions, add spices and chicken; cook covered 25 minutes until done.", "Boil lentils until soft and temper.", "Stir-fry spinach with garlic for 3 minutes."],
    safetyNotes: ["Cook chicken until juices run clear and there is no pink meat."], storage: "Refrigerate within 2 hours; eat within 2 days.", tags: ["halal", "batch-cook", "high-protein"], reviewStatus: "approved", swatch: "terracotta", icon: "Drumstick",
  },
  {
    id: "r_khichuri", name: "Vegetable khichuri with egg", nameBn: "সবজি খিচুড়ি ও ডিম", description: "Comforting rice-and-lentil one-pot meal.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 10, cookMinutes: 30, servings: 2, difficulty: "easy",
    ingredients: [{ foodId: "khichuri", grams: 500 }, { foodId: "egg_boiled", grams: 100 }],
    steps: ["Rinse rice and lentils together.", "Sauté onion, ginger and spices; add vegetables.", "Add rice, lentils and water; simmer covered until soft.", "Serve with a boiled egg."],
    safetyNotes: [], storage: "Eat within 2 days; reheat thoroughly.", tags: ["halal", "vegetarian", "budget", "batch-cook"], reviewStatus: "approved", swatch: "ivory", icon: "CookingPot",
  },
  {
    id: "r_roti_chickpea", name: "Roti with chickpea curry", nameBn: "রুটি ও ছোলার তরকারি", description: "Hearty, plant-based dinner rich in fiber.",
    mealTypes: ["dinner", "lunch"], profile: "adult", prepMinutes: 10, cookMinutes: 20, servings: 2, difficulty: "easy",
    ingredients: [{ foodId: "roti", grams: 160 }, { foodId: "chickpeas_cooked", grams: 300 }, { foodId: "mixed_veg", grams: 200 }, { foodId: "soybean_oil", grams: 10 }],
    steps: ["Soak chickpeas overnight and boil until tender (or use cooked).", "Sauté onion, garlic and spices in oil.", "Add chickpeas and a little water; simmer 10 minutes.", "Serve with warm rotis and vegetables."],
    safetyNotes: [], tags: ["halal", "vegetarian", "vegan", "budget", "high-fiber"], reviewStatus: "approved", swatch: "forest", icon: "Wheat",
  },
  {
    id: "r_rice_beef", name: "Rice, beef curry & salad", nameBn: "ভাত, গরুর মাংস ও সালাদ", description: "A weekend favorite with a fresh side.",
    mealTypes: ["dinner"], profile: "adult", prepMinutes: 15, cookMinutes: 60, servings: 2, difficulty: "medium",
    ingredients: [{ foodId: "rice_cooked", grams: 400 }, { foodId: "beef_curry", grams: 220 }, { foodId: "mixed_veg", grams: 150 }],
    steps: ["Marinate beef with spices for 20 minutes.", "Cook covered on low heat about 50 minutes until tender.", "Serve with rice and vegetables."],
    safetyNotes: ["Cook beef thoroughly; reheat leftovers until steaming hot."], tags: ["halal", "high-protein"], reviewStatus: "approved", swatch: "terracotta", icon: "Utensils",
  },
  {
    id: "r_doi_fruit", name: "Doi with guava", nameBn: "টক দই ও পেয়ারা", description: "Light afternoon snack.",
    mealTypes: ["afternoon_snack", "morning_snack"], profile: "adult", prepMinutes: 3, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "doi", grams: 150 }, { foodId: "guava", grams: 100 }],
    steps: ["Spoon yogurt into a bowl.", "Slice guava and serve alongside."],
    safetyNotes: [], tags: ["halal", "vegetarian", "quick", "office-friendly"], reviewStatus: "approved", swatch: "sage", icon: "Apple",
  },
  {
    id: "r_banana_peanuts", name: "Banana & peanuts", nameBn: "কলা ও চিনাবাদাম", description: "Portable snack for busy days.",
    mealTypes: ["afternoon_snack", "morning_snack"], profile: "adult", prepMinutes: 1, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "banana", grams: 118 }, { foodId: "peanuts", grams: 25 }],
    steps: ["Pack a banana and a small handful of peanuts."],
    safetyNotes: ["Contains peanuts."], tags: ["halal", "vegan", "quick", "office-friendly", "budget"], reviewStatus: "approved", swatch: "ivory", icon: "Banana",
  },
  {
    id: "r_tea_chickpea", name: "Milk tea & spiced chickpeas", nameBn: "দুধ চা ও ছোলা", description: "Familiar evening snack with more protein.",
    mealTypes: ["afternoon_snack", "evening_snack"], profile: "adult", prepMinutes: 5, cookMinutes: 5, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "milk_tea", grams: 150 }, { foodId: "chickpeas_cooked", grams: 100 }],
    steps: ["Warm cooked chickpeas with onion, chilli and a squeeze of lemon.", "Serve with a cup of tea."],
    safetyNotes: [], tags: ["halal", "vegetarian", "quick", "budget"], reviewStatus: "approved", swatch: "terracotta", icon: "Coffee",
  },
  // Infant recipes (§12.4) — require clinical review before launch (§4, §43 1.20)
  {
    id: "r_inf_dal_puree", name: "Smooth masoor dal purée", nameBn: "মসুর ডালের পিউরি", description: "Iron-rich first food, cooked very soft and mashed smooth.",
    mealTypes: ["lunch"], profile: "infant", minAgeMonths: 6, texture: "Smooth purée", prepMinutes: 5, cookMinutes: 25, servings: 3, difficulty: "easy",
    ingredients: [{ foodId: "dal_cooked", grams: 150 }],
    steps: ["Rinse lentils well.", "Simmer in water without salt until completely soft.", "Mash or blend until smooth; thin with breast milk, formula or cooled boiled water.", "Offer a few spoonfuls and follow your baby's cues."],
    safetyNotes: ["No added salt or sugar.", "Test temperature before serving.", "Serve only freshly prepared or properly refrigerated portions."], storage: "Refrigerate in a covered container up to 24 hours. Reheat once until steaming, then cool.", tags: ["iron-rich", "first-food"], reviewStatus: "pending", swatch: "sage", icon: "Soup",
  },
  {
    id: "r_inf_pumpkin", name: "Mashed pumpkin", nameBn: "মিষ্টি কুমড়া ভর্তা", description: "Soft, naturally sweet vegetable mash.",
    mealTypes: ["morning_snack", "lunch"], profile: "infant", minAgeMonths: 6, texture: "Smooth mash", prepMinutes: 5, cookMinutes: 15, servings: 3, difficulty: "easy",
    ingredients: [{ foodId: "pumpkin", grams: 150 }],
    steps: ["Peel, deseed and cube pumpkin.", "Steam or boil until very soft.", "Mash smooth, without lumps."],
    safetyNotes: ["No added salt or sugar."], tags: ["first-food"], reviewStatus: "pending", swatch: "terracotta", icon: "Carrot",
  },
  {
    id: "r_inf_banana", name: "Mashed ripe banana", nameBn: "পাকা কলা ভর্তা", description: "No-cook first fruit.",
    mealTypes: ["afternoon_snack"], profile: "infant", minAgeMonths: 6, texture: "Smooth mash", prepMinutes: 2, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "banana", grams: 60 }],
    steps: ["Wash hands and the banana skin.", "Mash a ripe banana with a fork until smooth."],
    safetyNotes: ["Serve immediately; do not store mashed banana."], tags: ["first-food"], reviewStatus: "pending", swatch: "ivory", icon: "Banana",
  },
  {
    id: "r_inf_egg", name: "Well-cooked mashed egg", nameBn: "ভালোভাবে সিদ্ধ ডিম ভর্তা", description: "Common allergen introduced in a safe, well-cooked form.",
    mealTypes: ["breakfast"], profile: "infant", minAgeMonths: 6, texture: "Finely mashed", prepMinutes: 2, cookMinutes: 12, servings: 2, difficulty: "easy",
    ingredients: [{ foodId: "egg_boiled", grams: 50 }],
    steps: ["Hard-boil the egg 10–12 minutes until fully set.", "Mash finely and mix with breast milk or formula to a soft texture."],
    safetyNotes: ["Egg is a common allergen. Offer a small amount and watch for reactions.", "Seek urgent help for breathing difficulty, swelling or severe reactions."], tags: ["allergen-introduction"], reviewStatus: "pending", swatch: "sage", icon: "Egg",
  },
  {
    id: "r_inf_khichuri", name: "Soft khichuri mash", nameBn: "নরম খিচুড়ি", description: "Family khichuri cooked softer and mashed, before adding salt.",
    mealTypes: ["dinner", "lunch"], profile: "infant", minAgeMonths: 8, texture: "Mashed with soft lumps", prepMinutes: 5, cookMinutes: 30, servings: 3, difficulty: "easy",
    ingredients: [{ foodId: "khichuri", grams: 150 }],
    steps: ["Set aside the baby's portion before adding salt or chilli.", "Cook a little longer until very soft.", "Mash, leaving small soft lumps as your baby is ready."],
    safetyNotes: ["Remove the baby's portion before adding salt, chilli or whole spices."], tags: ["family-meal"], reviewStatus: "pending", swatch: "forest", icon: "Baby",
  },
]

export const RECIPE_MAP: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]))

export function getRecipe(id: string): Recipe | undefined {
  return RECIPE_MAP[id]
}
