# 5. User Onboarding and Profile Creation

The onboarding process is one of the most important components of the application.

The system cannot create a meaningful personalized plan without understanding the user's needs and constraints.

However, the onboarding process should not overwhelm users with dozens of questions on the first screen.

Use a progressive questionnaire: collect essential information first and request additional information only when relevant.

## 5.1 Step 1: Identify Who the Plan Is For

Ask:

**Who is this nutrition plan for?**

Options:

- Myself.
- My baby.
- My child.
- My spouse or partner.
- Another family member.

If the user selects a baby or child, enable the appropriate age-specific workflow.

The application should not use an adult nutrition questionnaire for an infant.

## 5.2 Step 2: Basic Information

Collect the following fields when applicable.

| Field | Description | Required |
|---|---|---|
| Date of birth | Calculate age accurately | Yes |
| Sex-related physiological information | Used when relevant to validated estimation methods | As needed |
| Height | Centimeters | For relevant age groups |
| Current weight | Kilograms | For relevant age groups |
| Preferred language | Interface language | Yes |
| Country | Determine relevant food and guidance context | Yes |
| Region | Improve local food recommendations | Optional |
| Preferred measurement system | Metric or imperial | Optional |
| Time zone | Schedule meals correctly | Yes |
| Preferred currency | Display estimated food costs | Optional |

For infants, date of birth and relevant developmental information are more important than collecting adult-style lifestyle fields.

For children, growth measurements should be interpreted using appropriate age- and sex-specific growth references where applicable.

The system should distinguish self-reported measurements from clinically measured values.

## 5.3 Step 3: Primary Goal

Ask the user to select their main objective.

Possible options:

- Maintain current weight.
- Lose weight.
- Gain weight.
- Build muscle.
- Improve general nutrition.
- Improve meal consistency.
- Support sports performance.
- Plan nutrition during pregnancy.
- Support breastfeeding nutrition.
- Plan infant complementary feeding.
- Improve dietary variety.
- Follow nutrition guidance for a health condition.
- Plan meals for the family.

Some goals should trigger additional screening.

For example, an adult selecting weight loss may need questions about the intended rate of weight change, relevant health conditions, and potential contraindications.

A parent selecting infant feeding should be routed into a completely different workflow.

## 5.4 Step 4: Lifestyle and Occupation

This section captures the user's daily energy expenditure and practical limitations.

### Occupation categories

- Desk-based office work.
- Remote work from home.
- Teaching.
- Retail or hospitality.
- Healthcare work.
- Construction.
- Agriculture.
- Manufacturing.
- Delivery or transportation.
- Sports or fitness.
- Other.

Occupation alone is insufficient to determine energy needs.

The application should also ask:

- How many hours do you work daily?
- How much of your workday do you spend sitting?
- How much time do you spend standing or walking?
- Does your work involve lifting or strenuous activity?
- Do you work outdoors?
- Do you work in hot environments?
- Do you work night shifts?
- How many days per week do you work?

### Daily activity

Possible options:

- Mostly sedentary.
- Lightly active.
- Moderately active.
- Very active.
- Extremely active.

These options should be supported by explanatory examples.

The application should separately capture exercise frequency and duration rather than relying entirely on the activity label.

### Daily schedule

Collect:

- Wake-up time.
- Sleep time.
- Work start and end times.
- Commute duration.
- Typical breakfast time.
- Lunch availability.
- Dinner time.
- Exercise time.
- Meal preparation availability.

These fields determine when meals can realistically be scheduled.

## 5.5 Step 5: Dietary Preferences

Ask about the user's eating preferences.

Options include:

- No specific restriction.
- Vegetarian.
- Vegan.
- Pescatarian.
- Egg-free.
- Dairy-free.
- Gluten-free.
- Halal.
- Other user-defined preferences.

The system must distinguish preferences from medical restrictions.

For example, choosing dairy-free as a preference is different from having a diagnosed milk allergy.

Food allergies must be recorded separately and treated as safety constraints.

The system should also ask:

- Which foods do you enjoy?
- Which foods do you dislike?
- Which foods are unavailable to you?
- Are there religious or cultural food restrictions?
- Do you prefer home-cooked meals?
- Do you regularly eat outside?
- Do you prefer simple meals or more elaborate cooking?

## 5.6 Step 6: Health Information

This section should be handled with appropriate privacy and safety protections.

Collect only information needed for the requested nutrition service.

Potential questions include:

- Do you have any diagnosed health conditions?
- Do you have food allergies?
- Do you have any diagnosed nutritional deficiencies?
- Are you taking medications that affect food, nutrient, or fluid requirements?
- Have you been advised by a clinician to follow a particular diet?
- Are you pregnant or breastfeeding, where relevant?
- Have you experienced recent unexplained weight changes?
- Do you have difficulty swallowing or eating?
- Do you have a history of an eating disorder or another condition that makes restrictive dieting potentially unsafe?

Additional questions should be condition-specific.

For example, users with kidney disease may require more detailed screening before the system can safely produce a specialized plan.

The application must not infer a diagnosis from a symptom and must not suggest stopping or changing medication.

## 5.7 Step 7: Food Budget

The application should ask:

**How much would you prefer to spend on food?**

Options could include:

- Very budget-conscious.
- Budget-friendly.
- Moderate budget.
- Flexible budget.

A more advanced interface can allow the user to specify:

- Daily budget.
- Weekly budget.
- Monthly budget.
- Household food budget.
- Budget for groceries only.
- Budget including meals purchased outside.

In Bangladesh, the application should prioritize locally available ingredients where appropriate, such as rice, lentils, eggs, fish, vegetables, fruits, milk, and other affordable foods.

However, it must not assume that every household can access or afford the same ingredients.

Food prices should be treated as estimates and updated when reliable local price data is available.

## 5.8 Step 8: Cooking Capabilities

Ask:

- Do you cook yourself?
- Does someone else prepare your meals?
- How much time can you spend preparing each meal?
- Do you have access to a refrigerator?
- Do you have access to a microwave?
- Do you have a stove?
- Can you batch-cook meals?
- Can you carry food to work?
- Do you need recipes that require very little equipment?

Possible preparation preferences:

- Under 10 minutes.
- 10–20 minutes.
- 20–40 minutes.
- More than 40 minutes.

For infants and medically vulnerable users, food safety requirements take precedence over preparation convenience.

## 5.9 Step 9: Generate Nutrition Profile

After completing onboarding, the system creates a structured nutrition profile.

Example:

```json
{
  "profileType": "adult",
  "age": 30,
  "heightCm": 172,
  "weightKg": 78,
  "primaryGoal": "weight_management",
  "occupation": "office_worker",
  "activityLevel": "sedentary_work_with_regular_walking",
  "dietaryPreferences": ["halal"],
  "allergies": [],
  "foodBudget": {
    "period": "week",
    "amount": 2500,
    "currency": "BDT"
  },
  "cookingPreferences": {
    "maximumPreparationMinutes": 30,
    "batchCooking": true
  },
  "workSchedule": {
    "startTime": "10:00",
    "endTime": "19:00"
  },
  "planningPreferences": {
    "durationDays": 7,
    "mealsPerDay": 3,
    "includeSnacks": true
  }
}
```

This is an illustrative data structure, not a recommended diet for the example person.

The production system should also store units, provenance, consent, validation status, and timestamps where relevant.

Health information should be stored separately from general profile information where appropriate.

## 5.10 Profile Ownership and Consent

- Each account has one **primary profile** (the account owner).
- From Release Phase 1, the account owner can create **dependent child profiles** that they manage as parent or caregiver. The baby-feeding module (§12) requires this. Choosing "My baby" or "My child" in §5.1 creates a dependent profile, and the dashboard offers a profile switcher (§19.2).
- Profiles for other adults ("My spouse or partner", "Another family member" in §5.1) need household membership with explicit permissions, so they belong to Family Nutrition (Release Phase 2, §42.9, §29.1). Until then those options are not offered.
- Before collecting health information (§5.6), food photographs (§41) or a child's data, explain why it is needed and record consent (§21.4). Consent type, version and timestamp are stored (`consents`, §23.13) and can be withdrawn.
- Users can view, edit and delete their profiles and associated data according to the retention policy (§21.4, §29.3).
