export * from "./review.js";
import { changeSchema } from "./review.js";
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
export type ConversionPoint = { period: string; leadToSql: number; sqlToAlta: number; matureLeads: number; matureSql: number };
export type BreakdownPoint = { name: string; value: number; secondary?: number };
export type OverviewResponse = { kpis: Kpis; monthlyFunnel: SeriesPoint[]; monthlyConversion: ConversionPoint[]; channelFunnel: Array<SeriesPoint & { channel: string }>; altasByMunicipality: BreakdownPoint[]; opportunityRanking: OpportunityRow[]; discardReasons: BreakdownPoint[]; caveats: string[] };

export type OpportunityFactor = { key: string; label: string; normalizedValue: number; weight: number; contribution: number; evidence: string };
export type OpportunityRow = {
  municipalityId: string;
  municipality: string;
  province: string;
  service: string;
  monthlySearches: number;
  estimatedCpc: number;
  leads: number;
  sql: number;
  altas: number;
  sqlToAlta: number;
  caregiversAvailable: number;
  coverage: boolean;
  voiceSignals: number;
  competitors: number;
  score: number;
  eligibility: "eligible" | "constrained" | "ineligible";
  selectionEligibility: "eligible" | "constrained" | "ineligible";
  selectionReasons: string[];
  dataSource: "municipal_own" | "province_fallback";
  demandMonthsObserved: number;
  latestDemandMonth: string | null;
  latestLeadAt: string | null;
  selectionRulesVersion: string;
};
export type OpportunityDetail = OpportunityRow & { factors: OpportunityFactor[]; constraints: string[]; proposedAction: string; validationMetric: string; rulesVersion: string; disclaimer: string };

export type IdentityStatus = "confirmed" | "ambiguous" | "unlinked";
export type JourneyEventDto = { eventId: string; eventType: string; occurredAt: string; channel: string | null; campaign: string | null; landingUrl: string | null; sourceSystem: string; observed: boolean; identityStatus: IdentityStatus; metadata: Record<string, unknown> };
export type JourneyRouteStep = { eventType: string; occurredAt: string; sourceSystem: string; channel: string | null; observed: boolean };
export type JourneyCrmProfile = { sourceSystem: string; contactRef: string; matchMethod: string };
export type JourneySummary = { opportunityId: string; personId: string; municipality: string; service: string; status: string; createdAt: string; linkedIdentityCount: number; identityStatus: IdentityStatus; route: JourneyRouteStep[]; crmProfile: JourneyCrmProfile | null };
export type JourneyDetail = JourneySummary & { events: JourneyEventDto[]; identities: Array<{ sourceSystem: string; pseudonym: string; method: string; ambiguous: boolean }>; attribution: { firstTouch: string | null; lastTouch: string | null; multiTouch: Array<{ channel: string; touches: number }> }; warning: string };

export type LandingStatus = "draft" | "pending_review" | "approved" | "published" | "rejected";
export const landingDraftRequestSchema = z.object({ municipalityId: z.string().min(1), language: z.enum(["es", "ca"]), service: z.string().min(1), blocks: z.array(z.enum(["hero", "coverage", "how_it_works", "faq", "contact"])).min(1) });
export type LandingDraftRequest = z.infer<typeof landingDraftRequestSchema>;

export const landingDecisionRequestSchema = z.object({
  decision: z.enum(["keep", "iterate", "stop"]),
  hypothesis: z.string().trim().min(10).max(500),
  primaryMetric: z.enum(["session_to_lead", "lead_to_sql", "sql_to_alta", "sql_per_municipality_week"]),
  guardrailMetric: z.enum(["lead_to_sql", "sql_to_alta", "caregiver_capacity"]),
  note: z.string().trim().max(500).optional(),
  author: z.string().trim().min(1).max(100).optional(),
  change: changeSchema.optional(),
  evidenceDecisionId: z.string().min(1).max(100).optional(),
}).strict();
export type LandingDecisionRequest = z.infer<typeof landingDecisionRequestSchema>;

export type Paginated<T> = { items: T[]; page: number; pageSize: number; total: number };
export type ApiError = { error: { code: string; message: string; details?: unknown; requestId: string } };

