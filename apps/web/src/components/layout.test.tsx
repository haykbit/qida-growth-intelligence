import { describe, expect, it } from "vitest";
import { navigationGroups } from "./layout";

describe("workspace navigation", () => {
  it("keeps only the active product surfaces", () => {
    const [primary, ...secondary] = navigationGroups;

    expect(primary?.primary).toBe(true);
    expect(primary?.items.map((item) => item.label)).toEqual([
      "Landings",
      "Oportunidades",
      "Medición",
    ]);
    expect(secondary).toEqual([]);
  });

  it("exposes every route once", () => {
    const routes = navigationGroups.flatMap((group) =>
      group.items.map((item) => item.to),
    );

    expect(new Set(routes).size).toBe(routes.length);
  });
});
