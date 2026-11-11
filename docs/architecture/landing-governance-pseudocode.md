# Critical landing validation and publication pseudocode

```text
function requestPublication(draftId, reviewer):
  begin transaction
  draft = lock current version(draftId)
  facts = load verified municipality, service, coverage, capacity, first-party evidence

  if draft.version != requestedVersion:
    audit(BLOCKED_STALE_VERSION, draftId, reviewer)
    return conflict("Draft changed; review the current version")

  failures = []
  failures += rejectPricesAndHealthClaims(draft.content)
  failures += verifyEveryFigureAgainstStructuredFacts(draft.content, facts)
  failures += verifyTestimonialsAreConsentedAndAnonymous(draft.content)
  failures += validateLanguageLinksAndSeoStructure(draft)
  failures += detectDuplicateOrNoLocalValue(draft, facts)

  if !facts.hasOwnData: failures += "insufficient first-party local evidence"
  if !facts.serviceCovered: failures += "service is not covered"
  if facts.caregiverCapacity < configuredMinimum: failures += "capacity guardrail"
  if reviewer.role != MARKETING_APPROVER: failures += "human Marketing approval required"

  if failures not empty:
    save validation failures on draft version
    audit(PUBLICATION_BLOCKED, draftId, reviewer, failures without personal data)
    commit
    return validationError(failures)

  approvedVersion = immutableSnapshot(draft, facts.version, rulesVersion)
  mark approved by reviewer and time
  try:
    publish approvedVersion to simulated Strapi adapter with idempotency key
    mark published; audit(PUBLISHED, approvedVersion, reviewer)
    commit
  catch integrationError:
    mark publish_failed without losing approval/version
    audit(PUBLISH_FAILED, approvedVersion, reviewer, sanitized error)
    commit
    alert operator; retry only with same idempotency key
```

Production replaces the local Strapi adapter and role header with managed credentials, OIDC/RBAC, and an approval UI, while preserving immutable versions, idempotency, policy evidence, sanitized audit records, and failure recovery.

