# 22. Suggested Technical Architecture

Given the application's combination of structured data, user profiles, recipes, AI generation, and scheduling, a modular full-stack architecture is appropriate.

The following is a proposed architecture, not a mandatory technology choice.

## 22.1 Frontend

Recommended:

- Next.js.
- TypeScript.
- React.
- Tailwind CSS.
- shadcn/ui or a similar accessible component library.
- A validated form library.
- TanStack Query or Redux Toolkit Query, depending on the team's existing conventions.

The initial product can be a responsive web application.

A dedicated mobile application can be added later if native notifications, offline access, and mobile-specific capabilities become important.

## 22.2 Backend

Recommended:

- Node.js.
- TypeScript.
- Express.js or a comparable backend framework.
- Zod for input and output validation.
- MongoDB for profile, recipe, and planning documents.
- Redis for caching, rate limiting, and background-job coordination where appropriate.
- A background worker for meal-plan generation and notifications.

The architecture should favor modular boundaries rather than prematurely splitting every feature into a separate microservice.

## 22.3 High-Level Architecture

```text
Next.js Web Application
          |
          v
API / Authentication Layer
          |
          v
Application Modules
          |
          +--------------------+
          |                    |
          v                    v
Nutrition Engine         AI Orchestration
          |                    |
          v                    v
Food Database            AI Provider
          |
          v
Recipe Validation
          |
          v
Meal-Plan Validation
          |
          v
MongoDB / Persistent Storage
          |
          v
Calendar + Tasks + Notifications
```

The nutrition and validation layers should remain authoritative even if the AI provider changes.

## 22.4 Suggested Backend Feature Structure

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── profiles/
│   ├── nutrition-assessment/
│   ├── nutrition-rules/
│   ├── food-database/
│   ├── recipes/
│   ├── meal-plans/
│   ├── meal-plan-validation/
│   ├── infant-feeding/
│   ├── medical-nutrition/
│   ├── calendar/
│   ├── tasks/
│   ├── notifications/
│   ├── shopping-lists/
│   ├── progress/
│   ├── professional-review/
│   ├── food-journal/          # §41 (Release Phase 1)
│   ├── image-analysis/        # §41.3, §41.8 (Release Phase 1)
│   ├── nutrition-summary/     # §41.4–§41.6 (Release Phase 1)
│   ├── consents/              # §5.10 (Release Phase 1)
│   ├── ai-coach/              # §42.2 (Release Phase 2)
│   ├── pantry/                # §42.8.2 (Release Phase 2)
│   ├── habits/                # §42.18 (Release Phase 2)
│   ├── insights/              # §42.19, §17.6 (Release Phase 2)
│   ├── households/            # §42.9 (Release Phase 2)
│   ├── integrations/          # §42.23 (Release Phase 3)
│   └── admin/
├── shared/
│   ├── database/
│   ├── cache/
│   ├── middleware/
│   ├── validation/
│   ├── errors/
│   └── utilities/
├── jobs/
├── config/
└── app.ts
```

Not every module must be implemented immediately.

The purpose of this structure is to establish clear boundaries between user-facing features, nutritional calculations, clinical rules, and AI orchestration.

---

# 23. Database Design

A document-oriented database can work well for this application, provided relationships, versioning, and validation are handled deliberately.

The following collections are proposed.

## 23.1 Users

Stores account information.

```text
users
- _id
- email
- passwordHash or authenticationProvider
- preferredLanguage
- timezone
- accountStatus
- createdAt
- updatedAt
```

Sensitive authentication information should be handled according to the chosen authentication architecture.

## 23.2 Profiles

Stores individual nutrition profiles.

```text
profiles
- _id
- ownerUserId
- profileType
- dateOfBirth
- relevantPhysiologicalAttributes
- height
- weight
- activityProfile
- occupation
- goals
- dietaryPreferences
- allergies
- healthConditions
- budgetPreferences
- schedulePreferences
- profileVersion
- createdAt
- updatedAt
```

Access controls must prevent one family member from accessing another member's health information without authorization.

## 23.3 Nutrition Assessments

```text
nutritionAssessments
- _id
- profileId
- profileVersion
- assessmentVersion
- inputSnapshot
- estimatedEnergy
- nutrientTargets
- restrictions
- warnings
- reviewStatus
- createdAt
```

The input snapshot allows the application to understand which profile information was used to generate a particular assessment.

## 23.4 Foods

```text
foods
- _id
- canonicalName
- localizedNames
- category
- preparationState
- servingDefinitions
- localPortionUnits (§42.6.2)
- nutrientValues
- allergenMetadata
- safetyMetadata
- dataSource
- dataVersion
- reviewStatus
- barcode, brand, ingredientLabel (packaged products, Release Phase 2, §42.3)
```

## 23.5 Recipes

```text
recipes
- _id
- name
- localizedNames
- description
- supportedAgeGroups
- ingredients
- instructions
- servingCount
- preparationTime
- cookingTime
- nutrition
- allergens
- safetyNotes
- source
- reviewStatus
- version
```

## 23.6 Meal Plans

```text
mealPlans
- _id
- ownerUserId
- profileId
- assessmentId
- title
- goal
- durationDays
- startDate
- endDate
- meals
- validationStatus
- professionalReviewStatus
- status
- version
- createdAt
- updatedAt
```

For large plans, individual meals can be stored in separate documents to avoid excessively large documents and to support efficient updates.

## 23.7 Meals

```text
meals
- _id
- mealPlanId
- profileId
- date
- mealType
- scheduledTime
- recipeId
- ingredientOverrides
- servingCount
- calculatedNutrition
- scheduleStatus (§14.6)
- outcome (§14.6)
- linkedJournalEntryId (§41.7)
- completionData
- validationVersion
```

## 23.8 Calendar Events

```text
calendarEvents
- _id
- userId
- profileId
- mealId
- provider
- externalEventId
- scheduledStart
- scheduledEnd
- syncStatus
- lastSyncedAt
```

## 23.9 Shopping Lists

```text
shoppingLists
- _id
- ownerUserId
- mealPlanId
- dateRange
- items
- estimatedTotalCost
- status
- createdAt
```

## 23.10 Progress Records

```text
progressRecords
- _id
- profileId
- recordedAt
- measurementType
- measurementValue
- unit
- source
- notes
```

For health-related records, implement appropriate access controls and data-retention policies.

## 23.11 Nutrition Rules

```text
nutritionRules
- _id
- ruleType
- targetPopulation
- condition
- constraints
- sourceReference
- version
- approvalStatus
- reviewedBy
- reviewedAt
- nextReviewAt
```

## 23.12 Audit Events

```text
auditEvents
- _id
- actorId
- action
- resourceType
- resourceId
- timestamp
- outcome
- metadata
```

Audit logs should not unnecessarily duplicate sensitive health information.

## 23.13 Collections for §5.10, §41 and §42

Proposed additional collections. Fields follow the conventions above; the release phase is in brackets.

```text
foodJournalEntries            [Phase 1]  schema: §41.7.1–§41.7.2
mealImages                    [Phase 1]
- _id, ownerUserId, profileId, journalEntryId, storageRef (private), metadataStripped,
  consentStatus, retentionUntil, createdAt

consents                      [Phase 1]
- _id, userId, profileId, consentType, consentVersion, grantedAt, withdrawnAt

notificationPreferences       [Phase 1]
- _id, userId, profileId, reminderTypes, scheduledTimes, channels, enabled, updatedAt

savedMeals                    [Phase 2]
- _id, profileId, name, items (foodId, quantity, unit), timesConfirmed, lastUsedAt

userRecipes                   [Phase 2]  same shape as recipes + ownerUserId, personalNotes;
                                         reviewStatus = "personal" (never "approved", §42.5)
pantryItems                   [Phase 2]
- _id, ownerUserId, foodId, quantity, unit, expiresAt, updatedAt

habits                        [Phase 2]
- _id, profileId, habitType, target, schedule, records, createdAt

coachConversations            [Phase 2]
- _id, userId, profileId, messages, dataSourcesUsed, modelVersion, retentionUntil

households                    [Phase 2]
- _id, ownerUserId, members (profileId, role, permissions), createdAt

integrationConnections        [Phase 3]
- _id, userId, provider, scopes, status, connectedAt, revokedAt

professionalAccessGrants      [Phase 3]
- _id, profileId, professionalId, scope, grantedAt, expiresAt, revokedAt
```

Coach conversations, images and imported device data follow the retention rules in §29.3 and are excluded from analytics (§21.4).

---

# 24. API Design

The API should be organized around product modules.

Example REST endpoints are shown below.

## Authentication

```text
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
```

## Profiles

```text
POST   /api/v1/profiles
GET    /api/v1/profiles
GET    /api/v1/profiles/:profileId
PATCH  /api/v1/profiles/:profileId
DELETE /api/v1/profiles/:profileId
```

Deletion should follow the product's privacy and retention policies.

## Nutrition Assessment

```text
POST   /api/v1/profiles/:profileId/assessments
GET    /api/v1/profiles/:profileId/assessments
GET    /api/v1/assessments/:assessmentId
```

## Food Database

```text
GET    /api/v1/foods
GET    /api/v1/foods/:foodId
GET    /api/v1/foods/search
```

## Recipes

```text
GET    /api/v1/recipes
GET    /api/v1/recipes/:recipeId
POST   /api/v1/recipes/:recipeId/nutrition-estimate
POST   /api/v1/recipes/:recipeId/validate
```

Recipe creation and publication should require suitable authorization and validation.

## Meal Plans

```text
POST   /api/v1/meal-plans/generate
GET    /api/v1/meal-plans
GET    /api/v1/meal-plans/:planId
PATCH  /api/v1/meal-plans/:planId
POST   /api/v1/meal-plans/:planId/validate
POST   /api/v1/meal-plans/:planId/activate
POST   /api/v1/meal-plans/:planId/revise
POST   /api/v1/meal-plans/:planId/duplicate
```

Generation should support asynchronous processing for longer plans.

The activation endpoint must reject plans that have failed mandatory validation.

## Meals

```text
GET    /api/v1/meal-plans/:planId/meals
PATCH  /api/v1/meals/:mealId
POST   /api/v1/meals/:mealId/complete
POST   /api/v1/meals/:mealId/skip
POST   /api/v1/meals/:mealId/replace
POST   /api/v1/meals/:mealId/log          # link a food-journal entry as the actual meal (§14.6)
```

## Calendar

```text
GET    /api/v1/calendar
POST   /api/v1/calendar/events
PATCH  /api/v1/calendar/events/:eventId
DELETE /api/v1/calendar/events/:eventId
POST   /api/v1/calendar/sync
GET    /api/v1/calendar/export            # downloadable calendar events (§14.4)
```

## Shopping Lists

```text
POST   /api/v1/shopping-lists/generate
GET    /api/v1/shopping-lists
GET    /api/v1/shopping-lists/:listId
PATCH  /api/v1/shopping-lists/:listId
```

## Progress

```text
POST   /api/v1/profiles/:profileId/progress
GET    /api/v1/profiles/:profileId/progress
GET    /api/v1/profiles/:profileId/adherence
```

## Food Journal and Daily Nutrition

Specified in §41.9.

## Notification Preferences

```text
GET    /api/v1/notification-preferences
PATCH  /api/v1/notification-preferences
```

## Consent and Privacy

```text
GET    /api/v1/consents
POST   /api/v1/consents
POST   /api/v1/consents/:consentId/withdraw
POST   /api/v1/account/deletion-request
```

## Clinical Review Queue (Admin)

```text
GET    /api/v1/admin/reviews
GET    /api/v1/admin/reviews/:reviewId
POST   /api/v1/admin/reviews/:reviewId/decision   # approve, modify or reject (§13.5)
```

## Release Phase 2 and 3 Endpoints (proposed)

```text
POST   /api/v1/coach/conversations                         # Phase 2, §42.2
POST   /api/v1/coach/conversations/:conversationId/messages
POST   /api/v1/nutrition/simulate                          # Phase 2, §42.4
GET    /api/v1/meals/:mealId/alternatives?mode=similar|cheaper|quick|pantry   # similar: Phase 1; others: Phase 2
GET    /api/v1/saved-meals                                 # Phase 2, §42.3
POST   /api/v1/saved-meals
GET    /api/v1/user-recipes                                # Phase 2, §42.5
POST   /api/v1/user-recipes
GET    /api/v1/pantry                                      # Phase 2, §42.8.2
POST   /api/v1/pantry
PATCH  /api/v1/pantry/:itemId
GET    /api/v1/profiles/:profileId/habits                  # Phase 2, §42.18
POST   /api/v1/profiles/:profileId/habits
GET    /api/v1/profiles/:profileId/weekly-review           # Phase 1 content, grows per §17.6
POST   /api/v1/households                                  # Phase 2, §42.9
POST   /api/v1/households/:householdId/members
GET    /api/v1/meal-plans/:planId/adaptation-suggestions   # Phase 3, §42.13
POST   /api/v1/autopilot/weekly                            # Phase 3, §42.14
GET    /api/v1/integrations                                # Phase 3, §42.23
POST   /api/v1/integrations/:provider/connect
POST   /api/v1/professional-access                         # Phase 3, §42.24
DELETE /api/v1/professional-access/:grantId
GET    /api/v1/profiles/:profileId/reports/appointment
```

All endpoints must enforce authorization, validate input, and return consistent errors.
