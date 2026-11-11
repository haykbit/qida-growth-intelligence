import { z } from "zod";

export const filterSchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  province: z.string().max(100).optional(),
  municipalityId: z.string().max(32).optional(),
  service: z.string().max(100).optional(),
  channel: z.string().max(100).optional(),
  language: z.enum(["es", "ca"]).optional(),
});
export type GlobalFilters = z.infer<typeof filterSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const kpiSchema = z.object({
  leads: z.number().int().nonnegative(), sql: z.number().int().nonnegative(), altas: z.number().int().nonnegative(),
  leadToSql: z.number().min(0).max(1), sqlToAlta: z.number().min(0).max(1), costPerSql: z.number().nonnegative().nullable(),
  costPerAttributedAlta: z.number().nonnegative().nullable(), traceabilityCoverage: z.number().min(0).max(1), duplicates: z.number().int().nonnegative(),
  opportunityMunicipalities: z.number().int().nonnegative(), capacityConstrainedMunicipalities: z.number().int().nonnegative(),
});
export type Kpis = z.infer<typeof kpiSchema>;

export type SeriesPoint = { period: string; leads: number; sql: number; altas: number };
export type BreakdownPoint = { name: string; value: number; secondary?: number };
export type OverviewResponse = { kpis: Kpis; monthlyFunnel: SeriesPoint[]; channelFunnel: Array<SeriesPoint & { channel: string }>; altasByMunicipality: BreakdownPoint[]; opportunityRanking: OpportunityRow[]; discardReasons: BreakdownPoint[]; caveats: string[] };

export type OpportunityFactor = { key: string; label: string; normalizedValue: number; weight: number; contribution: number; evidence: string };
export type OpportunityRow = { municipalityId: string; municipality: string; province: string; service: string; monthlySearches: number; estimatedCpc: number; sql: number; altas: number; sqlToAlta: number; caregiversAvailable: number; coverage: boolean; voiceSignals: number; competitors: number; score: number; eligibility: "eligible" | "constrained" | "ineligible" };
export type OpportunityDetail = OpportunityRow & { factors: OpportunityFactor[]; constraints: string[]; proposedAction: string; validationMetric: string; rulesVersion: string; disclaimer: string };

export type IdentityStatus = "confirmed" | "ambiguous" | "unlinked";
export type JourneyEventDto = { eventId: string; eventType: string; occurredAt: string; channel: string | null; campaign: string | null; landingUrl: string | null; sourceSystem: string; observed: boolean; identityStatus: IdentityStatus; metadata: Record<string, unknown> };
export type JourneySummary = { opportunityId: string; personId: string; municipality: string; service: string; status: string; createdAt: string; linkedIdentityCount: number; identityStatus: IdentityStatus };
export type JourneyDetail = JourneySummary & { events: JourneyEventDto[]; identities: Array<{ sourceSystem: string; pseudonym: string; method: string; ambiguous: boolean }>; attribution: { firstTouch: string | null; lastTouch: string | null; multiTouch: Array<{ channel: string; touches: number }> }; warning: string };

export type LandingStatus = "draft" | "pending_review" | "approved" | "published" | "rejected";
export const landingDraftRequestSchema = z.object({ municipalityId: z.string().min(1), language: z.enum(["es", "ca"]), service: z.string().min(1), blocks: z.array(z.enum(["hero", "coverage", "how_it_works", "faq", "contact"])).min(1) });
export type LandingDraftRequest = z.infer<typeof landingDraftRequestSchema>;

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };
export type ApiError = { error: { code: string; message: string; details?: unknown; requestId: string } };

