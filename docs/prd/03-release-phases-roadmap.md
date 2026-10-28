# 43. Release Phases and Feature Catalog

This section is the **single source of truth for which release phase each feature belongs to**. Every feature in §1–§42 appears here exactly once, with links to its specification.

It replaces the phase and priority labels in §4 (Core Product Modules), §32 (MVP Scope), §38 (Future Enhancements) and §40 (Recommended Development Priorities). Those sections are kept for context and rationale; if a label there disagrees with this catalog, **this catalog wins**.

**Release phases vs development phases:** §33 (Development Roadmap, development phases 1–6) describes *how Release Phase 1 is built and launched*. Release Phases 2 and 3 below come after the controlled launch.

**Phasing rules**

1. Phase 1 contains everything needed for the core workflow to work well, plus every safety, privacy and correctness requirement those features depend on.
2. Safety features are never deferred to a later phase than the feature they protect, and are never paywalled (§30.1).
3. Clinically gated features (infant module, condition-specific modules) ship in their phase **only for scenarios that have completed clinical validation** (§4, §13.1, §32.1). Clinical validation is never skipped to meet a date (§33 Phase 5).
4. Later-phase features are guided by real user needs and data. Their phase can move, but only by updating this catalog.

---

## 43.1 The Core Workflow (Release Phase 1 goal)

**Create a profile → Generate a meal plan → Record actual meals → Review nutrition → Receive useful recommendations.**

If users can do these five things easily and reliably, the product is already meaningful. It is the practical form of the product loop in §35: Assess → Plan → Validate → Schedule → Eat → Track → Improve. Its success is measured by the core workflow completion rate (§42.26).

---

## 43.2 Release Phase 1 — Essential MVP

**Goal:** a useful product people can actually use every day.

| # | Feature | Phase 1 scope | Specification |
|---|---|---|---|
| 1.1 | Authentication and accounts | Registration, login, sessions, secure access | §21.3, §23.1, §24, FR-001 |
| 1.2 | User profiles and progressive onboarding | 9-step onboarding; adult and child workflows; profile editing; primary profile plus dependent child profiles; consent capture | §5, §5.10, §23.2, FR-002–FR-008, FR-040–FR-041 |
| 1.3 | Personalized nutrition goals and assessment | Supported adult calculations, goal adjustments, macro/micro targets, BMI/growth screening, hydration, eligibility restrictions | §6, §23.3, FR-009 |
| 1.4 | Nutrition knowledge base | Versioned, reviewed rules with sources | §7, §23.11 |
| 1.5 | Food database, including Bangladeshi core catalog | Curated food DB; raw/cooked distinction; core local foods (§27.2, §42.6.1 staples); local portion units mapped to gram weights | §8, §27.2, §42.6.1–§42.6.2, §23.4, FR-010 |
| 1.6 | Recipe database (verified recipes) | Reviewed recipes as the default; recipe detail screen; serving scaling | §9 (Approach A), §15.1–§15.2, §23.5, FR-013–FR-014 |
| 1.7 | Meal-plan generation and validation | 3-day and 7-day plans; user-selected meal schedules; constrained optimization; full validation pipeline; activation blocked on failed safety checks | §10, §11, §25, §18.3–§18.4, FR-011–FR-015 |
| 1.8 | Meal replacement — "Similar nutrition" mode | Replace a meal with recalculation and material-change warning | §15.3, §8.4, §42.11 (default mode), FR-016 |
| 1.9 | Food allergies, dietary preferences and food-safety protection | Allergy vs preference separation; enforcement across meals, recipes, substitutions, shopping lists, AI variations; "not allergen-free just because it isn't visible" rule; emergency routing | §5.5–§5.6, §13.4, §42.21, FR-006–FR-007 |
| 1.10 | Health-condition triage and escalation | Condition support levels; Level 1 general support; Level 3/4 detection, professional referral and emergency guidance; per-plan professional review for gated cases, handled by internal clinical reviewers through the admin review queue (§28.2, §24) | §13.1, §13.5, FR-024 |
| 1.11 | AI Food Journal — photo logging | Capture/upload, AI identification, portion estimation, confirmation, uncertainty, hidden-ingredient prompts | §41.2–§41.3, §41.7–§41.10 |
| 1.12 | Manual and text food logging, corrections | Log without photos (form or typed text, §42.3.1 "Text"); correct names and quantities | §41.2, §41.11, §42.3.1 |
| 1.13 | Daily nutrition dashboard | Daily summary, visual progress, remaining planned meals, incomplete-record warning | §41.4, §41.10 Req. 4 |
| 1.14 | Planned vs. actual meal comparison | Planned vs logged meals, portions, nutrients, timing; richer adherence states | §41.5 |
| 1.15 | Context-aware dietary recommendations (meal/day level) | Higher/lower energy, low protein, low fiber, excessive nutrient handling; no compensatory restriction | §41.6, §41.10 |
| 1.16 | Meal calendar and unified daily task system | In-app calendar; meals as tasks; daily schedule with Mark as eaten / Log actual meal / Replace / View recipe / Prepare later; smart rescheduling; downloadable calendar events; unified meal status model (§14.6) | §14.1–§14.6, §42.16, §23.7–§23.8, FR-017–FR-018, FR-026 |
| 1.17 | Reminders (user-configured) | Meal, preparation, shopping, food-logging and water reminders; configurable and easy to disable | §26, §42.17 (reminder types), FR-019 |
| 1.18 | Automatic shopping list | Aggregated, consolidated quantities; categories; purchased state; estimated cost; auto-update when the plan changes | §16.1–§16.2, §16.4, §42.8.1 (auto-update), §23.9, FR-020 |
| 1.19 | Basic progress tracking and plan revision | Weight for eligible adults, meal completion, adherence rate, feedback loop, user-requested revision, Weekly Review (Phase 1 content) | §17.1–§17.3, §17.5, §17.6, §23.10, FR-021–FR-022 |
| 1.20 | Basic baby-feeding module *(clinically gated)* | Separate child profile, age calculation, reviewed guidance, approved recipes, age-specific safety validation, food introduction tracker linked to the food journal, responsive-feeding guidance; only validated age bands (§12.2, up to 23 months). Required if baby nutrition is part of the launch | §12, §12.8, §42.10 (A–E basics), FR-023 |
| 1.21 | Privacy and data controls | Consent, minimization, deletion/retention, private image storage, AI-provider data minimization, audit logging | §21.3–§21.4, §29, §41.7.3, §23.12 |
| 1.22 | Localization (English and Bangla) | All food names, recipes, safety messages and explanations localizable | §27.1, §27.4 |
| 1.23 | Admin dashboard and clinical content publishing | Manage foods, recipes, rules, localization; review validation failures; separated roles; versioned clinical publication | §28 |
| 1.24 | App shell and navigation | Visual design system and tokens; mobile five-tab navigation (Home, Plan, Food Log, Recipes, Profile) with Shopping List and Progress inside it; home dashboard hierarchy with "+ Log a meal" as the primary action; profile switcher for dependent child profiles; accessibility and contrast; English and Bangla typography; the MVP screens in §44.15 | §19, §42.25, §44 |
| 1.25 | Analytics, quality and safety metrics | Activation, engagement, quality, dedicated safety metrics, core workflow completion | §31.1–§31.6, §41.12, §42.26 |
| 1.26 | Non-functional baseline | Performance, reliability, security, scalability; AI isolated from core services | §21 |
| 1.27 | Testing and AI evaluation | Unit, integration, safety, AI evaluation and UAT suites | §18.6, §34 |

Phase 1 functional requirements: FR-001–FR-024, FR-026 and FR-031–FR-041 (§20).

Phase 1 acceptance criteria: §37 and §41.11.

---

## 43.3 Release Phase 2 — Retention and Convenience

**Goal:** make the product easier to use consistently and remove practical barriers. Start after the core workflow works.

| # | Feature | Phase 2 scope | Specification |
|---|---|---|---|
| 2.1 | AI Nutrition Coach | Personalized Q&A over the user's validated plan, journal and food DB (replaces §38.3 voice assistant) | §42.2 |
| 2.2 | Smart Meal Swapping — extra modes | Cheaper option, Quick option, Use ingredients I already have | §42.11 |
| 2.3 | Bangladeshi Food Intelligence expansion | Street foods, restaurant meals, pitha/sweets, home vs restaurant variants, broader coverage | §42.6 |
| 2.4 | Smart grocery list enhancements | Adjust for number of people, remove owned items, replace unavailable ingredients, share with family | §42.8.1, §16.2 (sharing), FR-027 |
| 2.5 | Pantry management | Record home ingredients and expiry; use-before-expiry suggestions (replaces §38.4) | §42.8.2 |
| 2.6 | Budget-Aware Nutrition Optimizer | Budget plan presets (lowest-cost, high-protein within budget, quick workday, pantry-based); compare two meals on cost and nutrition | §42.7, §16.3, §27.3 |
| 2.7 | Saved meals, meal memory and recipe-entry logging | One-tap saved meals; "Is this your usual breakfast?"; log homemade dish by ingredients | §42.3.1–§42.3.2 |
| 2.8 | Voice and barcode logging | Voice entry; barcode lookup with packaged-food allergen/incomplete-data warnings (barcode depends on reliable product data coverage) | §42.3.1, §42.21 |
| 2.9 | Personal Recipe Library | Save and create recipes, personal notes, add to plan, recipe from available ingredients | §42.5 |
| 2.10 | AI-assisted recipe variations | Approach B, after the validation system is established; not for high-risk users | §9.3 |
| 2.11 | "What If I Eat This?" Food Simulator | Pre-meal fit check without moral labels or compensation advice | §42.4 |
| 2.12 | Habit Builder and weekly habit review | Personalized habits, weekly review | §42.18 |
| 2.13 | Progress Insights That Explain Why | Explained weekly insights and progress views; correlation ≠ causation | §42.19 |
| 2.14 | Smart reminders (learning) | Suggested reminder-timing changes based on usage | §42.17 |
| 2.15 | Family profiles and shared family meals | Multiple household profiles, per-member permissions, shared meals with per-member serving guidance | §2.8, §42.9, §29.1, FR-025 (replaces §38.1) |
| 2.16 | Additional plan durations | One-day, fourteen-day and thirty-day plans | §10.2 |
| 2.17 | External calendar integration | Google Calendar (and other supported services) with explicit authorization, de-duplication and no sensitive titles | §14.4 |
| 2.18 | Condition-aware planning modules *(clinically gated, phased rollout)* | Level 2 modules for selected conditions (e.g. diabetes §13.2) as each completes clinical validation | §2.6, §13.1–§13.3 |
| 2.19 | Subscriptions and payments | Free, Premium and Family plans | §30.1–§30.3, §30.5 |
| 2.20 | AI Coach navigation section and Family section | Add "AI Coach" and "Family" to the navigation; offer "My spouse or partner" and "Another family member" in onboarding | §42.25.1, §5.1, §5.10 |
| 2.21 | Toddler and child meal planning *(clinically gated)* | Age-specific meal planning for children beyond the infant module: child-friendly recipes, school-day and lunchbox planning, picky-eating support, variety tracking | §2.2, §12.2 |
| 2.22 | Fitness and sports planning | Workout-day and rest-day variations, pre- and post-workout meal suggestions, performance tracking | §2.5 |
| 2.23 | Pregnancy and breastfeeding nutrition *(clinically gated)* | Goal workflows from §5.3, with no calorie restriction (§6.3) | §2.6, §5.3, §6.3 |

Phase 2 functional requirements: FR-025, FR-027 and FR-042–FR-052 (§20).

---

## 43.4 Release Phase 3 — Advanced Product Capabilities

**Goal:** advanced capabilities once there are enough users and reliable data. These are harder to build and should follow actual user needs.

| # | Feature | Phase 3 scope | Specification |
|---|---|---|---|
| 3.1 | Adaptive meal plans | Journal-driven week-over-week adaptation with user approval | §42.13, §17.4 |
| 3.2 | Long-term plan frameworks | Three-month, six-month and custom-duration plans as adaptive frameworks with periodic reviews (not rigid daily menus) | §10.2 |
| 3.3 | Weekly Nutrition Autopilot | Weekly review → new plan → grocery list → calendar → reminders, user-approved | §42.14 |
| 3.4 | Personal Nutrition Twin | Transparent, correctable learned habits model | §42.15 |
| 3.5 | Nutrition Confidence Score | Daily record completeness and data-confidence indicator | §42.20 |
| 3.6 | Advanced nutrient gap detection | Pattern-based gaps across recorded intake, including micronutrients | §42.12 |
| 3.7 | Restaurant and Takeaway Assistant | Restaurant meal estimates as ranges, alternatives, log to journal | §42.22 |
| 3.8 | Wearable and health data integrations | Small set of well-supported integrations, explicit permission | §42.23, §38.7, FR-030 |
| 3.9 | Dietitian / professional mode and marketplace | Professional dashboard, journal and plan review, recommendations, appointment report export, consultations; Professional plan tier | §42.24, §13.5, §28.2, §30.4, §38.8, FR-028 |
| 3.10 | Advanced pediatric nutrition features | More sophisticated features beyond the basic module, for older children and complex scenarios, as clinically validated | §12, §42.10 |
| 3.11 | Advanced progress analytics | Adherence and outcome pattern analysis | §4 (Advanced analytics), FR-029 |
| 3.12 | Seasonal meal planning | Seasonal recommendations based on availability and price; enables the seasonal budget preset | §38.5, §42.7 |
| 3.13 | Grocery service integrations | Send shopping lists to supported grocery services | §38.6 |
| 3.14 | Offline support | Saved recipes, current plans and shopping lists offline, with sync | §38.9 |
| 3.15 | International expansion | Local food data, prices, recipes, interfaces, clinical guidance and regulation per country | §38.10 |
| 3.16 | Native mobile applications | Android/iOS apps when native notifications, offline access or device capabilities become important | §22.1 |
| 3.17 | Supplement information *(with safety restrictions)* | Reviewed supplement information that never presents supplements as required | §2.5 |

Phase 3 functional requirements: FR-028–FR-030 and FR-053–FR-059 (§20).

---

## 43.5 Not Scheduled (Deferred Indefinitely)

Keep these out of every phase until there is an explicit product decision (§32.2):

- Support for every medical condition (conditions are added individually under 2.18).
- Automatic medication-aware nutrition management.
- Social feeds and community features.
- Complex multi-clinic workflows.
- Fully autonomous AI recipe creation for high-risk users.
- Six-month rigid daily meal generation (long-term plans are frameworks, 3.2).

---

## 43.6 Superseded and Merged Items

To keep one specification per feature:

| Earlier item | Now specified by | Note |
|---|---|---|
| §38.1 Family Nutrition | §2.8 + §42.9 | Release Phase 2 (2.15) |
| §38.2 AI Meal Photography | §41 | Promoted to Release Phase 1 (1.11) |
| §38.3 Voice-Based Nutrition Assistant | §42.2 AI Nutrition Coach + §42.3 voice input | Release Phase 2 (2.1, 2.8) |
| §38.4 Pantry-Aware Planning | §42.8.2 | Release Phase 2 (2.5) |
| §19.1 Main Navigation | §42.25.1 | Calendar now lives inside "My Plan" |
| §4 priority column, §32, §40 priorities | This catalog | Labels there are historical |
| §16 "Shopping lists" in MVP vs review's Phase 2 | Basic list Phase 1 (1.18), enhancements Phase 2 (2.4) | Basic list is cheap and needed for the plan workflow |
| §15.3 Meal Substitution vs review's Smart Meal Swapping in Phase 2 | Similar-nutrition replacement Phase 1 (1.8), other modes Phase 2 (2.2) | FR-016 is a Must |
| §4 "Professional dashboard: Phase 2" | Release Phase 3 (3.9) | Per-plan clinical review for gated cases stays in Phase 1 (1.10) |
| §14.3 task states, §17.3 adherence, §41.5.3 adherence states, §42.16 daily actions | §14.6 Unified Meal Status Model | One status model |
| §35 Step 11, §41.13, §42.18 weekly habit review, §42.19, §42.14 | §17.6 Weekly Review | One screen that grows by phase |
| §4 "Multiple profiles: Phase 2" vs Phase 1 baby profiles | §5.10 | Dependent child profiles in Phase 1; other adults in Phase 2 |
| §19.1 / §42.25 navigation and quick actions vs the design guide | §44.5, §44.6, §44.17 | Five mobile tabs; one primary home action |

---

## 43.7 Open Decisions

These need a product-owner decision. Until one is made, do not implement a choice for them.

1. **Monetization tiers:** which tier includes the AI Food Journal, the AI Coach and dependent child profiles (§30). Safety guidance stays free whatever is decided.
2. **Phase 1 reminder delivery:** which channel the web app uses before native apps (for example web push or email) (§26, §22.1).
3. **Baby module at launch:** whether Release Phase 1 launches with the baby-feeding module (1.20) or adds it once clinical validation is complete.
4. **Design tokens:** approve the proposed accessible text variants `#616762` (small muted text) and `#A26249` (Terracotta text) (§44.2.2); define the semantic state colors (success, info, caution, safety alert) (§44.13); choose the Bengali font (§44.3).

---

# 32. MVP Scope

> **Phasing:** Release Phase 1 (Essential MVP) is defined in §43.2, which supersedes the feature lists below where they differ. The AI Food Journal (§41) is part of Phase 1.

The biggest risk in this product is trying to build everything at once.

The platform covers several different product categories: general nutrition, infant feeding, medical nutrition, recipe management, calendar scheduling, and family coordination.

A controlled MVP will allow the team to validate the main product loop before expanding.

## 32.1 Recommended MVP Features

### User management
- Account registration and login.
- Profile creation.
- Profile editing.
- Basic preferences.

### Nutrition assessment
- Adult age and body measurements.
- Lifestyle and activity assessment.
- Dietary preferences.
- Allergy recording.
- Basic supported-goal assessment.
- Clearly defined eligibility restrictions.

### Food and recipes
- Initial curated food database.
- Initial curated recipe database.
- Nutritional calculations.
- Ingredient substitutions.
- Recipe detail screens.

### Meal planning
- Three-day plans.
- Seven-day plans.
- User-selected meal schedules.
- Basic nutrition targets.
- Plan validation.
- Meal replacement.

### Calendar
- In-app calendar.
- Meal reminders.
- Completion tracking.
- Rescheduling.

### Shopping
- Automatic grocery list.
- Consolidated ingredient quantities.
- Basic estimated cost.

### Progress
- Basic weight tracking for eligible adults.
- Meal completion tracking.
- Plan revision.

### Infant feeding
- Separate child profile.
- Age calculation.
- Clinically reviewed feeding guidance.
- Approved recipe selection.
- Age-specific safety validation.
- Food introduction tracking.

**Launch restriction:** Infant meal-plan generation should be enabled only for the age ranges and scenarios that have completed clinical validation. More complex pediatric or medical scenarios should be escalated.

## 32.2 Features to Defer

Do not prioritize these in the first development cycle:

- Support for every medical condition.
- Six-month daily meal generation.
- Automatic medication-aware nutrition management.
- Wearable integrations.
- Advanced predictive analytics.
- Social feeds.
- Community features.
- Grocery delivery integrations.
- Complex multi-clinic workflows.
- Fully autonomous AI recipe creation for high-risk users.

These can be introduced when the core system is reliable.

---

# 33. Development Roadmap

A possible roadmap for a small, experienced development team is outlined below.

Actual timelines will depend on team size, design capacity, clinical review availability, integrations, and the scope of the initial release.

## Phase 1: Product Definition and Validation

**Estimated duration: 2–3 weeks**

Deliverables:

- Finalized PRD.
- User journeys.
- UX wireframes.
- Data model.
- Initial nutrition scope.
- Food database strategy.
- Clinical review plan.
- Security and privacy requirements.
- MVP acceptance criteria.

## Phase 2: Core Platform

**Estimated duration: 3–5 weeks**

Deliverables:

- Authentication.
- Profile management.
- Onboarding.
- Food database.
- Recipe database.
- Initial admin interface.
- Nutrition calculation services.

## Phase 3: Meal Planning and AI

**Estimated duration: 3–5 weeks**

Deliverables:

- Nutrition assessment.
- Meal selection engine.
- AI orchestration.
- Structured plan generation.
- Recipe and meal validation.
- Plan editing.
- Meal substitution.

## Phase 4: Calendar and Daily Workflow

**Estimated duration: 2–3 weeks**

Deliverables:

- In-app calendar.
- Meal tasks.
- Notifications.
- Meal-completion tracking.
- Shopping lists.
- Basic progress tracking.

## Phase 4A: AI Food Journal and Daily Nutrition

**Estimated duration: not yet estimated. Can overlap with Phases 3–4.**

Deliverables:

- Secure image upload and private storage.
- AI food identification and food-database matching.
- Portion estimation, including local portion units.
- Confirmation and correction interface.
- Manual and text logging.
- Nutrition calculation and daily aggregation.
- Daily nutrition dashboard.
- Planned vs. actual comparison and the unified meal status model (§14.6).
- Meal- and day-level recommendations.
- Food-journal evaluation set built from verified food records (§41.12).

## Phase 5: Infant Feeding and Safety Validation

**Estimated duration: 3–6 weeks or longer**

Deliverables:

- Child profile.
- Age-specific rules.
- Approved recipe collection.
- Food introduction tracking.
- Safety checks.
- Professional review workflow.
- Clinical content validation.
- Safety testing.

This phase can overlap with other development work, but clinical validation must not be skipped to meet a delivery date.

## Phase 6: Testing and Controlled Launch

**Estimated duration: 2–4 weeks**

Deliverables:

- Functional testing.
- Security testing.
- Nutrition calculation testing.
- Safety test suite.
- User acceptance testing.
- Monitoring.
- Documentation.
- Controlled beta launch.

These durations are planning estimates, not commitments. Several phases may overlap, and a broader clinical scope will increase the timeline.

---

# 38. Future Enhancements

> **Phasing:** each enhancement below is assigned a release phase in §43. §38.1, §38.3 and §38.4 are now specified in §42; §38.2 is specified in §41 and is in Release Phase 1 (see §43.6).

After the core application is stable, the following capabilities could significantly expand its value.

## 38.1 Family Nutrition

Generate coordinated meal plans for multiple household members.

The system could identify common meals and produce individual portion or preparation instructions.

## 38.2 AI Meal Photography

Allow users to upload a meal photograph and receive assistance identifying possible ingredients or recording a meal.

Photo-based portion estimation should be presented as uncertain and must not replace reliable measurement when accuracy is important.

## 38.3 Voice-Based Nutrition Assistant

Allow users to ask:

- "What should I eat for lunch today?"
- "I don't have fish at home. What can I replace it with?"
- "Give me a quick breakfast for tomorrow."
- "What ingredients do I need for this week's meals?"

The assistant should retrieve information from the user's validated plan and food database.

## 38.4 Pantry-Aware Planning

Users can record ingredients already available at home.

The planner prioritizes suitable existing ingredients while preserving nutritional and safety constraints.

## 38.5 Seasonal Meal Planning

The system can recommend seasonal foods and adjust recipes based on availability and price.

## 38.6 Grocery Integrations

Where supported, users could send shopping lists to grocery services.

## 38.7 Wearable Integrations

Activity data from supported devices could improve the context used for nutrition assessment.

However, automatically changing nutritional targets based on noisy wearable estimates should be approached carefully.

## 38.8 Professional Nutritionist Marketplace

Users could book consultations with qualified nutrition professionals.

The platform could support assessment sharing, plan review, and follow-up.

## 38.9 Offline Support

Users could access saved recipes, current meal plans, and shopping lists without a continuous internet connection.

Synchronization would occur when connectivity returns.

## 38.10 International Expansion

The platform could expand to additional countries by adding:

- Local food-composition data.
- Local prices.
- Regional recipes.
- Localized interfaces.
- Country-specific clinical guidance.
- Applicable privacy and regulatory requirements.

---

# 40. Recommended Development Priorities

> **Phasing:** the priority groups below are historical rationale. The authoritative release phases are in §43.

I recommend building the application in the following order.

**Priority 1 — Foundation**
- User accounts.
- Profile management.
- Food database.
- Recipe database.
- Nutrition calculation engine.

**Priority 2 — Core Value**
- Personalized assessment.
- Three-day and seven-day meal plans.
- Recipe details.
- Meal substitution.
- Nutritional validation.

**Priority 3 — Daily Usage**
- Calendar.
- Meal reminders.
- Completion tracking.
- Shopping lists.
- Basic progress monitoring.

**Priority 4 — Specialized Nutrition**
- Infant feeding.
- Age-specific rules.
- Child profiles.
- Clinically reviewed recipes.
- Safety escalation.

**Priority 5 — Growth**
- Family plans.
- Professional review.
- Premium subscriptions.
- External integrations.
- Advanced personalization.

The infant feeding module should be developed alongside the foundation where appropriate, but its public launch must remain dependent on clinical validation and safety testing.

## The single most important technical decision

**Do not let the AI model independently decide what a person should eat.**

Let validated nutritional calculations, food data, age-specific rules, medical restrictions, and safety checks determine what is permissible and appropriate. Let AI help personalize the selection, explain the plan, and make it easier to follow.

This architecture will make the application more reliable, easier to test, easier to maintain, and safer to expand.

## The single most important product decision

**Optimize for helping people follow a good plan, not merely for generating an impressive plan.**

A diet chart that looks perfect but requires expensive ingredients, complicated cooking, or unrealistic meal timing will not help users for long.

The product should generate plans that people can realistically afford, prepare, understand, and maintain.

That is the difference between a basic diet generator and a useful long-term nutrition platform.
