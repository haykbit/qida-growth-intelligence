import { describe, expect, it } from "vitest";
import { staticDemoRequest } from "./static-demo";

function object(value: unknown): Record<string, unknown> {
  expect(value).toBeTypeOf("object");
  expect(value).not.toBeNull();
  return value as Record<string, unknown>;
}

describe("static GitHub Pages data", () => {
  it("returns a paginated landing portfolio with calculated totals", async () => {
    const result = object(await staticDemoRequest("/landing-insights?page=1&pageSize=20"));
    expect(result.total).toBe(140);
    expect(result.items).toHaveLength(20);
    expect(object(result.totals).landings).toBe(140);
  });

  it("filters opportunities without calling the backend", async () => {
    const result = object(
      await staticDemoRequest("/opportunities?page=1&pageSize=12&province=Burgos"),
    );
    const items = result.items as Array<Record<string, unknown>>;
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.province === "Burgos")).toBe(true);
  });

  it("resolves the service slug used by the application routes", async () => {
    const result = object(
      await staticDemoRequest("/opportunities/09075/acompanamiento"),
    );
    expect(result.municipalityId).toBe("09075");
    expect(result.service).toBe("acompanamiento");
  });

  it("exposes measurement and data-model snapshots", async () => {
    const learning = object(await staticDemoRequest("/learning"));
    const workbench = object(await staticDemoRequest("/workbench"));
    expect(learning.experiments).toHaveLength(4);
    expect(workbench.queries).toHaveLength(6);
  });
});
