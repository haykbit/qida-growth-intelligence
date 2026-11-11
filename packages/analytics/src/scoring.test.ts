import { describe, expect, it } from "vitest";
import { scoreOpportunity } from "./scoring.js";

const baseline = {
  monthlySearches: 1_000,
  p90MonthlySearches: 1_200,
  sqlCount: 5,
  altaCount: 1,
  caregiversAvailable: 16,
  hasCoverage: true,
  serviceCovered: true,
  estimatedCpcEur: 3.5,
  unmetNeedSignals: 20,
  dataCompleteness: 0.9,
};

describe("scoreOpportunity", () => {
  it("is deterministic, versioned, and explained", () => {
    const first = scoreOpportunity(baseline);
    expect(scoreOpportunity(baseline)).toEqual(first);
    expect(first.score).toBeGreaterThan(0);
    expect(first.factors).toHaveLength(6);
    expect(first.rulesVersion).toMatch(/^qgi-opportunity-v/);
    expect(first.disclaimer).toContain("no es una predicción");
  });

  it("makes uncovered services ineligible", () => {
    const result = scoreOpportunity({ ...baseline, hasCoverage: false });
    expect(result.eligibility).toBe("ineligible");
    expect(result.score).toBe(0);
    expect(result.constraints).toContain("Municipio sin cobertura");
  });

  it("penalizes capacity constraints and responds monotonically to demand", () => {
    const constrained = scoreOpportunity({ ...baseline, caregiversAvailable: 2 });
    const lowDemand = scoreOpportunity({ ...baseline, monthlySearches: 100 });
    const highDemand = scoreOpportunity(baseline);
    expect(constrained.eligibility).toBe("constrained");
    expect(constrained.score).toBeLessThan(highDemand.score);
    expect(highDemand.score).toBeGreaterThan(lowDemand.score);
  });
});
