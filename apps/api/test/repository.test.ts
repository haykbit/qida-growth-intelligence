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
  it("scores opportunities without an uncalibrated confidence field or multiplier", async () => {
    const { database, query } = databaseReturning([[
      {
        municipio_id: "m-1", municipality: "Municipio", province: "Provincia", service: "respiro",
        monthly_searches: 250, estimated_cpc: 1.8, sql_count: 12, alta_count: 3,
        caregivers_available: 15, coverage: true, voice_signals: 20, competitors: 2, score: 44, total: 1,
      },
    ]]);
    const repository = new PrismaGrowthRepository(database, "test");
    const response = await repository.opportunities({ page: 1, pageSize: 25 });

    expect(response.items[0]).not.toHaveProperty("confidence");
    const sql = String(query.mock.calls[0]?.[0]);
    expect(sql).not.toContain("confidence");
    expect(sql).not.toContain("0.45");
  });

  it("returns categorical identity evidence from persisted ambiguous status", async () => {
    const { database } = databaseReturning([
      [{
        opportunity_id: "opp-1", person_id: "person-1", municipality: "Municipio", service: "respiro",
        status: "alta", created_at: new Date("2026-01-01T00:00:00.000Z"), linked_identity_count: 1,
        identity_status: "ambiguous", total: 1,
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
    expect(response?.events[0]).toMatchObject({ identityStatus: "ambiguous" });
    expect(response?.events[0]).not.toHaveProperty("identityConfidence");
    expect(response?.identities[0]).toMatchObject({ method: "explicit", ambiguous: true });
    expect(response?.identities[0]).not.toHaveProperty("confidence");
  });
});
