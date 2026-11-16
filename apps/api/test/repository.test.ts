import type { DatabaseClient } from "../src/lib/prisma.js";
import { PrismaGrowthRepository } from "../src/repositories/prisma-growth-repository.js";
import { describe, expect, it, vi } from "vitest";

function databaseReturning(resultSets: unknown[][]): { database: DatabaseClient; query: ReturnType<typeof vi.fn> } {
  let index = 0;
  const query = vi.fn(async () => resultSets[index++] ?? []);
  const database = {
    $queryRawUnsafe: query,
    $executeRawUnsafe: vi.fn(async () => 1),
    $transaction: vi.fn(),
    $disconnect: vi.fn(async () => undefined),
  } as unknown as DatabaseClient;
  return { database, query };
}

describe("PrismaGrowthRepository evidence semantics", () => {
  function overviewResultSets(paidSql: number, paidAltas: number): unknown[][] {
    return [
      [{
        leads: 10, sql_count: 5, alta_count: 2, mature_sql_count: 4, mature_alta_count: 1,
        traced: 8, duplicates: 1, opportunity_municipalities: 2, constrained_municipalities: 1, spend: 100,
      }],
      [{ paid_sql_count: paidSql, paid_alta_count: paidAltas }],
      [], [{ period: "2026-01", mature_leads: 10, mature_sql: 5, mature_altas: 2 }], [], [], [], [],
    ];
  }

  it("scores opportunities without an uncalibrated confidence field or multiplier", async () => {
    const { database, query } = databaseReturning([[
      {
        municipio_id: "m-1", municipality: "Municipio", province: "Provincia", service: "respiro",
        monthly_searches: 250, estimated_cpc: 1.8, lead_count: 30, sql_count: 12, alta_count: 3,
        caregivers_available: 15, coverage: true, voice_signals: 20, competitors: 2, score: 44, total: 1,
        own_municipal_data: true, demand_months_observed: 12, latest_demand_month: "2026-10", latest_lead_at: new Date("2026-10-15T00:00:00.000Z"),
      },
    ]]);
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.opportunities({ page: 1, pageSize: 25 });

    expect(response.items[0]).not.toHaveProperty("confidence");
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).not.toContain("confidence");
    expect(sql).not.toContain("0.45");
  });

  it("explains landing selection eligibility, provenance and freshness", async () => {
    const common = {
      province: "Barcelona", service: "respiro", monthly_searches: 250, estimated_cpc: 1.8,
      lead_count: 30, sql_count: 12, alta_count: 3, voice_signals: 20, competitors: 2,
      score: 44, demand_months_observed: 12, latest_demand_month: "2026-10",
      latest_lead_at: new Date("2026-10-15T00:00:00.000Z"), total: 4,
    };
    const { database, query } = databaseReturning([[
      { ...common, municipio_id: "m-1", municipality: "Elegible", caregivers_available: 15, coverage: true, own_municipal_data: true },
      { ...common, municipio_id: "m-2", municipality: "Restringido", caregivers_available: 4, coverage: true, own_municipal_data: true },
      { ...common, municipio_id: "m-3", municipality: "Agregado", caregivers_available: 15, coverage: true, own_municipal_data: false },
      { ...common, municipio_id: "m-4", municipality: "Sin histórico suficiente", caregivers_available: 15, coverage: true, own_municipal_data: true, demand_months_observed: 3 },
    ]]);
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.opportunities({ page: 1, pageSize: 25 });

    expect(response.items.map((item) => item.selectionEligibility)).toEqual(["eligible", "constrained", "ineligible", "ineligible"]);
    expect(response.items[0]).toMatchObject({
      leads: 30,
      dataSource: "municipal_own",
      demandMonthsObserved: 12,
      latestDemandMonth: "2026-10",
      latestLeadAt: "2026-10-15T00:00:00.000Z",
      selectionRulesVersion: "qgi-landing-selection-v1.0.0",
      selectionReasons: [],
    });
    expect(response.items[1]?.selectionReasons).toContain("Hay menos de ocho cuidadoras disponibles a 30 días");
    expect(response.items[2]).toMatchObject({ dataSource: "province_fallback" });
    expect(response.items[2]?.selectionReasons).toContain("Solo hay agregados provinciales; falta evidencia municipal propia");
    expect(response.items[3]?.selectionReasons).toContain("Hay menos de seis meses de demanda observada");
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).toContain("tipo_contacto <> 'cuidadora_empleo'");
    expect(sql).toContain("m.datos_propios AS own_municipal_data");
    expect(sql).toContain("COUNT(DISTINCT mes)::int AS demand_months_observed");
  });

  it("returns categorical identity evidence from persisted ambiguous status", async () => {
    const { database } = databaseReturning([
      [{
        opportunity_id: "opp-1", person_id: "person-1", municipality: "Municipio", service: "respiro",
        status: "alta", created_at: new Date("2026-01-01T00:00:00.000Z"), linked_identity_count: 1,
        identity_status: "ambiguous", crm_source_system: "hubspot", crm_source_identifier: "hubspot-contact-lead-1",
        crm_match_method: "explicit_crm_contact_id", route: [{ eventType: "landing_view", occurredAt: "2026-01-01T01:00:00.000Z", sourceSystem: "web", channel: "organic", observed: true }], total: 1,
      }],
      [{
        event_id: "event-1", event_type: "landing_view", occurred_at: new Date("2026-01-01T01:00:00.000Z"),
        channel: "organic", campaign: null, landing_url: "/local", source_system: "web", metadata: {},
        identity_status: "ambiguous",
      }],
      [{ source_system: "crm", source_identifier: "synthetic-1", match_method: "explicit", ambiguous: true }],
    ]);
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.journey("opp-1");

    expect(response).toMatchObject({ identityStatus: "ambiguous", linkedIdentityCount: 1 });
    expect(response?.route).toEqual([{ eventType: "landing_view", occurredAt: "2026-01-01T01:00:00.000Z", sourceSystem: "web", channel: "organic", observed: true }]);
    expect(response?.crmProfile).toMatchObject({ sourceSystem: "hubspot", matchMethod: "explicit_crm_contact_id" });
    expect(response?.crmProfile?.contactRef).toMatch(/^hs_[a-f0-9]{12}$/u);
    expect(response?.crmProfile?.contactRef).not.toContain("lead-1");
    expect(response?.events[0]).toMatchObject({ identityStatus: "ambiguous" });
    expect(response?.events[0]).not.toHaveProperty("identityConfidence");
    expect(response?.identities[0]).toMatchObject({ method: "explicit", ambiguous: true });
    expect(response?.identities[0]).not.toHaveProperty("confidence");
  });

  it.each([
    { name: "an unassignable service filter", filters: { service: "respiro" }, paidSql: 5, paidAltas: 2 },
    { name: "no reconciled denominator", filters: {}, paidSql: 0, paidAltas: 0 },
  ])("returns unavailable cost ratios for $name", async ({ filters, paidSql, paidAltas }) => {
    const { database } = databaseReturning(overviewResultSets(paidSql, paidAltas));
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.overview(filters);

    expect(response.kpis.costPerSql).toBeNull();
    expect(response.kpis.costPerAttributedAlta).toBeNull();
  });

  it("calculates paid cost ratios only for date-global reconciled outcomes", async () => {
    const { database } = databaseReturning(overviewResultSets(5, 2));
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.overview({ from: "2026-01-01", to: "2026-12-31" });

    expect(response.kpis.costPerSql).toBe(20);
    expect(response.kpis.costPerAttributedAlta).toBe(50);
    expect(response.monthlyConversion).toEqual([{
      period: "2026-01", leadToSql: 0.5, sqlToAlta: 0.4, matureLeads: 10, matureSql: 5,
    }]);
  });

  it("aggregates platform conversions before joining campaign events for data-quality discrepancies", async () => {
    const { database, query } = databaseReturning([
      [],
      [{ total_events: 0, unlinked_events: 0, ambiguous_identities: 0 }],
      [{ confirmed_links: 0, potential_duplicates: 0 }],
      [],
      [],
      [{ metric: "Google Ads", platform: 12, crm: 2 }],
      [{ count: 0 }],
    ]);
    const repository = new PrismaGrowthRepository(database, "test");

    const response = await repository.dataQuality();

    expect(response.discrepancies).toEqual([{ metric: "Google Ads", platform: 12, crm: 2, difference: 10 }]);
    const discrepancySql = String(query.mock.calls[5]?.[0]);
    expect(discrepancySql).toContain("platform_totals AS");
    expect(discrepancySql).toContain("SELECT DISTINCT plataforma, campania");
    expect(discrepancySql).not.toContain("FROM ads_diario a LEFT JOIN journey_event");
  });

  it("counts only eligible recent SQL as pending maturity", async () => {
    const { database, query } = databaseReturning([
      [],
      [{ total_events: 0, unlinked_events: 0, ambiguous_identities: 0 }],
      [{ confirmed_links: 0, potential_duplicates: 0 }],
      [],
      [],
      [],
      [{ count: 7 }],
    ]);
    const repository = new PrismaGrowthRepository(database, "test");

    const response = await repository.dataQuality();

    expect(response.pendingMaturitySql).toBe(7);
    const maturitySql = String(query.mock.calls[6]?.[0]);
    expect(maturitySql).toContain("l.fecha_sql > CURRENT_DATE - interval '90 days'");
    expect(maturitySql).toContain("m.tiene_cobertura AND m.cuidadoras_disponibles_30d >= 8");
    expect(maturitySql).toContain("tipo_contacto <> 'cuidadora_empleo'");
  });

  it("catalogs the six metric-producing query families used by the product", async () => {
    const { database } = databaseReturning([
      [{ municipio: "Terrassa", servicio: "acompanamiento", busquedas_mensuales: 420, leads: 22, sql: 8, altas: 2, cuidadoras_30d: 16, cobertura: true, puntuacion: 58 }],
      [{ url: "/cuidados/terrassa", municipality: "Terrassa", sessions: 500, leads: 25, sql_count: 10, alta_count: 3, impressions: 1000, clicks: 80, average_position: 8, coverage: true, caregivers_available: 16 }],
      [{ experiment_id: "exp-1", name: "CTA local", primary_metric: "formularios_por_sesion", methodology: "geo_holdout", treatment_count: 4, control_count: 4 }],
      [{ total_events: 100, unlinked_events: 10, ambiguous_identities: 2 }],
      [{ check: "sql_before_lead", failures: 0 }],
      [{ pending_maturity_sql: 7 }],
      [{ period: "2026-10", sesiones: 500, formularios: 25, clics_telefono: 12, leads: 25, sql: 10, altas: 3 }],
      [
        { variant: "treatment", period: "pre_late", conversion: 0.04, sample_size: 400 },
        { variant: "treatment", period: "post", conversion: 0.06, sample_size: 500 },
        { variant: "control", period: "pre_late", conversion: 0.04, sample_size: 420 },
        { variant: "control", period: "post", conversion: 0.045, sample_size: 480 },
      ],
    ]);
    const repository = new PrismaGrowthRepository(database, "test");

    const response = await repository.workbench();

    expect(response.queries.map((query) => query.id)).toEqual([
      "opportunity_score",
      "landing_performance",
      "landing_monthly_funnel",
      "experiment_effect",
      "traceability_coverage",
      "quality_controls",
    ]);
    expect(response.queries.every((query) => query.statements.length > 0 && query.metrics.length > 0 && query.shownIn.length > 0)).toBe(true);
    expect(response.queries.find((query) => query.id === "experiment_effect")?.resultRows[0]).toMatchObject({ cambio_estimado: 0.015 });
    expect(response.queries.find((query) => query.id === "traceability_coverage")?.resultRows[0]).toMatchObject({ cobertura: 0.9 });
  });

  it("builds versioned planning ranges from persisted eligible demand", async () => {
    const { database } = databaseReturning([
      [
        {
          municipio_id: "m-1", municipality: "Barcelona", province: "Barcelona", service: "cuidados por horas",
          monthly_searches: 1_000, estimated_cpc: 2.4, lead_count: 30, sql_count: 10, alta_count: 2,
          caregivers_available: 16, coverage: true, voice_signals: 20, competitors: 2, score: 80, total: 2,
          own_municipal_data: true, demand_months_observed: 12, latest_demand_month: "2026-10", latest_lead_at: new Date("2026-10-15T00:00:00.000Z"),
        },
        {
          municipio_id: "m-2", municipality: "Municipio sin cobertura", province: "Barcelona", service: "cuidadora interna",
          monthly_searches: 2_000, estimated_cpc: 3.2, lead_count: 0, sql_count: 0, alta_count: 0,
          caregivers_available: 20, coverage: false, voice_signals: 10, competitors: 4, score: 0, total: 2,
          own_municipal_data: false, demand_months_observed: 12, latest_demand_month: "2026-10", latest_lead_at: null,
        },
      ],
      [{ sql_count: 120, paid_sql_count: 40 }],
    ]);
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.strategy({
      scenario: "base",
      demandCaptureRate: 0.025,
      leadToSqlRate: 0.42,
      sqlToAltaRate: 0.18,
      capacityUtilization: 0.7,
      months: 6,
      marketLimit: 10,
    });

    expect(response.planningModel).toMatchObject({
      version: "qgi-landing-impact-v1.0.0",
      candidateRowsEvaluated: 2,
      eligibleMarketsInCandidateSet: 1,
      marketsIncluded: 1,
    });
    expect(response.scenarioProjection).toEqual({ sql: 44.1, altas: 7.9, periodMonths: 6 });
    expect(response.prioritizedBets).toHaveLength(1);
    expect(response.rejectedBets[0]).toMatchObject({ municipalityId: "m-2", scenarioSql: 0, scenarioAltas: 0 });
    expect(response.impactRange.sql.min).toBeLessThan(response.impactRange.sql.max);
    expect(response.enablingInitiatives[0]).toMatchObject({ directScenarioSql: 0, directScenarioAltas: 0 });
    expect(response.portfolioInitiatives).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "local_landings", outcome: "sql" }),
      expect.objectContaining({ id: "qualification", outcome: "altas", scenarioValues: { conservative: 7.2, base: 14.4, optimistic: 21.6 } }),
      expect.objectContaining({ id: "paid_reallocation", outcome: "sql", scenarioValues: { conservative: 12, base: 24, optimistic: 36 } }),
      expect.objectContaining({ id: "traceability", outcome: "enabler", range: { min: 0, max: 0 } }),
    ]));
    expect(response.caveats.join(" ")).toContain("not incremental estimates or causal forecasts");
  });
});
