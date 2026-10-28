# 41. AI Food Journal & Photo-Based Nutrition Tracking

**Module:** AI Food Journal  
**Feature Category:** Computer Vision, Nutrition Analysis, Personalized Dietary Coaching  
**Priority:** Core Feature  
**Target Platforms:** Web, Android, iOS

## 41.1 Feature Overview

The AI Food Journal allows users to photograph their meals, upload food images, or manually record what they have eaten throughout the day.

The application analyzes the submitted information to identify foods, estimate portion sizes, calculate nutritional values, and maintain a daily nutrition log.

It then compares the user's actual food intake against their personalized nutrition targets and provides practical recommendations.

The system should answer five important questions:

1. What did I eat today?
2. Approximately how many calories and nutrients did I consume?
3. Am I eating more or less than my personalized target?
4. Which nutrients might be missing or excessive?
5. What should I adjust in my next meal or tomorrow's diet?

The feature should work independently as a food diary while also integrating with the application's personalized meal planner.

## 41.2 Core User Experience

### Step 1: Capture a Meal

On the home screen, the user sees a prominent button:

**📸 Log a Meal**

When tapped, the user can:

- Take a photograph using their phone camera.
- Upload an existing photograph.
- Upload multiple photographs of the same meal.
- Select a meal category.
- Enter a meal description.
- Add a meal manually without a photograph.

Meal categories include:

- Breakfast.
- Lunch.
- Dinner.
- Morning snack.
- Afternoon snack.
- Evening snack.
- Drinks.
- Other.

The application should automatically suggest the meal category based on the time of day, but users must be able to change it.

### Step 2: AI Analyzes the Image

The image analysis system identifies likely foods and estimates the visible portion sizes.

For example, a user uploads a photograph containing:

- Cooked rice.
- Fried fish.
- Cooked vegetables.
- Lentils.

The AI returns a list of possible food items, estimated quantities, and confidence information.

The system should not immediately treat these estimates as exact measurements.

### Step 3: Confirm the Food Items

Display a confirmation screen:

**We identified these foods in your meal.**

| Food | Estimated quantity | User action |
|---|---|---|
| Cooked rice | Approximately 200 g | Edit |
| Fish | Approximately 100 g edible portion | Edit |
| Cooked vegetables | Approximately 100 g | Edit |
| Cooked lentils | Approximately 100 g | Edit |

These values are illustrative estimates, not verified measurements of an actual meal.

The user can:

- Confirm an item.
- Correct its name.
- Adjust the portion size.
- Add a missing ingredient.
- Remove an incorrectly identified food.
- Specify how the food was cooked.
- Indicate whether oil, butter, sauce, or dressing was added.

The system should keep this process simple. Users should not have to answer a long questionnaire for every meal.

### Step 4: Calculate Nutrition

After confirmation, the application retrieves the relevant food-composition data and calculates the estimated nutritional values.

The meal summary displays:

- Total calories.
- Protein.
- Carbohydrates.
- Fat.
- Fiber.
- Selected micronutrients, where sufficient data are available.

The system should calculate nutrition from the confirmed ingredients and portions rather than asking the AI model to invent the nutritional values.

### Step 5: Add the Meal to the Daily Journal

The meal appears in the user's daily food timeline.

For example:

**Today's Food Journal**

- 8:30 AM — Breakfast.
- 1:00 PM — Lunch.
- 4:30 PM — Afternoon snack.
- 8:30 PM — Dinner.

Each entry displays the photograph, identified foods, estimated nutritional values, and confirmation status.

The user can open an entry to edit it later.

### Step 6: Update the Daily Nutrition Dashboard

After each confirmed meal, the application recalculates the day's cumulative intake.

For example:

| Metric | Daily target | Estimated consumed | Difference |
|---|---:|---:|---:|
| Energy | 2,000 kcal | 1,250 kcal | 750 kcal below target |
| Protein | 90 g | 55 g | 35 g below target |
| Fiber | 25 g | 15 g | 10 g below target |

These numbers are illustrative only. Actual targets must come from the user's validated nutrition assessment.

The application should distinguish between a target, an estimated intake, and a clinically recommended limit.

It should also account for meals that have not yet been logged. A low intake at lunchtime does not automatically mean the user has eaten too little for the entire day.

---

## 41.3 AI Image Analysis Engine

The image analysis engine converts photographs into structured food records.

### 41.3.1 Food Identification

The system should identify likely:

- Food items.
- Ingredients that are visually distinguishable.
- Cooking methods when they can reasonably be inferred.
- Number of visible pieces.
- Mixed dishes.
- Drinks.
- Accompaniments and side dishes.

It should recognize common regional foods where possible, including Bangladeshi dishes.

Examples include:

- Rice.
- Roti.
- Paratha.
- Dal.
- Fish curry.
- Fried fish.
- Chicken curry.
- Khichuri.
- Vegetables.
- Eggs.
- Fruits.
- Milk tea.
- Sweets and desserts.

The system should support both individual ingredients and mixed dishes.

For example, identifying a bowl of curry is not enough if the application cannot determine whether it contains fish, chicken, potatoes, vegetables, or another primary ingredient.

When the ingredients cannot be determined confidently, the application should ask the user to clarify.

### 41.3.2 Portion Estimation

Portion estimation is one of the most technically challenging parts of this feature.

A photograph is a two-dimensional representation of a three-dimensional meal. Without additional information, the application cannot reliably determine the exact weight or volume of every food item.

The system should estimate portions using available evidence, including:

- Visible dimensions.
- Plate or bowl geometry.
- Recognized food shapes.
- Number of pieces.
- Reference objects when available.
- User-selected portion sizes.
- Multiple views of the same meal.
- Optional reference measurements.

For better accuracy, the interface may ask the user to:

- Select a small, medium, or large portion.
- Indicate how many pieces they ate.
- Specify the plate or bowl size.
- Enter a known weight.
- Upload a second photograph from another angle.

The application should not require all these details for every meal.

Instead, it should request additional information when the uncertainty could materially change the nutritional estimate.

### 41.3.3 Mixed Dishes and Hidden Ingredients

Some dishes contain ingredients that cannot be reliably identified from appearance alone.

Examples include:

- Cooking oil.
- Butter or ghee.
- Sugar.
- Cream.
- Sauces.
- Coconut milk.
- Hidden ingredients in curries.
- Fillings inside baked foods.

The application should allow users to describe the dish or select a recipe from the database.

For a known recipe, nutrition can be calculated from its ingredient quantities and serving size.

For an unknown homemade dish, the application should produce an estimate with an appropriate uncertainty indicator.

It must not imply that the exact oil or sugar content can be recovered from an ordinary photograph.

### 41.3.4 Confidence and Uncertainty

Each food identification should include a confidence estimate or uncertainty category.

Possible labels:

- High confidence.
- Moderate confidence.
- Low confidence.

These labels should be calibrated against actual system performance rather than assigned arbitrarily by the language model.

The application should distinguish two kinds of uncertainty:

**Identification uncertainty:** The system may be unsure whether the food is fried fish or grilled fish.

**Quantity uncertainty:** The system may recognize the food correctly but be unsure whether the portion weighs 80 g or 150 g.

When confidence is low, the system should ask a clarifying question or present a range rather than returning an unjustifiably precise result.

### 41.3.5 Nutritional Calculation

Once the food items and quantities are confirmed, the system retrieves their nutrient values from the food database.

Conceptually:

**Estimated meal nutrition = sum of the nutritional contributions of the confirmed ingredients.**

For a nutrient such as protein:

Protein from each ingredient is calculated using the corresponding food-composition data and quantity.

The system then adds the contributions across all ingredients.

Equivalent calculations apply to energy, carbohydrates, fat, fiber, and other available nutrients.

The calculation engine must correctly distinguish raw and cooked food values.

It must also account for relevant cooking yields, edible portions, and recipe ingredients when the data are available.

---

## 41.4 Daily Nutrition Dashboard

The daily dashboard is the main destination after the user logs meals.

It should present a clear overview of actual intake and remaining planned meals.

### 41.4.1 Daily Summary

Display:

- Estimated calories consumed.
- Personalized energy target.
- Difference between consumed and target energy.
- Protein consumed and target.
- Carbohydrates consumed.
- Fat consumed.
- Fiber consumed.
- Selected micronutrients.
- Number of meals logged.
- Meals remaining in the planned schedule.

For users who prefer a simple interface, the dashboard should prioritize the most relevant information and place advanced nutrient details behind an expandable section.

### 41.4.2 Visual Progress

Use simple progress indicators.

For example:

**Daily energy intake**

1,250 kcal consumed  
2,000 kcal reference target

The application can show the current amount relative to the target.

However, it should not imply that reaching 100% of every displayed target is always necessary or appropriate.

Some nutritional recommendations are ranges, some are minimums, and others are upper limits.

The visualization must reflect the meaning of each metric.

### 41.4.3 Remaining Planned Meals

The application should show how the remaining meals relate to the current plan.

Example:

"You have logged breakfast and lunch. Your planned dinner is still pending."

If the user has consumed less than expected, the system can identify that the daily total is currently below the intended trajectory.

It should not automatically encourage the user to compensate by consuming a very large meal.

Instead, it should suggest an appropriate next step based on the user's circumstances and the available nutritional information.

---

## 41.5 Planned Diet vs. Actual Intake

This integration is one of the most valuable parts of the entire application.

The system already knows the user's intended meal plan. The food journal records what the user actually ate.

Comparing the two provides useful, personalized feedback.

### 41.5.1 Comparison Features

The application should compare:

- Planned meals against logged meals.
- Planned portions against estimated consumed portions.
- Planned energy against estimated actual energy.
- Planned protein against actual protein.
- Other relevant nutrients.
- Meal timing.
- Skipped meals.
- Unplanned snacks.
- Food substitutions.

### 41.5.2 Example

Suppose the user has a planned lunch consisting of rice, fish, vegetables, and lentils.

Instead, the user photographs a lunch containing a larger rice portion, fried fish, and a sugary drink.

The system should:

1. Identify the actual foods.
2. Ask the user to confirm uncertain items.
3. Calculate the estimated nutrition.
4. Compare it with the planned lunch.
5. Update the daily nutrition totals.
6. Explain the main differences.
7. Suggest a reasonable adjustment for subsequent meals if needed.

The application should avoid labeling individual foods as morally good or bad.

Its purpose is to help users understand their overall dietary pattern.

### 41.5.3 Plan Adherence

The application should distinguish between:

- Following the planned meal.
- Eating a modified version.
- Replacing the meal.
- Skipping the meal.
- Eating an unplanned meal.
- Logging an uncertain food record.

This produces more meaningful adherence information than simply counting whether a user pressed a completion button.

---

## 41.6 Personalized Dietary Recommendations

The application should convert nutrition analysis into clear, practical suggestions.

Instead of displaying only numbers, it should explain what the user can do next.

### 41.6.1 If Energy Intake Is Higher Than Expected

The application should consider:

- Whether all meals have been logged.
- Whether portion estimates are uncertain.
- Whether the difference is meaningful.
- Whether the user's target is appropriate.
- Whether the pattern is repeated or isolated.
- Whether the user has a medically relevant reason for a different intake.

It can then offer proportionate suggestions.

For example:

"Your estimated intake is higher than today's planned amount, mainly because of the larger lunch portion. If you are hungry later, choose a suitable meal based on your normal appetite and nutritional needs. You do not need to skip dinner to compensate."

The system should not automatically prescribe fasting, extreme restriction, or excessive exercise to compensate for a meal.

### 41.6.2 If Energy Intake Is Lower Than Expected

The system should consider:

- The time of day.
- Missing food records.
- The user's appetite.
- The remaining planned meals.
- The user's health status.
- Whether low intake is becoming a repeated pattern.

It can suggest a suitable planned meal or snack if appropriate.

For example:

"Your recorded intake is currently below your planned amount. You still have dinner scheduled, so your daily total may change. If you are hungry, consider your planned meal rather than trying to reach a number immediately."

Persistent low intake, unintended weight loss, or other warning signs should trigger appropriate professional guidance.

### 41.6.3 If Protein Intake Is Below Target

For eligible users, the application may identify suitable foods that could contribute additional protein.

Examples include:

- Eggs.
- Fish.
- Chicken.
- Lentils.
- Beans.
- Dairy products.
- Other suitable alternatives.

The recommendations must respect allergies, dietary preferences, budget, and medical restrictions.

### 41.6.4 If Fiber Intake Is Low

The system may suggest appropriate additions such as vegetables, fruit, legumes, or whole grains.

The advice should account for the user's existing meals, digestive tolerance, age, and medical circumstances.

### 41.6.5 If a Nutrient Appears Excessive

The application should distinguish an estimated intake above a target from an intake that exceeds a clinically relevant upper limit.

It should not warn users that they are consuming a dangerous amount merely because a general target has been exceeded.

Where relevant, the system should consider the source of the nutrient, the applicable reference value, and the uncertainty of the food record.

### 41.6.6 Recommendations Must Be Context-Aware

The system should not issue generic instructions such as "eat fewer calories" whenever intake is higher than expected.

For example:

- A growing child should not receive an adult weight-loss recommendation.
- An infant's feeding pattern should not be judged against adult calorie targets.
- A person with a medically restricted diet may require professional review.
- An athlete's intake should be evaluated in the context of training and recovery.
- A user with an uncertain food log should not receive overly confident feedback.

---

## 41.7 AI Food Journal Data Model

The application should store meal images, food identifications, user corrections, and calculated nutritional values separately enough to support auditing and recalculation.

### 41.7.1 Food Journal Entry

```json
{
  "entryId": "entry_123",
  "profileId": "profile_456",
  "mealType": "lunch",
  "consumedAt": "2026-11-02T13:00:00",
  "imageIds": [
    "image_001"
  ],
  "identifiedFoods": [
    {
      "foodId": "cooked_rice",
      "displayName": "Cooked rice",
      "estimatedQuantity": 200,
      "unit": "g",
      "quantityConfidence": "moderate",
      "confirmedByUser": true
    }
  ],
  "nutritionEstimate": {
    "energyKcal": null,
    "proteinGrams": null,
    "carbohydrateGrams": null,
    "fatGrams": null,
    "fiberGrams": null
  },
  "analysisStatus": "pending_confirmation",
  "createdAt": "2026-11-02T13:05:00"
}
```

This is a schema illustration. Nutritional values should be populated by the calculation service after the food and portion information has been validated.

### 41.7.2 Additional Data

The production implementation should also support:

- Food identification candidates.
- User corrections.
- Cooking method.
- Ingredient details.
- Portion estimation method.
- Nutrition database version.
- AI model version.
- Calculation version.
- Uncertainty information.
- Image storage reference.
- Consent and retention status.
- Links to the corresponding planned meal.
- Edit history.

The application should preserve the distinction between the original AI estimate and the user's confirmed information.

### 41.7.3 Image Storage and Privacy

Food photographs should be stored securely.

The system should:

- Use private image storage.
- Apply access controls.
- Avoid exposing image URLs publicly.
- Define image retention and deletion policies.
- Remove unnecessary image metadata where appropriate.
- Avoid sending images to third-party services without suitable privacy disclosures and authorization.

Users should be able to delete a photograph without accidentally deleting their entire nutrition history, unless they explicitly choose to delete the associated entry as well.

---

## 41.8 Recommended Technical Architecture

The image analysis feature should use a multimodal AI service or computer-vision model for food recognition, combined with deterministic nutrition calculations.

### 41.8.1 Processing Pipeline

```text
User Takes or Uploads Photo
            |
            v
Image Validation and Secure Storage
            |
            v
AI Food Identification
            |
            v
Food Database Matching
            |
            v
Portion Estimation
            |
            v
User Confirmation
            |
            v
Nutritional Calculation Engine
            |
            v
Daily Intake Aggregation
            |
            v
Planned vs. Actual Comparison
            |
            v
Personalized Feedback
            |
            v
Food Journal + Dashboard
```

### 41.8.2 Recommended Separation of Responsibilities

**Computer vision / multimodal AI**
- Identifies likely foods.
- Suggests cooking methods when visually supported.
- Produces candidate ingredient descriptions.
- Assists with portion estimation.

**Food database**
- Supplies standardized food identities.
- Supplies nutrient values.
- Supplies relevant allergen information.
- Provides raw and cooked food variants.

**Nutrition engine**
- Calculates nutritional values.
- Aggregates meals into daily totals.
- Compares intake against targets.
- Determines the relevant differences.

**Recommendation engine**
- Applies validated rules.
- Identifies meaningful deviations.
- Selects appropriate adjustments.
- Escalates cases outside the supported scope.

**Language model**
- Explains the results.
- Asks clarifying questions.
- Presents suggestions in understandable language.

The language model should not be the final authority on nutrient calculations.

### 41.8.3 Processing Strategy

The system should support asynchronous processing when necessary.

A typical request could follow these steps:

1. Validate the uploaded image.
2. Store the image securely.
3. Create a food journal entry.
4. Submit the image for analysis.
5. Match the results to known food items.
6. Request user confirmation if necessary.
7. Calculate nutrition.
8. Update daily totals.
9. Generate contextual feedback.

If image analysis fails, the user should still be able to enter the meal manually.

The application should never lose a food entry because a third-party AI service is temporarily unavailable.

---

## 41.9 Suggested API Endpoints

```text
POST   /api/v1/food-journal/entries
POST   /api/v1/food-journal/entries/:entryId/images
POST   /api/v1/food-journal/entries/:entryId/analyze

GET    /api/v1/food-journal/entries
GET    /api/v1/food-journal/entries/:entryId

PATCH  /api/v1/food-journal/entries/:entryId
POST   /api/v1/food-journal/entries/:entryId/confirm
POST   /api/v1/food-journal/entries/:entryId/recalculate

DELETE /api/v1/food-journal/entries/:entryId

GET    /api/v1/nutrition/daily-summary
GET    /api/v1/nutrition/daily-comparison
GET    /api/v1/nutrition/recommendations
```

Endpoints must validate ownership, enforce profile access permissions, and reject unauthorized requests.

The daily summary should support a date and profile identifier so that users can view historical intake.

The recalculation endpoint should use the stored food records and current calculation rules without silently rewriting the user's confirmed food information.

---

## 41.10 Additional Safety and Accuracy Requirements

The application must recognize the limitations of image-based nutritional analysis.

### Requirement 1: No false precision

If the application estimates a meal at 650 kcal, it should not imply that the true value is exactly 650 kcal.

The user interface should make it clear that the number is an estimate.

### Requirement 2: User correction

Users must be able to correct food identities and portion sizes.

### Requirement 3: Missing ingredients

The application should ask about important hidden ingredients when they could materially change the result.

### Requirement 4: Incomplete records

The system should warn users that the daily total includes only recorded food and drink.

### Requirement 5: No automatic compensatory restriction

A meal that exceeds the planned target should not automatically trigger fasting, meal skipping, or extreme calorie restriction.

### Requirement 6: Child safety

Adult calorie tracking and weight-loss coaching must not be applied to infants or children.

Child food journaling should prioritize age-appropriate feeding, dietary variety, and relevant nutritional concerns.

### Requirement 7: Medical restrictions

Users with supported medical conditions should receive only recommendations permitted by the applicable clinical rules.

### Requirement 8: Privacy

Images and associated health data must be handled according to the application's privacy and retention policies.

### Requirement 9: Auditability

The system should record which food database and calculation version were used to produce a nutritional estimate.

### Requirement 10: Graceful uncertainty

When the application cannot reliably identify a food or portion, it should ask the user rather than fabricate an answer.

---

## 41.11 MVP Acceptance Criteria

The initial release of this feature should meet the following requirements:

- Users can photograph or upload meals.
- Users can log meals without photographs.
- The system identifies supported food items.
- The system matches identified foods to the food database.
- Users can correct food names and quantities.
- Nutrition is calculated using validated food-composition data.
- The application distinguishes estimates from confirmed quantities.
- Daily totals update after a meal is confirmed.
- Users can view their food journal by date.
- The system compares actual intake against applicable personalized targets.
- Users can view planned meals alongside actual meals.
- Recommendations respect supported dietary restrictions.
- The system does not present uncertain image estimates as exact measurements.
- Users can delete entries and manage their images.
- Failed AI requests do not prevent manual food logging.

---

## 41.12 Success Metrics

Measure both usability and accuracy.

### Product metrics

- Percentage of users who log their first meal.
- Average meals logged per active user.
- Percentage of logged meals confirmed by users.
- Time required to record a meal.
- Percentage of users who return to the food journal.
- Percentage of users who use planned-versus-actual comparisons.

### Quality metrics

- Food identification accuracy.
- Portion estimation error.
- Nutritional estimation error.
- Frequency of user corrections.
- Percentage of meals requiring clarification.
- Rate of failed image analyses.
- Accuracy across different cuisines and mixed dishes.

### Safety metrics

- Incorrect handling of allergen-related information.
- Unsafe recommendations generated from food records.
- Inappropriate calorie-restriction suggestions.
- Failure to identify unsupported medical scenarios.
- Unauthorized access to uploaded images.

The system should be evaluated against manually verified food records and measured portions. Success should not be judged solely by user satisfaction or the apparent plausibility of AI responses.

---

## 41.13 Final Product Experience

The completed feature should make the application feel like a personal nutrition companion.

A user opens the app in the morning and sees their planned meals.

At breakfast, they take a photograph of what they actually eat.

The application identifies the food, asks them to confirm the portion if needed, and records the meal.

At lunch, they upload another photograph.

The system compares the actual meal with the planned lunch and updates their nutritional totals.

In the evening, the user opens the dashboard and sees:

- What they ate throughout the day.
- Their estimated calorie intake.
- Their protein and other relevant nutrient intake.
- How their actual meals differed from their plan.
- What remains scheduled.
- Which adjustments may be useful.

At the end of the week, the application summarizes recurring patterns and helps the user create a more practical plan for the following week.

**The key principle is simple: the meal planner establishes a personalized plan, while the AI Food Journal helps the user understand and improve their real-world eating habits.**

---

# 42.3 Complete AI Food Scanner: Multi-Input Logging and Meal Memory

*Extends §41 (AI Food Journal), which specifies photo logging, manual logging, confirmation, nutrition calculation and uncertainty handling.*

## 42.3.1 Input methods

| Input method | How it works |
|---|---|
| Food photo | Take a picture and let AI identify the likely foods (§41.2–§41.3). |
| Text | Type "two eggs, two slices of bread and tea with milk." The text is parsed into candidate foods and quantities, then goes through the same confirmation step. |
| Voice | Say what was eaten instead of typing. It is transcribed, then handled like text. |
| Barcode | Scan packaged products to retrieve product information (ingredients, nutrition, allergens) from reliable product data. |
| Saved meals | Log a frequently eaten meal with one tap. |
| Recipe entry | Record the ingredients and portion of a homemade dish (links to §42.5 Personal Recipe Library). |

All input methods produce the same structured journal entry (§41.7) and follow the same rules: user confirmation, deterministic nutrition calculation, and estimates shown with uncertainty.

## 42.3.2 Automatic meal memory

If a user regularly eats the same meal, after it has been confirmed a few times the app offers: **"Is this your usual breakfast?"** Once the user confirms, the meal is logged with minimal effort.

## 42.3.3 Mixed dishes

For mixed dishes such as biryani, khichuri, curry or fried rice, ask for clarification when necessary. A photo alone cannot reliably reveal the amount of oil, sugar, sauce or every ingredient (§41.3.3). Show estimates with an appropriate uncertainty range, allow corrections, and never present image-derived calorie counts as exact.

**Competitive note:** AI meal logging and nutrition tracking are already common in this category. The advantage comes from making logging **faster, more accurate, locally relevant and easier to correct**.

---

# 42.4 "What If I Eat This?" Food Simulator

Before eating something, users can search for a food or upload a photo and ask: **"How would this fit into my day?"** (e.g. a burger, pizza, biryani or dessert).

The app estimates the nutritional content, explains how the food fits into the user's overall intake, and offers options if the user wants them:

- Estimated calories and macronutrients.
- How the food affects the day's recorded totals.
- Possible portion alternatives.
- Options for balancing the rest of the day through normal, appropriate meals.

**Rules:** it does not label foods as morally good or bad, and it never encourages skipping meals to compensate for eating something the user enjoys (§41.10 Req. 5). A simulation is not logged unless the user chooses to log it.

It makes nutrition guidance useful in real-life situations, not only when following a predefined plan.

---

# 42.22 Restaurant and Takeaway Assistant

Users often follow a plan at home but struggle when eating out. They can search for a restaurant meal or enter what they plan to order, and the app:

1. Estimates nutrition from verified restaurant information where available.
2. Offers a range when the exact recipe or portion size is unknown.
3. Suggests alternatives that better fit the user's preferences or goals.
4. Records the selected meal in the food journal.

For Bangladesh, coverage can eventually include common restaurant meals: biryani, kebabs, burgers, pizza, fast food and popular local dishes (§42.6.1 restaurant variants).

Do not pretend to know the exact nutrition of a restaurant's food unless reliable information is available. Preparation methods and portion sizes vary considerably.

---

# 42.20 Nutrition Confidence Score

*Related to §41.3.4 (Confidence and Uncertainty) and §41.10 Req. 4 (Incomplete records).*

Instead of a calorie total without context, the app shows how complete and reliable the day's food record is. It considers:

- Whether all meals were logged.
- Whether portions were confirmed.
- Whether recipes and ingredients were known.
- Whether nutrition data came from reliable sources.
- Whether important details remain uncertain.

Example display:

> **Today's nutrition record: Partially complete**
> Two meals were logged using confirmed portions. Dinner was estimated from a photo, and one snack may be missing.

This measures **record completeness and data confidence**. It is not a medical score and not a claim that the user ate healthily. It helps users understand why a daily total may be inaccurate.

---

# 42.12 Nutrient Gap Detection

*Extends §6.5 (Micronutrient Planning) and §41.6.3–§41.6.5 (meal-level recommendations).*

Calories alone do not describe diet quality. The app tracks selected nutrients and identifies **patterns across recorded intake over time**. For example, logged meals may often contain little variety or few sources of particular nutrients.

Depending on how reliable and complete the data are, it can suggest:

- Adding more fruit and vegetables.
- Including suitable protein sources.
- Increasing variety in whole grains and legumes.
- Reviewing sources of iron, calcium or other important nutrients.

Nutrients tracked: protein, carbohydrates and fats, fiber, sodium, and selected vitamins and minerals including iron and calcium. Targets depend on age, sex where relevant, life stage, health conditions and other applicable factors (§6, §7.2B).

**Wording rule:** say **"Your recorded meals may be low in…"**. Never diagnose a deficiency. The app cannot determine blood iron levels or diagnose a vitamin deficiency from food photos; clinical testing and professional assessment may be needed (§6.5).

---

# 42.2 AI Nutrition Coach

*Extends §18.2 (AI responsibilities). Supersedes §38.3 (Voice-Based Nutrition Assistant), whose example questions are now handled by the coach; voice is an input channel of the coach and the food journal.*

Instead of making users navigate menus and interpret charts themselves, provide a personal AI nutrition coach that understands the user's goals, meal plans, food journal, dietary preferences and progress. It is one of the product's most important differentiators.

Example questions:

- "I skipped breakfast. What should I eat now?"
- "I ate biryani for lunch. What should I have for dinner?"
- "I'm hungry, but I've already reached my calorie target. What are my options?"
- "I have eggs, rice, lentils and vegetables at home. What can I cook?"
- "I work at a desk all day. How can I improve my eating habits?"
- "I want to gain muscle without spending too much money on food."
- "What should I eat for lunch today?" / "I don't have fish at home. What can I replace it with?" / "Give me a quick breakfast for tomorrow." / "What ingredients do I need for this week's meals?" (from §38.3)

The coach must respond using the user's **actual information** (validated plan, food journal, profile, food database), not generic advice.

**Example flow:** a user uploads a photo of lunch → the AI estimates the content → the user confirms foods and portions → the daily summary updates (§41). Later the user asks "What should I eat tonight?" and the coach recommends a dinner based on:

- What the user has already eaten.
- Their remaining estimated nutritional needs.
- Their dietary preferences and restrictions.
- Their budget and available ingredients.
- Their original goal.

**Requirements**

- The AI must not invent nutrition numbers. It retrieves data from the trusted food database, the nutrition engine calculates totals, and the AI explains the results in natural language.
- Suggestions are drawn from options that pass the hard safety constraints (§25.2 Step 1, §18.5).
- For medical conditions, follow the validated rules for the condition's support level (§13.1) and direct users to qualified professionals when necessary.
- The coach can help with everyday food decisions, but it does not replace a qualified professional for complex nutritional needs (§42.24).
- For suspected emergencies (e.g. severe allergic reaction), direct the user to urgent medical help instead of handling it in chat (§12.5, §42.21).
