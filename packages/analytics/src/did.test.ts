import { describe, expect, it } from "vitest";
import { differenceInDifferences, type DidObservation } from "./did.js";

function observations(group: "treatment" | "control", prefix: string, values: readonly number[]): DidObservation[] {
  return Array.from({ length: 10 }, (_, unit) => values.map((value, period) => ({
    unitId: `${prefix}-${String(unit)}`,
    group,
    period: `p${String(period)}`,
    phase: period < 3 ? "pre" as const : "post" as const,
    value,
  }))).flat();
}

describe("differenceInDifferences", () => {
  it("calculates the observed effect but never automatically claims causality", () => {
    const result = differenceInDifferences([
      ...observations("treatment", "t", [10, 11, 12, 18]),
      ...observations("control", "c", [8, 9, 10, 12]),
    ]);
    expect(result.observedDifferenceInDifferences).toBe(4);
    expect(result.parallelTrendsCheck).toBe("pass");
    expect(result.causalClaimSupported).toBe(false);
    expect(result.limitations.at(-1)).toContain("confundidores");
  });

  it("warns when pre trends diverge", () => {
    const result = differenceInDifferences([
      ...observations("treatment", "t", [10, 15, 20, 22]),
      ...observations("control", "c", [10, 10, 10, 11]),
    ]);
    expect(result.parallelTrendsCheck).toBe("warning");
  });
});
