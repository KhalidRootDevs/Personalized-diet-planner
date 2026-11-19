// Clinical rule library for the admin console (§7.2–§7.3, §28). Illustrative entries only.
// Every rule carries source, population, reviewer, approval status, version and next review date.
// Changes go through review; nothing here updates automatically.

export interface ClinicalRule {
  id: string
  title: string
  summary: string
  category: "safety" | "energy" | "condition" | "infant" | "food_data"
  source: string
  population: string
  reviewer: string
  status: "approved" | "in_review" | "draft" | "retired"
  version: string
  approvedOn?: string
  nextReview: string
}

export const CLINICAL_RULES: ClinicalRule[] = [
  { id: "rule_honey_12m", title: "No honey before 12 months", summary: "Exclude honey and foods containing honey for infants under 12 months.", category: "infant", source: "WHO complementary feeding guidance (illustrative citation)", population: "Infants 0–12 months", reviewer: "Pediatric dietitian (placeholder)", status: "approved", version: "1.2", approvedOn: "2026-03-10", nextReview: "2027-03-10" },
  { id: "rule_choking", title: "Choking-hazard textures", summary: "Whole nuts, whole grapes, popcorn, hard raw pieces and similar are excluded for under-5s unless modified to a safe texture.", category: "infant", source: "National pediatric food-safety guidance (illustrative)", population: "Children 6 months–5 years", reviewer: "Pediatric dietitian (placeholder)", status: "approved", version: "1.1", approvedOn: "2026-02-02", nextReview: "2027-02-02" },
  { id: "rule_allergen_exclusion", title: "Allergen exclusion everywhere", summary: "Recorded allergens are hard constraints across meals, snacks, recipes, substitutions, shopping lists and AI variations.", category: "safety", source: "Internal safety policy §13.6", population: "All profiles", reviewer: "Clinical safety lead (placeholder)", status: "approved", version: "2.0", approvedOn: "2026-01-15", nextReview: "2026-12-15" },
  { id: "rule_adult_energy", title: "Adult energy estimate (ranges)", summary: "Mifflin–St Jeor with activity factor, reported as a range. Adults 18+ only; never for children or pregnancy.", category: "energy", source: "Mifflin et al. 1990 (illustrative citation)", population: "Adults 18+, not pregnant", reviewer: "Registered dietitian (placeholder)", status: "approved", version: "1.0", approvedOn: "2025-11-20", nextReview: "2026-11-20" },
  { id: "rule_no_child_bmi", title: "No adult BMI for children", summary: "Child growth uses age- and sex-specific references interpreted by clinicians, never adult BMI.", category: "infant", source: "WHO Child Growth Standards (illustrative citation)", population: "Children 0–18 years", reviewer: "Pediatrician (placeholder)", status: "approved", version: "1.0", approvedOn: "2026-01-05", nextReview: "2027-01-05" },
  { id: "rule_no_deficit_pregnancy", title: "No calorie deficit in pregnancy, breastfeeding or eating-disorder history", summary: "Weight-loss goals route to balanced, non-restrictive plans for these groups.", category: "safety", source: "Internal clinical policy §13 (illustrative)", population: "Adults with listed circumstances", reviewer: "Clinical safety lead (placeholder)", status: "approved", version: "1.3", approvedOn: "2026-04-01", nextReview: "2027-04-01" },
  { id: "rule_ckd_review", title: "Kidney disease requires professional review", summary: "Chronic kidney disease is Support Level 3: general guidance only until a professional reviews the plan.", category: "condition", source: "KDIGO nutrition guidance (illustrative citation)", population: "Adults with CKD", reviewer: "Renal dietitian (placeholder)", status: "in_review", version: "2.0-draft", nextReview: "2026-12-01" },
  { id: "rule_sodium_htn", title: "Sodium guidance for high blood pressure", summary: "Prefer lower-sodium options and flag high-sodium foods (e.g. shutki, restaurant curries). No medication changes.", category: "condition", source: "WHO sodium guideline (illustrative citation)", population: "Adults with hypertension", reviewer: "Registered dietitian (placeholder)", status: "draft", version: "0.3", nextReview: "2026-12-20" },
  { id: "rule_cooked_raw", title: "Raw vs cooked values", summary: "Food entries carry their state; recipe nutrition uses ingredient quantities and cooking yields.", category: "food_data", source: "Internal data policy §8.1", population: "All", reviewer: "Food data lead (placeholder)", status: "approved", version: "1.0", approvedOn: "2025-12-01", nextReview: "2026-12-01" },
]

export const RULE_STATUS_LABEL: Record<ClinicalRule["status"], string> = { approved: "Approved", in_review: "In review", draft: "Draft", retired: "Retired" }
