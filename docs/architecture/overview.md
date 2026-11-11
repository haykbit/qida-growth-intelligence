# Architecture overview

Qida Growth Intelligence is a pnpm monorepo with a React/Vite analytical client, an Express domain API, PostgreSQL through Prisma, shared Zod contracts, and a deterministic analytics package. PostgreSQL is the source of truth; the web application never embeds metric values.

## Runtime flow

1. A seeded generator creates coherent municipalities, demand, voice, competition, landing, SEO, session, ads, CRM, identity, journey, experiment, and recommendation records.
2. Domain modules query filtered aggregates through Prisma/parameterized SQL.
3. Express validates query and command inputs and emits stable shared contracts plus structured logs.
4. TanStack Query fetches API data; tables and Recharts render the same filtered dataset.
5. Landing commands enforce policy and audit transitions from draft to simulated publication.

## Boundaries

- `packages/contracts`: transport schemas and DTOs; dependency-free except Zod.
- `packages/analytics`: deterministic scoring, cohort, attribution, and experiment logic.
- `apps/api`: HTTP, persistence orchestration, OpenAPI, logging, and errors.
- `apps/web`: navigation, filters, accessibility, loading/error states, visual analytics.
- `prisma`: canonical model, migration, and reproducible seed.
- `infra`: Docker, kind/Kubernetes, health/readiness probes, Tilt.

## Measurement stance

Descriptive channel credit is available as first touch, last touch, and multi-touch. These are attribution views, not causal estimates. Experiments show observed differences and Difference-in-Differences only when pre-trend/sample checks pass; otherwise limitations remain prominent.

## Security and privacy

All people and identifiers are synthetic pseudonyms. Commands are schema-validated, database access is parameterized, list endpoints are bounded, logs exclude personal identifiers, landing text is sanitized, and approval uses a documented local role header suitable for later SSO replacement.

