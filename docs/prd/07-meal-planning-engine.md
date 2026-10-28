# 10. Personalized Meal Plan Generator

This is the central feature of the application.

## 10.1 User Flow

1. The user creates a profile.
2. The system collects relevant nutritional and lifestyle information.
3. The nutrition assessment engine calculates applicable targets.
4. The system identifies medical, dietary, and safety constraints.
5. The user selects a planning duration.
6. The user chooses meal preferences and practical limitations.
7. The planning engine selects appropriate meals.
8. The engine calculates nutritional estimates.
9. The validation system checks the proposed plan.
10. The AI generates explanations and presentation text.
11. The user reviews the plan.
12. The user confirms and adds it to their calendar.

For high-risk profiles, the system may require professional review before activation.

## 10.2 Plan Duration

The user should be able to generate:

- One-day plan.
- Three-day plan.
- Seven-day plan.
- Fourteen-day plan.
- Thirty-day plan.
- Three-month plan.
- Six-month plan.
- Custom-duration plan.

The application must distinguish between generating a long-term framework and prescribing an unchanging daily menu for months.

For example, a six-month plan may include:

- A stable nutrition strategy.
- Weekly meal plans.
- Seasonal ingredient substitutions.
- Periodic progress reviews.
- Changes in energy targets when justified.
- Reminders to update body measurements or health information.
- Reassessment when a material change occurs.

The system should not automatically generate six months of rigid daily instructions when user requirements are likely to change.

## 10.3 Meal Frequency

Users should be able to configure their preferred meal structure where appropriate.

For adults, options might include:

- Three main meals.
- Three meals and one snack.
- Three meals and two snacks.
- Other supported schedules.

For infants and children, meal frequency must be age-appropriate and based on relevant feeding guidance.

The application must not apply an adult's preferred meal frequency to a baby.

## 10.4 Meal Components

For each planned meal, show:

- Meal name.
- Scheduled time.
- Foods and ingredients.
- Serving sizes.
- Estimated calories.
- Protein.
- Carbohydrates.
- Fat.
- Relevant micronutrients.
- Preparation time.
- Recipe instructions.
- Substitution options.
- Estimated cost.
- Relevant safety notes.

Nutrient information should be displayed only to the level supported by reliable data.

## 10.5 Plan Validation

Every plan should pass a validation pipeline before it is shown as ready.

Validation checks include:

1. Allergen exclusions.
2. Age suitability.
3. Food safety.
4. Medical restrictions.
5. Energy and nutrient target compatibility.
6. Meal timing constraints.
7. Dietary preferences.
8. Budget and availability.
9. Recipe completeness.
10. Nutrient calculation validity.
11. Required professional review.
12. Warning signs requiring escalation.

If a plan fails a safety-critical check, it must not be presented as a valid plan.

If a plan cannot meet every preference or nutritional target, the system should explain the limitation rather than silently inventing a solution.

---

# 11. Sample User Experience: Three-Day Diet Plan

Consider an adult who provides the following information:

- Age: 30.
- Occupation: Office worker.
- Work schedule: 10 AM–7 PM.
- Activity: Mostly sedentary work with some walking.
- Goal: Improve general nutrition.
- Preference: Affordable Bangladeshi meals.
- Allergies: None reported.
- Cooking time: Limited on weekdays.

The following is an illustrative interface example, not an individualized prescription.

## Day 1

| Time | Meal | Example meal |
|---|---|---|
| 8:30 AM | Breakfast | Eggs, whole-grain roti, and a serving of fruit |
| 1:00 PM | Lunch | Rice, fish, cooked vegetables, and lentils |
| 4:30 PM | Snack | Plain yogurt and fruit, if suitable |
| 8:30 PM | Dinner | Roti, chicken or lentils, and vegetables |

Each meal opens a detailed recipe card.

## Day 2

| Time | Meal | Example meal |
|---|---|---|
| 8:30 AM | Breakfast | Oats with milk or an appropriate alternative, plus fruit |
| 1:00 PM | Lunch | Rice, chicken, vegetables, and lentils |
| 4:30 PM | Snack | A suitable fruit and a portion of nuts, if safe |
| 8:30 PM | Dinner | Fish, vegetables, and rice or roti |

## Day 3

| Time | Meal | Example meal |
|---|---|---|
| 8:30 AM | Breakfast | Vegetable omelet and roti |
| 1:00 PM | Lunch | Rice, fish, lentils, and vegetables |
| 4:30 PM | Snack | Yogurt or another suitable snack |
| 8:30 PM | Dinner | Chicken or beans, vegetables, and roti |

### Important implementation details

The real application must not assume that these example meals meet the user's nutritional requirements.

It must calculate the actual quantities, estimated nutrients, and costs after completing the assessment.

The user should be able to open any meal and see:

- Exact ingredient quantities.
- Whether quantities refer to raw or cooked ingredients.
- Preparation instructions.
- Total preparation time.
- Estimated nutrition.
- Alternative ingredients.
- Cost estimate.
- A button to mark the meal as completed.

The user should also be able to replace a meal with an alternative that meets the same relevant constraints.

---

# 25. Meal-Plan Generation Algorithm

A reliable meal planner should be a constrained optimization system rather than a model that simply writes a list of foods.

## 25.1 Input

The engine receives:

- Validated profile.
- Nutrition assessment.
- Applicable nutrient targets.
- Allergy restrictions.
- Medical restrictions.
- Age-specific rules.
- Preferred meal schedule.
- Available recipes.
- Food budget.
- Ingredient availability.
- Cooking limitations.
- Planning duration.

## 25.2 Processing

### Step 1: Establish hard constraints

Examples:

- Exclude allergens.
- Enforce age-specific restrictions.
- Exclude medically contraindicated options.
- Enforce required clinical review.
- Respect supported food safety rules.

A hard constraint must not be overridden to improve convenience or taste.

### Step 2: Establish nutritional objectives

For supported users, determine applicable targets for energy and nutrients.

Targets should use ranges when appropriate rather than demanding false precision.

### Step 3: Retrieve eligible recipes

Retrieve recipes that satisfy the hard constraints.

### Step 4: Rank recipes

Rank the remaining options according to:

- Nutritional compatibility.
- User preferences.
- Preparation time.
- Cost.
- Ingredient availability.
- Variety.
- Cultural relevance.

### Step 5: Build daily plans

Select recipes and portions that collectively satisfy the supported objectives.

### Step 6: Check weekly variety

Avoid unnecessary repetition while retaining practical ingredient reuse.

### Step 7: Validate nutritional totals

Calculate nutrition from the actual ingredients and serving quantities.

### Step 8: Validate safety

Run all applicable safety checks again against the assembled plan.

### Step 9: Generate explanations

Use AI to explain why the meals were selected and how they fit the user's preferences.

### Step 10: Return the plan

Return a structured draft with validation status, warnings, and any required review steps.

## 25.3 Optimization Model

The planning engine can be expressed conceptually as:

**Minimize:**

- Nutritional deviation from appropriate targets.
- Preference mismatches.
- Excessive cost.
- Excessive preparation time.
- Unnecessary meal repetition.
- Ingredient waste.

**Subject to:**

- Allergen exclusions.
- Food safety rules.
- Age-specific restrictions.
- Medical restrictions.
- Supported nutrient constraints.
- User schedule.
- Recipe feasibility.
- Required professional approval.

Hard safety constraints must remain separate from soft optimization preferences.

A recipe's popularity or low price must never make an unsafe recipe eligible.

## 25.4 Meal Variety

The system should allow ingredient reuse without forcing users to eat the same meal every day.

For example, a weekly plan could reuse some ingredients across multiple recipes while varying preparation methods and complementary foods.

This can reduce shopping costs and preparation time.

However, the system should not over-optimize for variety at the expense of affordability or nutritional adequacy.

---

# 42.7 Budget-Aware Nutrition Optimizer

*Extends §16.3 (Budget Optimization), §27.3 (Budget Awareness) and §5.7 (Food Budget).*

This feature gets its own identity because affordability is a genuine barrier to healthier eating. Users enter an approximate food budget (daily, weekly or monthly), location and dietary preferences, and the app generates practical meal plans within that budget.

Plan options:

- Lowest-cost suitable meal plan.
- High-protein plan within budget.
- Family meal plan (§42.9).
- Quick meals for busy workdays.
- Weekly plan using seasonal ingredients (depends on §38.5 seasonal data).
- Plan using ingredients already available at home (§42.8.2 Pantry).

Users can also **compare two meals** on estimated cost and nutritional value.

Prices are estimates unless the app has access to current local pricing (§27.3). The cheapest option must never replace a nutritionally important food if that creates an inadequacy (§16.3).

**Business opportunity:** many people (students, families, office workers) want to eat better but cannot afford expensive ingredients or complicated recipes. Taking affordability seriously broadens the audience beyond weight loss.

---

# 42.13 Adaptive Meal Plans

*Extends §17.4 (Plan Adjustment Rules), §17.5 (Feedback Loop) and §10.2 (Plan Duration). User-requested revision (FR-022) already exists. This feature adds journal-driven, week-over-week adaptation.*

The app should not create a six-month plan and leave it unchanged. It adapts the plan based on progress, preferences and changing circumstances.

Example:

1. The user creates a four-week plan.
2. They record their meals during the first week.
3. The app compares actual intake with the plan (§41.5).
4. It identifies practical difficulties, such as expensive meals or recipes that take too long.
5. The user receives suggestions for the next week.

Triggers, in addition to §17.4:

- The user consistently skips a particular meal.
- They cannot find certain ingredients.
- Their goals or dietary preferences change.
- Their progress suggests the plan needs to be reviewed.

**Rules**

- A missed target never automatically means the user needs a stricter diet. If a user eats more than their estimated target one day, the app does not recommend skipping meals the next day; it helps them return to a sustainable routine.
- For people with medical conditions, major changes to dietary targets go through the clinical safeguards (§13, §17.4).
- Adjustments are suggestions that the user reviews before they take effect (§19.3: editing never silently changes a confirmed plan).

---

# 42.14 Weekly Nutrition Autopilot

*Builds on §42.13 Adaptive Meal Plans, §16 Shopping Lists and §14 Calendar.*

Once a week, the user can request an updated plan based on their preferences, budget, schedule, available ingredients and recent food records. The app then:

1. Reviews the previous week's recorded data.
2. Identifies practical difficulties.
3. Asks the user about any important changes.
4. Suggests a new meal plan.
5. Generates a grocery list.
6. Adds meals to the calendar.
7. Schedules optional reminders.

The user reviews and approves the changes before the new plan becomes active. Autopilot reduces planning effort while keeping the user in control. The new plan goes through the full validation pipeline (§10.5).

---

# 42.15 Personal Nutrition Twin

A continuously updated model of the user's dietary habits, learned from recorded information such as:

- Frequently eaten foods.
- Preferred meal times.
- Typical portion sizes.
- Commonly skipped meals.
- Food preferences.
- Budget.
- Recipes they repeatedly choose.
- Their success in following different plans.

It uses these patterns to make better suggestions. For example: *"You tend to choose simpler meals on busy weekdays. Would you like a five-day plan with quick lunches and more varied dinners?"*

**Rules**

- Based on observed patterns, never on assumptions about the user's personality.
- Transparent: users can review and correct remembered preferences.
- A few entries are never treated as conclusive evidence about habits.
- Learned preferences are soft inputs only. They never override health or safety constraints (§17.5).

Personalization becomes more useful as the app collects reliable data.
