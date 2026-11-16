import { expect, test } from "@playwright/test";

test("abre las dos versiones y la evidencia comercial desde una decisión", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Rendimiento de landings" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Medición", exact: true })
    .first()
    .click();
  await page
    .getByRole("link", { name: "Zaragoza", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("tab", { name: "Cambios y decisiones" }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(
    page.getByText("Titular y botón principal", { exact: true }),
  ).toBeVisible();
  for (const label of ["anterior", "nueva"]) {
    const opened = page.waitForEvent("popup");
    await page
      .getByRole("link", { name: "Ver versión " + label, exact: true })
      .click();
    const preview = await opened;
    await expect(preview.getByRole("heading", { level: 1 })).toHaveText(
      label === "anterior"
        ? "Más compañía. Más autonomía. Más tranquilidad."
        : "Encuentra acompañamiento a domicilio en Zaragoza",
    );
    await preview.close();
  }
  await expect(
    page.getByText("SQL familiares elegibles frente al control", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByText("Municipios asignados", { exact: true }).click();
  await expect(page.getByText(/Control · /)).toBeVisible();
  await expect(page.getByLabel("Responsable", { exact: true })).toHaveAttribute(
    "required",
    "",
  );
  await expect(
    page.getByRole("button", { name: "Guardar decisión" }),
  ).toBeVisible();
});

test("abre filtros y el acta de una sesión desde el calendario en móvil", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Filtros", exact: true }).click();
  await expect(page.getByLabel("Filtros globales")).toBeVisible();
  await page.getByRole("button", { name: "Cerrar filtros" }).click();
  await page.getByRole("button", { name: "Abrir navegación" }).click();
  await page
    .getByRole("link", { name: "Plan de 90 días", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: /^Revisión semanal,/ })
    .nth(1)
    .click();
  await expect(
    page.getByRole("combobox", { name: "Sesión", exact: true }),
  ).toHaveValue("2026-11-30");
  await page.getByRole("button", { name: "Añadir acción" }).click();
  await expect(page.getByLabel("Responsable de la acción")).toBeVisible();
});

test("navega desde oportunidades hasta las consultas del modelo", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: "Oportunidades", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Oportunidades", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "Modelo de datos", exact: true })
    .first()
    .click();
  await page.getByRole("tab", { name: "Consultas", exact: true }).click();
  await page.getByRole("tab", { name: "SQL", exact: true }).click();
  await expect(page.locator("pre").first()).toBeVisible();
});
