import { expect, test } from "@playwright/test";

test("la navegación prioriza las superficies principales", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await expect(page.getByLabel("Filtros globales")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Oportunidades" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Recorridos" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Fábrica de landings" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Estrategia" })).toBeVisible();
  await expect(page.getByRole("link", { name: "SEO" })).toHaveCount(0);

  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByLabel("Filtros globales")).toBeVisible();
  await expect(page.getByLabel("Provincia")).toBeVisible();
  await page.getByRole("button", { name: "Aplicar" }).click();
  await expect(page.getByLabel("Filtros globales")).toHaveCount(0);

  await page.getByRole("link", { name: "Oportunidades" }).click();
  await expect(page.getByRole("heading", { name: "Oportunidades" })).toBeVisible();
  await expect(page.getByText(/confidence|confianza/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Análisis" }).click();
  await page.getByRole("link", { name: "Banco SQL" }).click();
  await expect(page.getByRole("heading", { name: "Banco de trabajo SQL" })).toBeVisible();
  await expect(page.locator("pre")).toHaveCount(3);

  await page.getByRole("button", { name: "Contexto" }).click();
  await page.getByRole("link", { name: "Arquitectura" }).click();
  await expect(page.getByRole("heading", { name: "Arquitectura y gobierno" })).toBeVisible();
});

test("el shell móvil mantiene navegación y filtros bajo demanda", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await expect(page.getByLabel("Filtros globales")).toHaveCount(0);

  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByLabel("Filtros globales")).toBeVisible();
  await page.getByRole("button", { name: "Aplicar" }).click();

  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page.getByRole("link", { name: "Estrategia" }).click();
  await expect(page.getByRole("heading", { name: "Estrategia" })).toBeVisible();
  await expect(page.getByText(/2[.,]?000 SQL\/mes/i)).toBeVisible();
  await expect(page.getByText(/confidence|confianza/i)).toHaveCount(0);
});
