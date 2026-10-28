# 19. Application Screens and User Interface

The interface should be simple, modern, accessible, and easy to use.

## 19.1 Main Navigation

> **Updated:** the mobile navigation is the five-tab bottom bar in §44.5 (17-visual-design-system.md). §42.25.1 (later in this file) lists the destinations, and §44.17 maps them onto the tabs.

Recommended navigation:

1. Home.
2. My Plans.
3. Calendar.
4. Recipes.
5. Shopping List.
6. Progress.
7. Profile.

The exact navigation can vary between mobile and desktop layouts.

## 19.2 Home Dashboard

> **Layout and actions:** follow the dashboard hierarchy in §44.6, with one primary action, "+ Log a meal". View today's plan, View daily nutrition and Generate a new plan are secondary. "Ask AI Coach" appears as a secondary entry from Release Phase 2 (§44.17). When dependent child profiles exist (§5.10), a profile switcher is shown in the header.

The dashboard should show:

- Today's meal plan.
- Upcoming meal.
- Daily nutrition summary, when appropriate.
- Meal-completion progress.
- Upcoming preparation tasks.
- Shopping reminders.
- Relevant plan updates.
- A quick action to generate a new plan.

For a parent, the dashboard should display the selected child's profile and age-specific feeding information.

For a user with a medical condition, it should display relevant restrictions and reminders without exposing unnecessary sensitive information.

## 19.3 My Plans

Users should see:

- Active plan.
- Previous plans.
- Draft plans.
- Plan duration.
- Creation date.
- Goal.
- Current status.
- Next review date, if applicable.

Available actions:

- View.
- Edit.
- Duplicate.
- Pause.
- Archive.
- Generate a revised plan.

Editing a profile should not silently change an already confirmed plan.

The application should clearly distinguish between the current profile and the information used to generate each plan.

## 19.4 Plan Details

The plan screen should provide:

- Daily meal overview.
- Weekly calendar.
- Recipe access.
- Nutritional summary.
- Shopping list.
- Meal replacement.
- Completion tracking.
- Plan settings.

Users should be able to regenerate selected meals without necessarily regenerating the entire plan.

## 19.5 Accessibility

The interface should support:

- Readable text.
- Sufficient color contrast.
- Screen-reader compatibility.
- Keyboard navigation.
- Clear error messages.
- Localization.
- Metric measurements.
- Straightforward language.
- Avoidance of stigmatizing or judgmental weight-related language.

---

# 42.25 Main App Experience

*Updates §19.1 (Main Navigation) and §19.2 (Home Dashboard).*

Even with this many features, the app must not become complicated. The core goal is that users open the app and immediately understand what to do today.

## 42.25.1 Main navigation

| Section | Main purpose |
|---|---|
| Home | Today's plan, quick actions and a short daily overview. |
| My Plan | Daily, weekly, monthly and longer-term meal plans, including the calendar view (§14, §42.16). |
| Food Journal | Photo, voice, text and barcode-based food logging. |
| AI Coach | Personalized questions, food suggestions and practical guidance. |
| Recipes | Recipes, ingredients, preparation instructions and substitutions. |
| Progress | Nutrition trends, habits and progress over time. |
| Family | Separate profiles and age-appropriate family nutrition. |
| Shopping List | Ingredients, estimated costs and pantry management. |

> **Mobile layout:** these are destinations, not bottom tabs. On mobile they sit inside the five-tab bottom navigation of §44.5, as mapped in §44.17. The tab for Food Journal is labeled "Food Log".

Profile and settings stay reachable from every screen (§19.1 "Profile"). Sections whose features aren't released yet are hidden until their phase ships (§43). Exact navigation can vary between mobile and desktop.

## 42.25.2 Home screen quick actions

Prioritize four actions:

> **Hierarchy:** "Log a meal" is the single primary action. The other three are secondary (§44.6, §44.17).

1. **Log a meal** — the fastest route to recording food.
2. **View today's plan** — what to eat next.
3. **Ask AI Coach** — personalized help.
4. **View daily nutrition** — recorded intake and progress.

Keep the interface clean. Users should never need several screens just to record a meal.

---

# 20. Functional Requirements

The following requirements should be treated as the initial product backlog.

| ID | Requirement | Priority |
|---|---|---|
| FR-001 | Users can create and securely access accounts | Must |
| FR-002 | Users can create and update nutrition profiles | Must |
| FR-003 | The system calculates age from date of birth | Must |
| FR-004 | Users can enter height and weight where applicable | Must |
| FR-005 | Users can record activity and occupation | Must |
| FR-006 | Users can record dietary preferences | Must |
| FR-007 | Users can record allergies and health restrictions | Must |
| FR-008 | Users can specify goals and planning duration | Must |
| FR-009 | The system performs supported nutrition assessments | Must |
| FR-010 | The system retrieves food-composition data | Must |
| FR-011 | Users can generate a personalized meal plan | Must |
| FR-012 | Users can view meal ingredients and portions | Must |
| FR-013 | Users can access recipes and preparation instructions | Must |
| FR-014 | The system calculates meal nutrition from ingredients | Must |
| FR-015 | The system validates plans against safety restrictions | Must |
| FR-016 | Users can replace meals with alternatives | Must |
| FR-017 | Users can schedule meals in an in-app calendar | Must |
| FR-018 | Users can mark meals completed, skipped, or replaced | Must |
| FR-019 | Users can configure reminders | Must |
| FR-020 | Users can generate shopping lists | Must |
| FR-021 | Users can track basic progress | Must |
| FR-022 | Users can request a revised plan | Must |
| FR-023 | Infant plans follow validated age-specific rules | Must for infant launch |
| FR-024 | High-risk cases are escalated appropriately | Must |
| FR-025 | Users can manage multiple family profiles | Should |
| FR-026 | Users can export calendar events | Should |
| FR-027 | Users can share shopping lists | Should |
| FR-028 | Qualified professionals can review eligible plans | Should |
| FR-029 | Users can access advanced progress analytics | Could |
| FR-030 | Users can connect supported activity devices | Could |

"Must" indicates a requirement for the relevant release. Infant-specific requirements are mandatory before launching the infant module, not optional post-launch enhancements.

### Requirements added by §5.10, §14.6, §41 and §42

The release phase of every requirement, including FR-001–FR-030, is set in §43.

| ID | Requirement | Release phase | Spec |
|---|---|---|---|
| FR-031 | Users can log a meal by photo; AI proposes foods and portions that the user confirms or corrects | 1 | §41.2–§41.3 |
| FR-032 | Users can log meals manually or as typed text | 1 | §41.2, §42.3.1 |
| FR-033 | Nutrition for logged meals is calculated from confirmed foods using the food database | 1 | §41.3.5 |
| FR-034 | Users can view a daily nutrition dashboard of logged intake against targets | 1 | §41.4 |
| FR-035 | Users can compare planned and actual meals | 1 | §41.5 |
| FR-036 | Users receive context-aware recommendations after logging | 1 | §41.6 |
| FR-037 | Users can delete journal entries and manage their food photos | 1 | §41.7.3 |
| FR-038 | Each planned meal supports Mark as eaten, Log actual meal, Replace, View recipe and Prepare later | 1 | §42.16, §14.6 |
| FR-039 | Users can choose local portion units mapped to gram weights | 1 | §42.6.2 |
| FR-040 | Parents and caregivers can create and manage dependent child profiles | 1 | §5.10 |
| FR-041 | Users can review consent and withdraw it | 1 | §5.10, §21.4 |
| FR-042 | Users can ask the AI Nutrition Coach questions answered from their own data | 2 | §42.2 |
| FR-043 | Users can swap meals using cheaper, quick or use-what-I-have modes | 2 | §42.11 |
| FR-044 | Users can log meals by voice and by barcode | 2 | §42.3.1 |
| FR-045 | Users can save meals and confirm suggested usual meals | 2 | §42.3.1–§42.3.2 |
| FR-046 | Users can save and create personal recipes | 2 | §42.5 |
| FR-047 | Users can record pantry items and get use-before-expiry suggestions | 2 | §42.8.2 |
| FR-048 | Users can generate budget-preset plans and compare two meals | 2 | §42.7 |
| FR-049 | Users can check how a food would fit their day before eating it | 2 | §42.4 |
| FR-050 | Users can track personalized habits | 2 | §42.18 |
| FR-051 | Users see explained progress insights in the Weekly Review | 2 | §42.19, §17.6 |
| FR-052 | Households can plan shared meals with per-member serving guidance | 2 | §42.9 |
| FR-053 | Users receive adaptive plan suggestions to approve or reject | 3 | §42.13 |
| FR-054 | Users can run the Weekly Nutrition Autopilot | 3 | §42.14 |
| FR-055 | Users can review and correct their Nutrition Twin preferences | 3 | §42.15 |
| FR-056 | Users see a daily nutrition-record confidence indicator | 3 | §42.20 |
| FR-057 | Users are shown pattern-based nutrient gaps from their recorded intake | 3 | §42.12 |
| FR-058 | Users can get estimates for restaurant meals and log them | 3 | §42.22 |
| FR-059 | Users can grant a professional access to their journal and plans, and export an appointment report | 3 | §42.24 |

---

# 21. Non-Functional Requirements

## 21.1 Performance

Initial targets:

- Main dashboard loads within approximately two seconds under normal conditions.
- Cached profile and plan data should be returned quickly.
- Meal-plan generation should provide progress feedback when it takes longer than expected.
- Recipe and food searches should be responsive.
- Long-running AI requests should not block unrelated application functionality.

These are initial targets and should be measured under realistic traffic and device conditions.

## 21.2 Reliability

The system should:

- Preserve saved meal plans.
- Prevent duplicate calendar events.
- Recover gracefully from failed AI requests.
- Retry transient failures safely.
- Maintain database backups.
- Log critical failures.
- Support controlled plan regeneration.
- Keep a record of important changes to active plans.

## 21.3 Security

Requirements include:

- Secure authentication.
- Proper session management.
- Role-based access control.
- Encrypted communication.
- Secure storage of sensitive data.
- Protection against common web vulnerabilities.
- Rate limiting.
- Audit logging for privileged operations.
- Secure handling of third-party API credentials.
- Controlled access to professional-review records.

## 21.4 Privacy

Health-related information is particularly sensitive.

The application should:

- Collect only necessary information.
- Explain why information is requested.
- Obtain appropriate consent.
- Provide account and data deletion workflows.
- Allow users to manage profile information.
- Define data-retention periods.
- Avoid unnecessary disclosure to AI providers.
- Document third-party data processing.
- Avoid using identifiable health information for model training without appropriate authorization and consent.
- Restrict staff access to sensitive records.
- Keep analytics systems free of unnecessary personal health information.

The product should obtain legal review for the privacy and health-data requirements of each launch market.

## 21.5 Scalability

The architecture should support:

- Multiple user profiles.
- Large recipe and food databases.
- Asynchronous meal-plan generation.
- Background notifications.
- Growing AI usage.
- Multiple languages.
- Additional countries.
- Additional clinical modules.

AI generation should be isolated from core account, calendar, and food database services so that an AI provider outage does not make existing plans inaccessible.
