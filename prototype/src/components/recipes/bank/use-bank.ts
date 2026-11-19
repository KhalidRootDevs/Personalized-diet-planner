"use client"

// Browse-side glue for the recipe bank. Safety stays in lib/recipe-bank.ts; this only decides which
// life stage a browse applies to when the person hasn't chosen one.
import { useMemo } from "react"
import { useActiveProfile } from "@/lib/store"
import { RECIPES } from "@/lib/data/recipes"
import { ageInMonths } from "@/lib/nutrition"
import { ageGroupForProfile, browseRecipes, type BankFilters } from "@/lib/recipe-bank"
import type { AgeGroupId, HealthFitId, Profile } from "@/lib/types"

export const CHILD_STAGES: AgeGroupId[] = ["infant", "toddler", "child"]
/** Fits that are meaningful on baby/child food (recipeHealthFits drops adult nutrient labels for them). */
export const CHILD_FITS: HealthFitId[] = ["gluten_free", "easy_to_chew"]

export function isChildProfile(p: Profile | undefined): boolean {
  return !!p && p.type !== "adult"
}

/** The profile's own life stage; child profiles always map to a child stage (incl. under 6 months). */
export function ownStage(p: Profile | undefined): AgeGroupId {
  if (!p) return "adult"
  const stage = ageGroupForProfile(p)
  if (p.type === "adult") return stage
  if (CHILD_STAGES.includes(stage)) return stage
  return ageInMonths(p.dateOfBirth) < 12 ? "infant" : "child"
}

/**
 * Filters actually sent to browseRecipes.
 * - Child profiles: always their own stage (the browse cannot switch a baby's profile to other age rules).
 * - Adults: their own stage unless they pick one, so baby purées don't fill an adult's results.
 */
export function effectiveFilters(f: BankFilters, p: Profile | undefined): BankFilters {
  if (isChildProfile(p)) return { ...f, ages: [ownStage(p)], fits: f.fits?.filter((x) => CHILD_FITS.includes(x)) }
  return f.ages?.length ? f : { ...f, ages: [ownStage(p)] }
}

export function useBrowse(f: BankFilters) {
  const profile = useActiveProfile()
  return useMemo(() => browseRecipes(RECIPES, effectiveFilters(f, profile), profile), [f, profile])
}
