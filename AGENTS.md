# Qida Growth Intelligence agent operating guide

## Mission

Deliver a runnable, explainable growth-intelligence product. Every UI metric must originate in persisted synthetic data through the API. The product must distinguish descriptive correlation, attribution, and causal evidence.

## Repository rules

- Use pnpm workspaces, strict TypeScript, Zod at external boundaries, and Conventional Commits.
- Work only in the assigned worktree and file ownership area. Coordinate shared-contract changes with the orchestrator.
- Never use `any`, unseeded randomness, real personal data, secrets, or visual hardcodes posing as analytics.
- Do not weaken quality gates. Required before integration: lint, typecheck, test, build.
- Preserve the original nine Qida tables and semantics. Extensions belong in separate tables.
- Identity resolution is deterministic; ambiguous identities remain separate.
- Opportunity scores are rules-based, versioned, and explained. They are not validated predictions.
- Landing publication is local/simulated and requires a human approval transition.

## Ownership

| Area | Owner | Paths |
| --- | --- | --- |
| Foundation/contracts/integration | Agent 0 | root, `packages/contracts`, `docs`, `infra` |
| Data/seed/analytics | Agent 1 | `prisma`, `packages/analytics`, seed validation |
| API | Agent 2 | `apps/api` |
| Web/UX | Agent 3 | `apps/web`, `packages/ui` |
| QA/security/review | Agent 0 | cross-cutting after integration |

## Domain invariants

- `fecha_sql >= fecha_creacion`; `fecha_alta >= fecha_sql`; every alta maps to a valid family care opportunity.
- Caregiver job contacts are excluded from family opportunity funnel metrics.
- Non-indexed landings produce no GSC organic clicks.
- No-coverage and capacity-constrained municipalities are ineligible or penalized explicitly.
- Cohort conversion denominators use mature, eligible opportunities.
- Platform conversions and CRM-reconciled conversions are reported separately.

## Local verification

```bash
pnpm install
pnpm db:generate
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

