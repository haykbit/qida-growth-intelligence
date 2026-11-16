export const LANDING_IMPACT_MODEL_VERSION = "qgi-landing-impact-v1.0.0";

export const LANDING_IMPACT_FORMULA =
  "búsquedas mensuales × meses × captura de demanda × utilización de capacidad × tasa lead→SQL × tasa SQL→alta";

export type LandingImpactAssumptions = {
  demandCaptureRate: number;
  leadToSqlRate: number;
  sqlToAltaRate: number;
  capacityUtilization: number;
  months: number;
  marketLimit: number;
};

export type LandingImpactMarket = {
  municipalityId: string;
  municipality: string;
  service: string;
  monthlySearches: number;
  eligible: boolean;
};

export type LandingImpactRow = {
  municipalityId: string;
  municipality: string;
  service: string;
  monthlySearches: number;
  potentialLeads: number;
  capacityAdjustedLeads: number;
  scenarioSql: number;
  scenarioAltas: number;
};

export type LandingImpactResult = {
  modelVersion: typeof LANDING_IMPACT_MODEL_VERSION;
  formula: typeof LANDING_IMPACT_FORMULA;
  eligibleMarketsAvailable: number;
  marketsIncluded: number;
  rows: LandingImpactRow[];
  totals: { sql: number; altas: number };
};

export type PlanningDeltaInput = {
  baselineMonthlyVolume: number;
  months: number;
  assumedRateChange: number;
};

const round = (value: number, digits = 1): number => Number(value.toFixed(digits));

function assertRate(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be a finite number between 0 and 1`);
  }
}

function validateAssumptions(assumptions: LandingImpactAssumptions): void {
  assertRate("demandCaptureRate", assumptions.demandCaptureRate);
  assertRate("leadToSqlRate", assumptions.leadToSqlRate);
  assertRate("sqlToAltaRate", assumptions.sqlToAltaRate);
  assertRate("capacityUtilization", assumptions.capacityUtilization);
  if (!Number.isInteger(assumptions.months) || assumptions.months < 1) {
    throw new RangeError("months must be a positive integer");
  }
  if (!Number.isInteger(assumptions.marketLimit) || assumptions.marketLimit < 1) {
    throw new RangeError("marketLimit must be a positive integer");
  }
}

export function calculateLandingImpact(
  markets: readonly LandingImpactMarket[],
  assumptions: LandingImpactAssumptions,
): LandingImpactResult {
  validateAssumptions(assumptions);
  const eligibleMarkets = markets.filter((market) => market.eligible);
  const uniqueEligibleMarkets = eligibleMarkets.filter((market, index, rows) =>
    rows.findIndex((candidate) => candidate.municipalityId === market.municipalityId) === index,
  );
  const selectedMarkets = uniqueEligibleMarkets.slice(0, assumptions.marketLimit);

  const rawRows = selectedMarkets.map((market) => {
    const monthlySearches = Math.max(0, market.monthlySearches);
    const potentialLeads = monthlySearches * assumptions.months * assumptions.demandCaptureRate;
    const capacityAdjustedLeads = potentialLeads * assumptions.capacityUtilization;
    const scenarioSql = capacityAdjustedLeads * assumptions.leadToSqlRate;
    const scenarioAltas = scenarioSql * assumptions.sqlToAltaRate;
    return { market, monthlySearches, potentialLeads, capacityAdjustedLeads, scenarioSql, scenarioAltas };
  });

  return {
    modelVersion: LANDING_IMPACT_MODEL_VERSION,
    formula: LANDING_IMPACT_FORMULA,
    eligibleMarketsAvailable: uniqueEligibleMarkets.length,
    marketsIncluded: selectedMarkets.length,
    rows: rawRows.map(({ market, monthlySearches, potentialLeads, capacityAdjustedLeads, scenarioSql, scenarioAltas }) => ({
      municipalityId: market.municipalityId,
      municipality: market.municipality,
      service: market.service,
      monthlySearches,
      potentialLeads: round(potentialLeads),
      capacityAdjustedLeads: round(capacityAdjustedLeads),
      scenarioSql: round(scenarioSql),
      scenarioAltas: round(scenarioAltas),
    })),
    totals: {
      sql: round(rawRows.reduce((sum, row) => sum + row.scenarioSql, 0)),
      altas: round(rawRows.reduce((sum, row) => sum + row.scenarioAltas, 0)),
    },
  };
}

export function calculatePlanningDelta(input: PlanningDeltaInput): number {
  if (!Number.isFinite(input.baselineMonthlyVolume) || input.baselineMonthlyVolume < 0) {
    throw new RangeError("baselineMonthlyVolume must be a finite non-negative number");
  }
  if (!Number.isInteger(input.months) || input.months < 1) {
    throw new RangeError("months must be a positive integer");
  }
  assertRate("assumedRateChange", input.assumedRateChange);
  return round(input.baselineMonthlyVolume * input.months * input.assumedRateChange);
}
