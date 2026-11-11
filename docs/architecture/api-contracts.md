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
| GET | `/filters` | Valid global filter options |
| GET | `/openapi.json` | OpenAPI 3 document |

Errors use `{ "error": { "code": string, "message": string, "details"?: unknown, "requestId": string } }`. Mutations return an audit identifier. Shared transport shapes live in `@qida/contracts`.

