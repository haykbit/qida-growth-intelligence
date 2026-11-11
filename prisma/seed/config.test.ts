import { describe, expect, it } from "vitest";
import { configFromEnvironment, DEFAULT_SEED_CONFIG } from "./config.js";

describe("seed configuration boundary", () => {
  it("uses reproducible defaults", () => {
    expect(configFromEnvironment({})).toEqual(DEFAULT_SEED_CONFIG);
  });

  it("parses supported environment overrides", () => {
    expect(configFromEnvironment({
      SEED_VALUE: "7",
      SEED_SIMULATION_DATE: "2025-06-30",
      SEED_MUNICIPALITIES: "30",
      SEED_DEMAND_MUNICIPALITIES: "20",
      SEED_MONTHLY_SQL: "100",
    })).toMatchObject({ seed: 7, municipalityCount: 30, demandMunicipalityCount: 20, monthlySqlTarget: 100 });
  });

  it("rejects incoherent or malformed overrides", () => {
    expect(() => configFromEnvironment({ SEED_MUNICIPALITIES: "11" })).toThrow();
    expect(() => configFromEnvironment({ SEED_MUNICIPALITIES: "20", SEED_DEMAND_MUNICIPALITIES: "21" })).toThrow();
    expect(() => configFromEnvironment({ SEED_SIMULATION_DATE: "not-a-date" })).toThrow();
  });
});
