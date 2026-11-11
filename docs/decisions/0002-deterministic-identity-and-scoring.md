# ADR 0002: Deterministic identity and explainable prioritization

Status: accepted

Identity links require an explicit shared pseudonymous identifier or confirmed source mapping. No probabilistic merge runs automatically; ambiguous records remain independently queryable. The product reports linkage as confirmed, ambiguous, or unlinked rather than presenting uncalibrated confidence percentages.

Opportunity prioritization uses versioned rules with eligibility gates, factor contributions, raw evidence, constraints, action, and a validation metric. Its score is a transparent ordering rule, not a probability or prediction, and is not multiplied by a synthetic confidence factor. This favors auditability over opaque predictive claims for the MVP.

