# 17. Progress Tracking and Plan Adjustment

The application should help users understand whether their plan is practical and whether adjustments may be needed.

## 17.1 Adult Progress Tracking

Potential fields include:

- Weight.
- Meal completion.
- Self-reported energy levels.
- Hunger and fullness.
- Exercise activity.
- Sleep duration.
- Optional measurements relevant to a specific goal.

The system should avoid requiring daily weight measurements.

Users should be able to choose an appropriate tracking frequency.

## 17.2 Infant and Child Progress

Track, where appropriate:

- Feeding opportunities.
- Foods introduced.
- Food acceptance.
- Reported reactions.
- Growth measurements.
- Feeding difficulties.

Do not treat a child's growth or food acceptance as a competition or score.

## 17.3 Plan Adherence

The system can calculate a simple adherence measure:

**Adherence rate = completed planned meals ÷ total eligible planned meals × 100**

For example, if a user completes 18 of 21 eligible planned meals, the recorded adherence rate is approximately 85.7%.

This metric must be interpreted carefully.

Skipping a meal, changing a meal, and recording an incomplete meal should not be treated identically in every context.

The application should not shame users for low adherence.

## 17.4 Plan Adjustment Rules

The system may suggest a plan review when:

- The user's weight changes materially.
- The user's activity level changes.
- Work hours change.
- A user repeatedly cannot prepare planned meals.
- The food budget changes.
- The user reports persistent hunger or poor tolerance.
- A relevant health condition changes.
- A child moves into a different developmental stage.

Changes to clinically significant targets should follow validated rules.

The AI should not independently modify medical nutrition requirements simply because a user reports a few days of non-adherence.

## 17.5 Feedback Loop

After selected meals, the user may answer:

- Did you eat this meal?
- Was the portion appropriate?
- Were the ingredients available?
- Was preparation easy?
- Did you enjoy the meal?
- Would you like a similar meal again?

This feedback can improve future meal selection without overriding health or safety constraints.

## 17.6 Weekly Review (Single Flow)

Several sections describe an end-of-week review: §35 Step 11, §41.13, §42.18 (weekly habit review), §42.19 (progress insights), §42.13 (adaptive suggestions) and §42.14 (Weekly Autopilot). These are **one Weekly Review screen** whose content grows with each release phase, not separate features:

| Weekly Review component | Release phase |
|---|---|
| Adherence and planned-vs-actual summary, recurring patterns, "Would you like to revise your plan?" (§17.3, §35 Step 11, §41.13) | 1 |
| Habit review (§42.18) and explained insights (§42.19) | 2 |
| Adaptive next-week suggestions (§42.13), Autopilot plan with grocery list and calendar proposal (§42.14), record-confidence summary (§42.20) | 3 |

A single weekly-review reminder (§42.17) opens this screen. Nothing it proposes takes effect until the user approves it.

---

# 42.18 Habit Builder and Lifestyle Tracking

*Related to §17.1 (Adult Progress Tracking).*

A healthy lifestyle involves more than food. The habit system helps users build manageable routines without overwhelming them. Trackable habits:

- Water intake.
- Regular meal times.
- Fruit and vegetable consumption.
- Physical activity.
- Sleep duration.
- Meal preparation.
- Consistency with the planned routine.

**Personalized habits:** instead of giving everyone the same checklist, the app selects a few habits based on the user's goals. For example, someone who often skips breakfast gets a reminder to prepare a simple breakfast the night before. Someone who wants to improve their diet starts with one manageable goal, such as including a suitable protein source in a particular meal.

**Weekly habit review**, shown at the end of each week:

- Habits completed consistently.
- Habits the user struggled with.
- Changes in recorded food intake.
- One or two suggested priorities for the coming week.

The goal is lasting habits, not guilt about missing a day (§17.3 no shaming). Show habits without streak counters, scores or reward effects (§44.12). Habits for children's profiles follow age-appropriate rules and are never scored as a competition (§17.2).

---

# 42.19 Progress Insights That Explain Why

*Extends §17 (Progress Tracking) and §19.2.*

Many apps show charts; this app explains what the charts mean. Examples:

- *"You logged more protein on the days you prepared meals at home. Planning two simple lunches ahead of time might help you maintain that routine."*
- *"You frequently miss your planned afternoon snack on busy workdays. Would you like a few quick alternatives?"*

Progress views:

- Food logging consistency.
- Actual meals compared with planned meals.
- Estimated calorie and nutrient trends.
- Changes in body measurements, where relevant.
- Habit completion.
- Meal preparation patterns.
- Estimated food spending.
- User-reported hunger, energy and satisfaction.

**Rules:** insights are based on recorded information and state their limitations. **Distinguish correlation from causation.** For example, never claim a food caused weight loss just because the two happened around the same time.

---

# 42.23 Wearable and Health Data Integration

*Extends §38.7 (Wearable Integrations), §4 and FR-030.*

With explicit permission, users can connect supported health and fitness services to import, depending on the integration:

- Steps and physical activity.
- Exercise sessions.
- Sleep duration.
- Body weight.
- Heart-rate data.
- Other supported measurements.

Activity data provides context for nutrition planning. For example, a user who had an unusually active day may get suitable guidance about meals and hydration.

**Rules:** never automatically raise food targets based on every wearable calorie estimate. Wearable energy expenditure is itself an estimate, so avoid false precision. Start with a small number of well-supported integrations rather than trying to connect every device at launch.
