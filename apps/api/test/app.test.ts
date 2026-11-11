import type { GrowthRepository, StrategyAssumptions } from "../src/domain/types.js";
import { createApp } from "../src/app.js";
import { createLogger } from "../src/lib/logger.js";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

function repositoryMock(): GrowthRepository {
  return {
    health: vi.fn(async () => ({ database: "up" as const, seedVersion: "test-seed" })),
    filters: vi.fn(async () => ({ dateRange: { min: null, max: null }, provinces: [], municipalities: [], services: [], channels: [], languages: ["es", "ca"] as Array<"es" | "ca"> })),
    overview: vi.fn(async () => ({
      kpis: { leads: 0, sql: 0, altas: 0, leadToSql: 0, sqlToAlta: 0, costPerSql: 0, costPerAttributedAlta: 0, traceabilityCoverage: 0, duplicates: 0, opportunityMunicipalities: 0, capacityConstrainedMunicipalities: 0 },
      monthlyFunnel: [], channelFunnel: [], altasByMunicipality: [], opportunityRanking: [], discardReasons: [], caveats: [],
    })),
    opportunities: vi.fn(async (input) => ({ items: [], page: input.page, pageSize: input.pageSize, total: 0 })),
    opportunity: vi.fn(async () => null),
    journeys: vi.fn(async (input) => ({ items: [], page: input.page, pageSize: input.pageSize, total: 0 })),
    journey: vi.fn(async () => null),
    funnels: vi.fn(async () => ({ byChannel: [], byService: [], byMunicipality: [], byCohort: [], discardReasons: [], maturityWindowDays: 90, caveats: [] })),
    landings: vi.fn(async (input) => ({ items: [], page: input.page, pageSize: input.pageSize, total: 0 })),
    createLandingDraft: vi.fn(async () => { throw new Error("not configured"); }),
    reviewLanding: vi.fn(async () => { throw new Error("not configured"); }),
    approveLanding: vi.fn(async () => { throw new Error("not configured"); }),
    publishLanding: vi.fn(async () => { throw new Error("not configured"); }),
    seo: vi.fn(async () => ({ rows: [], caveat: "descriptive" })),
    ads: vi.fn(async () => ({ rows: [], caveats: [] })),
    experiments: vi.fn(async (input) => ({ items: [], page: input.page, pageSize: input.pageSize, total: 0 })),
    experiment: vi.fn(async () => null),
    dataQuality: vi.fn(async () => ({ generatedAt: new Date(0).toISOString(), freshness: [], identity: { totalEvents: 0, unlinkedEvents: 0, ambiguousIdentities: 0, traceabilityCoverage: 0 }, duplicates: { potentialLeadDuplicates: 0, confirmedLinks: 0 }, integrity: [], missingness: [], discrepancies: [], immatureCohorts: 0, limitations: [] })),
    strategy: vi.fn(async (assumptions: StrategyAssumptions) => ({
      label: "Synthetic planning demonstration — not a forecast" as const,
      baseline: { sqlPerMonth: 2000 as const, source: "planning_brief" as const, observedFilteredSql: 0 }, assumptions,
      scenarios: {
        conservative: { demandCaptureRate: 0.015, leadToSqlRate: 0.35, sqlToAltaRate: 0.12, capacityUtilization: 0.5 },
        base: { demandCaptureRate: 0.025, leadToSqlRate: 0.42, sqlToAltaRate: 0.18, capacityUtilization: 0.7 },
        optimistic: { demandCaptureRate: 0.04, leadToSqlRate: 0.5, sqlToAltaRate: 0.24, capacityUtilization: 0.85 },
      },
      scenarioProjection: { sql: 0, altas: 0, periodMonths: assumptions.months },
      prioritizedBets: [], rejectedBets: [], milestones: { first90Days: [], sixMonths: [] }, caveats: [],
    })),
    workbench: vi.fn(async () => ({ executionMode: "curated_read_only" as const, generatedAt: new Date(0).toISOString(), queries: [], warning: "No user SQL" })),
    governance: vi.fn(async () => ({ product: "Qida Growth Intelligence", architectureStages: [], ownership: [], integrations: [], controls: { validation: [], monitoring: [], approval: "human", privacy: "synthetic", evidenceLabels: [] } })),
  };
}

describe("Qida API", () => {
  let repository: GrowthRepository;
  beforeEach(() => { repository = repositoryMock(); });

  function app() { return createApp({ repository, logger: createLogger({ LOG_LEVEL: "silent" }) }); }

  it("reports database and seed health", async () => {
    const response = await request(app()).get("/api/v1/health").expect(200);
    expect(response.body).toEqual({ status: "ok", database: "up", seedVersion: "test-seed" });
    expect(response.headers["x-request-id"]).toBeTypeOf("string");
  });

  it("rejects unbounded page sizes with a structured request id", async () => {
    const response = await request(app()).get("/api/v1/opportunities?pageSize=101").set("x-request-id", "test-request").expect(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(response.body.error.requestId).toBe("test-request");
    expect(repository.opportunities).not.toHaveBeenCalled();
  });

  it("rejects reversed filter date ranges", async () => {
    await request(app()).get("/api/v1/overview?from=2026-06-01&to=2026-05-01").expect(400);
    expect(repository.overview).not.toHaveBeenCalled();
  });

  it("passes bounded server-side pagination to the repository", async () => {
    await request(app()).get("/api/v1/journeys?page=3&pageSize=10&search=synthetic").expect(200);
    expect(repository.journeys).toHaveBeenCalledWith(expect.objectContaining({ page: 3, pageSize: 10, search: "synthetic" }));
  });

  it("enforces the local approval role before persistence", async () => {
    const encodedUrl = encodeURIComponent("/local/es/test/respiro");
    const response = await request(app()).post(`/api/v1/landings/${encodedUrl}/approve`).send({ approver: "Local reviewer" }).expect(403);
    expect(response.body.error.code).toBe("ROLE_FORBIDDEN");
    expect(repository.approveLanding).not.toHaveBeenCalled();
  });

  it("validates deterministic landing draft commands", async () => {
    await request(app()).post("/api/v1/landings/drafts").send({ municipalityId: "001", language: "fr", service: "respiro", blocks: [] }).expect(400);
    expect(repository.createLandingDraft).not.toHaveBeenCalled();
  });

  it("applies named strategy scenario defaults and bounded overrides", async () => {
    const response = await request(app()).get("/api/v1/strategy?scenario=conservative&months=3&leadToSqlRate=0.4").expect(200);
    expect(response.body).toHaveProperty("scenarioProjection");
    expect(response.body).not.toHaveProperty("portfolioEstimate");
    expect(repository.strategy).toHaveBeenCalledWith(expect.objectContaining({ scenario: "conservative", months: 3, demandCaptureRate: 0.015, leadToSqlRate: 0.4 }));
    await request(app()).get("/api/v1/strategy?demandCaptureRate=0.9").expect(400);
  });

  it("publishes an OpenAPI document containing the complete surface", async () => {
    const response = await request(app()).get("/api/v1/openapi.json").expect(200);
    expect(response.body.openapi).toBe("3.0.3");
    expect(response.body.paths).toHaveProperty("/workbench");
    expect(response.body.paths).toHaveProperty("/governance");
    expect(response.body.paths).toHaveProperty("/landings/{url}/publish");
  });

  it("returns structured 404 errors", async () => {
    const response = await request(app()).get("/api/v1/does-not-exist").expect(404);
    expect(response.body.error).toEqual(expect.objectContaining({ code: "NOT_FOUND", requestId: expect.any(String) }));
  });
});
