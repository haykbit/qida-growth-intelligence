export type DidObservation = {
  unitId: string;
  group: "treatment" | "control";
  period: string;
  phase: "pre" | "post";
  value: number;
};

export type DidResult = {
  treatmentPre: number;
  treatmentPost: number;
  controlPre: number;
  controlPost: number;
  observedDifferenceInDifferences: number;
  treatmentUnits: number;
  controlUnits: number;
  prePeriods: number;
  parallelTrendsCheck: "pass" | "warning" | "insufficient_data";
  preTrendDifference: number | null;
  causalClaimSupported: false;
  limitations: string[];
};

const mean = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0) / values.length;
const round = (value: number): number => Number(value.toFixed(4));

function groupMean(observations: readonly DidObservation[], group: DidObservation["group"], phase: DidObservation["phase"]): number {
  const values = observations.filter((row) => row.group === group && row.phase === phase).map((row) => row.value);
  if (values.length === 0) throw new Error(`Missing ${group} ${phase} observations`);
  return mean(values);
}

function periodMeans(observations: readonly DidObservation[], group: DidObservation["group"]): Array<{ period: string; value: number }> {
  const grouped = new Map<string, number[]>();
  for (const observation of observations) {
    if (observation.group !== group || observation.phase !== "pre") continue;
    const values = grouped.get(observation.period) ?? [];
    values.push(observation.value);
    grouped.set(observation.period, values);
  }
  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([period, values]) => ({ period, value: mean(values) }));
}

export function differenceInDifferences(observations: readonly DidObservation[]): DidResult {
  const treatmentPre = groupMean(observations, "treatment", "pre");
  const treatmentPost = groupMean(observations, "treatment", "post");
  const controlPre = groupMean(observations, "control", "pre");
  const controlPost = groupMean(observations, "control", "post");
  const treatmentUnits = new Set(observations.filter((row) => row.group === "treatment").map((row) => row.unitId)).size;
  const controlUnits = new Set(observations.filter((row) => row.group === "control").map((row) => row.unitId)).size;
  const treatmentPeriods = periodMeans(observations, "treatment");
  const controlPeriods = periodMeans(observations, "control");
  const sharedPeriods = treatmentPeriods.filter((row) => controlPeriods.some((control) => control.period === row.period));
  let preTrendDifference: number | null = null;
  let trendCheck: DidResult["parallelTrendsCheck"] = "insufficient_data";
  if (sharedPeriods.length >= 3) {
    const firstPeriod = sharedPeriods[0];
    const lastPeriod = sharedPeriods.at(-1);
    if (firstPeriod !== undefined && lastPeriod !== undefined) {
      const controlFirst = controlPeriods.find((row) => row.period === firstPeriod.period);
      const controlLast = controlPeriods.find((row) => row.period === lastPeriod.period);
      if (controlFirst !== undefined && controlLast !== undefined) {
        preTrendDifference = round((lastPeriod.value - firstPeriod.value) - (controlLast.value - controlFirst.value));
        const scale = Math.max(1, Math.abs(treatmentPre), Math.abs(controlPre));
        trendCheck = Math.abs(preTrendDifference) / scale <= 0.1 ? "pass" : "warning";
      }
    }
  }
  const limitations: string[] = [];
  if (treatmentUnits < 10 || controlUnits < 10) limitations.push("Tamaño de muestra inferior a 10 municipios en al menos un grupo");
  if (trendCheck === "insufficient_data") limitations.push("Se requieren al menos tres periodos pre compartidos para comprobar tendencias");
  if (trendCheck === "warning") limitations.push("Las tendencias previas divergen por encima del umbral descriptivo del 10%");
  limitations.push("Estimación descriptiva sin intervalos de confianza ni ajuste por confundidores");
  return {
    treatmentPre: round(treatmentPre),
    treatmentPost: round(treatmentPost),
    controlPre: round(controlPre),
    controlPost: round(controlPost),
    observedDifferenceInDifferences: round((treatmentPost - treatmentPre) - (controlPost - controlPre)),
    treatmentUnits,
    controlUnits,
    prePeriods: sharedPeriods.length,
    parallelTrendsCheck: trendCheck,
    preTrendDifference,
    causalClaimSupported: false,
    limitations,
  };
}
