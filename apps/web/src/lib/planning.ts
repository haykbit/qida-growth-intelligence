export type PlanningScenario = { baselineSql: number; sqlUplift: number; sqlToAlta: number };
export type ScenarioOutput = { incrementalSql: number; incrementalAltas: number };

export function calculateScenario(input: PlanningScenario): ScenarioOutput {
  const baselineSql = Math.max(0, input.baselineSql);
  const sqlUplift = Math.max(0, input.sqlUplift);
  const sqlToAlta = Math.min(1, Math.max(0, input.sqlToAlta));
  const incrementalSql = baselineSql * sqlUplift;
  return { incrementalSql, incrementalAltas: incrementalSql * sqlToAlta };
}
