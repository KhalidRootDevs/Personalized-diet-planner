# 34. Testing Strategy

Testing must cover ordinary product behavior as well as nutrition-specific correctness.

## 34.1 Unit Tests

Test:

- Supported energy calculations.
- Unit conversions.
- Nutrient calculations.
- Ingredient scaling.
- Recipe serving adjustments.
- Age calculations.
- Plan duration.
- Calendar event scheduling.
- Allergen exclusion rules.
- Local portion unit to gram conversion.
- Daily intake aggregation and meal outcome to adherence mapping (§14.6).

## 34.2 Integration Tests

Test:

- Profile creation to assessment.
- Assessment to plan generation.
- Recipe retrieval to nutrition calculation.
- Plan generation to validation.
- Plan activation to calendar creation.
- Meal replacement to daily nutrition recalculation.
- Shopping list aggregation.
- Notification scheduling.
- Photo upload to identification, confirmation, nutrition calculation and dashboard update.
- Logging an actual meal against a planned meal, then the outcome, adherence and daily totals.
- Manual logging still works when image analysis fails.

## 34.3 Safety Tests

Create dedicated tests for:

- Allergens.
- Infant choking hazards.
- Age-inappropriate ingredients.
- Unsupported medical conditions.
- Missing clinical information.
- Contradictory restrictions.
- Incorrect portion states.
- Unverified recipes.
- Required professional review.
- Emergency symptoms.
- Compensatory restriction advice after over-target logging.
- Adult calorie feedback shown on child profiles.
- An allergen assumed absent because it isn't visible in a photo.

## 34.4 AI Evaluation Tests

Run a fixed evaluation set whenever the model, prompt, nutrition rules, or recipe retrieval logic changes.

The evaluation should measure:

- Output validity.
- Constraint compliance.
- Recipe correctness.
- Explanation quality.
- Unsupported claims.
- Safety violations.
- Consistency across repeated runs.
- Food identification, portion and nutrition estimation accuracy against manually verified records (§41.12).

## 34.5 User Acceptance Tests

Recruit representative users for testing:

- Parents introducing complementary foods.
- Office workers.
- People preparing their own meals.
- People with different food preferences.
- Users who are less comfortable with technology.

Testing should evaluate whether users can understand the plan, prepare the recipes, follow the schedule, and identify important warnings.

---

# 36. Risks and Mitigation

## Risk 1: Incorrect nutritional recommendations

**Mitigation:**
- Use structured nutritional data.
- Separate calculations from AI text generation.
- Validate plans before activation.
- Review clinical content.
- Monitor reported errors.

## Risk 2: Unsafe infant feeding recommendations

**Mitigation:**
- Maintain a separate infant feeding engine.
- Use approved age-specific rules.
- Restrict unsupported cases.
- Require pediatric nutrition review.
- Test choking, allergy, and food safety scenarios.

## Risk 3: Overly complex onboarding

**Mitigation:**
- Use progressive questions.
- Ask only relevant questions.
- Provide defaults where safe.
- Allow profile completion over time.

## Risk 4: Unrealistic meal plans

**Mitigation:**
- Ask about cooking time.
- Respect budget.
- Include local foods.
- Support ingredient substitutions.
- Learn from user feedback.

## Risk 5: AI-generated nutrition inaccuracies

**Mitigation:**
- Calculate nutrition from the food database.
- Require structured output.
- Reject unsupported ingredients or quantities.
- Maintain deterministic validation.
- Version models and prompts.

## Risk 6: Long-term plans become outdated

**Mitigation:**
- Use periodic reviews.
- Update plans when relevant profile data changes.
- Recalculate targets when justified.
- Avoid treating a six-month plan as an immutable prescription.

## Risk 7: Excessive AI operating costs

**Mitigation:**
- Cache validated recipes and common explanations.
- Use deterministic rules for calculations.
- Generate only the required planning horizon.
- Use asynchronous jobs for long plans.
- Track AI cost per successful plan.

## Risk 8: Sensitive data exposure

**Mitigation:**
- Apply strict access controls.
- Minimize data sent to AI providers.
- Encrypt sensitive information.
- Define retention policies.
- Audit privileged access.
- Test security regularly.

---

# 37. MVP Acceptance Criteria

The MVP should not be considered ready merely because it can generate a plausible-looking diet chart.

It should satisfy the following criteria.

### Profile management
- Users can create, update, and view supported profiles.
- Age is calculated correctly.
- Relevant missing information is identified.
- Allergies and restrictions are stored correctly.

### Nutrition assessment
- Supported calculations are covered by automated tests.
- Unsupported cases are identified.
- Targets include the appropriate assumptions and reference versions.
- The system does not treat estimates as exact measurements.

### Meal planning
- Users can generate supported three-day and seven-day plans.
- Meals contain ingredient quantities and serving information.
- Nutritional totals are calculated from the selected ingredients.
- Substitutions trigger recalculation.
- Plans cannot be activated when mandatory safety checks fail.

### Recipe system
- Each active recipe has the required ingredient and instruction fields.
- Relevant allergens are identified.
- Food safety notes are available where required.
- Recipe versions and review status are tracked.

### Calendar
- Users can schedule meals.
- Meal completion status persists.
- Rescheduling does not create unintended duplicate events.
- Reminders respect user preferences.

### Shopping lists
- Ingredients are aggregated correctly.
- Quantities use compatible units.
- The user can mark items as purchased.
- Costs are clearly identified as estimates when applicable.

### Infant module
- The correct child-specific workflow is used.
- Age-specific restrictions are enforced.
- Unsafe recipes cannot be activated.
- High-risk scenarios trigger the appropriate escalation.
- Approved clinical guidance is versioned and traceable.

### Privacy and security
- Users cannot access unauthorized profiles.
- Sensitive information is protected.
- Data deletion and retention workflows are documented.
- Privileged actions are audited.

### Operations
- Errors are monitored.
- Backups are configured.
- Failed AI requests can be recovered safely.
- Critical safety failures can be investigated.
