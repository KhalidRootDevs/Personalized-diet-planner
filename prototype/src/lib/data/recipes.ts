import type { Recipe } from "@/lib/types"
import { BANK_RECIPES } from "./recipe-bank-data"

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
  // Toddler and child recipes (§12.2, 12+ months). Pending clinical review.
  // Quick everyday recipes (≤ 20–25 min) so busy profiles get a complete, varied plan (§10.3, §25).
  {
    id: "r_rice_egg_curry", name: "Rice, egg curry & vegetables", nameBn: "ভাত, ডিমের তরকারি ও সবজি", description: "A fast weekday lunch using rice cooked earlier.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 5, cookMinutes: 15, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "rice_cooked", grams: 250 }, { foodId: "egg_boiled", grams: 100 }, { foodId: "mixed_veg", grams: 120 }, { foodId: "soybean_oil", grams: 5 }],
    steps: ["Reheat rice cooked earlier until steaming hot.", "Fry sliced onion in 1 tsp oil, add turmeric, chilli and tomato.", "Add halved boiled eggs and a splash of water; simmer 5 minutes.", "Serve with the vegetables."],
    safetyNotes: ["Reheat rice until steaming hot all the way through."], storage: "Cooked rice: refrigerate within 1 hour, eat within 1 day.", tags: ["halal", "quick", "budget", "office-friendly", "high-protein"], reviewStatus: "approved", swatch: "ivory", icon: "Egg",
  },
  {
    id: "r_roti_dal_lalshak", name: "Roti, dal & lal shak", nameBn: "রুটি, ডাল ও লাল শাক", description: "Plant-based plate with iron-rich red amaranth.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 5, cookMinutes: 15, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "roti", grams: 120 }, { foodId: "dal_cooked", grams: 180 }, { foodId: "lal_shak", grams: 120 }, { foodId: "mustard_oil", grams: 4 }],
    steps: ["Warm rotis on a dry tawa.", "Reheat dal made in a batch, or boil red lentils 12 minutes.", "Stir-fry lal shak with garlic in 1 tsp mustard oil for 4 minutes."],
    safetyNotes: [], tags: ["halal", "vegetarian", "quick", "budget", "high-fiber"], reviewStatus: "approved", swatch: "sage", icon: "Salad",
  },
  {
    id: "r_rice_tilapia_potol", name: "Rice, grilled tilapia & potol", nameBn: "ভাত, গ্রিল তেলাপিয়া ও পটল", description: "Light fish lunch with pointed gourd.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 5, cookMinutes: 15, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "rice_cooked", grams: 250 }, { foodId: "tilapia_grilled", grams: 120 }, { foodId: "potol_bhaji", grams: 120 }],
    steps: ["Season tilapia with turmeric, salt and lemon.", "Grill or pan-sear 4–5 minutes per side until it flakes.", "Serve with rice and potol bhaji."],
    safetyNotes: ["Cook fish until it flakes easily.", "Check for bones before serving."], tags: ["halal", "quick", "high-protein"], reviewStatus: "approved", swatch: "sage", icon: "Fish",
  },
  {
    id: "r_rice_dal_begun", name: "Rice, dal & begun bhorta", nameBn: "ভাত, ডাল ও বেগুন ভর্তা", description: "Comforting home plate with smoky mashed eggplant.",
    mealTypes: ["lunch", "dinner"], profile: "adult", prepMinutes: 10, cookMinutes: 10, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "rice_cooked", grams: 250 }, { foodId: "dal_cooked", grams: 180 }, { foodId: "begun_bhorta", grams: 100 }],
    steps: ["Roast eggplant over a flame until soft; peel and mash with onion, chilli and a little mustard oil.", "Reheat batch-cooked dal and rice.", "Serve together."],
    safetyNotes: [], tags: ["halal", "vegetarian", "quick", "budget"], reviewStatus: "approved", swatch: "terracotta", icon: "Soup",
  },
  {
    id: "r_roti_borboti_egg", name: "Roti, borboti bhaji & egg", nameBn: "রুটি, বরবটি ভাজি ও ডিম", description: "Yardlong beans with a boiled egg and roti.",
    mealTypes: ["dinner", "lunch"], profile: "adult", prepMinutes: 5, cookMinutes: 15, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "roti", grams: 120 }, { foodId: "borboti_bhaji", grams: 120 }, { foodId: "egg_boiled", grams: 50 }],
    steps: ["Stir-fry chopped borboti with onion and turmeric 8–10 minutes.", "Boil an egg 9–10 minutes until set.", "Serve with warm rotis."],
    safetyNotes: ["Cook eggs until the yolk is firm."], tags: ["halal", "quick", "budget", "high-protein"], reviewStatus: "approved", swatch: "sage", icon: "Egg",
  },
  {
    id: "r_rice_chicken_lau", name: "Rice, chicken & lau", nameBn: "ভাত, মুরগি ও লাউ", description: "Simple chicken with bottle gourd curry.",
    mealTypes: ["dinner", "lunch"], profile: "adult", prepMinutes: 5, cookMinutes: 20, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "rice_cooked", grams: 250 }, { foodId: "chicken_plain", grams: 100 }, { foodId: "lau_curry", grams: 150 }, { foodId: "mustard_oil", grams: 5 }],
    steps: ["Cook diced chicken with onion, ginger and turmeric 12–15 minutes until done.", "Simmer lau pieces with a little cumin until soft.", "Serve with rice."],
    safetyNotes: ["Cook chicken until there is no pink meat."], storage: "Refrigerate within 2 hours; eat within 2 days.", tags: ["halal", "high-protein"], reviewStatus: "approved", swatch: "terracotta", icon: "Drumstick",
  },
  {
    id: "r_chira_doi_banana", name: "Chira with doi & banana", nameBn: "চিড়া, দই ও কলা", description: "No-cook breakfast that's easy on busy mornings.",
    mealTypes: ["breakfast"], profile: "adult", prepMinutes: 5, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "chira", grams: 60 }, { foodId: "doi", grams: 150 }, { foodId: "banana", grams: 118 }],
    steps: ["Rinse chira and drain for 2 minutes until soft.", "Mix with plain doi and sliced banana."],
    safetyNotes: [], tags: ["halal", "vegetarian", "quick", "budget", "no-cook"], reviewStatus: "approved", swatch: "ivory", icon: "Banana",
  },
  {
    id: "r_muri_chickpea", name: "Muri with chickpeas", nameBn: "মুড়ি ও ছোলা", description: "Crunchy, familiar afternoon snack.",
    mealTypes: ["afternoon_snack", "evening_snack", "morning_snack"], profile: "adult", prepMinutes: 5, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "muri", grams: 30 }, { foodId: "chickpeas_cooked", grams: 80 }],
    steps: ["Toss muri with cooked chickpeas, chopped onion, chilli and a squeeze of lemon."],
    safetyNotes: [], tags: ["halal", "vegetarian", "vegan", "quick", "budget"], reviewStatus: "approved", swatch: "ivory", icon: "Wheat",
  },
  {
    id: "r_papaya_peanuts", name: "Papaya & peanuts", nameBn: "পেঁপে ও চিনাবাদাম", description: "Fruit with a handful of peanuts.",
    mealTypes: ["afternoon_snack", "morning_snack"], profile: "adult", prepMinutes: 3, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "papaya", grams: 150 }, { foodId: "peanuts", grams: 20 }],
    steps: ["Cube ripe papaya.", "Serve with a small handful of peanuts."],
    safetyNotes: ["Peanuts are a common allergen."], tags: ["halal", "vegetarian", "vegan", "quick"], reviewStatus: "approved", swatch: "terracotta", icon: "Apple",
  },
  {
    id: "r_rice_katla_kumra", name: "Rice, katla curry & kumra", nameBn: "ভাত, কাতলা ও কুমড়া", description: "Classic fish curry with sweet pumpkin.",
    mealTypes: ["dinner", "lunch"], profile: "adult", prepMinutes: 10, cookMinutes: 30, servings: 2, difficulty: "easy",
    ingredients: [{ foodId: "rice_cooked", grams: 500 }, { foodId: "katla_curry", grams: 240 }, { foodId: "kumra_bhaji", grams: 240 }],
    steps: ["Fry katla pieces lightly, then simmer in an onion-tomato gravy 10 minutes.", "Cook pumpkin with panch phoron until soft.", "Serve with rice."],
    safetyNotes: ["Cook fish until it flakes easily.", "Check for bones before serving."], storage: "Refrigerate within 2 hours; eat within 2 days.", tags: ["halal", "batch-cook", "high-protein"], reviewStatus: "approved", swatch: "sage", icon: "Fish",
  },
  {
    id: "r_child_khichuri_egg", name: "Family khichuri with chopped egg", nameBn: "ডিম দিয়ে নরম খিচুড়ি", description: "The family pot, set aside before salt and chilli, with soft chopped egg.",
    mealTypes: ["lunch", "dinner"], profile: "child", minAgeMonths: 12, texture: "Soft, chopped small", prepMinutes: 5, cookMinutes: 30, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "khichuri", grams: 150 }, { foodId: "egg_boiled", grams: 25 }],
    steps: ["Take your child's portion out of the family khichuri before adding salt, chilli or whole spices.", "Hard-boil the egg until fully set and chop it small.", "Mix in the egg and let it cool to a safe temperature."],
    safetyNotes: ["Remove whole spices such as cardamom and bay leaf.", "Egg is a common allergen; skip it if your clinician advised avoiding egg."], tags: ["family-meal", "toddler"], reviewStatus: "pending", swatch: "forest", icon: "Soup",
  },
  {
    id: "r_child_fish_rice", name: "Rice, soft fish & dal plate", nameBn: "ভাত, নরম মাছ ও ডাল", description: "A small family plate with rui fish flaked and checked for bones.",
    mealTypes: ["lunch", "dinner"], profile: "child", minAgeMonths: 12, texture: "Soft pieces, bones removed", prepMinutes: 10, cookMinutes: 25, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "rice_cooked", grams: 100 }, { foodId: "rui_fish", grams: 40 }, { foodId: "dal_cooked", grams: 60 }, { foodId: "mixed_veg", grams: 50 }],
    steps: ["Set aside your child's fish and vegetables before adding extra chilli.", "Flake the fish with your fingers and remove every bone.", "Mix rice with dal so it's soft, and serve the fish and vegetables in small pieces."],
    safetyNotes: ["Check carefully for fish bones.", "Fish is a common allergen."], tags: ["family-meal", "toddler"], reviewStatus: "pending", swatch: "sage", icon: "Fish",
  },
  {
    id: "r_child_roti_dal", name: "Roti strips with dal & pumpkin", nameBn: "রুটি, ডাল ও কুমড়া", description: "Soft roti strips to dip, with dal and mashed pumpkin.",
    mealTypes: ["breakfast", "dinner"], profile: "child", minAgeMonths: 12, texture: "Soft finger food", prepMinutes: 5, cookMinutes: 15, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "roti", grams: 40 }, { foodId: "dal_cooked", grams: 80 }, { foodId: "pumpkin", grams: 50 }],
    steps: ["Tear a soft roti into strips your child can hold.", "Serve with warm dal for dipping and mashed pumpkin on the side."],
    safetyNotes: ["Wheat is a common allergen.", "Keep your child seated while eating."], tags: ["toddler", "finger-food"], reviewStatus: "pending", swatch: "ivory", icon: "Wheat",
  },
  {
    id: "r_child_doi_fruit", name: "Doi with soft fruit", nameBn: "টক দই ও ফল", description: "Plain doi with mashed banana and soft mango pieces.",
    mealTypes: ["afternoon_snack", "morning_snack"], profile: "child", minAgeMonths: 12, texture: "Soft pieces", prepMinutes: 3, cookMinutes: 0, servings: 1, difficulty: "easy",
    ingredients: [{ foodId: "doi", grams: 80 }, { foodId: "banana", grams: 60 }, { foodId: "mango", grams: 40 }],
    steps: ["Spoon plain, unsweetened doi into a small bowl.", "Add mashed banana and small soft mango pieces."],
    safetyNotes: ["Milk is a common allergen.", "Choose plain doi without added sugar."], tags: ["snack", "toddler"], reviewStatus: "pending", swatch: "terracotta", icon: "Banana",
  },
]

RECIPES.push(...BANK_RECIPES)

export const RECIPE_MAP: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]))

export function getRecipe(id: string): Recipe | undefined {
  return RECIPE_MAP[id]
}
