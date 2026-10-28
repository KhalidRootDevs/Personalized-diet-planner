"use client"

import { useApp } from "@/lib/store"

// Bangla covers the app shell only in this prototype (§27.1). Full localization is out of scope.
const DICT = {
  home: { en: "Home", bn: "হোম" },
  plan: { en: "Plan", bn: "পরিকল্পনা" },
  foodLog: { en: "Food Log", bn: "খাবার লগ" },
  recipes: { en: "Recipes", bn: "রেসিপি" },
  profile: { en: "Profile", bn: "প্রোফাইল" },
  logMeal: { en: "Log a meal", bn: "খাবার লগ করুন" },
  goodMorning: { en: "Good morning", bn: "শুভ সকাল" },
  goodAfternoon: { en: "Good afternoon", bn: "শুভ অপরাহ্ন" },
  goodEvening: { en: "Good evening", bn: "শুভ সন্ধ্যা" },
  today: { en: "Today", bn: "আজ" },
  todaysPlan: { en: "Today's plan", bn: "আজকের পরিকল্পনা" },
  dailySummary: { en: "Daily summary", bn: "দৈনিক সারাংশ" },
  nextStep: { en: "Next step", bn: "পরবর্তী পদক্ষেপ" },
} as const

export type DictKey = keyof typeof DICT

export function useT() {
  const lang = useApp((s) => s.settings.language)
  return (key: DictKey) => DICT[key][lang]
}
