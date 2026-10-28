# 2. Target Users and Use Cases

The platform should support several user categories without treating them as interchangeable.

## 2.1 Infants: Six to Twelve Months

### User problem

Parents often do not know which foods to introduce, how to prepare them, what textures are appropriate, or which foods create choking or other safety risks.

### Application capabilities

The infant nutrition module should:

- Capture the infant's date of birth and relevant developmental information.
- Calculate age in months and update it automatically.
- Provide age-appropriate complementary feeding guidance.
- Explain suitable food textures and preparation methods.
- Suggest foods that can be introduced according to established feeding guidance.
- Explain how to introduce common allergens safely, when appropriate.
- Identify choking hazards and unsafe preparations.
- Provide practical meal ideas using locally available foods.
- Explain how breast milk or infant formula continues to fit into the feeding routine.
- Allow parents to track foods introduced and any reactions.
- Provide guidance on hydration and food hygiene appropriate to the infant's age.
- Offer a daily feeding schedule without rigidly prescribing amounts that are inappropriate for an individual infant.

### Example

A parent creates a profile for a six-month-old infant.

The system identifies that the infant is at the beginning of complementary feeding and generates an introductory plan with age-appropriate food textures, preparation instructions, feeding opportunities, and safety notes.

The plan could include foods such as well-cooked mashed lentils, soft mashed vegetables, or appropriately prepared egg, depending on the infant's readiness, dietary context, and applicable feeding guidance.

It must also explain that complementary foods begin alongside continued breastfeeding or appropriate infant formula, not as an immediate replacement.

**Important:** Six months is a general starting point for complementary feeding, provided the infant is developmentally ready. The application must not assume that every infant is ready on the same day.

The system must not force the same feeding quantities or meal frequency on every infant.

### Example age groups

| Age | Primary planning focus |
|---|---|
| Before 6 months | Breastfeeding or appropriate infant formula guidance; no routine solid-food meal plans |
| Around 6 months | Introduction of complementary foods when developmentally ready |
| 7–8 months | Progressive texture development and varied complementary foods |
| 9–11 months | Increasing food variety, suitable textures, and responsive feeding |
| 12 months | Transition toward an age-appropriate family diet while maintaining nutritional adequacy |
| 1–2 years | Toddler nutrition, food variety, iron-rich foods, and safe textures |

Age categories must be supported by clinically reviewed rules, not arbitrary AI-generated instructions.

## 2.2 Toddlers and Children

### User problem

Parents need meal ideas that support growth, provide sufficient nutrients, and remain practical for family life.

### Application capabilities

- Age-specific meal planning.
- Child-friendly recipes.
- Appropriate texture and portion guidance.
- Iron-rich food suggestions.
- Calcium and vitamin D considerations.
- School-day meal planning.
- Healthy snack recommendations.
- Food variety tracking.
- Allergy and intolerance management.
- Picky-eating support.
- Lunchbox planning.
- Family meal integration.

The application should avoid restrictive weight-loss plans for children unless specifically developed and supervised under appropriate clinical guidance.

## 2.3 Office Workers and Sedentary Adults

### User problem

Office workers often sit for long periods, have irregular meal schedules, rely on convenience foods, and struggle to maintain balanced eating habits.

### Application capabilities

- Estimate nutritional needs using age, body measurements, activity, and goals.
- Account for predominantly sedentary work.
- Incorporate commuting and working hours.
- Suggest convenient meals and snacks.
- Provide office-friendly lunch options.
- Generate meal-preparation plans.
- Support weight management where appropriate.
- Offer reminders for planned meals.
- Consider budget and access to workplace food.

### Example

A 30-year-old office employee works from 10 AM to 7 PM and spends most of the day sitting.

The system considers the person's body measurements, activity outside work, goals, food preferences, and health information before generating a plan.

It may recommend breakfast before work, a convenient lunch, an optional snack, and dinner after work.

The plan should not automatically assign a low-calorie diet simply because the user works at a desk. Total energy needs depend on the person's complete activity pattern and individual circumstances.

## 2.4 Physically Active Workers

### User problem

People who perform physically demanding work may need more energy, fluids, and nutrients than people with comparable body measurements who are mostly sedentary.

### Application capabilities

- Record occupation and physical workload.
- Capture work duration and intensity.
- Consider outdoor heat exposure and sweating.
- Provide practical meals and portable snacks.
- Account for physically demanding shifts.
- Support adequate energy and protein intake.
- Offer hydration guidance.
- Provide meal timing suggestions around working hours.

The system should distinguish light, moderate, and heavy physical work instead of assigning a single activity multiplier to every occupation.

People performing heavy work in hot environments may need individualized fluid and electrolyte guidance, particularly when medical conditions or medications affect hydration.

## 2.5 Fitness and Sports Users

### Target users

- People trying to lose body fat.
- People trying to gain weight.
- People trying to build muscle.
- Recreational athletes.
- Gym members.
- Endurance athletes.

### Application capabilities

- Goal-based meal planning.
- Protein and energy target estimation.
- Workout-day and rest-day meal variations.
- Pre-workout and post-workout meal suggestions.
- Meal-preparation planning.
- Weight and performance tracking.
- Supplement information with appropriate safety restrictions.

The application should not assume supplements are necessary to achieve a nutrition goal.

## 2.6 Users With Health Conditions

Potential conditions include:

- Diabetes.
- Hypertension.
- Chronic kidney disease.
- Cardiovascular disease.
- Gastrointestinal conditions.
- Food allergies and intolerances.
- Celiac disease.
- Iron deficiency and other diagnosed nutritional deficiencies.
- Pregnancy and breastfeeding.
- Other conditions for which nutrition is clinically relevant.

These conditions must not be treated as a single generic category.

Each supported condition needs its own clinically reviewed rules, contraindications, and escalation criteria.

For example, a person with chronic kidney disease may need individualized recommendations concerning protein, potassium, phosphorus, sodium, or fluids. The appropriate recommendations depend on the person's clinical situation and treatment.

The application must not generate an unrestricted diet chart for a medically complex user merely because it knows their age, height, and weight.

## 2.7 Older Adults

The application should support:

- Maintaining adequate nutrition.
- Preserving muscle mass.
- Appropriate protein distribution.
- Hydration.
- Food texture considerations where necessary.
- Budget-conscious meal planning.
- Nutrition considerations associated with chronic conditions.
- Medication-related considerations when supported by reliable clinical rules.

Unintentional weight loss, swallowing difficulties, frailty, and other warning signs should trigger appropriate professional assessment.

## 2.8 Family Nutrition

A future module should allow one account to manage multiple household profiles.

For example:

- Parent A: adult weight management.
- Parent B: breastfeeding nutrition.
- Child A: infant complementary feeding.
- Child B: school lunch planning.

The system could generate a shared household shopping list and identify meals that can be prepared using common ingredients.

However, it must retain separate portions, textures, nutritional targets, and safety rules for each individual.

A family meal may share a common base while requiring different preparation or serving methods for an infant.

---

# 3. User Personas

## Persona A: New Parent

**Goal:** Understand what to feed a baby starting complementary foods.

**Needs:**
- Age-specific guidance.
- Simple recipes.
- Clear safety instructions.
- Food introduction tracking.
- Practical ingredients.
- Confidence that the recommendations are appropriate.

**Success condition:** The parent can understand and safely implement the feeding guidance without relying on an unstructured collection of online advice.

## Persona B: Office Employee

**Goal:** Maintain a healthy diet while working full-time.

**Needs:**
- A realistic schedule.
- Affordable meals.
- Office-friendly lunch options.
- Portion guidance.
- Simple preparation instructions.
- Reminders.

**Success condition:** The user can consistently follow a meal plan that fits their working day.

## Persona C: Physically Active Worker

**Goal:** Eat enough to support demanding daily work.

**Needs:**
- Higher or otherwise appropriately estimated energy requirements.
- Portable meals.
- Hydration guidance.
- Convenient snacks.
- Shift-based scheduling.

**Success condition:** The plan reflects the user's workload, environment, and personal nutritional requirements.

## Persona D: User With a Medical Condition

**Goal:** Follow an appropriate diet without worsening an existing health condition.

**Needs:**
- Condition-specific rules.
- Allergen exclusions.
- Clinically reviewed meal recommendations.
- Clear limitations.
- Professional referral where necessary.

**Success condition:** The user receives safe, appropriate guidance within the application's supported clinical scope.

---

# 4. Core Product Modules

> **Phasing:** the Priority column below is historical. Release phases are defined in §43 (03-release-phases-roadmap.md). Modules added in §41–§42 (AI Food Journal, AI Coach, habits, pantry and others) appear in §43, not in this table.

The application should be divided into the following modules.

| Module | Purpose | Priority |
|---|---|---|
| Authentication and accounts | Secure user access | MVP |
| User profiles | Store demographic and lifestyle information | MVP |
| Multiple profiles | Manage family members | Phase 2 |
| Nutrition assessment | Estimate needs and identify restrictions | MVP |
| Nutrition knowledge base | Store validated nutrition rules | MVP |
| Food database | Provide food composition and portion information | MVP |
| Recipe database | Store and generate recipes | MVP |
| AI meal planner | Create personalized meal plans | MVP |
| Plan duration management | Support plans of different lengths | MVP |
| Calendar integration | Schedule meals | MVP |
| Daily task management | Track planned meals | MVP |
| Notifications | Remind users about meals and preparation | MVP |
| Shopping lists | Generate ingredient lists | MVP |
| Progress tracking | Track adherence and user-reported outcomes | MVP |
| Plan adjustment | Revise plans as circumstances change | MVP |
| Infant feeding module | Age-specific infant nutrition and safety | MVP, with clinical validation |
| Medical nutrition modules | Condition-specific planning | Phased rollout |
| Family meal coordination | Coordinate household meals | Phase 2 |
| Professional dashboard | Allow qualified professionals to review plans | Phase 2 |
| Subscription and payments | Support monetization | Phase 2 |
| Wearable integrations | Import activity data | Phase 3 |
| Advanced analytics | Identify adherence and outcome patterns | Phase 3 |

**Important launch condition:** The infant feeding module should not be released as an unrestricted AI-generated nutrition service until its rules, content, and safety behavior have been reviewed by qualified professionals.
