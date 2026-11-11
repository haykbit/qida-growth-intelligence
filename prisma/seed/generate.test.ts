import { describe, expect, it } from "vitest";
import { generateSyntheticDataset } from "./generate.js";
import { validateSyntheticDataset } from "./validate.js";
import type { SeedConfig } from "./config.js";

const testConfig: SeedConfig = {
  seed: 12345,
  startDate: new Date("2025-01-01T00:00:00.000Z"),
  simulationDate: new Date("2025-04-30T23:59:59.999Z"),
  municipalityCount: 40,
  demandMunicipalityCount: 30,
  monthlySqlTarget: 80,
};

describe("synthetic data generator", () => {
  it("is deterministic and validates all invariants", () => {
    const first = generateSyntheticDataset(testConfig);
    const second = generateSyntheticDataset(testConfig);
    expect(second.seedRun.datasetChecksum).toBe(first.seedRun.datasetChecksum);
    expect(second.leads).toEqual(first.leads);
    const validation = validateSyntheticDataset(first, testConfig.monthlySqlTarget);
    expect(validation.errors).toEqual([]);
    expect(validation.metrics).toMatchObject({ municipalities: 40, demandMunicipalities: 30, sql: 320, scenarios: 12, months: 4 });
    expect(first.experiments.map((experiment) => experiment.name)).toEqual(expect.arrayContaining([
      expect.stringContaining("positivo"),
      expect.stringContaining("inconcluso"),
      expect.stringContaining("negativo"),
    ]));
    expect(first.identities.some((identity) => identity.ambiguous && identity.matchMethod === "ambiguous_unmerged")).toBe(true);
    expect(first.identities.every((identity) => !("confidence" in identity))).toBe(true);
    expect(first.events.every((event) => !("identityConfidence" in event))).toBe(true);
    expect(first.recommendations.every((recommendation) => !("confidence" in recommendation))).toBe(true);
    expect(first.recommendations.every((recommendation) => recommendation.rulesVersion === "qgi-opportunity-v2.0.0")).toBe(true);
    expect(new Set(first.workflows.map((workflow) => workflow.status))).toEqual(new Set(["draft", "pending_review", "published", "rejected"]));
  });

  it("changes the fingerprint when the seed changes", () => {
    const first = generateSyntheticDataset(testConfig);
    const second = generateSyntheticDataset({ ...testConfig, seed: testConfig.seed + 1 });
    expect(second.seedRun.datasetChecksum).not.toBe(first.seedRun.datasetChecksum);
  });

  it("uses explicit synthetic IDs outside the verified local municipality catalog", () => {
    const dataset = generateSyntheticDataset(testConfig);
    expect(dataset.municipalities.slice(20).every((row) => row.municipioId.startsWith("SYN-"))).toBe(true);
  });
});
