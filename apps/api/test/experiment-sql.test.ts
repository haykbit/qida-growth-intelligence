import { expect, it } from "vitest";
import type { SqlWeek } from "@qida/contracts";
import { sqlReadout } from "../src/repositories/experiment-sql.js";

const week = (
  n: number,
  group: SqlWeek["group"],
  sql: number,
  mature = true,
): SqlWeek => ({
  week: n,
  start: "2026-04-01",
  group,
  municipalities: 10,
  sql,
  phone: 0,
  paid: 0,
  matureSql: 0,
  altas: 0,
  sessions: 100,
  mature,
});
it("uses assigned municipality-weeks, includes zeros and excludes provisional observations", () => {
  const rows = [
    week(-1, "treatment", 10),
    week(-1, "control", 0),
    week(0, "treatment", 30),
    week(0, "control", 10),
    week(1, "treatment", 1000, false),
    week(1, "control", 0, false),
  ];
  expect(sqlReadout("2026-11-30", rows).difference).toBe(1);
});
it("reports an inconclusive readout until both groups have mature post-exposure data", () => {
  const result = sqlReadout("2026-11-30", [
    week(-1, "treatment", 10),
    week(-1, "control", 10),
    week(0, "treatment", 100, false),
  ]);
  expect(result.difference).toBeNull();
  expect(result.warnings).toContain(
    "La ventana de ocho semanas todavía no está completa y madura.",
  );
});
