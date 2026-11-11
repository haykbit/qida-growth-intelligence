export const OPPORTUNITY_RULES_VERSION = "qgi-opportunity-v1.0.0";

export type OpportunityEligibility = "eligible" | "constrained" | "ineligible";

export type OpportunityScoreInput = {
  monthlySearches: number;
  p90MonthlySearches: number;
  sqlCount: number;
  altaCount: number;
  caregiversAvailable: number;
  hasCoverage: boolean;
  serviceCovered: boolean;
  estimatedCpcEur: number;
  unmetNeedSignals: number;
  dataCompleteness: number;
};

export type ScoreFactor = {
  key: "demand" | "captureGap" | "conversionOpportunity" | "commercialFit" | "capacity" | "dataConfidence";
  normalizedValue: number;
  weight: number;
  contribution: number;
  evidence: string;
};

export type OpportunityScoreResult = {
  score: number;
  eligibility: OpportunityEligibility;
  confidence: number;
  factors: ScoreFactor[];
  constraints: string[];
  proposedAction: string;
  validationMetric: string;
  rulesVersion: string;
  disclaimer: string;
};

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const round = (value: number, digits = 4): number => Number(value.toFixed(digits));

function safeRatio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export function scoreOpportunity(input: OpportunityScoreInput): OpportunityScoreResult {
  const searches = Math.max(0, input.monthlySearches);
  const sql = Math.max(0, input.sqlCount);
  const altas = Math.max(0, input.altaCount);
  const demand = clamp01(safeRatio(searches, Math.max(1, input.p90MonthlySearches)));
  const expectedSqlFromDemand = Math.max(1, searches * 0.025);
  const captureGap = clamp01(1 - safeRatio(sql, expectedSqlFromDemand));
  const conversionOpportunity = clamp01(1 - safeRatio(altas, Math.max(1, sql)));
  const cpcFit = clamp01(1 - Math.max(0, input.estimatedCpcEur - 1) / 9);
  const voiceFit = clamp01(input.unmetNeedSignals / 40);
  const commercialFit = clamp01(cpcFit * 0.6 + voiceFit * 0.4);
  const capacity = clamp01(input.caregiversAvailable / 12);
  const dataConfidence = clamp01(input.dataCompleteness);

  const values: ReadonlyArray<readonly [ScoreFactor["key"], number, number, string]> = [
    ["demand", demand, 0.28, `${String(searches)} búsquedas/mes frente al p90 de ${String(Math.max(1, input.p90MonthlySearches))}`],
    ["captureGap", captureGap, 0.24, `${String(sql)} SQL frente a ${String(round(expectedSqlFromDemand, 1))} esperables como referencia operativa`],
    ["conversionOpportunity", conversionOpportunity, 0.14, `${String(altas)}/${String(sql)} altas sobre SQL; señala margen, no rendimiento causal`],
    ["commercialFit", commercialFit, 0.12, `CPC €${Math.max(0, input.estimatedCpcEur).toFixed(2)} y ${String(Math.max(0, input.unmetNeedSignals))} señales de necesidad`],
    ["capacity", capacity, 0.12, `${String(Math.max(0, input.caregiversAvailable))} cuidadoras disponibles a 30 días`],
    ["dataConfidence", dataConfidence, 0.1, `${String(round(dataConfidence * 100, 0))}% de señales requeridas disponibles`],
  ];

  const factors = values.map(([key, normalizedValue, weight, evidence]) => ({
    key,
    normalizedValue: round(normalizedValue),
    weight,
    contribution: round(normalizedValue * weight * 100, 2),
    evidence,
  }));

  const constraints: string[] = [];
  let eligibility: OpportunityEligibility = "eligible";
  let eligibilityMultiplier = 1;

  if (!input.hasCoverage || !input.serviceCovered) {
    eligibility = "ineligible";
    eligibilityMultiplier = 0;
    constraints.push(!input.hasCoverage ? "Municipio sin cobertura" : "Servicio sin cobertura en el municipio");
  } else if (input.caregiversAvailable < 4) {
    eligibility = "constrained";
    eligibilityMultiplier = 0.35;
    constraints.push("Capacidad limitada: menos de 4 cuidadoras disponibles a 30 días");
  }
  if (dataConfidence < 0.6) constraints.push("Confianza reducida por señales incompletas");

  const weighted = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  const score = round(weighted * eligibilityMultiplier, 1);
  const action = eligibility === "ineligible"
    ? "Resolver cobertura antes de invertir en captación"
    : eligibility === "constrained"
      ? "Aumentar capacidad y ejecutar una prueba de captación limitada"
      : captureGap >= 0.5
        ? "Probar captación local incremental con presupuesto acotado"
        : "Optimizar conversión del funnel y medir por cohorte madura";

  return {
    score,
    eligibility,
    confidence: round(dataConfidence, 2),
    factors,
    constraints,
    proposedAction: action,
    validationMetric: "SQL elegibles incrementales y altas de cohorte madura por euro invertido",
    rulesVersion: OPPORTUNITY_RULES_VERSION,
    disclaimer: "Score determinista de priorización; no es una predicción validada ni evidencia causal.",
  };
}
