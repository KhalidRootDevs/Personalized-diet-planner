# 18. Artificial Intelligence Architecture

AI is important to the product, but it should not be responsible for every calculation or safety decision.

The recommended architecture combines deterministic software rules, validated nutritional data, a meal-planning engine, and an AI language model.

## 18.1 Responsibilities of the Nutrition Engine

The nutrition engine should handle:

- Supported energy calculations.
- Nutrient target calculations.
- Portion calculations.
- Food-composition lookups.
- Ingredient substitutions.
- Allergy exclusions.
- Age-specific restrictions.
- Clinical eligibility rules.
- Recipe validation.
- Meal-plan validation.
- Nutritional totals.

These calculations should be reproducible and testable.

## 18.2 Responsibilities of the AI Model

The AI model can handle:

- Understanding user preferences expressed in natural language.
- Asking clarifying questions.
- Explaining recommendations.
- Selecting among approved recipes.
- Suggesting practical meal variations.
- Translating explanations.
- Generating recipe instructions from validated ingredients.
- Summarizing a user's plan.
- Explaining how to prepare for the upcoming week.
- Helping users navigate the application.

The AI must not invent nutrient values, fabricate clinical guidelines, or bypass mandatory safety restrictions.

## 18.3 Recommended Generation Pipeline

```text
User Profile
     |
     v
Profile Validation
     |
     v
Nutrition Assessment Engine
     |
     v
Safety and Eligibility Rules
     |
     v
Nutrient Target Calculation
     |
     v
Food and Recipe Retrieval
     |
     v
Meal-Planning Engine
     |
     v
AI Explanation and Personalization
     |
     v
Structured Output Validation
     |
     v
Nutrition and Safety Validation
     |
     +---- Failed validation ----> Revise or reject
     |
     v
Professional Review, if required
     |
     v
User Reviews and Confirms Plan
     |
     v
Calendar + Tasks + Notifications
```

## 18.4 Structured AI Output

The model should return structured data rather than a block of unvalidated prose.

For example:

```json
{
  "planTitle": "Personalized Seven-Day Meal Plan",
  "durationDays": 7,
  "profileId": "profile_123",
  "days": [
    {
      "dayNumber": 1,
      "meals": [
        {
          "mealType": "breakfast",
          "scheduledTime": "08:30",
          "recipeId": "recipe_001",
          "servings": 1,
          "reason": "Fits the user's schedule and preferences"
        }
      ]
    }
  ],
  "validation": {
    "nutritionValidated": false,
    "safetyValidated": false,
    "requiresProfessionalReview": false
  }
}
```

This is a structural example only.

A generated plan must not be activated until the actual validation services have evaluated it.

## 18.5 AI Guardrails

The application should enforce these restrictions:

- Never bypass allergy exclusions.
- Never recommend unsafe infant foods or textures.
- Never apply adult nutrition equations to infants or children.
- Never invent clinical references.
- Never change medications or prescribe dosages.
- Never diagnose a medical condition from a food diary.
- Never claim that a plan guarantees a health outcome.
- Never mark an unreviewed plan as professionally approved.
- Never generate a specialized clinical plan when required information is missing.
- Never fabricate nutritional values when the database lacks the required information.

When uncertainty is too high, the model should ask a question, offer a safer alternative, or decline to generate the requested plan.

## 18.6 AI Evaluation

Before releasing a new model or prompt version, evaluate it against a curated test set.

Test cases should include:

- Adults with ordinary dietary preferences.
- Users with multiple allergies.
- Infants at different developmental stages.
- Users with health conditions.
- Missing profile information.
- Contradictory user instructions.
- Requests for unsafe diets.
- Requests involving unsupported conditions.
- Unavailable ingredients.
- Incorrect or ambiguous food quantities.

Track safety violations separately from general response quality.

A high overall satisfaction score must not compensate for a serious food safety failure.
