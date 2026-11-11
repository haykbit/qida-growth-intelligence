# API contracts

Base path: `/api/v1`. Dates are ISO-8601. Money is numeric EUR. Rates are decimals in `[0,1]`. All list queries accept `from`, `to`, `province`, `municipalityId`, `service`, `channel`, `language`; unsupported filters are ignored only when documented. Pagination uses `page` (1-based) and `pageSize` (max 100).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness, DB status, seed version |
| GET | `/overview` | KPIs, monthly funnel, channel funnel, municipalities, opportunities, discard reasons |
| GET | `/opportunities` | Ranked paginated municipality/service opportunities |
| GET | `/opportunities/:municipalityId/:service` | Factor explanation, evidence, constraints and action |
| GET | `/journeys` | Searchable synthetic people/opportunities |
| GET | `/journeys/:opportunityId` | Ordered events, identities, duplicate links, attribution views |
| GET | `/funnels` | Channel/service/municipality/cohort conversion and time-to-stage |
| GET | `/landings` | Landing inventory and performance |
| POST | `/landings/drafts` | Deterministic safe local draft |
| POST | `/landings/:url/review` | Validate and set pending review |
| POST | `/landings/:url/approve` | Local role-gated human approval |
| POST | `/landings/:url/publish` | Simulated publish after approval |
| GET | `/seo` | SEO/landing performance by origin and status |
| GET | `/ads` | Platform and CRM-reconciled paid-media performance |
| GET | `/experiments` | Experiment registry and evaluated results |
| GET | `/experiments/:id` | Assignments, series, DiD diagnostics and limitations |
| GET | `/data-quality` | Freshness, identity, duplicates, integrity, missingness, discrepancies, immature cohorts |
| GET | `/strategy` | Prioritized/rejected bets, scenario assumptions, incremental impact, owners, 90-day and six-month roadmap |
| GET | `/workbench` | Three curated read-only SQL analyses with results, interpretation and recommended decisions |
| GET | `/governance` | Architecture flow, ownership, integration mode, validation and monitoring controls |
| GET | `/filters` | Valid global filter options |
| GET | `/openapi.json` | OpenAPI 3 document |

Errors use `{ "error": { "code": string, "message": string, "details"?: unknown, "requestId": string } }`. Mutations return an audit identifier. Shared transport shapes live in `@qida/contracts`.

Workbench SQL is curated server-side and read-only; clients cannot submit arbitrary SQL. Strategy response values are planning assumptions or synthetic demonstration outputs and carry an explicit evidence label.

