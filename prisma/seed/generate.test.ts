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
    expect(validation.metrics).toMatchObject({ municipalities: 40, demandMunicipalities: 30, scenarios: 12, months: 4 });
    expect(first.experiments.map((experiment) => experiment.name)).toEqual(expect.arrayContaining([
      expect.stringContaining("positivo"),
      expect.stringContaining("inconcluso"),
      expect.stringContaining("negativo"),
    ]));
    expect(first.identities.some((identity) => identity.ambiguous && identity.matchMethod === "ambiguous_unmerged")).toBe(true);
    const familyPersonIds = new Set(first.opportunities.map((opportunity) => opportunity.personId));
    const hubspotPersonIds = new Set(first.identities.filter((identity) => identity.sourceSystem === "hubspot").map((identity) => identity.personId));
    expect([...familyPersonIds].every((personId) => hubspotPersonIds.has(personId))).toBe(true);
    expect(first.identities.every((identity) => !("confidence" in identity))).toBe(true);
    expect(first.events.every((event) => !("identityConfidence" in event))).toBe(true);
    expect(first.recommendations.every((recommendation) => !("confidence" in recommendation))).toBe(true);
    expect(first.recommendations.every((recommendation) => recommendation.rulesVersion === "qgi-opportunity-v2.0.0")).toBe(true);
    expect(new Set(first.workflows.map((workflow) => workflow.status))).toEqual(new Set(["draft", "pending_review", "published", "rejected"]));
  });

  it("derives variable monthly funnel stages from persisted lead cohorts", () => {
    const dataset = generateSyntheticDataset(testConfig);
    const monthly = new Map<string, { leads: number; sql: number; altas: number }>();
    for (const lead of dataset.leads) {
      if (lead.tipoContacto !== "familia_cuidado") continue;
      const month = lead.fechaCreacion.toISOString().slice(0, 7);
      const counts = monthly.get(month) ?? { leads: 0, sql: 0, altas: 0 };
      counts.leads += 1;
      counts.sql += lead.esSql ? 1 : 0;
      counts.altas += lead.esAlta ? 1 : 0;
      monthly.set(month, counts);
    }

    const cohorts = [...monthly.values()];
    expect(new Set(cohorts.map((row) => row.leads)).size).toBeGreaterThan(1);
    expect(new Set(cohorts.map((row) => row.sql)).size).toBeGreaterThan(1);
    expect(new Set(cohorts.map((row) => row.altas)).size).toBeGreaterThan(1);
    expect(cohorts.every((row) => row.leads >= row.sql && row.sql >= row.altas)).toBe(true);
  });

  it("changes the fingerprint when the seed changes", () => {
    const first = generateSyntheticDataset(testConfig);
    const second = generateSyntheticDataset({ ...testConfig, seed: testConfig.seed + 1 });
    expect(second.seedRun.datasetChecksum).not.toBe(first.seedRun.datasetChecksum);
  });

  it("uses municipality names instead of numbered synthetic labels", () => {
    const dataset = generateSyntheticDataset(testConfig);
    expect(dataset.municipalities.every((row) => !/^Municipio Sintético \d+$/u.test(row.nombre))).toBe(true);
  });
});
