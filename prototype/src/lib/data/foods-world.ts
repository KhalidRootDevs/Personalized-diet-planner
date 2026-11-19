import type { Allergen, Food, PortionUnit } from "@/lib/types"

// Ingredients for the international recipe bank (§8, §27). Illustrative prototype values only —
// not validated food-composition data. Raw vs cooked state is explicit (§8.2): grams in a recipe are
// always in the state named here (e.g. "Chicken (cooked)" is cooked weight, "Lentils (dry)" is dry weight).
// Sodium is listed wherever a typical value is known, so the sodium rules (§13, bp_aware) can work.
// No pork and no alcohol anywhere (halal market).
const SRC = "Prototype sample data (illustrative)"

/** [kcal, protein g, carbs g, fat g, fiber g, iron mg, calcium mg, sodium mg] per 100 g. */
type Per100 = [number, number, number, number, number, number, number, number]

/** Household measure. `est` = gram weight is an estimate (bowl, handful, piece; §42.6). */
function u(label: string, labelBn: string, grams: number, est = false): PortionUnit {
  return est ? { label, labelBn, grams, estimate: true } : { label, labelBn, grams }
}

function food(
  id: string,
  name: string,
  nameBn: string,
  category: Food["category"],
  state: Food["state"],
  n: Per100,
  allergens: Allergen[],
  units: PortionUnit[],
  costPer100gBdt: number,
  confidence: Food["confidence"],
  extra: Partial<Food> = {},
): Food {
  const [energyKcal, proteinG, carbsG, fatG, fiberG, ironMg, calciumMg, sodiumMg] = n
  return {
    id,
    name,
    nameBn,
    category,
    state,
    per100g: { energyKcal, proteinG, carbsG, fatG, fiberG, ironMg, calciumMg, sodiumMg },
    allergens,
    units,
    costPer100gBdt,
    dataSource: SRC,
    confidence,
    reviewStatus: "pending",
    ...extra,
  }
}

export const WORLD_FOODS: Food[] = [
  // ── Grains, breads and starches ──────────────────────────────────────────
  food("pasta_dry", "Pasta (dry)", "পাস্তা (শুকনো)", "grain", "dry", [371, 13, 75, 1.5, 3.2, 1.3, 21, 6], ["wheat"], [u("1 cup dry", "১ কাপ শুকনো", 100, true), u("1 portion dry", "১ জনের শুকনো", 80, true)], 30, "high", { prepNotes: "Dry weight. Roughly doubles to 2.2× its weight when boiled." }),
  food("pasta_ww_dry", "Whole-wheat pasta (dry)", "আটার পাস্তা (শুকনো)", "grain", "dry", [348, 14.6, 72, 1.4, 9, 3.6, 40, 8], ["wheat"], [u("1 cup dry", "১ কাপ শুকনো", 100, true), u("1 portion dry", "১ জনের শুকনো", 80, true)], 45, "high", { prepNotes: "Dry weight." }),
  food("bread_ww", "Whole-wheat bread", "লাল আটার পাউরুটি", "grain", "prepared", [250, 12.5, 43, 3.5, 6, 2.5, 160, 450], ["wheat"], [u("1 slice", "১ স্লাইস", 30)], 20, "high", { prepNotes: "Packaged bread; sodium varies by brand." }),
  food("pita_ww", "Whole-wheat pita", "আটার পিটা রুটি", "grain", "prepared", [266, 9.8, 55, 2.6, 7.4, 3.1, 15, 530], ["wheat"], [u("1 pita", "১টি পিটা", 60)], 25, "moderate"),
  food("corn_tortilla", "Corn tortilla", "ভুট্টার টরটিয়া", "grain", "prepared", [218, 5.7, 45, 2.9, 6.3, 1.2, 81, 45], [], [u("1 tortilla", "১টি টরটিয়া", 26)], 30, "moderate"),
  food("couscous_dry", "Couscous (dry)", "কুসকুস (শুকনো)", "grain", "dry", [376, 12.8, 77, 0.6, 5, 1.1, 24, 10], ["wheat"], [u("½ cup dry", "আধা কাপ শুকনো", 90)], 40, "high", { prepNotes: "Dry weight; absorbs about its own volume of water." }),
  food("quinoa_dry", "Quinoa (dry)", "কিনোয়া (শুকনো)", "grain", "dry", [368, 14, 64, 6, 7, 4.6, 47, 5], [], [u("½ cup dry", "আধা কাপ শুকনো", 85)], 120, "high"),
  food("rice_noodles_dry", "Rice noodles (dry)", "চালের নুডলস (শুকনো)", "grain", "dry", [364, 6, 80, 0.6, 1.6, 0.7, 18, 180], [], [u("1 nest", "১টি গোছা", 60, true)], 30, "moderate"),
  food("egg_noodles_dry", "Egg noodles (dry)", "ডিমের নুডলস (শুকনো)", "grain", "dry", [384, 14, 71, 4.4, 3.3, 4.5, 30, 20], ["wheat", "egg"], [u("1 cake", "১টি কেক", 60, true)], 30, "moderate"),
  food("brown_rice_cooked", "Brown rice (cooked)", "লাল চালের ভাত", "grain", "cooked", [123, 2.7, 25.6, 1, 1.6, 0.6, 3, 4], [], [u("1 cup cooked", "১ কাপ", 160), u("Medium plate", "মাঝারি প্লেট", 250, true)], 10, "high"),
  food("suji", "Semolina (suji, dry)", "সুজি", "grain", "dry", [360, 12.7, 73, 1, 3.9, 1.2, 17, 1], ["wheat"], [u("¼ cup", "সিকি কাপ", 40)], 10, "high", { infantSafeFromMonths: 6, prepNotes: "Dry weight. Wheat allergen; for babies cook into a smooth porridge." }),
  food("poha_dry", "Flattened rice (poha / chira, dry)", "চিড়া (শুকনো)", "grain", "dry", [350, 6.6, 77, 1.2, 1.4, 6, 20, 10], [], [u("1 cup dry", "১ কাপ শুকনো", 60, true)], 9, "moderate", { prepNotes: "Dry weight. Rinsed poha roughly triples in weight." }),
  food("idli_batter", "Idli / dosa batter (rice and urad, unsalted)", "ইডলি / দোসার ব্যাটার", "grain", "prepared", [135, 4.3, 27, 0.6, 1.5, 0.9, 12, 5], [], [u("1 idli (batter)", "১টি ইডলি", 40, true), u("1 ladle", "১ হাতা", 60, true)], 15, "moderate", { infantSafeFromMonths: 8, prepNotes: "Fermented batter before salting; salt is listed separately in recipes." }),
  food("cornflour", "Cornflour (cornstarch)", "কর্নফ্লাওয়ার", "grain", "dry", [381, 0.3, 91, 0.1, 0.9, 0.5, 2, 9], [], [u("1 tbsp", "১ টেবিল চামচ", 8)], 25, "high"),
  food("potato", "Potato (boiled)", "আলু (সিদ্ধ)", "vegetable", "cooked", [87, 1.9, 20, 0.1, 1.8, 0.3, 5, 4], [], [u("1 medium", "১টি মাঝারি", 150, true), u("1 small", "১টি ছোট", 90, true)], 4, "high", { infantSafeFromMonths: 6 }),
  food("sweet_potato", "Sweet potato (cooked)", "মিষ্টি আলু (সিদ্ধ)", "vegetable", "cooked", [90, 2, 20.7, 0.2, 3.3, 0.7, 38, 36], [], [u("1 medium", "১টি মাঝারি", 130, true)], 6, "high", { infantSafeFromMonths: 6 }),

  // ── Pulses, beans and soy ────────────────────────────────────────────────
  food("moong_dal_dry", "Moong dal (split yellow, dry)", "মুগ ডাল (শুকনো)", "pulse", "dry", [348, 24.5, 60, 1.2, 8.2, 4.4, 75, 15], [], [u("¼ cup dry", "সিকি কাপ শুকনো", 50)], 16, "high", { prepNotes: "Dry weight. Cooks to about 3× its weight." }),
  food("moong_dal_cooked", "Moong dal (cooked, unsalted)", "রান্না মুগ ডাল (লবণ ছাড়া)", "pulse", "cooked", [105, 7, 19, 0.4, 7.6, 1.4, 27, 2], [], [u("Small bowl", "ছোট বাটি", 150, true), u("2 tbsp", "২ টেবিল চামচ", 30, true)], 6, "high", { infantSafeFromMonths: 6 }),
  food("toor_dal_dry", "Toor dal (pigeon pea, dry)", "অড়হর ডাল (শুকনো)", "pulse", "dry", [343, 22, 63, 1.5, 15, 5, 73, 17], [], [u("¼ cup dry", "সিকি কাপ শুকনো", 50)], 20, "high", { prepNotes: "Dry weight." }),
  food("lentils_cooked", "Brown or green lentils (cooked)", "রান্না মসুর (খোসাসহ)", "pulse", "cooked", [116, 9, 20, 0.4, 7.9, 3.3, 19, 2], [], [u("1 cup cooked", "১ কাপ", 200)], 8, "high", { infantSafeFromMonths: 6 }),
  food("yellow_peas_cooked", "Dried yellow peas (motor, cooked)", "সিদ্ধ মটর (ডাবলি)", "pulse", "cooked", [118, 8.3, 21, 0.4, 8.3, 1.3, 14, 2], [], [u("Small bowl", "ছোট বাটি", 150, true)], 7, "moderate", { prepNotes: "Soaked overnight and boiled; the base of chotpoti." }),
  food("kidney_beans_cooked", "Kidney beans (rajma, cooked)", "রাজমা (সিদ্ধ)", "pulse", "cooked", [127, 8.7, 22.8, 0.5, 6.4, 2.9, 35, 2], [], [u("1 cup cooked", "১ কাপ", 175)], 12, "high", { prepNotes: "Raw kidney beans are toxic: soak and boil hard for at least 10 minutes before simmering." }),
  food("black_beans_cooked", "Black beans (cooked)", "কালো শিম বিচি (সিদ্ধ)", "pulse", "cooked", [132, 8.9, 23.7, 0.5, 8.7, 2.1, 27, 1], [], [u("1 cup cooked", "১ কাপ", 170)], 18, "high"),
  food("green_peas", "Green peas (cooked)", "মটরশুঁটি (সিদ্ধ)", "vegetable", "cooked", [84, 5.4, 15.6, 0.2, 5.5, 1.5, 27, 3], [], [u("½ cup", "আধা কাপ", 80)], 15, "high", { infantSafeFromMonths: 6, prepNotes: "Mash or flatten for babies and toddlers." }),
  food("moong_sprouts", "Mung bean sprouts (raw)", "মুগ ডালের অঙ্কুর", "pulse", "raw", [30, 3, 6, 0.2, 1.8, 0.9, 13, 6], [], [u("1 cup", "১ কাপ", 100)], 12, "moderate", { prepNotes: "Steam or blanch before eating: raw sprouts can carry bacteria." }),
  food("tofu", "Tofu (firm)", "টোফু", "pulse", "prepared", [144, 15.8, 2.8, 8.7, 2.3, 2.7, 350, 14], ["soy"], [u("½ block", "আধা ব্লক", 150, true)], 60, "moderate", { prepNotes: "Calcium-set tofu; calcium varies by coagulant." }),
  food("hummus", "Hummus", "হুমুস", "pulse", "prepared", [166, 7.9, 14.3, 9.6, 6, 2.4, 38, 380], ["sesame"], [u("2 tbsp", "২ টেবিল চামচ", 30)], 60, "moderate", { prepNotes: "Chickpeas blended with tahini (sesame), lemon and olive oil." }),

  // ── Meat, fish and eggs (cooked weight unless stated) ────────────────────
  food("beef_mince_cooked", "Minced beef (lean, cooked)", "গরুর কিমা (রান্না)", "meat", "cooked", [250, 26, 0, 15.5, 0, 2.6, 18, 72], [], [u("½ cup", "আধা কাপ", 75)], 85, "moderate", { infantSafeFromMonths: 6, prepNotes: "Cooked weight; about 130 g raw mince gives 100 g cooked. For babies, cook through and mash finely." }),
  food("salmon_cooked", "Salmon (cooked)", "স্যামন মাছ (রান্না)", "fish", "cooked", [206, 22, 0, 12.4, 0, 0.3, 15, 61], ["fish"], [u("1 fillet", "১টি ফিলে", 120, true)], 250, "high", { infantSafeFromMonths: 6, prepNotes: "Low-mercury oily fish. Remove pin bones." }),
  food("fish_white_cooked", "White fish fillet (bhetki / basa, cooked)", "সাদা মাছের ফিলে (রান্না)", "fish", "cooked", [105, 22, 0, 1.5, 0, 0.4, 15, 70], ["fish"], [u("1 fillet", "১টি ফিলে", 120, true)], 70, "moderate", { infantSafeFromMonths: 6, prepNotes: "Boneless fillet, steamed or baked." }),
  food("tuna_canned", "Tuna canned in water (drained)", "টিনজাত টুনা (পানিতে)", "fish", "prepared", [116, 25.5, 0, 0.8, 0, 1.5, 11, 300], ["fish"], [u("1 small can, drained", "১টি ছোট টিন", 120)], 110, "high", { prepNotes: "Light (skipjack) tuna is lower in mercury than albacore." }),
  food("prawns_cooked", "Prawns (cooked, peeled)", "চিংড়ি (রান্না)", "fish", "cooked", [99, 24, 0.2, 0.3, 0, 0.5, 70, 111], ["shellfish"], [u("6 medium", "৬টি মাঝারি", 90, true)], 90, "moderate"),
  food("egg_raw", "Egg (whole, raw weight)", "ডিম", "egg", "raw", [143, 12.6, 0.7, 9.5, 0, 1.8, 56, 142], ["egg"], [u("1 large egg", "১টি বড় ডিম", 50)], 25, "high", { prepNotes: "Weight without shell. Cook until white and yolk are set." }),

  // ── Dairy ────────────────────────────────────────────────────────────────
  food("greek_yogurt", "Greek yogurt (plain, low-fat)", "গ্রিক দই (টক, কম চর্বি)", "dairy", "prepared", [73, 10, 3.9, 1.9, 0, 0.1, 110, 36], ["milk"], [u("½ cup", "আধা কাপ", 120)], 60, "high"),
  food("paneer", "Paneer", "পনির", "dairy", "prepared", [265, 18.3, 1.2, 20.8, 0, 0.2, 480, 18], ["milk"], [u("6 cubes", "৬ টুকরা", 60, true)], 90, "moderate", { prepNotes: "Fresh, pasteurised-milk paneer." }),
  food("mozzarella", "Mozzarella (part-skim)", "মোজারেলা চিজ", "dairy", "prepared", [254, 24.3, 2.8, 15.9, 0, 0.2, 782, 619], ["milk"], [u("¼ cup grated", "সিকি কাপ কুচি", 28)], 120, "high", { prepNotes: "Pasteurised." }),
  food("cheese_feta", "Feta cheese", "ফেটা চিজ", "dairy", "prepared", [264, 14, 4.1, 21, 0, 0.7, 493, 1116], ["milk"], [u("1 small cube", "১টি ছোট টুকরা", 30, true)], 150, "high", { prepNotes: "Brined and high in salt. Choose pasteurised feta in pregnancy." }),
  food("butter", "Butter (unsalted)", "মাখন (লবণ ছাড়া)", "fat", "prepared", [717, 0.9, 0.1, 81, 0, 0, 24, 11], ["milk"], [u("1 tsp", "১ চা চামচ", 5)], 140, "high"),
  food("ghee", "Ghee", "ঘি", "fat", "prepared", [900, 0, 0, 99.5, 0, 0, 4, 2], ["milk"], [u("1 tsp", "১ চা চামচ", 5)], 160, "high"),

  // ── Oils, nuts and seeds ─────────────────────────────────────────────────
  food("olive_oil", "Olive oil", "জলপাই তেল", "fat", "raw", [884, 0, 0, 100, 0, 0.6, 1, 2], [], [u("1 tsp", "১ চা চামচ", 5), u("1 tbsp", "১ টেবিল চামচ", 14)], 120, "high"),
  food("sesame_seeds", "Sesame seeds", "তিল", "fat", "dry", [573, 17.7, 23.4, 49.7, 11.8, 14.6, 975, 11], ["sesame"], [u("1 tsp", "১ চা চামচ", 3)], 50, "high"),
  food("almonds", "Almonds (whole)", "কাঠবাদাম", "fat", "raw", [579, 21, 21.6, 50, 12.5, 3.7, 269, 1], ["tree_nut"], [u("10 almonds", "১০টি", 12)], 160, "high", { chokingRisk: true, prepNotes: "Whole nuts are a choking hazard for children under 5; use smooth nut butter or finely ground." }),
  food("cashews", "Cashews (whole)", "কাজু বাদাম", "fat", "raw", [553, 18.2, 30, 44, 3.3, 6.7, 37, 12], ["tree_nut"], [u("10 cashews", "১০টি", 15)], 180, "high", { chokingRisk: true, prepNotes: "Whole nuts are a choking hazard for children under 5." }),
  food("coconut_milk", "Coconut milk (canned)", "নারকেলের দুধ", "fat", "prepared", [197, 2, 2.8, 21.3, 0, 1.6, 18, 13], [], [u("¼ cup", "সিকি কাপ", 60)], 45, "moderate", { prepNotes: "Full-fat canned; light coconut milk has about half the fat." }),
  food("avocado", "Avocado", "অ্যাভোকাডো", "fruit", "raw", [160, 2, 8.5, 14.7, 6.7, 0.6, 12, 7], [], [u("½ avocado", "আধা অ্যাভোকাডো", 70, true)], 90, "high", { infantSafeFromMonths: 6 }),

  // ── Vegetables (raw unless stated) ───────────────────────────────────────
  food("tomato", "Tomato", "টমেটো", "vegetable", "raw", [18, 0.9, 3.9, 0.2, 1.2, 0.3, 10, 5], [], [u("1 medium", "১টি মাঝারি", 120, true)], 6, "high"),
  food("tomato_puree", "Crushed tomatoes (canned / passata)", "টমেটো পিউরি", "vegetable", "prepared", [32, 1.6, 7, 0.3, 1.9, 1.3, 34, 130], [], [u("1 cup", "১ কাপ", 240)], 25, "moderate", { prepNotes: "Sodium varies; choose 'no added salt' where possible." }),
  food("onion", "Onion", "পেঁয়াজ", "vegetable", "raw", [40, 1.1, 9.3, 0.1, 1.7, 0.2, 23, 4], [], [u("1 medium", "১টি মাঝারি", 110, true)], 6, "high"),
  food("garlic", "Garlic", "রসুন", "vegetable", "raw", [149, 6.4, 33, 0.5, 2.1, 1.7, 181, 17], [], [u("1 clove", "১ কোয়া", 4, true)], 25, "high"),
  food("ginger", "Ginger", "আদা", "vegetable", "raw", [80, 1.8, 18, 0.8, 2, 0.6, 16, 13], [], [u("1-inch piece", "১ ইঞ্চি টুকরা", 10, true)], 25, "high"),
  food("green_chilli", "Green chilli", "কাঁচা মরিচ", "vegetable", "raw", [40, 2, 9.5, 0.2, 1.5, 1, 18, 7], [], [u("1 chilli", "১টি মরিচ", 3, true)], 12, "high"),
  food("spring_onion", "Spring onion", "পেঁয়াজ পাতা", "vegetable", "raw", [32, 1.8, 7.3, 0.2, 2.6, 1.5, 72, 16], [], [u("2 stalks", "২টি ডাঁটা", 20, true)], 15, "high"),
  food("coriander_leaves", "Coriander leaves", "ধনেপাতা", "vegetable", "raw", [23, 2.1, 3.7, 0.5, 2.8, 1.8, 67, 46], [], [u("Small handful", "এক মুঠো", 10, true)], 20, "high"),
  food("herbs_mixed", "Fresh herbs (basil, mint, parsley)", "তাজা পাতা (তুলসী, পুদিনা)", "vegetable", "raw", [36, 3, 6, 0.8, 3.3, 6.2, 138, 56], [], [u("Small handful", "এক মুঠো", 10, true)], 40, "moderate"),
  food("bell_pepper", "Bell pepper (capsicum)", "ক্যাপসিকাম", "vegetable", "raw", [31, 1, 6, 0.3, 2.1, 0.4, 7, 4], [], [u("1 medium", "১টি মাঝারি", 120, true)], 25, "high"),
  food("carrot", "Carrot (raw)", "গাজর (কাঁচা)", "vegetable", "raw", [41, 0.9, 9.6, 0.2, 2.8, 0.3, 33, 69], [], [u("1 medium", "১টি মাঝারি", 70, true)], 8, "high", { chokingRisk: true, prepNotes: "Raw carrot sticks and rounds are a choking hazard for young children; steam until soft." }),
  food("carrot_cooked", "Carrot (steamed / boiled)", "গাজর (সিদ্ধ)", "vegetable", "cooked", [35, 0.8, 8.2, 0.2, 3, 0.3, 30, 58], [], [u("½ cup", "আধা কাপ", 75)], 8, "high", { infantSafeFromMonths: 6 }),
  food("cucumber", "Cucumber", "শসা", "vegetable", "raw", [15, 0.7, 3.6, 0.1, 0.5, 0.3, 16, 2], [], [u("1 medium", "১টি মাঝারি", 200, true)], 6, "high", { chokingRisk: true, prepNotes: "Hard raw rounds can be a choking risk for under-5s; offer peeled and cut into thin sticks." }),
  food("lettuce", "Lettuce", "লেটুস পাতা", "vegetable", "raw", [15, 1.4, 2.9, 0.2, 1.3, 0.9, 36, 28], [], [u("4 leaves", "৪টি পাতা", 40, true)], 30, "high"),
  food("cabbage", "Cabbage", "বাঁধাকপি", "vegetable", "raw", [25, 1.3, 5.8, 0.1, 2.5, 0.5, 40, 18], [], [u("1 cup shredded", "১ কাপ কুচি", 70)], 5, "high"),
  food("broccoli", "Broccoli (steamed)", "ব্রকলি (ভাপানো)", "vegetable", "cooked", [35, 2.4, 7.2, 0.4, 3.3, 0.7, 40, 41], [], [u("1 cup florets", "১ কাপ", 90)], 30, "high", { infantSafeFromMonths: 6 }),
  food("green_beans", "Green beans (cooked)", "ফরাসি শিম (সিদ্ধ)", "vegetable", "cooked", [35, 1.9, 7.9, 0.3, 3.2, 0.7, 44, 1], [], [u("1 cup", "১ কাপ", 125)], 12, "high", { infantSafeFromMonths: 6 }),
  food("mushroom", "Mushroom (button)", "মাশরুম", "vegetable", "raw", [22, 3.1, 3.3, 0.3, 1, 0.5, 3, 5], [], [u("1 cup sliced", "১ কাপ কাটা", 70)], 50, "high"),
  food("zucchini", "Zucchini (courgette)", "জুকিনি", "vegetable", "raw", [17, 1.2, 3.1, 0.3, 1, 0.4, 16, 8], [], [u("1 medium", "১টি মাঝারি", 200, true)], 30, "high"),
  food("spinach_raw", "Spinach (palong shak, raw)", "পালং শাক (কাঁচা)", "vegetable", "raw", [23, 2.9, 3.6, 0.4, 2.2, 2.7, 99, 79], [], [u("1 bunch", "১ আঁটি", 200, true), u("2 cups leaves", "২ কাপ পাতা", 60)], 8, "high", { prepNotes: "Shrinks to about a quarter when cooked." }),
  food("lal_shak_raw", "Red amaranth leaves (lal shak, raw)", "লাল শাক (কাঁচা)", "vegetable", "raw", [23, 2.5, 4, 0.3, 2.1, 2.3, 215, 20], [], [u("1 bunch", "১ আঁটি", 200, true)], 6, "moderate", { infantSafeFromMonths: 6, prepNotes: "Cook until very soft and blend for babies." }),
  food("lau", "Bottle gourd (lau)", "লাউ", "vegetable", "raw", [14, 0.6, 3.4, 0, 0.5, 0.2, 26, 2], [], [u("1 cup cubes", "১ কাপ টুকরা", 120)], 4, "high", { infantSafeFromMonths: 6, prepNotes: "Cook until soft; mash for babies." }),
  food("sweet_corn", "Sweet corn kernels (cooked)", "মিষ্টি ভুট্টা দানা", "vegetable", "cooked", [96, 3.4, 21, 1.5, 2.4, 0.5, 3, 1], [], [u("½ cup", "আধা কাপ", 80)], 25, "high"),

  // ── Fruit ────────────────────────────────────────────────────────────────
  food("apple", "Apple (raw)", "আপেল", "fruit", "raw", [52, 0.3, 13.8, 0.2, 2.4, 0.1, 6, 1], [], [u("1 medium", "১টি মাঝারি", 180, true)], 30, "high", { chokingRisk: true, prepNotes: "Raw hard apple pieces are a choking hazard for young children; grate or cook until soft." }),
  food("apple_cooked", "Apple (stewed, no sugar)", "আপেল সিদ্ধ (চিনি ছাড়া)", "fruit", "cooked", [50, 0.3, 13, 0.1, 2.4, 0.1, 5, 1], [], [u("½ cup", "আধা কাপ", 120)], 30, "high", { infantSafeFromMonths: 6 }),
  food("berries", "Mixed berries (fresh or frozen)", "মিশ্র বেরি", "fruit", "raw", [50, 0.8, 12, 0.4, 3.5, 0.5, 15, 1], [], [u("½ cup", "আধা কাপ", 75)], 120, "moderate", { chokingRisk: true, prepNotes: "Whole round berries are a choking hazard for under-5s: halve or quarter them." }),
  food("lemon_juice", "Lemon or lime juice", "লেবুর রস", "fruit", "raw", [22, 0.4, 6.9, 0.2, 0.3, 0.1, 6, 1], [], [u("1 tbsp", "১ টেবিল চামচ", 15)], 20, "high"),
  food("tamarind", "Tamarind pulp", "তেঁতুলের ক্বাথ", "fruit", "prepared", [239, 2.8, 62.5, 0.6, 5.1, 2.8, 74, 28], [], [u("1 tbsp", "১ টেবিল চামচ", 18)], 20, "moderate", { prepNotes: "Unsweetened pulp; many shop tamarind sauces add sugar." }),

  // ── Seasonings and sauces (small amounts) ────────────────────────────────
  food("salt", "Salt", "লবণ", "mixed_dish", "dry", [0, 0, 0, 0, 0, 0, 24, 38758], [], [u("¼ tsp", "সিকি চা চামচ", 1.5), u("1 tsp", "১ চা চামচ", 6)], 4, "high", { prepNotes: "Listed so sodium is calculated, not guessed. Never added to baby food." }),
  food("spice_mix", "Ground spices (turmeric, cumin, coriander, chilli)", "গুঁড়া মশলা (হলুদ, জিরা, ধনে, মরিচ)", "mixed_dish", "dry", [350, 12, 55, 12, 30, 30, 400, 50], [], [u("1 tsp", "১ চা চামচ", 2.5)], 80, "low", { prepNotes: "A blend; amounts in recipes are small, so the nutrient contribution is negligible." }),
  food("mustard_paste", "Mustard seed paste (shorshe bata)", "সরিষা বাটা", "mixed_dish", "prepared", [508, 26, 28, 36, 12, 9.2, 266, 13], ["mustard"], [u("1 tbsp", "১ টেবিল চামচ", 15)], 40, "moderate", { prepNotes: "Ground mustard seed with water and green chilli." }),
  food("soy_sauce", "Soy sauce", "সয়া সস", "mixed_dish", "prepared", [53, 8.1, 4.9, 0.6, 0.8, 1.5, 33, 5493], ["soy", "wheat"], [u("1 tsp", "১ চা চামচ", 6), u("1 tbsp", "১ টেবিল চামচ", 16)], 40, "high", { prepNotes: "Very high in sodium; contains soy and wheat." }),
  food("fish_sauce", "Fish sauce", "ফিশ সস", "mixed_dish", "prepared", [35, 5, 3.6, 0, 0, 0.8, 43, 7851], ["fish"], [u("1 tsp", "১ চা চামচ", 6)], 50, "moderate", { prepNotes: "Very high in sodium." }),
  food("miso", "Miso paste", "মিসো পেস্ট", "mixed_dish", "prepared", [199, 12.8, 26.5, 6, 5.4, 2.5, 57, 3728], ["soy"], [u("1 tbsp", "১ টেবিল চামচ", 17)], 90, "moderate", { prepNotes: "Fermented soybean paste; high in sodium. Some miso contains barley (gluten)." }),
  food("green_curry_paste", "Thai green curry paste", "থাই গ্রিন কারি পেস্ট", "mixed_dish", "prepared", [120, 2, 15, 5, 5, 2, 100, 2500], [], [u("1 tbsp", "১ টেবিল চামচ", 15)], 80, "low", { prepNotes: "Check the label: many pastes contain shrimp paste (shellfish)." }),
  food("sugar", "Sugar", "চিনি", "sweet", "dry", [387, 0, 100, 0, 0, 0, 1, 1], [], [u("1 tsp", "১ চা চামচ", 4)], 14, "high"),
]
