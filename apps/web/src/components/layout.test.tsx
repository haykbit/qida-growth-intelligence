import { describe, expect, it } from "vitest";
import { navigationGroups } from "./layout";

describe("workspace navigation", () => {
  it("keeps the primary navigation focused and moves secondary tools into groups", () => {
    const [primary, ...secondary] = navigationGroups;

    expect(primary?.primary).toBe(true);
    expect(primary?.items.map((item) => item.label)).toEqual([
      "Resumen",
      "Oportunidades",
      "Recorridos",
      "Fábrica de landings",
      "Estrategia",
    ]);
    expect(secondary.map((group) => group.label)).toEqual(["Análisis", "Contexto"]);
  });

  it("exposes every route once", () => {
    const routes = navigationGroups.flatMap((group) => group.items.map((item) => item.to));

    expect(new Set(routes).size).toBe(routes.length);
  });
});
