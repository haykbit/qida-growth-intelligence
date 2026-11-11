import { describe, expect, it } from "vitest";
import { calculateScenario } from "./planning";

describe("calculateScenario", () => {
  it("derives incremental SQL and altas from explicit planning assumptions", () => {
    expect(calculateScenario({ baselineSql: 2000, sqlUplift: 0.06, sqlToAlta: 0.15 })).toEqual({ incrementalSql: 120, incrementalAltas: 18 });
  });

  it("does not allow negative volume or a conversion outside zero to one", () => {
    expect(calculateScenario({ baselineSql: -2000, sqlUplift: 0.06, sqlToAlta: 2 })).toEqual({ incrementalSql: 0, incrementalAltas: 0 });
    expect(calculateScenario({ baselineSql: 2000, sqlUplift: 0.1, sqlToAlta: 2 })).toEqual({ incrementalSql: 200, incrementalAltas: 200 });
  });
});
