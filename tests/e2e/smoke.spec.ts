import { expect, test } from "@playwright/test";

test("analyst can navigate core intelligence surfaces", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /executive|overview/i })).toBeVisible();
  await page.getByRole("link", { name: /opportunit/i }).click();
  await expect(page.getByRole("heading", { name: /opportunit/i })).toBeVisible();
  await page.getByRole("link", { name: /journey/i }).click();
  await expect(page.getByText(/vistas descriptivas de atribución/i)).toBeVisible();

  await page.getByRole("link", { name: /strategy/i }).click();
  await expect(page.getByRole("heading", { name: /growth strategy/i })).toBeVisible();
  await expect(page.getByText(/2[.,]?000 SQL\/mes/i)).toBeVisible();

  await page.getByRole("link", { name: /analytics workbench/i }).click();
  await expect(page.getByRole("heading", { name: /analytics workbench/i })).toBeVisible();
  await expect(page.locator("pre")).toHaveCount(3);

  await page.getByRole("link", { name: /^architecture$/i }).click();
  await expect(page.getByRole("heading", { name: /architecture.*governance/i })).toBeVisible();

  await page.getByRole("link", { name: /interview mode/i }).click();
  await expect(page.getByRole("heading", { name: /case study|interview/i })).toBeVisible();
  await expect(page.getByText(/synthetic|sintétic/i).first()).toBeVisible();
});

test("responsive shell keeps core navigation and filters usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /executive overview/i })).toBeVisible();
  await page.getByRole("button", { name: "Filtros" }).click();
  await expect(page.getByLabel("Provincia")).toBeVisible();
  await page.getByRole("button", { name: "Aplicar" }).click();
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page.getByRole("link", { name: /strategy/i }).click();
  await expect(page.getByRole("heading", { name: /growth strategy/i })).toBeVisible();
});

