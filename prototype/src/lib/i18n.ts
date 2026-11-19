"use client"

import { useApp } from "@/lib/store"

// English + Bangla (§27.1). The dictionary covers the app shell, common actions, Home, the log flow
// and safety messages. Screen-specific copy can use `useTx()` for inline en/bn pairs.
// Prototype translations: production strings need review by a native-speaking editor (§28, admin → Translations).
export const DICT = {
  // Tab bar and shell
  home: { en: "Home", bn: "হোম" },
  plan: { en: "Plan", bn: "পরিকল্পনা" },
  foodLog: { en: "Food Log", bn: "খাবার লগ" },
  recipes: { en: "Recipes", bn: "রেসিপি" },
  profile: { en: "Profile", bn: "প্রোফাইল" },
  notifications: { en: "Notifications", bn: "নোটিফিকেশন" },
  calendar: { en: "Calendar", bn: "ক্যালেন্ডার" },
  shoppingList: { en: "Shopping list", bn: "বাজারের তালিকা" },
  progress: { en: "Progress", bn: "অগ্রগতি" },
  family: { en: "Family", bn: "পরিবার" },
  settings: { en: "Settings", bn: "সেটিংস" },
  privacy: { en: "Privacy and data", bn: "গোপনীয়তা ও তথ্য" },
  // Common actions
  continue: { en: "Continue", bn: "চালিয়ে যান" },
  back: { en: "Back", bn: "পিছনে" },
  skipForNow: { en: "Skip for now", bn: "এখন বাদ দিন" },
  save: { en: "Save", bn: "সংরক্ষণ করুন" },
  saveChanges: { en: "Save changes", bn: "পরিবর্তন সংরক্ষণ করুন" },
  cancel: { en: "Cancel", bn: "বাতিল" },
  done: { en: "Done", bn: "সম্পন্ন" },
  close: { en: "Close", bn: "বন্ধ করুন" },
  add: { en: "Add", bn: "যোগ করুন" },
  edit: { en: "Edit", bn: "সম্পাদনা" },
  delete: { en: "Delete", bn: "মুছুন" },
  confirm: { en: "Confirm", bn: "নিশ্চিত করুন" },
  seeAll: { en: "See all", bn: "সব দেখুন" },
  search: { en: "Search", bn: "খুঁজুন" },
  undo: { en: "Undo", bn: "ফিরিয়ে নিন" },
  signIn: { en: "Sign in", bn: "সাইন ইন" },
  signOut: { en: "Sign out", bn: "সাইন আউট" },
  getStarted: { en: "Get started", bn: "শুরু করুন" },
  // Home
  logMeal: { en: "Log a meal", bn: "খাবার লগ করুন" },
  goodMorning: { en: "Good morning", bn: "শুভ সকাল" },
  goodAfternoon: { en: "Good afternoon", bn: "শুভ অপরাহ্ন" },
  goodEvening: { en: "Good evening", bn: "শুভ সন্ধ্যা" },
  today: { en: "Today", bn: "আজ" },
  todaysPlan: { en: "Today's plan", bn: "আজকের পরিকল্পনা" },
  dailySummary: { en: "Daily summary", bn: "দৈনিক সারাংশ" },
  nextStep: { en: "Next step", bn: "পরবর্তী পদক্ষেপ" },
  moreForYou: { en: "More for you", bn: "আপনার জন্য আরও" },
  eatenToday: { en: "Eaten today", bn: "আজ খেয়েছেন" },
  estimate: { en: "estimate", bn: "আনুমানিক" },
  upNext: { en: "Up next", bn: "এরপর" },
  recorded: { en: "recorded", bn: "রেকর্ড করা" },
  protein: { en: "Protein", bn: "প্রোটিন" },
  carbs: { en: "Carbohydrates", bn: "শর্করা" },
  fat: { en: "Fat", bn: "চর্বি" },
  fiber: { en: "Fiber", bn: "আঁশ" },
  water: { en: "Water", bn: "পানি" },
  energy: { en: "Energy", bn: "শক্তি" },
  // Meals and statuses
  breakfast: { en: "Breakfast", bn: "সকালের নাস্তা" },
  lunch: { en: "Lunch", bn: "দুপুরের খাবার" },
  dinner: { en: "Dinner", bn: "রাতের খাবার" },
  snack: { en: "Snack", bn: "হালকা খাবার" },
  planned: { en: "Planned", bn: "পরিকল্পিত" },
  eaten: { en: "Eaten", bn: "খাওয়া হয়েছে" },
  skipped: { en: "Skipped", bn: "বাদ গেছে" },
  replaced: { en: "Replaced", bn: "বদলানো হয়েছে" },
  // Log flow
  takePhoto: { en: "Take a photo", bn: "ছবি তুলুন" },
  uploadPhoto: { en: "Upload a photo", bn: "ছবি আপলোড করুন" },
  describeMeal: { en: "Describe your meal", bn: "খাবারের বর্ণনা দিন" },
  addManually: { en: "Add manually", bn: "নিজে যোগ করুন" },
  reviewFoods: { en: "Check the foods", bn: "খাবারগুলো যাচাই করুন" },
  howMuch: { en: "How much did you eat?", bn: "কতটুকু খেয়েছেন?" },
  portion: { en: "Portion", bn: "পরিমাণ" },
  oilQuestion: { en: "How much oil was used?", bn: "কতটুকু তেল ব্যবহার হয়েছে?" },
  confirmAndSave: { en: "Confirm and save", bn: "নিশ্চিত করে সংরক্ষণ করুন" },
  identification: { en: "Identification", bn: "শনাক্তকরণ" },
  quantity: { en: "Quantity", bn: "পরিমাণ" },
  confidenceHigh: { en: "High confidence", bn: "উচ্চ নিশ্চয়তা" },
  confidenceModerate: { en: "Moderate confidence", bn: "মাঝারি নিশ্চয়তা" },
  confidenceLow: { en: "Low confidence", bn: "কম নিশ্চয়তা" },
  estimateNote: { en: "Photo estimates are approximate. Please check the foods and portions.", bn: "ছবি থেকে হিসাব আনুমানিক। খাবার ও পরিমাণ যাচাই করুন।" },
  incompleteDay: { en: "Totals include only the meals you've logged.", bn: "মোট হিসাবে শুধু লগ করা খাবার আছে।" },
  manualAlwaysWorks: { en: "Manual logging always works, even without photo analysis.", bn: "ছবি বিশ্লেষণ ছাড়াও নিজে লগ করা সবসময় কাজ করে।" },
  // Safety
  allergenWarning: { en: "Contains an allergen on your profile", bn: "আপনার প্রোফাইলের একটি অ্যালার্জেন আছে" },
  infantSafety: { en: "Not safe for babies this age", bn: "এই বয়সের শিশুর জন্য নিরাপদ নয়" },
  noHoney: { en: "No honey before 12 months", bn: "১২ মাসের আগে মধু নয়" },
  chokingRisk: { en: "Choking risk — change the texture or avoid", bn: "গলায় আটকানোর ঝুঁকি — টেক্সচার বদলান বা এড়িয়ে চলুন" },
  emergencyGuidance: { en: "Emergency guidance", bn: "জরুরি নির্দেশনা" },
  getHelpNow: { en: "Please get urgent help now. In Bangladesh call 999.", bn: "এখনই জরুরি সাহায্য নিন। বাংলাদেশে ৯৯৯ নম্বরে কল করুন।" },
  professionalReview: { en: "Professional review needed", bn: "পেশাদার পর্যালোচনা প্রয়োজন" },
  notMedicalAdvice: { en: "Supports healthy eating and doesn't replace medical advice.", bn: "স্বাস্থ্যকর খাবারে সহায়তা করে, চিকিৎসকের পরামর্শের বিকল্প নয়।" },
  noRestriction: { en: "We won't suggest skipping meals or cutting back to make up for a meal.", bn: "কোনো খাবারের জন্য আমরা খাবার বাদ দিতে বা কমাতে বলব না।" },
} as const

export type DictKey = keyof typeof DICT
export type Lang = "en" | "bn"

export function useLang(): Lang {
  return useApp((s) => s.settings.language)
}

export function useT() {
  const lang = useLang()
  return (key: DictKey) => DICT[key][lang]
}

/** Inline translation for screen-specific copy: `tx("Continue", "চালিয়ে যান")`. */
export function useTx() {
  const lang = useLang()
  return (en: string, bn: string) => (lang === "bn" ? bn : en)
}
