import { describe, expect, it } from "vitest";
import { calculateMonthlyCohorts, type CohortOpportunity } from "./cohorts.js";

describe("calculateMonthlyCohorts", () => {
  it("uses only mature eligible family SQL in the conversion denominator", () => {
    const rows: CohortOpportunity[] = [
      { opportunityId: "mature-alta", createdAt: new Date("2026-01-01Z"), sqlAt: new Date("2026-01-03Z"), altaAt: new Date("2026-01-20Z"), eligible: true, contactType: "family" },
      { opportunityId: "mature-open", createdAt: new Date("2026-01-02Z"), sqlAt: new Date("2026-01-04Z"), altaAt: null, eligible: true, contactType: "family" },
      { opportunityId: "not-eligible", createdAt: new Date("2026-01-03Z"), sqlAt: new Date("2026-01-04Z"), altaAt: new Date("2026-01-10Z"), eligible: false, contactType: "family" },
      { opportunityId: "caregiver", createdAt: new Date("2026-01-04Z"), sqlAt: new Date("2026-01-04Z"), altaAt: null, eligible: true, contactType: "caregiver_job" },
      { opportunityId: "immature", createdAt: new Date("2026-03-15Z"), sqlAt: new Date("2026-03-20Z"), altaAt: null, eligible: true, contactType: "family" },
    ];
    const result = calculateMonthlyCohorts(rows, new Date("2026-04-02Z"), 60);
    expect(result[0]).toMatchObject({ cohort: "2026-01", eligibleCreated: 2, matureSql: 2, altasFromMatureSql: 1, sqlToAlta: 0.5, complete: true });
    expect(result[1]).toMatchObject({ cohort: "2026-03", eligibleCreated: 1, matureSql: 0, sqlToAlta: null, complete: false });
  });
});
