# Security, privacy, and production path

## MVP controls

- Inputs are parsed with bounded Zod schemas and database values are parameterized.
- Synthetic pseudonyms replace names, phone numbers, email addresses, and external customer identifiers.
- Structured logs include request/audit IDs but exclude identity source values and landing content.
- Landing draft blocks are server-authored from structured facts; policy validation rejects prices, health claims, invented figures/testimonials, personal data, uncovered services, insufficient first-party evidence, and unsafe capacity.
- Approval requires a simulated local reviewer role and is audited. Draft creation cannot jump directly to publication.
- Identity resolution accepts explicit deterministic evidence only. Ambiguous matches are surfaced, not merged.

## Before production

Add OIDC/SSO, role and municipality-level authorization, managed secrets, TLS, encryption keys, retention/deletion workflows, data-processing records, consent/legal-basis enforcement, operational audit export, rate limiting at the edge, dependency/container scanning, backups/restore tests, and human-reviewed CMS credentials. Conduct a privacy impact assessment before connecting real CRM or call data.

