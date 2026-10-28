# 8. Food Database

The food database contains the nutritional information required to calculate meal composition.

## 8.1 Required Food Fields

Each food item should support:

| Field | Description |
|---|---|
| Food ID | Unique identifier |
| Name | Canonical food name |
| Local names | Regional and translated names |
| Category | Grain, fruit, vegetable, protein source, etc. |
| Food state | Raw, cooked, dried, canned, and so on |
| Serving unit | Grams, milliliters, pieces, cups, or other supported units |
| Serving weight | Weight associated with the serving |
| Energy | Kilocalories |
| Protein | Grams |
| Carbohydrates | Grams |
| Total fat | Grams |
| Fiber | Grams |
| Sugars | Grams where available |
| Sodium | Milligrams where available |
| Micronutrients | Structured nutrient values |
| Allergens | Relevant allergen metadata |
| Preparation notes | Relevant food handling information |
| Cost estimate | Optional local price estimate |
| Data source | Origin of nutrient data |
| Confidence | Data quality indicator |
| Review status | Approved, pending, or deprecated |

## 8.2 Food Database Sources

Potential sources include:

- National food-composition databases.
- USDA FoodData Central.
- FAO resources.
- Other reputable, licensed food-composition datasets.
- Professionally verified local food data.

Data licensing must be checked before incorporating any dataset into a commercial product.

For Bangladesh, local dishes and ingredients should be added gradually, with standardized ingredient quantities and preparation methods.

## 8.3 Cooked Versus Raw Foods

The system must distinguish between raw and cooked food values.

For example, 100 grams of dry rice and 100 grams of cooked rice do not contain the same energy per 100 grams because cooking changes the food's water content.

Recipes should calculate nutrition from the actual ingredient quantities and account for relevant cooking yields where data are available.

The system should not combine raw ingredient weights with cooked-food nutrient values indiscriminately.

## 8.4 Food Substitutions

Every food may have zero or more substitutions.

A substitution should be evaluated against:

- Nutritional similarity.
- Allergy restrictions.
- Dietary preferences.
- Food safety.
- Price.
- Availability.
- Cultural suitability.
- Recipe compatibility.

For example, replacing fish with lentils may change protein, fat, and micronutrient content.

The application must recalculate the meal rather than assuming that every substitution is nutritionally equivalent.

---

# 9. Recipe Management System

Every planned meal should have a recipe or a clearly defined serving instruction.

## 9.1 Recipe Requirements

Each recipe should contain:

- Recipe ID.
- Recipe name.
- Short description.
- Suitable age groups.
- Relevant dietary categories.
- Ingredients.
- Ingredient quantities.
- Preparation time.
- Cooking time.
- Number of servings.
- Cooking equipment.
- Step-by-step instructions.
- Estimated nutrition.
- Portion size.
- Allergen information.
- Storage instructions where appropriate.
- Reheating instructions where appropriate.
- Food safety notes.
- Recipe image, if available.
- Source or author.
- Review status.

## 9.2 Example Recipe Structure

```json
{
  "recipeId": "recipe_001",
  "name": "Rice and Lentil Meal",
  "supportedProfiles": [
    "adult"
  ],
  "servings": 2,
  "ingredients": [
    {
      "foodId": "rice",
      "quantity": 120,
      "unit": "g",
      "state": "dry"
    },
    {
      "foodId": "lentils",
      "quantity": 100,
      "unit": "g",
      "state": "dry"
    }
  ],
  "preparationTimeMinutes": 10,
  "cookingTimeMinutes": 25,
  "instructions": [],
  "nutritionPerServing": {},
  "allergens": [],
  "safetyNotes": [],
  "reviewStatus": "pending"
}
```

This is a data-model example, not a complete recipe or a recommendation for a specific individual.

## 9.3 Recipe Generation

The system should support two approaches.

**Approach A: Verified recipe selection**

The system selects an appropriate recipe from a reviewed recipe database.

Advantages:
- More predictable nutritional calculations.
- Better consistency.
- Lower safety risk.
- Easier quality control.

**Approach B: AI-assisted recipe creation**

The AI proposes a new recipe using approved ingredients and constraints.

The application then validates:

- Ingredient safety.
- Allergy exclusions.
- Age suitability.
- Ingredient quantities.
- Nutritional calculations.
- Preparation instructions.
- Food hygiene requirements.

A newly generated recipe should not be treated as clinically verified merely because an AI model produced it.

For the initial release, verified recipes should be the default. AI-generated variations can be introduced after the validation system is established.

---

# 15. Recipe Details and Cooking Experience

Users should not have to search elsewhere to understand how to prepare a planned meal.

## 15.1 Recipe Screen

Each meal opens a dedicated recipe screen.

### Recipe header

- Meal name.
- Image, if available.
- Preparation time.
- Cooking time.
- Number of servings.
- Difficulty.
- Estimated cost.

### Ingredients

Display ingredient quantities in practical units.

For example:

- Rice: measured quantity, with raw or cooked state specified.
- Fish: measured edible portion.
- Lentils: measured dry quantity.
- Vegetables: measured quantity.
- Oil and seasonings: measured quantities where relevant.

### Instructions

Use numbered, clear steps.

Instructions should explain:

- Preparation.
- Cooking method.
- Cooking time where applicable.
- How to determine when food is ready.
- Serving method.
- Relevant food safety precautions.

### Nutrition summary

Display:

- Calories.
- Protein.
- Carbohydrates.
- Fat.
- Fiber.
- Selected micronutrients.

The application should state that nutrition values are estimates when ingredient composition or preparation introduces uncertainty.

## 15.2 Serving Adjustments

The user should be able to change the number of servings.

For example:

- One serving.
- Two servings.
- Four servings.

The system should scale ingredient quantities appropriately and recalculate nutrition.

However, ingredient quantities do not always scale perfectly in cooking. Certain ingredients, cooking times, and preparation techniques may need additional adjustments.

For infant recipes, scaling must never override age-specific serving and safety rules.

## 15.3 Meal Substitution

The user should be able to select:

**Replace this meal.**

The system should offer alternatives based on:

- Similar nutritional contribution.
- Allergies.
- Medical restrictions.
- Preferences.
- Available ingredients.
- Preparation time.
- Budget.

After substitution, the application should recalculate the affected meal and relevant daily totals.

The system should warn the user if the replacement materially changes the plan.

---

# 42.5 Personal Recipe Library

*Extends §9 (Recipe Management) and §15 (Recipe Details).*

Users can save recipes they enjoy and build their own collection. Each saved or user-created recipe can include:

- Ingredients and quantities.
- Preparation instructions.
- Preparation and cooking time.
- Servings.
- Estimated nutrition per serving.
- Dietary tags.
- Substitution options.
- Cost estimate.
- Personal notes.

Users can add saved recipes directly to their meal plan. They can also create a recipe from ingredients they already have: the app suggests a few possible dishes, then calculates estimated nutrition from the confirmed ingredients and quantities. When the user edits a recipe, the nutritional estimates update automatically.

User-created recipes are personal content. They are not treated as reviewed recipes (§9.3) and must still pass allergen, age and safety validation before they are used in a plan.

---

# 42.11 Smart Meal Swapping

*Extends §15.3 (Meal Substitution), §8.4 (Food Substitutions) and FR-016.*

A meal plan is only useful if people can follow it. If the plan recommends grilled chicken, brown rice and broccoli and the user doesn't have chicken, dislikes broccoli or can't afford the meal, they tap **"Replace this meal."** The app then suggests alternatives that match the original meal's nutritional purpose as closely as possible.

| Original meal | Possible alternative |
|---|---|
| Grilled chicken and rice | Fish with rice and vegetables |
| Oats with milk and fruit | An appropriate alternative using locally available foods |
| Chicken salad | Egg, chickpea or fish-based meal |
| Expensive protein snack | A more affordable option with comparable nutritional value |

Actual substitutions depend on the user's age, nutritional needs, allergies, medical restrictions and preferences.

**Replacement modes**

- **Similar nutrition** (default): find an alternative with a similar nutritional profile.
- **Cheaper option:** prioritize affordability.
- **Quick option:** prioritize meals that take less time to prepare.
- **Use ingredients I already have:** prioritize pantry items (§42.8.2).

Every mode only re-ranks options that already pass the hard constraints. A swap always triggers recalculation and a warning if the plan changes materially (§15.3).

---

# 27. Localization and Bangladesh-Specific Features

The initial release should be designed with Bangladesh as a primary market.

## 27.1 Languages

Recommended initial languages:

- English.
- Bangla.

All food names, recipe instructions, safety messages, and user-facing explanations should support localization.

Clinical rules should remain tied to their underlying validated source regardless of translation.

## 27.2 Local Food Catalog

Prioritize common foods and dishes, such as:

- Rice.
- Roti.
- Lentils.
- Eggs.
- Fish.
- Chicken.
- Milk and yogurt.
- Seasonal fruits.
- Leafy vegetables.
- Other common vegetables.
- Beans and pulses.
- Common household recipes.

The food catalog should represent actual preparation methods.

For example, a fried fish preparation and a grilled fish preparation may have different nutritional values.

## 27.3 Budget Awareness

The system should consider locally relevant costs.

Potential features include:

- Estimated cost per serving.
- Weekly grocery budget.
- Affordable alternatives.
- Seasonal ingredient recommendations.
- Grocery list totals.

Price estimates should include the date and geographic assumptions where reliable data are available.

## 27.4 Cultural Preferences

The application should support culturally familiar meal patterns without treating them as mandatory.

Users should be able to select foods and meal structures that match their preferences.

It should not assume that all Bangladeshi users eat the same foods or follow identical meal schedules.

---

# 42.6 Bangladeshi Food Intelligence

*Extends §27 (Localization and Bangladesh-Specific Features), §8 (Food Database) and §5.7 (Food Budget). This is a signature feature for the initial market.*

Many nutrition apps are designed around Western foods. This app should understand the meals Bangladeshi users actually eat.

## 42.6.1 Detailed local food database

Coverage examples (in addition to §27.2):

- Rice, roti, paratha and khichuri.
- Dal, chickpeas and beans.
- Rui, katla, hilsa and other commonly eaten fish.
- Chicken, beef, eggs and local vegetables.
- Bhorta, bhaji, curries and mixed dishes.
- Pitha, traditional sweets and desserts.
- Tea with milk and sugar.
- Common street foods, restaurant meals and snacks.

For each food, record nutritional values where reliable data are available, along with serving sizes, preparation methods and relevant variations. For mixed dishes, distinguish a **home-prepared** version from a **restaurant** version where possible, since ingredients and calorie content may differ substantially.

## 42.6.2 Local portion units

Users can choose serving sizes such as:

- One small, medium or large bowl.
- One cup of cooked rice.
- One piece of fish.
- One roti.
- One tablespoon of oil.
- One plate of a mixed dish.

These map to **documented gram weights** wherever possible, with a clear indication when an amount is only an estimate. They also feed photo-portion selection (§41.3.2).

## 42.6.3 Strategy

Start with Bangladesh, build excellent local food coverage, and expand to other cuisines later (§38.10). A focused, accurate food database is more valuable than a huge database filled with unreliable entries.
