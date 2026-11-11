# Delivery task board

| ID | Owner | Objective | Paths | Dependencies | Acceptance/tests | State | Commit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| FND-001 | Agent 0 | Monorepo, contracts, architecture, API plan | root, contracts, docs | none | strict config and docs reviewed | done | pending |
| DAT-001 | Agent 1 | 9 source + extension Prisma models/migration | prisma | FND-001 | schema validates, relations/indexes | ready | — |
| DAT-002 | Agent 1 | deterministic coherent seed + A–L scenarios | prisma/seed, scripts | DAT-001 | reproducibility and invariants tests | ready | — |
| ANA-001 | Agent 1 | scores, cohorts, attribution, DiD | packages/analytics | FND-001 | sensitivity/metric tests | ready | — |
| API-001 | Agent 2 | Express foundation, validation, errors, OpenAPI | apps/api | FND-001 | health/contract tests | ready | — |
| API-002 | Agent 2 | all read endpoints and landing workflow | apps/api | DAT-001, ANA-001 | Supertest integration | ready | — |
| WEB-001 | Agent 3 | app shell, theme, routing, global filters | apps/web | FND-001 | responsive/loading/error states | ready | — |
| WEB-002 | Agent 3 | nine functional product surfaces | apps/web | API contract | component/build checks | ready | — |
| INF-001 | Agent 0 | Docker, K8s/kind, Tilt, health probes | infra, Tiltfile | API-001, WEB-001 | config render/build | in progress | — |
| QA-001 | Agent 0 | integrate and cross-review | all | implementation tasks | no ownership overlap unresolved | blocked | — |
| QA-002 | Agent 0 | lint/typecheck/test/build/E2E smoke | all | QA-001 | all commands pass | blocked | — |
| STR-001 | Agent 2 + 3 | Strategy, editable scenarios, 90-day/six-month roadmap | API + web | core metrics | planning assumptions labeled and decision criteria visible | in progress | — |
| WRK-001 | Agent 1 + 2 + 3 | Curated executable analytics workbench | analytics + API + web | data/API | 3 read-only SQL queries with results and decisions | in progress | — |
| GOV-001 | Agent 0 + 3 | Architecture/governance and interview case mode | docs + web | core features | Existing/Proposed/Simulated separated | in progress | — |


