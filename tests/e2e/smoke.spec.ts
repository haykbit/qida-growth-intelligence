import { expect, test } from "@playwright/test";

test("analyst can navigate core intelligence surfaces", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /executive|overview/i })).toBeVisible();
  await page.getByRole("link", { name: /opportunit/i }).click();
  await expect(page.getByRole("heading", { name: /opportunit/i })).toBeVisible();
  await page.getByRole("link", { name: /journey/i }).click();
  await expect(page.getByText(/attribution.*causal|causal.*attribution/i)).toBeVisible();
});

