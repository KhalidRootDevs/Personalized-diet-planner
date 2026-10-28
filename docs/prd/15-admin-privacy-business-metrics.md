# 28. Admin Dashboard and Content Management

The platform requires an administrative interface to manage food data, recipes, rules, and safety content.

## 28.1 Admin Features

Authorized administrators should be able to:

- Manage food entries.
- Manage recipe entries.
- Update food-composition data.
- Review AI-generated recipes.
- Manage localization.
- Publish approved content.
- Maintain nutrition rules.
- View validation failures.
- Manage user reports.
- Track content versions.
- Review audit events.

## 28.2 Professional Roles

Potential roles include:

- System administrator.
- Content editor.
- Nutrition professional.
- Clinical reviewer.
- Support agent.

Permissions must be separated.

A support agent should not automatically have access to a user's complete medical profile.

A content editor should not be able to publish high-risk clinical rules without the required review.

## 28.3 Clinical Content Publishing

A proposed workflow:

```text
Draft Rule
    |
    v
Source Verification
    |
    v
Professional Review
    |
    v
Safety Review
    |
    v
Approval
    |
    v
Versioned Publication
    |
    v
Monitoring and Scheduled Reassessment
```

Changes to clinical rules should be auditable and reversible where appropriate.

---

# 29. Privacy, Security, and Compliance

Nutrition information can reveal sensitive health information.

The product must be designed to protect it from the beginning.

## 29.1 Access Control

Users should only access profiles they own or are authorized to manage.

Family profiles need explicit permissions.

For example, an adult should not automatically be able to view another adult's complete health records simply because both are members of the same household.

## 29.2 Data Encryption

Use:

- TLS for communication.
- Secure password hashing if passwords are stored.
- Managed encryption at rest where available.
- Secure secret management.
- Restricted access to production databases.
- Appropriate backup protection.

## 29.3 Data Retention

Define retention periods for:

- Account data.
- Nutrition profiles.
- Meal plans.
- Health records.
- Audit logs.
- AI request logs.
- Backups.
- Food photographs (§41.7.3).
- AI coach conversations (§42.2).
- Imported wearable and health-service data (§42.23).
- Consent records (§5.10).

Avoid retaining sensitive information indefinitely without a documented purpose.

## 29.4 AI Provider Privacy

Before selecting an AI provider, evaluate:

- Data-retention terms.
- Use of submitted data for model training.
- Regional processing requirements.
- Contractual protections.
- Security certifications.
- Data deletion capabilities.
- Support for structured outputs.
- Reliability and cost.

The application should send only the information necessary for a particular task.

Where possible, use internal profile identifiers and remove unnecessary identifying information from AI requests.

## 29.5 Legal Review

Before launch, obtain appropriate legal review covering:

- Privacy and personal data.
- Health-related claims.
- Consumer protection.
- Children's data.
- Professional licensing.
- Medical device or health software classification where relevant.
- Third-party data processing.
- International expansion requirements.

The application should not claim regulatory approval or medical-device status unless the relevant requirements have actually been satisfied.

---

# 30. Monetization Strategy

The product could support a freemium business model.

## 30.1 Free Plan

Potential features:

- One primary profile.
- Basic nutrition assessment.
- Limited meal-plan generation.
- Basic recipes.
- In-app calendar.
- Basic reminders.
- Basic shopping lists.

Safety features must not be withheld from free users.

> **Open decision (§43.7):** the plans below don't yet say which tier includes the AI Food Journal (§41), the AI Coach (§42.2) or dependent child profiles (§5.10). "One primary profile" must not block a parent from using the baby-feeding safety guidance.

## 30.2 Premium Plan

Potential features:

- Longer planning horizons.
- More frequent plan revisions.
- Advanced recipe personalization.
- Budget optimization.
- Advanced progress tracking.
- More family profiles.
- Meal-preparation planning.
- Expanded recipe collections.
- External calendar integrations.
- Advanced reports.

## 30.3 Family Plan

Potential features:

- Multiple household profiles.
- Shared grocery lists.
- Household meal coordination.
- Different plans for each family member.
- Shared preparation schedules.
- Permission controls.

## 30.4 Professional Plan

Potential customers:

- Registered dietitians.
- Nutrition clinics.
- Healthcare practices.
- Maternal and child nutrition services.
- Qualified wellness professionals.

Potential features:

- Client management.
- Assessment review.
- Plan approval.
- Client progress reports.
- Professional notes.
- Secure messaging, if appropriately implemented.

## 30.5 Revenue Principles

The application should not monetize fear or health anxiety.

It should not imply that users must pay to receive essential safety information.

Paid features should focus on convenience, expanded planning capabilities, collaboration, and professional workflows.

---

# 31. Product Analytics and Success Metrics

The application should measure whether users can successfully follow their plans.

## 31.1 Acquisition

Track:

- Account registrations.
- Onboarding completion.
- Traffic sources.
- Cost per acquisition where applicable.

## 31.2 Activation

Track:

- Percentage of users who complete a profile.
- Percentage who generate their first plan.
- Percentage who review a recipe.
- Percentage who schedule at least one meal.
- Time to first useful meal plan.

## 31.3 Engagement

Track:

- Weekly active users.
- Meal completion rate.
- Recipe views.
- Meal substitutions.
- Shopping list usage.
- Plan revisions.
- Calendar engagement.

## 31.4 Retention

Track:

- Day 7 retention.
- Day 30 retention.
- Monthly active users.
- Repeat meal-plan generation.
- Family-plan usage.

## 31.5 Quality

Track:

- Recipe validation failure rate.
- Incorrect nutrient calculations.
- Invalid ingredient substitutions.
- User-reported inaccuracies.
- Meal-plan generation failures.
- Cost-estimation error where measurable.
- Professional-review rejection rate.

## 31.6 Safety

Safety should have its own dedicated metrics.

Examples:

- Critical allergen violations.
- Unsafe infant recipe outputs.
- Invalid medical recommendations.
- Plans activated without required approval.
- High-risk cases incorrectly classified as low-risk.
- Unsupported clinical requests handled incorrectly.

Critical safety failures should be investigated individually rather than hidden inside aggregate performance metrics.

## 31.7 Business Metrics

Track:

- Free-to-paid conversion.
- Subscription retention.
- Revenue per user.
- AI cost per generated plan.
- Customer acquisition cost.
- Gross margin.
- Support cost per active user.

The initial product should optimize for trust, safety, and repeated use before attempting to maximize paid conversion.

---

# 42.26 Additional Success Metrics

*Extends §31 (Product Analytics) and §41.12 (Food Journal metrics). Metrics already listed there are not repeated.*

Don't measure success only by downloads or the number of AI features.

| Metric | What it tells you |
|---|---|
| First food-log completion rate | Whether users understand how to record meals. |
| Four-week retention | Whether users keep using the product (alongside Day 7/Day 30, §31.4). |
| User-reported usefulness | Whether recommendations help with real decisions. |
| Safety incidents and inappropriate recommendations | Whether the system is operating responsibly (§31.6). |
| **Core workflow completion rate** | Percentage of users who generate a plan, record meals **and** review their nutrition summary. |

The core workflow completion rate is one of the most important metrics. It means more than counting how many people generated a plan once.

Treat these as measurement categories, not predetermined targets. Set realistic benchmarks after observing actual users.
