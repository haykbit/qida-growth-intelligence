# Metric catalog

All rates are calculated after applying the same global filters. Family acquisition excludes contacts whose `tipo_contacto` is caregiver/job seeking. Unless stated otherwise, counts deduplicate by care opportunity rather than raw touch.

| Metric | Definition and formula | Source / grain | Window and limitations |
| --- | --- | --- | --- |
| Leads | Eligible family leads created in the period | `lead`, opportunity | Creation date; unattributed leads remain included |
| SQL | Eligible opportunities whose SQL timestamp falls in the period | `care_opportunity`, opportunity | SQL date; not platform conversions |
| Altas | Eligible opportunities completed as alta in the period | `care_opportunity`, opportunity | Alta date; may follow acquisition period |
| Lead → SQL | SQL opportunities / eligible lead opportunities | CRM, cohort | Grouped by lead-creation cohort; immature cohorts flagged |
| SQL → Alta | Alta opportunities / eligible SQL opportunities | CRM, cohort | SQL cohort must satisfy maturity window; never divides period altas by period SQL |
| Time to SQL | Mean elapsed hours from lead creation to SQL | CRM, opportunity | Only non-negative completed transitions |
| Time to alta | Mean elapsed days from SQL to alta | CRM, opportunity | Only non-negative completed transitions |
| Cost per SQL | Paid spend / CRM-reconciled SQL linked to paid campaigns | `ads_diario`, journey + CRM | Campaigns without municipal targeting are not allocated to municipalities |
| Cost per attributed alta | Paid spend / altas with explicit paid journey evidence | ads + journeys + CRM | Attribution is descriptive, not causal |
| Platform conversions | Conversion count reported by Google/Meta | `ads_diario`, campaign-day | May differ from CRM due to platform windows and definitions |
| Traceability coverage | Opportunities with at least one linked pre-conversion event / eligible opportunities | journeys, opportunity | Deterministic links only; ambiguous identities stay unmerged |
| Duplicate leads | Extra lead records linked to a person with more than one source identifier | identity + lead | Counts duplicates detected with explicit evidence |
| Monthly searches | Sum of query demand for the municipality/service in latest complete month | `motor_demanda_busqueda` | Search demand is a signal, not lead volume |
| Landing CTR | GSC clicks / GSC impressions | `gsc_diario`, URL-query-day | Only indexed landing dates; descriptive |
| Landing form rate | Forms / web sessions | `web_sesiones_diarias`, URL-channel-day | Session aggregates may not map one-to-one to people |
| Opportunity score | Weighted normalized demand gap, capacity, conversion opportunity, commercial fit, and confidence after eligibility gates | analytics rules, municipality-service | Rules version shown; prioritization aid, not a prediction |
| First touch | Earliest observed eligible acquisition channel in a linked journey | `journey_event`, opportunity | Descriptive attribution; missing early events bias results |
| Last touch | Latest observed eligible channel before SQL/alta | `journey_event`, opportunity | Descriptive attribution; does not prove influence |
| Multi-touch | Count/share of observed touches across linked channels | `journey_event`, opportunity-channel | No causal credit weights in MVP |
| Experiment observed difference | Treatment post-period mean minus control post-period mean | experiment assignments + outcome series | Descriptive unless design assumptions hold |
| Difference-in-Differences | `(treatment_post - treatment_pre) - (control_post - control_pre)` | assignments + municipality-period metric | Report only with sample size and pre-trend diagnostics; no automatic significance claim |

## Cohort maturity

Lead → SQL cohorts require at least 14 elapsed days after the cohort period. SQL → Alta cohorts require at least 30 elapsed days. Newer cohorts remain visible but are marked incomplete and excluded from headline conversion comparisons.

## Deduplication

An opportunity is the funnel counting unit. Multiple calls, forms, source-system leads, or sessions linked by explicit identifiers do not multiply the denominator. Identity records with insufficient or conflicting evidence remain separate and contribute to the data-quality view.

