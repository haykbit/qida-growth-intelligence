import { describe, expect, it } from "vitest";
import { calculateLandingImpact, calculatePlanningDelta, LANDING_IMPACT_MODEL_VERSION } from "./impact-model.js";

const assumptions = {
  demandCaptureRate: 0.025,
  leadToSqlRate: 0.42,
  sqlToAltaRate: 0.18,
  capacityUtilization: 0.7,
  months: 6,
  marketLimit: 10,
};

const barcelonaMarket = { municipalityId: "001", municipality: "Barcelona", service: "cuidados por horas", monthlySearches: 1_000, eligible: true };
const sabadellMarket = { municipalityId: "003", municipality: "Sabadell", service: "Alzheimer", monthlySearches: 200, eligible: true };
const markets = [
  barcelonaMarket,
  { municipalityId: "002", municipality: "Badalona", service: "cuidadora interna", monthlySearches: 500, eligible: false },
  sabadellMarket,
];

describe("calculateLandingImpact", () => {
  it("returns deterministic and traceable planning arithmetic", () => {
    const result = calculateLandingImpact(markets, assumptions);
    expect(calculateLandingImpact(markets, assumptions)).toEqual(result);
    expect(result.modelVersion).toBe(LANDING_IMPACT_MODEL_VERSION);
    expect(result.marketsIncluded).toBe(2);
    expect(result.rows[0]).toEqual(expect.objectContaining({
      potentialLeads: 150,
      capacityAdjustedLeads: 105,
      scenarioSql: 44.1,
      scenarioAltas: 7.9,
    }));
    expect(result.totals).toEqual({ sql: 52.9, altas: 9.5 });
  });

  it("excludes ineligible markets and respects the declared first-wave limit", () => {
    const result = calculateLandingImpact(markets, { ...assumptions, marketLimit: 1 });
    expect(result.eligibleMarketsAvailable).toBe(2);
    expect(result.marketsIncluded).toBe(1);
    expect(result.rows.map((row) => row.municipalityId)).toEqual(["001"]);
  });

  it("includes each municipality only once in the first wave", () => {
    const result = calculateLandingImpact([
      barcelonaMarket,
      { municipalityId: "001", municipality: "Barcelona", service: "cuidadora interna", monthlySearches: 900, eligible: true },
      sabadellMarket,
    ], assumptions);
    expect(result.eligibleMarketsAvailable).toBe(2);
    expect(result.rows.map((row) => row.municipalityId)).toEqual(["001", "003"]);
  });

  it("recalculates when an assumption changes", () => {
    const base = calculateLandingImpact(markets, assumptions);
    const lowerCapture = calculateLandingImpact(markets, { ...assumptions, demandCaptureRate: 0.01 });
    expect(lowerCapture.totals.sql).toBeLessThan(base.totals.sql);
    expect(lowerCapture.totals.altas).toBeLessThan(base.totals.altas);
  });

  it("rejects invalid planning assumptions", () => {
    expect(() => calculateLandingImpact(markets, { ...assumptions, capacityUtilization: 1.1 })).toThrow(RangeError);
    expect(() => calculateLandingImpact(markets, { ...assumptions, marketLimit: 0 })).toThrow(RangeError);
  });
});

describe("calculatePlanningDelta", () => {
  it("turns an explicit rate change into a bounded scenario difference", () => {
    expect(calculatePlanningDelta({ baselineMonthlyVolume: 200, months: 6, assumedRateChange: 0.02 })).toBe(24);
  });

  it("rejects negative baselines and invalid rate changes", () => {
    expect(() => calculatePlanningDelta({ baselineMonthlyVolume: -1, months: 6, assumedRateChange: 0.02 })).toThrow(RangeError);
    expect(() => calculatePlanningDelta({ baselineMonthlyVolume: 200, months: 6, assumedRateChange: 2 })).toThrow(RangeError);
  });
});
