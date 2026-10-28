# 14. Calendar and Daily Task Integration

The calendar is a major differentiator because the product should help users follow their plans, not merely generate them.

## 14.1 Calendar Features

Users should be able to:

- Add a meal plan to the in-app calendar.
- Schedule individual meals.
- Schedule an entire week.
- View meals in daily, weekly, and monthly formats.
- Move a meal to a different time.
- Mark a meal as completed.
- Skip a meal.
- Record a replacement meal.
- Pause a plan.
- Reschedule meals when work hours change.
- Receive reminders.
- Export supported events to external calendars.

## 14.2 Example Daily Schedule

An office worker might have:

| Time | Calendar item |
|---|---|
| 8:30 AM | Breakfast |
| 12:45 PM | Prepare for lunch |
| 1:00 PM | Lunch |
| 4:30 PM | Planned snack |
| 8:30 PM | Dinner |

The system should allow the user to change these times according to actual availability.

It should not force a meal at an arbitrary time simply because the default template specifies it.

## 14.3 Task Management

Each scheduled meal should behave like a task.

Example task:

```json
{
  "taskType": "meal",
  "title": "Lunch",
  "scheduledAt": "2026-11-02T13:00:00",
  "status": "pending",
  "linkedMealId": "meal_123",
  "reminderEnabled": true,
  "completionData": null
}
```

Possible task states:

- Upcoming.
- Due.
- Completed.
- Skipped.
- Rescheduled.
- Replaced.

The system should distinguish between a skipped meal and a completed meal with a different food choice.

## 14.4 External Calendar Integration

The application may support Google Calendar, Apple Calendar, or other supported services.

For the initial release, it may be sufficient to provide:

- In-app calendar.
- Downloadable calendar events in a supported format.
- Google Calendar integration in a later release.

The system must avoid creating duplicate events when a user updates or regenerates a plan.

Where an external calendar is connected, users should explicitly authorize access and be able to disconnect it.

Sensitive health details should not be placed in external calendar event titles by default.

For example, an event titled "Lunch" is preferable to one that reveals a medical condition.

## 14.5 Smart Rescheduling

If a user changes their working hours, the application should identify affected meals.

It may suggest:

- Moving lunch.
- Preparing a portable snack.
- Replacing a meal that is no longer practical.
- Moving meal preparation to the previous evening.

Any rescheduled or replaced meal should be validated again when the change affects nutritional or safety constraints.

## 14.6 Unified Meal Status Model

§14.3 (task states), §17.3 (adherence), §41.5.3 (planned vs actual) and §42.16 (daily actions) describe the same planned meal from different angles. They share one model with two fields.

**Schedule status** (when): `upcoming` → `due`, plus `rescheduled` and `paused` (plan paused, §14.1). The `"pending"` value in the §14.3 example means `upcoming`.

**Outcome** (what happened), set when the meal is resolved:

| Outcome | Set by | Adherence (§17.3) |
|---|---|---|
| `eaten_as_planned` | "Mark as eaten" | Completed |
| `eaten_modified` | "Log actual meal", where the logged meal differs from the plan | Completed, flagged as modified |
| `replaced` | "Replace meal" (§15.3, §42.11), or logging a different meal instead | Completed with a different food choice |
| `skipped` | "Skip" | Not completed |
| `unresolved` | No action by the end of the day | Shown as unknown, never assumed skipped or completed |

Rules:

- "Mark as eaten" records the planned recipe and portions as consumed. "Log actual meal" links a food-journal entry to the meal (§41.7.2); the day's totals then come from that entry, not from the plan.
- Unplanned meals and snacks are journal entries with no linked planned meal (§41.5.3 "unplanned").
- Uncertain journal records keep their uncertainty (§41.3.4) and lower the day's record confidence (§42.20).
- "Prepare later" creates or moves a meal-preparation task (§16.4). It does not change the meal's outcome.
- Modified, replaced and skipped meals are never treated identically (§17.3), and none of them triggers shaming or compensation advice.

---

# 42.16 Unified Calendar and Daily Task System

*Extends §14 (Calendar and Daily Task Integration).*

The calendar becomes a **daily nutrition schedule**:

**Today's plan**
- Breakfast.
- Morning snack, if applicable.
- Lunch.
- Afternoon snack, if applicable.
- Dinner.
- Water reminders, if enabled.
- Meal-preparation tasks.

Every planned meal has simple actions:

- **Mark as eaten**
- **Log actual meal** (opens the food journal pre-linked to the planned meal, §41.5)
- **Replace meal** (§42.11)
- **View recipe** (§15)
- **Prepare later**

When a user records what they actually ate, the app compares it with the planned meal. If the user substitutes a meal, the app updates the food journal and the relevant nutrition summaries. This creates one workflow from planning to doing to reviewing.

---

# 16. Shopping List and Meal Preparation

This module converts a meal plan into a practical grocery list.

## 16.1 Automatic Shopping List

The system should aggregate ingredients across selected meals and dates.

For example, a seven-day plan may use rice, lentils, eggs, fish, vegetables, and fruit repeatedly.

The shopping list should consolidate quantities instead of displaying a separate entry for every recipe.

## 16.2 Shopping List Features

- Group ingredients by category.
- Combine duplicate ingredients.
- Show total required quantities.
- Allow manual quantity adjustments.
- Mark items as purchased.
- Identify optional ingredients.
- Show estimated cost.
- Allow users to remove ingredients.
- Recalculate affected recipes when relevant.
- Support sharing with family members.

## 16.3 Budget Optimization

The system should suggest lower-cost alternatives when the planned meals exceed the user's budget.

It should evaluate whether substitutions preserve:

- Nutritional adequacy.
- Medical suitability.
- Allergen restrictions.
- Age suitability.
- Recipe practicality.

The cheapest option should not automatically replace a nutritionally important food if doing so creates an inadequacy.

## 16.4 Meal Preparation Planning

A weekly preparation view can group tasks.

Example:

**Sunday preparation**
- Wash and prepare selected vegetables.
- Cook suitable ingredients in advance.
- Portion and refrigerate or freeze foods according to safe storage guidance.
- Prepare ingredients for upcoming lunches.

The application must provide food-safety instructions appropriate to the foods and storage methods involved.

For infants and medically vulnerable users, storage and reheating guidance must be particularly careful.

---

# 42.8 Smart Grocery Lists and Pantry Management

*Extends §16 (Shopping List and Meal Preparation). Supersedes §38.4 (Pantry-Aware Planning), which is specified here.*

## 42.8.1 Grocery list additions

In addition to §16.1–§16.2, users can:

- Adjust quantities according to the number of people.
- Remove ingredients they already have.
- Replace unavailable ingredients (with recalculation, §8.4).

Quantities update automatically whenever the meal plan changes. For example, replacing three chicken meals with fish meals updates the shopping list.

## 42.8.2 Pantry management

Users record ingredients they already have at home, optionally with expiry dates. The app then recommends meals that use those ingredients before they expire, while preserving nutritional and safety constraints. This connects meal planning, grocery shopping, budget management and food-waste reduction into one workflow, and powers the "Use ingredients I already have" swap mode (§42.11) and the pantry-based budget plan (§42.7).

---

# 26. Notifications and Reminders

The application should support:

- Meal reminders.
- Meal preparation reminders.
- Shopping reminders.
- Plan review reminders.
- Progress-entry reminders.
- Food preparation notifications.
- Age-related review reminders for child profiles.

Notifications should be configurable.

Users should be able to disable nonessential notifications.

The application should avoid judgmental messages such as "You failed your diet."

Preferred messages are supportive and practical.

Example:

"Your lunch is scheduled for 1:00 PM. Would you like to view the recipe or choose an alternative?"

For infant feeding, reminders should support the parent's established routine and should not encourage rigid feeding schedules that conflict with responsive feeding.

---

# 42.17 Smart Reminders That Learn From the User

*Extends §26 (Notifications and Reminders).*

Avoid generic notifications such as "Drink water!" or "It's time to eat!" at arbitrary intervals. Users choose which reminders they want and when. Supported reminders, in addition to §26:

- Food logging.
- Water intake.
- Weekly reviews.
- Baby feeding records, when appropriate.

Over time, the app can suggest changes to reminder timing based on the user's preferences and usage. For example: *"You usually log dinner around 8:30 PM. Would you like your evening food-journal reminder at that time?"* Changes are suggested and the user accepts them; they are never applied silently. Notifications stay configurable, respectful and easy to disable.
