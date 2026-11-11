import { describe, expect, it } from "vitest";
import { metricTree, monitoringSignals, workbenchQueries } from "./workbench.js";

describe("analytics workbench catalog", () => {
  it("separates business, operational, and guardrail metrics", () => {
    expect(metricTree.business.length).toBeGreaterThan(0);
    expect(metricTree.operational.length).toBeGreaterThan(0);
    expect(metricTree.guardrails.some((metric) => metric.key === "channel_cannibalization")).toBe(true);
    expect(Object.values(metricTree).flat().every((metric) => metric.formula.length > 0 && metric.limitations.length > 0)).toBe(true);
  });

  it("covers the required monitoring signals", () => {
    expect(monitoringSignals.map((signal) => signal.key).sort()).toEqual(["conversion", "coverage", "indexation", "negative_experiment", "quality", "staleness", "traffic"]);
  });

  it("publishes three parameterized SQL templates with explicit extension usage", () => {
    expect(workbenchQueries).toHaveLength(3);
    for (const query of workbenchQueries) {
      expect(query.sql).toMatch(/SELECT/i);
      expect(query.sql).not.toContain("SELECT *");
      expect(query.originalTables.length).toBeGreaterThan(0);
      expect(query.extensionTables.length).toBeGreaterThan(0);
    }
    expect(workbenchQueries.find((query) => query.id === "municipality_prioritization")?.sql).toContain("motor_demanda_busqueda");
    expect(workbenchQueries.find((query) => query.id === "landing_cohort_comparison")?.sql).toContain("experiment_assignment");
    expect(workbenchQueries.find((query) => query.id === "quality_and_losses")?.sql).toContain("journey_event");
  });
});
