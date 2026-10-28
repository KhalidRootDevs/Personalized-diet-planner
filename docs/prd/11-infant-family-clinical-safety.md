# 12. Infant and Child Feeding Module

This module deserves separate treatment because the safety requirements differ substantially from adult nutrition planning.

## 12.1 Profile Creation

For a child, collect relevant information such as:

- Date of birth.
- Prematurity and corrected age when relevant.
- Current weight and length or height, if available.
- Developmental readiness for complementary feeding.
- Breastfeeding and/or infant formula feeding.
- Known allergies.
- Diagnosed medical conditions.
- Feeding difficulties.
- Foods already introduced.
- Reported reactions.
- Clinician-provided dietary restrictions.

Do not require irrelevant adult information such as occupation or weight-loss goals.

## 12.2 Age-Specific Feeding Plans

The module should maintain distinct rules for:

- Infants younger than six months.
- Infants beginning complementary feeding.
- Infants aged 7–8 months.
- Infants aged 9–11 months.
- Children aged 12–23 months.
- Older children.

The precise age bands and recommendations should follow the selected clinical guidance and be reviewed by qualified pediatric nutrition professionals.

## 12.3 Food Introduction Tracker

Parents should be able to record:

- Food introduced.
- Date introduced.
- Preparation method.
- Texture.
- Whether the child accepted the food.
- Any observed reaction.
- Whether a clinician has advised avoiding the food.

The system should not automatically label a child allergic because the child disliked a food or experienced an unrelated symptom.

Potential allergic reactions should be handled through a separate safety workflow.

## 12.4 Infant Recipe Requirements

Each infant recipe must specify:

- Minimum suitable developmental stage.
- Ingredients.
- Ingredient quantities.
- Preparation method.
- Texture.
- Serving guidance.
- Choking-risk considerations.
- Allergen information.
- Food hygiene requirements.
- Safe storage and handling instructions where applicable.

The application must distinguish between foods that are appropriate as ingredients and preparations that are safe to serve.

For example, a food may be nutritious but unsafe when served whole, hard, or in a shape that presents a choking risk.

## 12.5 Infant Safety Rules

The system should enforce the following principles through clinically reviewed rules:

- Breast milk or appropriate infant formula remains central during the first year.
- Complementary foods are generally introduced around six months when developmental readiness is present.
- Honey must not be recommended before twelve months.
- Whole nuts and other high-risk choking hazards must not be recommended for infants.
- Foods must have age-appropriate textures.
- Unsafe food preparation and storage methods must be prohibited.
- Allergen introduction should follow appropriate guidance and additional medical advice where indicated.
- Iron-rich complementary foods should be considered as part of age-appropriate feeding.
- Infants with feeding difficulties, significant prematurity-related concerns, growth problems, or complex medical conditions may require professional assessment.

The application should distinguish emergency symptoms from routine feeding concerns.

For example, breathing difficulty or signs of a severe allergic reaction require urgent emergency assistance, not an AI-generated meal adjustment.

## 12.6 Baby Meal Plan Interface

A parent's daily dashboard might display:

**Today's feeding plan**

- Feeding opportunity 1: Age-appropriate complementary food.
- Feeding opportunity 2: Another suitable complementary food.
- Additional feeding opportunities according to age-appropriate guidance.
- Breastfeeding or appropriate formula feeding according to the infant's established routine.

The exact number of meals, portions, textures, and feeding opportunities must come from validated age-specific guidance and the child's circumstances.

The application should use responsive feeding principles and avoid encouraging parents to force-feed a child to finish a prescribed portion.

## 12.7 Growth Tracking

Parents may record weight and length over time.

The application can display growth trends using appropriate pediatric references.

However:

- Growth measurements should not automatically trigger restrictive feeding.
- Unexpected growth patterns should prompt appropriate clinical review.
- Measurements taken at home may be inaccurate.
- The application must distinguish screening information from a medical diagnosis.

## 12.8 Food Journaling for Infant and Child Profiles

When the food journal (§41) is used for a dependent child profile:

- For infants, logging a food that has not been introduced before creates or updates its entry in the food introduction tracker (§12.3). There is one record, not two separate logs.
- No adult calorie dashboard, energy-target comparison or weight-loss feedback is shown (§41.10 Req. 6, §42.10). The child view focuses on feeding opportunities, food variety, texture, acceptance and reported reactions (§17.2).
- Reported reactions follow the separate safety workflow (§12.3, §12.5), and emergency symptoms route to urgent help.

---

# 42.10 Baby Feeding Companion

*Extends §12 (Infant and Child Feeding Module), which remains the base specification (profile, age bands, food introduction tracker, infant recipes, safety rules, growth tracking).*

Build this as a **dedicated module**, not a section of the adult meal planner. It can be one of the most distinctive parts of the product.

Additions to §12:

- **A. Age-specific guidance:** WHO recommends introducing complementary foods at around six months while breastfeeding continues, with food quantity, frequency, variety and texture progressing as the child grows. This is the reference starting point for the module's rules, subject to the clinical review in §12.2.
- **B. First-food tracker** (§12.3): also record how the baby appeared to tolerate each food and any symptoms reported by the caregiver. The app helps parents keep a useful food history and identify **what to discuss with a healthcare professional**. It must not diagnose an allergy from a diary entry.
- **C. Age-appropriate recipes** (§12.4): also show nutritional information where available and allergy-related cautions.
- **D. Growth tracking** (§12.7): caregivers may record weight, length/height and other appropriate measurements. Use recognized pediatric growth standards, and clearly separate a measurement from a clinical interpretation. The app must not diagnose malnutrition or a growth disorder from user-entered measurements alone.
- **E. Responsive feeding support:** help caregivers understand signs of hunger and fullness, and encourage patient, age-appropriate feeding rather than forcing a child to finish a serving (WHO guidance; extends §12.6).

**Important:** keep baby nutrition separate from adult weight-loss logic. Infants are never given calorie-deficit plans or adult-style weight targets.

---

# 42.9 Family Nutrition Profiles and Shared Family Meals

*Extends §2.8 (Family Nutrition), §38.1, §30.3 (Family Plan) and FR-025.*

Most households do not prepare completely separate meals for every person. Users can create separate profiles for family members, each with their own needs and restrictions. For example:

- An adult who wants to lose weight.
- An adult who wants to build muscle.
- A school-age child with age-appropriate needs.
- An infant starting complementary foods.

**Shared family meals:** the app identifies meals that work for several family members and suggests changes to portions or preparation. For example, a family preparing fish, rice and vegetables for dinner gets one shared meal plan with different serving guidance for each member.

**Rules**

- Infants and young children need age-appropriate textures, preparation, choking-hazard precautions and nutritional guidance. **A baby must not simply receive a smaller portion of an adult meal.**
- For infants and children with allergies, growth concerns or medical conditions, apply additional safeguards and direct caregivers to qualified professionals when appropriate.
- Per-member health data stays access-controlled (§29.1).

This positions the app as a household nutrition platform rather than a personal calorie counter.

---

# 13. Health Conditions and Clinical Safety

This module determines what the system can safely recommend for people with health conditions.

## 13.1 Condition Support Levels

Each condition should have a defined support level.

### Level 1: General Nutrition Support

Suitable for general wellness and supported adult nutrition goals without identified high-risk circumstances.

The system can provide a personalized meal plan within its validated scope.

### Level 2: Condition-Aware Planning

Suitable for selected conditions where clinically reviewed dietary rules can safely constrain recommendations.

The system may generate a plan using approved rules and clearly defined eligibility criteria.

### Level 3: Professional Review Required

Suitable for conditions that require individualized assessment before a plan can be activated.

The system may collect information, display general educational material, and prepare a draft for professional review.

### Level 4: Unsupported or Urgent Case

The application should not generate a specialized plan when it cannot safely support the user's circumstances.

It should explain the limitation and direct the user to appropriate healthcare services.

Urgent symptoms should trigger emergency guidance rather than routine diet planning.

## 13.2 Example: Diabetes

Potential capabilities, once clinically validated:

- Balanced meal planning.
- Carbohydrate estimation.
- Meal scheduling.
- Food substitutions.
- General education.
- Tracking of meals and user-recorded glucose values, if the user chooses.

The system must not automatically change medication doses or recommend stopping medication.

Users taking insulin or certain glucose-lowering medications may need individualized advice to avoid hypoglycemia.

## 13.3 Example: Kidney Disease

The system should identify that nutritional requirements may depend on disease stage, laboratory findings, treatment, and clinician instructions.

It must not assume that a generic high-protein diet is appropriate.

Where necessary, it should require clinician-defined restrictions or professional review.

## 13.4 Example: Food Allergy

Allergy restrictions must be enforced across:

- Main meals.
- Snacks.
- Recipes.
- Substitutions.
- Shopping lists.
- AI-generated variations.

The system should not merely remove the named allergen from a recipe's title or ingredient list while ignoring other relevant sources of exposure.

Where cross-contact is relevant, the application should communicate the limitation and provide appropriate food safety guidance.

## 13.5 Clinical Review Workflow

For supported professional review, the workflow should include:

1. User completes the assessment.
2. System creates a draft plan.
3. Safety checks run.
4. The plan is flagged if professional review is required.
5. A qualified professional reviews relevant information.
6. The professional approves, modifies, or rejects the plan.
7. The approved plan is activated.
8. The system stores the review status and version.

The application should not represent an unreviewed AI-generated plan as physician-approved.

---

# 42.21 Food Safety and Allergy Protection

*Extends §13.4 (Food Allergy), §5.5–§5.6 (onboarding allergies) and §12.5 (Infant Safety Rules). Allergy exclusion across meals, recipes, substitutions, shopping lists and AI variations is already required.*

This matters especially because the app serves both adults and children. Users record allergies, intolerances and dietary restrictions during onboarding; meal recommendations and recipes are checked against them. Additional behaviors:

- Flag a recipe that contains a recorded allergen.
- Identify possible allergens in ingredient lists.
- Warn when packaged-food information is incomplete (barcode logging, §42.3).
- Flag age-inappropriate foods or preparations in baby recipes.
- Explain relevant food storage and preparation precautions.

**Key rules**

- Never assume a dish is allergen-free because the allergen isn't visible in a photo.
- For packaged foods, use ingredient labels and reliable product data when available. If the ingredients are uncertain, say so instead of presenting an unsafe recommendation.
- For suspected severe allergic reactions, direct users to urgent medical help rather than handling the emergency through a chatbot.

---

# 42.24 Dietitian / Nutrition Professional Mode

*Extends §13.5 (Clinical Review Workflow), §28.2 (Professional Roles), §30.4 (Professional Plan), §38.8 (Professional Nutritionist Marketplace) and FR-028.*

With the user's permission, a qualified professional can:

- Review a food journal.
- Review a meal plan.
- Add recommendations.
- Monitor agreed-upon goals.
- Provide feedback.
- Share an updated plan.

**Appointment report export:** users can optionally export a report of their recorded meals, relevant nutritional estimates, preferences and questions for an appointment.

An AI coach helps with everyday decisions but does not replace a qualified professional for complex needs. Professional mode makes the app more useful for people who need individualized guidance, including those with medical conditions. It is introduced as an additional service, not a requirement for every user. Access to a user's records is explicit, revocable and audited (§28.2, §29.1).
