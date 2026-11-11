# Qida Growth Intelligence

An explainable local growth-intelligence platform for home-care acquisition. It connects synthetic but coherent demand, coverage, CRM, journeys, landing, SEO, paid-media, experiment, and data-quality records from PostgreSQL to a React dashboard through an Express API.

## What is included

- Executive funnel and acquisition health with effective global filters.
- Explainable municipality/service opportunity ranking with capacity gates.
- Deterministically linked multichannel journeys and duplicate detection.
- Mature-cohort funnel analytics.
- Existing landing-factory simulation with safe drafting, mandatory review, approval, simulated publication, and performance.
- SEO and paid-media reconciliation.
- Experiment registry with guarded Difference-in-Differences diagnostics.
- Data quality, freshness, traceability, integrity, and missingness views.
- Reproducible synthetic data and documented scenarios A–L.

Attribution views are descriptive and do not prove causality. Opportunity scores are deterministic prioritization rules, not statistical predictions.

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop
- For Kubernetes: `kind`, `kubectl`, and Tilt

## Fast local start with Docker Compose

```bash
docker compose -f infra/docker-compose.yml up --build
```

Open the dashboard at <http://localhost:5173>, API at <http://localhost:3000/api/v1/health>, and OpenAPI at <http://localhost:3000/api/v1/openapi.json>.

## Local development

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d postgres
export DATABASE_URL='postgresql://qida:qida_local@localhost:5432/qida_growth?schema=public'
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm db:validate
pnpm dev
```

## kind + Tilt

```bash
./scripts/create-kind-cluster.sh
tilt up
```

Tilt builds separate API and web images, runs migrations and the reproducible seed before API startup, and exposes PostgreSQL on 5432, the API on 3000, and the web UI on 5173. Source changes hot reload.

## Quality gates

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

## Repository map

- `apps/web`: React analytical interface.
- `apps/api`: Express domain API and OpenAPI.
- `packages/contracts`: shared transport types and validation.
- `packages/analytics`: pure measurement and scoring logic.
- `prisma`: PostgreSQL model, migration, deterministic seed.
- `infra`: Docker, kind/Kubernetes, and Tilt.
- `docs`: product, architecture, decisions, metric catalog, agents, and scenarios.

## Privacy and production path

The repository contains no real family data. Synthetic identifiers are pseudonyms and logs avoid identity values. The local approval role is an MVP boundary; production should add SSO/OIDC, RBAC, managed secrets, encrypted transport/storage, retention controls, audit export, and a reviewed CMS integration.

