export const GENERATOR_VERSION = "qgi-synthetic-v1.0.0";

export type SeedConfig = {
  seed: number;
  startDate: Date;
  simulationDate: Date;
  municipalityCount: number;
  demandMunicipalityCount: number;
  monthlySqlTarget: number;
};

export const DEFAULT_SEED_CONFIG: SeedConfig = {
  seed: 42_026,
  startDate: new Date("2025-01-01T00:00:00.000Z"),
  simulationDate: new Date("2026-11-30T23:59:59.999Z"),
  municipalityCount: 270,
  demandMunicipalityCount: 190,
  monthlySqlTarget: 2_000,
};

export function configFromEnvironment(environment: NodeJS.ProcessEnv = process.env): SeedConfig {
  const positiveInteger = z.coerce.number().int().positive();
  const parsed = z.object({
    SEED_VALUE: positiveInteger.default(DEFAULT_SEED_CONFIG.seed),
    SEED_SIMULATION_DATE: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).default(DEFAULT_SEED_CONFIG.simulationDate.toISOString().slice(0, 10)),
    SEED_MUNICIPALITIES: positiveInteger.min(12).default(DEFAULT_SEED_CONFIG.municipalityCount),
    SEED_DEMAND_MUNICIPALITIES: positiveInteger.default(DEFAULT_SEED_CONFIG.demandMunicipalityCount),
    SEED_MONTHLY_SQL: positiveInteger.default(DEFAULT_SEED_CONFIG.monthlySqlTarget),
  }).parse(environment);
  const simulationDate = new Date(`${parsed.SEED_SIMULATION_DATE}T23:59:59.999Z`);
  const config: SeedConfig = {
    seed: parsed.SEED_VALUE,
    startDate: DEFAULT_SEED_CONFIG.startDate,
    simulationDate,
    municipalityCount: parsed.SEED_MUNICIPALITIES,
    demandMunicipalityCount: parsed.SEED_DEMAND_MUNICIPALITIES,
    monthlySqlTarget: parsed.SEED_MONTHLY_SQL,
  };
  return z.custom<SeedConfig>((value) => {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as SeedConfig;
    return !Number.isNaN(candidate.simulationDate.getTime())
      && candidate.demandMunicipalityCount <= candidate.municipalityCount
      && candidate.simulationDate >= candidate.startDate;
  }, "Seed configuration has inconsistent dates or municipality counts").parse(config);
}
import { z } from "zod";

