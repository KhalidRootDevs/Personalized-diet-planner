# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**NutriPlan** — a personalized nutrition & diet planning platform (HealthTech). It generates meal plans from a person's age, body measurements, activity/occupation, health conditions, allergies, dietary preferences, budget, cooking capacity and schedule, then turns them into recipes, shopping lists, calendar tasks and reminders, and adjusts them over time.

- **Initial market:** Bangladesh (English + Bangla, local foods, BDT budgets); architecture must allow international expansion.
- **Platforms:** responsive web first; Android/iOS later.
- **Vision:** "Personalized nutrition for every stage of life" — infants (6–12 months), toddlers/children, sedentary office workers, physically active workers, fitness users, users with health conditions, older adults, families.
- **Core product loop:** Assess → Plan → Validate → Schedule → Eat → Track → Improve.
- **AI Food Journal (§41, core feature):** users photograph, upload or manually log what they actually ate; the system identifies foods, estimates portions, has the user confirm, calculates nutrition deterministically, and compares actual intake with the personalized plan and targets to give context-aware suggestions. Works standalone as a food diary and integrated with the meal planner.
- **Positioning (§42.1):** "Your personal AI nutrition companion that helps you plan what to eat, understand what you actually eat, and make healthier choices in real life." Five differentiators: AI Food Journal, Adaptive Meal Planner, Local (Bangladeshi) Food Intelligence, Personal AI Coach, Family Nutrition (incl. baby feeding). The connected experience matters more than the number of features.

**Current state:** specification plus a clickable stakeholder prototype; no production code exists yet. The full Product Requirements Document lives in [`docs/prd/`](docs/prd/). It is the source of truth for features; do not drop, change, or reinterpret features unless the user asks.

**Prototype:** [`prototype/`](prototype/) is an installable PWA demo (Next.js 16, Tailwind v4, shadcn/ui, zustand with localStorage, no backend) covering all phases with P1/P2/P3 badges. See [`prototype/README.md`](prototype/README.md). The production app will be Flutter or React Native, so treat the prototype as a flow/UI reference, not as the codebase. Its data is illustrative and its tier gating (`src/lib/features.ts`) is a proposal pending §43.7. Next 16 has breaking changes: read `prototype/node_modules/next/dist/docs/` before changing it.

## Non-negotiable rules (apply to all code and content)

These come from the PRD (§1.4, §10.5, §12.5, §13, §18.5, §25) and override convenience, taste, cost, or weight goals.

**Architecture**
- **The AI model never independently decides what a person should eat.** Deterministic, testable nutrition-engine code + validated food data + reviewed rules decide what is permissible. AI only personalizes selection among approved options, explains, translates, and helps navigation (§18, §40).
- Nutrition engine and validation layers stay authoritative and provider-independent. AI output must be **structured (JSON) and schema-validated**, never free prose that is trusted directly.
- **Hard safety constraints are separate from soft optimization preferences.** Popularity or low price must never make an unsafe recipe eligible.
- Plans that fail any safety-critical validation **must not be shown as valid or activated**; the activate endpoint rejects them.
- AI generation is isolated from accounts, calendar and food data so an AI outage never makes existing plans inaccessible.

**AI guardrails — never:**
- bypass allergy exclusions (enforce across meals, snacks, recipes, substitutions, shopping lists, AI variations);
- recommend unsafe infant foods/textures (e.g. honey before 12 months, whole nuts, choking hazards);
- apply adult equations (Mifflin–St Jeor, adult BMI) to infants or children;
- invent clinical references or nutrient values when data is missing;
- change medications, prescribe dosages, or diagnose a condition/deficiency from food data;
- claim a plan guarantees an outcome, or mark an unreviewed plan as professionally approved;
- generate a specialized clinical plan when required information is missing;
- auto-prescribe calorie restriction for infants, children, pregnant users, possible malnutrition, eating-disorder risk, or unsafe medical contexts.

When uncertainty is too high: ask, offer a safer alternative, or decline.

**AI Food Journal (§41.3, §41.6, §41.10)**
- Vision/multimodal AI only proposes candidate foods, cooking methods and portions. The food database supplies nutrient values, and the nutrition engine computes them **after user confirmation**. The language model is never the final authority on nutrient numbers.
- Never present photo estimates as exact. Show them as estimates with confidence labels (high/moderate/low, calibrated against measured performance, not assigned by the LLM), and keep **identification** uncertainty separate from **quantity** uncertainty. Use ranges or a clarifying question when confidence is low.
- Ask about hidden ingredients (oil, ghee, sugar, sauces, coconut milk) only when they could materially change the result. Never imply that oil or sugar content can be recovered from a photo, and keep per-meal questions minimal.
- Keep the original AI estimate separate from user-confirmed data. Store edit history, model version, food-DB version and calculation version. Recalculation must not rewrite the user's confirmed food information.
- Daily totals cover only logged items: warn that records may be incomplete, and account for meals not yet logged.
- **No compensatory restriction:** an over-target meal never triggers fasting, meal skipping, extreme restriction or excess exercise. Under-target intake never pushes a huge catch-up meal. Persistent low intake or unintended weight loss leads to professional guidance.
- Distinguish target vs range vs minimum vs clinical upper limit in both visuals and warnings. Exceeding a general target is not "dangerous".
- No adult calorie tracking or weight-loss coaching for infants or children. Recommendations respect allergies, preferences, budget and clinical rules. Never label foods as morally good or bad.
- Photos go in private storage with access control, no public URLs, metadata stripping and retention/deletion policies. Send them to third-party AI only with disclosure and authorization. Deleting a photo must not delete the nutrition history unless the user explicitly chooses that.
- If image analysis or the AI provider fails, manual logging must still work and no entry may be lost.

**Coach, insights and planning intelligence (§42)**
- The AI Coach answers from the user's validated plan, journal and food DB, never with generic advice or invented numbers. It suggests only options that pass hard constraints, and routes emergencies and complex clinical needs to professionals.
- All logging inputs (photo, text, voice, barcode, saved meals, recipe entry) produce the same structured journal entry and go through the same confirmation and deterministic calculation.
- Swap modes (similar / cheaper / quick / use what I have) and budget presets only re-rank options that are already safe. The cheapest option never creates a nutritional inadequacy.
- Nutrient gaps are worded as "Your recorded meals may be low in…", never as a diagnosed deficiency.
- Insights must state their limitations and separate correlation from causation. Restaurant and wearable estimates are ranges; never auto-raise targets from wearable calorie estimates.
- Adaptive plans, Autopilot and learned reminder timing are suggestions the user approves. A missed target never means a stricter diet. The Nutrition Twin is transparent and correctable, and doesn't draw conclusions from a few entries.
- The Confidence Score measures record completeness, not health. Family shared meals never give a baby a smaller adult portion. User-created recipes are not "reviewed" recipes.

**Data & domain correctness**
- Distinguish **raw vs cooked** food values; compute recipe nutrition from actual ingredient quantities and cooking yields.
- Substitutions always **trigger recalculation** — never assume nutritional equivalence.
- Distinguish: nutrient target ≠ estimated intake ≠ measured status ≠ diagnosed deficiency.
- Distinguish dietary **preference** from medical **restriction**/allergy (allergies are safety constraints).
- Estimates communicate uncertainty; use ranges instead of false precision.
- Every clinical rule is versioned with source, population, reviewer, approval status and next review date. Guideline changes go through controlled review, not automatic updates.
- Health conditions use support levels 1–4 (general → condition-aware → professional review required → unsupported/urgent). Emergency symptoms route to emergency guidance, not meal adjustments.

**Privacy & UX**
- Minimize health data collected and sent to AI providers (use internal IDs, strip identifiers). Health data stored separately from general profile where appropriate.
- Role-based access; family members cannot see each other's health data without authorization; support agents don't get full medical profiles.
- No sensitive health details in external calendar event titles ("Lunch", not a condition).
- Supportive, non-judgmental language — no shaming for adherence, no stigmatizing weight language, no fear-based monetization. Safety features are never paywalled.
- Infant feeding follows responsive-feeding principles; never encourage force-feeding or replacing breast milk/formula with water.

## Visual design (PRD §44 — read before building any UI)

- **Feel:** calm, credible, food-first, personal; an editorial wellness look, **not** an AI demo or futuristic dashboard.
- **Palette tokens:** primary Forest Green `#244C3A` · surface Sage `#DCE7D8` · canvas Warm Ivory `#FAF8F2` · card White `#FFFFFF` · accent Terracotta `#C8795B` (sparingly, decorative only) · text Charcoal `#292F2B` · Muted Grey `#7C837D` (large text, icons and borders only). Small muted text uses the proposed `#616762`, because Muted Grey and Terracotta fail AA for small text (§44.2.2). Semantic state colors are not yet defined; don't invent them (§43.7).
- **Type:** Inter or Geist. Newsreader only for occasional large titles. Tabular numerals for nutrition numbers. A Bengali-capable font is required for Bangla (§44.3).
- **Shape:** 4 px spacing base (8/16/24). Radii: cards 12–16, buttons 12–14, inputs 10–12. Flat surfaces with subtle borders; shadows only for real elevation.
- **Mobile navigation:** five tabs (Home, Plan, Food Log, Recipes, Profile). Shopping List sits in Plan, Progress in Home/Food Log, Family in Profile, and the AI Coach is a contextual entry point, not a chat-first tab (§44.17). Lucide icons, always with labels.
- **Home:** greeting → daily summary → meal timeline → one next step → secondary details. One primary action, "+ Log a meal".
- **Never:** purple/blue AI gradients, glassmorphism, competing primary actions, overloaded dashboards, streaks, food scores, confetti, moralizing red warnings, or animated numbers that suggest precision. Safety alerts (allergens, infant safety, emergencies) still get a clear, prominent alert state.
- **Child profiles:** softer Sage presentation, caregiver language, milestones and textures instead of calories, no gamification.
- Respect reduced motion. Never rely on color alone. Charts carry labels, units and text equivalents.

## Proposed tech stack (PRD §22 — suggested, not mandatory)

- **Frontend:** Next.js, TypeScript, React, Tailwind CSS, shadcn/ui (or similar accessible lib), a validated form library, TanStack Query or RTK Query, Lucide icons. Design tokens defined centrally (§44.13).
- **Backend:** Node.js, TypeScript, Express (or comparable), Zod for input/output validation, MongoDB, Redis (cache, rate limiting, job coordination), background worker for plan generation and notifications.
- Modular monolith with clear boundaries — do not split prematurely into microservices.

Suggested backend layout: §22.4 (core modules plus food-journal, image-analysis, nutrition-summary and consents for Phase 1; ai-coach, pantry, habits, insights and households for Phase 2; integrations for Phase 3). Proposed collections: §23, including §23.13 for the newer features.

REST API is versioned under `/api/v1/...` and grouped by module (§24). All endpoints enforce authorization, validate input, and return consistent errors. Long plan generation is asynchronous. Food journal endpoints live under `/api/v1/food-journal/entries...` and `/api/v1/nutrition/{daily-summary,daily-comparison,recommendations}` (§41.9). Image analysis may be asynchronous (§41.8.3). Notification preferences, consent and privacy, the admin clinical-review queue, and Phase 2/3 endpoints are proposed in §24.

## Release phases (PRD §43 is the single source of truth)

[§43](docs/prd/03-release-phases-roadmap.md) assigns **every feature exactly once** to a release phase and replaces the older labels in §4, §32, §38 and §40. Check §43 before planning or building any feature. If a feature's phase needs to change, update §43 rather than adding a second label elsewhere.

**Phase 1 core workflow:** Create a profile → Generate a meal plan → Record actual meals → Review nutrition → Receive useful recommendations.

- **Release Phase 1 (Essential MVP):** accounts; progressive onboarding; assessment and goals; knowledge base; food DB with core Bangladeshi foods and local portion units; verified recipes; 3- and 7-day plans with full validation; similar-nutrition meal replacement; allergy/food-safety protection; condition triage and escalation; **AI Food Journal** (photo, manual and text logging with corrections); daily nutrition dashboard; planned vs actual; meal/day recommendations; calendar and unified daily task actions; configurable reminders; automatic shopping list; basic progress and plan revision; basic baby-feeding module (clinically gated); privacy controls; English/Bangla; admin and clinical content publishing; analytics and safety metrics.
- **Release Phase 2 (Retention and convenience):** AI Nutrition Coach, extra swap modes, Bangladeshi food expansion, grocery enhancements and pantry, Budget Optimizer, saved meals and meal memory, voice and barcode logging, Personal Recipe Library, AI recipe variations, "What If I Eat This?", Habit Builder, explained progress insights, learning reminders, family profiles and shared meals, 1/14/30-day plans, Google Calendar, condition-aware modules (gated), subscriptions.
- **Release Phase 3 (Advanced):** adaptive meal plans, long-term frameworks, Weekly Autopilot, Nutrition Twin, Confidence Score, advanced nutrient gaps, restaurant assistant, wearables, dietitian mode and marketplace, advanced pediatric features, advanced analytics, seasonal planning, grocery integrations, offline, international expansion, native apps.
- **Not scheduled:** every medical condition at once, medication-aware management, social/community, multi-clinic workflows, autonomous AI recipes for high-risk users, rigid six-month daily menus (§43.5).
- §33's development phases 1–6 describe how **Release Phase 1** is built and launched.
- Clinically gated features ship only for scenarios that have passed clinical validation, which is never skipped to meet a date. Safety features are never deferred later than the feature they protect, and never paywalled.
- "Done" means the §37 and §41.11 acceptance criteria pass, not that a plausible diet chart is produced.
- **Open decisions (§43.7). Ask the user; don't pick one yourself:** which monetization tier includes the food journal, AI coach and child profiles; the Phase 1 reminder delivery channel on web; whether the baby module is part of the Phase 1 launch; design token approvals (accessible grey/terracotta variants, semantic colors, Bengali font).

**Cross-cutting models (use these, don't reinvent them):** profile ownership and consent (§5.10: primary profile plus dependent child profiles in Phase 1, other adults in Phase 2); unified meal status, meaning schedule status plus outcome (§14.6); one Weekly Review screen that grows by phase (§17.6); infant food journaling feeds the introduction tracker (§12.8).

## Testing expectations (PRD §34)

- Unit tests for energy/nutrient calculations, unit conversions, ingredient scaling, age calculation, plan duration, calendar scheduling, allergen exclusion.
- Dedicated **safety test suite** (allergens, infant choking hazards, age-inappropriate ingredients, unsupported conditions, missing clinical info, contradictory restrictions, raw/cooked portion states, unverified recipes, required review, emergency symptoms).
- Fixed AI evaluation set re-run whenever model, prompt, nutrition rules or retrieval logic change. Safety violations are tracked separately; good overall quality never offsets a safety failure.
- Food journal accuracy (identification, portion and nutrition error, across cuisines and mixed dishes) is evaluated against manually verified food records and measured portions, not user satisfaction (§41.12).

## PRD index — read the relevant file before working on a feature

Files are organized by domain. Each §42 extension sits in the same file as the base section it extends, so one file covers a whole feature area.

| File | Sections | Topics |
|---|---|---|
| [01-product-vision-principles-journey.md](docs/prd/01-product-vision-principles-journey.md) | doc info, §1, §42 intro, §42.1, §35, §39 | Document info, executive summary, problem, objectives, principles, positioning and differentiators, end-to-end journey, final recommendation |
| [02-users-personas-modules.md](docs/prd/02-users-personas-modules.md) | §2–4 | Target users and use cases, personas, module list |
| [03-release-phases-roadmap.md](docs/prd/03-release-phases-roadmap.md) | §43, §32, §33, §38, §40 | **Authoritative release phases**, core workflow, open decisions, superseded items; MVP rationale, development roadmap (including 4A Food Journal), future enhancements, priorities |
| [04-onboarding-and-profiles.md](docs/prd/04-onboarding-and-profiles.md) | §5 | 9-step onboarding, profile JSON, profile ownership and consent (§5.10) |
| [05-nutrition-assessment-knowledge-base.md](docs/prd/05-nutrition-assessment-knowledge-base.md) | §6–7 | Energy estimation, goals, macros and micros, BMI and growth, hydration, assessment output, knowledge base and source management |
| [06-food-database-recipes-localization.md](docs/prd/06-food-database-recipes-localization.md) | §8, §9, §15, §42.5, §42.11, §27, §42.6 | Food DB, raw vs cooked, substitutions, recipes, recipe screen, serving scaling, Personal Recipe Library, Smart Meal Swapping, localization, Bangladeshi Food Intelligence and local portions |
| [07-meal-planning-engine.md](docs/prd/07-meal-planning-engine.md) | §10, §11, §25, §42.7, §42.13–§42.15 | Plan flow, durations, validation, sample plan, optimization algorithm, Budget Optimizer, adaptive plans, Weekly Autopilot, Nutrition Twin |
| [08-food-journal-and-ai-coach.md](docs/prd/08-food-journal-and-ai-coach.md) | §41, §42.3, §42.4, §42.22, §42.20, §42.12, §42.2 | AI Food Journal (photo logging, image analysis, dashboard, planned vs actual, recommendations, data model, API, safety), multi-input logging and meal memory, What-If simulator, restaurant assistant, Confidence Score, nutrient gaps, AI Nutrition Coach |
| [09-calendar-shopping-reminders.md](docs/prd/09-calendar-shopping-reminders.md) | §14, §42.16, §16, §42.8, §26, §42.17 | Calendar and meal tasks, unified meal status model (§14.6), daily task actions, shopping lists, meal prep, smart grocery and pantry, notifications, smart reminders |
| [10-progress-habits-insights.md](docs/prd/10-progress-habits-insights.md) | §17, §42.18, §42.19, §42.23 | Progress, adherence, plan adjustment, feedback, Weekly Review (§17.6), habits, explained insights, wearables |
| [11-infant-family-clinical-safety.md](docs/prd/11-infant-family-clinical-safety.md) | §12, §42.10, §42.9, §13, §42.21, §42.24 | Infant/child feeding module, infant food journaling (§12.8), Baby Feeding Companion, family profiles and shared meals, condition support levels, clinical review, food safety and allergy protection, dietitian mode |
| [12-ai-architecture.md](docs/prd/12-ai-architecture.md) | §18 | Engine vs AI responsibilities, generation pipeline, structured output, guardrails, AI evaluation |
| [13-ux-and-requirements.md](docs/prd/13-ux-and-requirements.md) | §19, §42.25, §20, §21 | Screens, navigation and home quick actions, accessibility, FR-001–FR-059, non-functional requirements |
| [14-technical-architecture-data-api.md](docs/prd/14-technical-architecture-data-api.md) | §22–24 | Stack, architecture, backend modules, MongoDB collections, REST API |
| [15-admin-privacy-business-metrics.md](docs/prd/15-admin-privacy-business-metrics.md) | §28–31, §42.26 | Admin and clinical publishing, privacy/security/compliance, monetization, analytics and success metrics |
| [16-testing-risks-acceptance.md](docs/prd/16-testing-risks-acceptance.md) | §34, §36, §37 | Testing strategy, risks and mitigations, MVP acceptance criteria |
| [17-visual-design-system.md](docs/prd/17-visual-design-system.md) | §44 | Visual design: direction, palette and measured contrast, typography (incl. Bengali), spacing and shape, five-tab navigation, home hierarchy, photo-logging UX, plan/recipe UI, life-stage adaptations, charts, imagery, icons and motion, what to avoid, design tokens, accessibility checklist, MVP screens, reconciliation with §19/§42.25 |

Section numbers (§N) are stable — cite them in commits, issues and code comments when implementing a requirement (e.g. FR-015, §10.5).
