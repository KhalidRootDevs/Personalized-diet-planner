# 6. Nutrition Assessment Engine

The nutrition assessment engine converts user information into structured requirements and constraints.

It should operate independently from the language model that explains the resulting recommendations.

## 6.1 Core Inputs

The assessment engine considers:

- Age.
- Relevant physiological characteristics.
- Height and weight.
- Growth stage.
- Activity level.
- Occupation and physical workload.
- Exercise.
- Primary goal.
- Health conditions.
- Pregnancy or breastfeeding status, where applicable.
- Food allergies.
- Dietary preferences.
- Food budget.
- Local food availability.
- Cooking capacity.
- Schedule.

Not every field applies to every user.

## 6.2 Adult Energy Estimation

For supported adults, the system can estimate resting energy expenditure using an appropriate validated equation.

For example, the Mifflin–St Jeor equation is one possible starting point for eligible adults:

For males:

**REE = 10 × weight in kg + 6.25 × height in cm − 5 × age in years + 5**

For females:

**REE = 10 × weight in kg + 6.25 × height in cm − 5 × age in years − 161**

REE is resting energy expenditure.

The application may then estimate total daily energy expenditure using an appropriate activity adjustment, provided the equation is suitable for the user.

These equations are estimates, not direct measurements.

The system should communicate uncertainty and avoid presenting a single calculated number as the user's exact physiological requirement.

It should not apply adult equations to infants or children.

## 6.3 Goal Adjustments

The system should distinguish estimated maintenance energy from any target selected for a goal.

Potential goal categories:

- Maintenance.
- Weight reduction.
- Weight gain.
- Muscle development.
- General nutrition improvement.
- Clinical nutrition support.

For eligible adults, the system may apply a conservative, evidence-based energy adjustment when appropriate.

However, it must not automatically prescribe calorie restriction to:

- Infants.
- Children.
- Pregnant users.
- Users with potential malnutrition.
- Users with certain medical conditions.
- Users for whom restrictive dieting may be unsafe.

When a goal cannot safely be supported, the application should explain why and recommend an appropriate alternative or professional assessment.

## 6.4 Macronutrient Planning

For supported users, the system may calculate or recommend targets for:

- Protein.
- Carbohydrates.
- Fat.
- Fiber.
- Total energy.

Targets should be derived from appropriate reference values and individualized where clinically justified.

The system should avoid prescribing an extreme macronutrient distribution merely because it is popular.

For example, protein requirements for a healthy adult differ from those for a growing child or a person with certain kidney conditions.

## 6.5 Micronutrient Planning

The application should account for relevant micronutrients, including:

- Iron.
- Calcium.
- Vitamin D.
- Vitamin B12.
- Folate.
- Zinc.
- Iodine.
- Potassium.
- Sodium.
- Other nutrients relevant to the user's age and circumstances.

Not every nutrient needs to be displayed prominently to every user.

However, the meal-planning engine should consider important nutrient requirements when sufficient food-composition data are available.

The system must distinguish between:

1. A nutrient target.
2. Estimated intake from planned meals.
3. Measured nutrient status.
4. A clinically diagnosed deficiency.

These are not interchangeable.

The application must not diagnose a deficiency solely because a generated menu appears low in a nutrient.

## 6.6 BMI and Growth Assessment

For eligible adults, the system can calculate BMI:

**BMI = weight in kilograms ÷ height in meters²**

BMI can provide a screening measure but should not be treated as a complete assessment of health.

For children, the system must use appropriate age- and sex-specific growth references rather than applying adult BMI categories.

Infant growth assessment should use appropriate pediatric growth standards and account for measurement accuracy.

The system should not automatically generate weight-loss recommendations for children based solely on BMI.

## 6.7 Hydration Planning

Hydration guidance should consider:

- Age.
- Activity.
- Environment.
- Heat exposure.
- Exercise.
- Medical restrictions.
- Relevant medications.
- Pregnancy or breastfeeding, where applicable.

The application should avoid universal fluid prescriptions for users whose conditions require individualized guidance.

For infants, water and complementary feeding guidance must be age-appropriate, and the application must not recommend replacing breast milk or infant formula with water.

## 6.8 Assessment Output

The assessment engine should return a structured object rather than free-form text.

Example:

```json
{
  "assessmentStatus": "completed",
  "profileType": "adult",
  "estimatedEnergyKcal": {
    "value": null,
    "confidence": "not_calculated"
  },
  "nutritionTargets": {},
  "dietaryConstraints": [],
  "allergenExclusions": [],
  "medicalRestrictions": [],
  "mealTimingPreferences": [],
  "safetyWarnings": [],
  "professionalReviewRequired": false,
  "assessmentVersion": "1.0"
}
```

Values are intentionally omitted because a real assessment requires validated inputs and applicable rules.

---

# 7. Nutrition Knowledge Base

This is a foundational component of the product.

The application must not rely entirely on a language model's general knowledge to determine what foods are safe or nutritionally appropriate.

## 7.1 Purpose

The nutrition knowledge base stores validated information used to:

- Calculate nutrient targets.
- Determine age-appropriate recommendations.
- Enforce food restrictions.
- Validate recipes.
- Identify unsafe ingredients or preparation methods.
- Apply condition-specific rules.
- Explain recommendations.
- Identify when professional assessment is required.

## 7.2 Knowledge Base Categories

### A. Age-specific rules

Examples:

- Infant complementary feeding.
- Texture progression.
- Choking prevention.
- Allergen introduction.
- Toddler meal planning.
- Child growth assessment.
- Adult nutrition.
- Older-adult nutrition.

### B. Nutrient reference values

Store relevant reference values for:

- Energy.
- Protein.
- Carbohydrates.
- Fat.
- Fiber.
- Vitamins.
- Minerals.
- Fluids where applicable.

Each reference should include its population, age range, applicable assumptions, source, and version.

### C. Health-condition rules

Each supported condition should have:

- Eligibility criteria.
- Required user information.
- Dietary restrictions.
- Nutritional considerations.
- Contraindications.
- Warning signs.
- Escalation criteria.
- Professional-review requirements.
- Source references.
- Clinical review and expiry dates.

### D. Food safety rules

Examples include:

- Choking hazards for infants and young children.
- Unsafe food textures.
- Food hygiene.
- Unsafe storage.
- Undercooked animal products.
- Allergy-related exclusions.
- Age-specific food restrictions.

### E. Cultural and regional food guidance

Examples include:

- Bangladeshi staple foods.
- Regional vegetables.
- Common fish varieties.
- Lentils and pulses.
- Local fruits.
- Common home-cooked meals.
- Affordable substitutions.

Cultural relevance should improve the plan without compromising nutritional adequacy or safety.

## 7.3 Knowledge Source Management

Every important clinical rule should include:

- Source organization.
- Source title.
- Source URL or identifier.
- Publication or update date.
- Applicable population.
- Rule version.
- Reviewer identity or role.
- Approval status.
- Next review date.

Clinical content should be reviewed by appropriately qualified professionals.

A change in a guideline should trigger a controlled review and publication process rather than an automatic, unverified update to production behavior.
