import { z } from "zod";
import { landingDraftRequestSchema, type GlobalFilters, type LandingDraftRequest } from "@qida/contracts";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";

const apiErrorSchema = z.object({
  error: z.object({ code: z.string(), message: z.string(), details: z.unknown().optional(), requestId: z.string() }),
});

export class ApiClientError extends Error {
  readonly code: string;
  readonly requestId: string;
  constructor(message: string, code = "UNKNOWN", requestId = "unavailable") {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
    this.requestId = requestId;
  }
}

async function request<T>(path: string, schema: z.ZodType<T>, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = apiErrorSchema.safeParse(payload);
    throw new ApiClientError(parsed.success ? parsed.data.error.message : `La API respondió con ${response.status}`, parsed.success ? parsed.data.error.code : "HTTP_ERROR", parsed.success ? parsed.data.error.requestId : "unavailable");
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new ApiClientError("La respuesta de la API no cumple el contrato esperado.", "CONTRACT_MISMATCH", response.headers.get("x-request-id") ?? "unavailable");
  }
  return parsed.data;
}

function queryString(filters: GlobalFilters, pagination?: { page?: number; pageSize?: number }, extra?: Record<string, string | undefined>): string {
  const values: Record<string, string | undefined> = { ...filters, ...extra };
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
  if (pagination?.page) params.set("page", String(pagination.page));
  if (pagination?.pageSize) params.set("pageSize", String(pagination.pageSize));
  const text = params.toString();
  return text ? `?${text}` : "";
}

const seriesPointSchema = z.object({ period: z.string(), leads: z.number(), sql: z.number(), altas: z.number() });
const breakdownSchema = z.object({ name: z.string(), value: z.number(), secondary: z.number().optional() });
const opportunityRowSchema = z.object({
  municipalityId: z.string(), municipality: z.string(), province: z.string(), service: z.string(), monthlySearches: z.number(), estimatedCpc: z.number(), sql: z.number(), altas: z.number(), sqlToAlta: z.number(), caregiversAvailable: z.number(), coverage: z.boolean(), voiceSignals: z.number(), competitors: z.number(), score: z.number(), eligibility: z.enum(["eligible", "constrained", "ineligible"]), confidence: z.number(),
});

export const overviewSchema = z.object({
  kpis: z.object({ leads: z.number(), sql: z.number(), altas: z.number(), leadToSql: z.number(), sqlToAlta: z.number(), costPerSql: z.number(), costPerAttributedAlta: z.number(), traceabilityCoverage: z.number(), duplicates: z.number(), opportunityMunicipalities: z.number(), capacityConstrainedMunicipalities: z.number() }),
  monthlyFunnel: z.array(seriesPointSchema),
  channelFunnel: z.array(seriesPointSchema.extend({ channel: z.string() })),
  altasByMunicipality: z.array(breakdownSchema),
  opportunityRanking: z.array(opportunityRowSchema),
  discardReasons: z.array(breakdownSchema),
  caveats: z.array(z.string()),
});
export type OverviewData = z.infer<typeof overviewSchema>;

const paginated = <T extends z.ZodTypeAny>(item: T) => z.object({ items: z.array(item), page: z.number(), pageSize: z.number(), total: z.number() });
export const opportunitiesSchema = paginated(opportunityRowSchema);
export type OpportunityRowData = z.infer<typeof opportunityRowSchema>;

export const opportunityDetailSchema = opportunityRowSchema.extend({
  factors: z.array(z.object({ key: z.string(), label: z.string(), normalizedValue: z.number(), weight: z.number(), contribution: z.number(), evidence: z.string() })),
  constraints: z.array(z.string()), proposedAction: z.string(), validationMetric: z.string(), rulesVersion: z.string(), disclaimer: z.string(),
});
export type OpportunityDetailData = z.infer<typeof opportunityDetailSchema>;

const journeySummarySchema = z.object({ opportunityId: z.string(), personId: z.string(), municipality: z.string(), service: z.string(), status: z.string(), createdAt: z.string(), duplicateCount: z.number(), identityConfidence: z.number() });
export const journeysSchema = paginated(journeySummarySchema);
export type JourneySummaryData = z.infer<typeof journeySummarySchema>;
export const journeyDetailSchema = journeySummarySchema.extend({
  events: z.array(z.object({ eventId: z.string(), eventType: z.string(), occurredAt: z.string(), channel: z.string().nullable(), campaign: z.string().nullable(), landingUrl: z.string().nullable(), sourceSystem: z.string(), observed: z.boolean(), identityConfidence: z.number().nullable(), metadata: z.record(z.unknown()) })),
  identities: z.array(z.object({ sourceSystem: z.string(), pseudonym: z.string(), method: z.string(), confidence: z.number(), ambiguous: z.boolean() })),
  attribution: z.object({ firstTouch: z.string().nullable(), lastTouch: z.string().nullable(), multiTouch: z.array(z.object({ channel: z.string(), touches: z.number() })) }), warning: z.string(),
});
export type JourneyDetailData = z.infer<typeof journeyDetailSchema>;

const funnelSegmentSchema = z.object({ name: z.string(), leads: z.number(), sql: z.number(), altas: z.number(), leadToSql: z.number(), sqlToAlta: z.number(), mature: z.boolean().optional() });
export const funnelsSchema = z.object({
  byChannel: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  byService: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  byMunicipality: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  byCohort: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  discardReasons: z.array(breakdownSchema), maturityWindowDays: z.number(), caveats: z.array(z.string()),
});
export type FunnelsData = z.infer<typeof funnelsSchema>;

export const landingSchema = z.object({ url: z.string(), municipalityId: z.string().nullable(), municipality: z.string().nullable(), language: z.enum(["es", "ca"]), service: z.string().nullable(), origin: z.enum(["manual", "generada"]), status: z.enum(["draft", "pending_review", "approved", "published", "rejected"]), publishedAt: z.string().nullable(), indexedAt: z.string().nullable(), sessions: z.number(), forms: z.number(), sql: z.number(), altas: z.number(), impressions: z.number(), clicks: z.number(), content: z.object({ title: z.string(), description: z.string(), blocks: z.array(z.object({ type: z.string(), heading: z.string(), body: z.string() })), generatedFrom: z.object({ municipalityId: z.string(), service: z.string(), language: z.enum(["es", "ca"]) }) }).optional(), validationIssues: z.array(z.string()).optional() });
const landingListObjectSchema = z.object({ items: z.array(landingSchema), page: z.number(), pageSize: z.number(), total: z.number() });
export const landingsSchema = landingListObjectSchema;
export type LandingData = z.infer<typeof landingSchema>;

export const landingMutationSchema = z.object({ landing: landingSchema, auditId: z.string() });

const seoRowSchema = z.object({ origin: z.string(), status: z.string(), landings: z.number(), published: z.number(), indexed: z.number(), impressions: z.number(), clicks: z.number(), ctr: z.number(), averagePosition: z.number().nullable(), organicSessions: z.number(), forms: z.number(), sql: z.number(), altas: z.number() });
export const seoSchema = z.object({ rows: z.array(seoRowSchema), caveat: z.string() });
export type SeoData = z.infer<typeof seoSchema>;

const adRowSchema = z.object({ platform: z.string(), campaign: z.string(), municipalityId: z.string().nullable(), spend: z.number(), impressions: z.number(), clicks: z.number(), cpc: z.number(), platformConversions: z.number(), crmSql: z.number(), crmAltas: z.number(), costPerSql: z.number().nullable(), costPerAlta: z.number().nullable(), allocationWarning: z.string().nullable() });
export const adsSchema = z.object({ rows: z.array(adRowSchema), caveats: z.array(z.string()) });
export type AdsData = z.infer<typeof adsSchema>;

const experimentSummarySchema = z.object({ id: z.string(), name: z.string(), hypothesis: z.string(), startDate: z.string(), endDate: z.string().nullable(), status: z.string(), primaryMetric: z.string(), methodology: z.string(), treatmentMunicipalities: z.number(), controlMunicipalities: z.number(), observedDifference: z.number().nullable(), didEstimate: z.number().nullable(), evidenceLevel: z.enum(["descriptive", "quasi_experimental"]), limitations: z.array(z.string()) });
const experimentListSchema = paginated(experimentSummarySchema).extend({ caveats: z.array(z.string()).default([]) });
export const experimentsSchema = experimentListSchema;
export type ExperimentSummaryData = z.infer<typeof experimentSummarySchema>;
export const experimentDetailSchema = experimentSummarySchema.extend({
  assignments: z.array(z.object({ municipalityId: z.string(), municipality: z.string(), variant: z.string(), assignedAt: z.string() })), series: z.array(z.object({ period: z.string(), variant: z.string(), value: z.number(), sampleSize: z.number() })), diagnostics: z.object({ parallelTrendsPass: z.boolean().nullable(), minimumSamplePass: z.boolean(), preTrendDifference: z.number().nullable() }),
});
export type ExperimentDetailData = z.infer<typeof experimentDetailSchema>;

export const dataQualitySchema = z.object({ generatedAt: z.string(), freshness: z.array(z.object({ source: z.string(), latestAt: z.string().nullable(), lagDays: z.number().nullable(), status: z.string() })), identity: z.object({ totalEvents: z.number(), unlinkedEvents: z.number(), ambiguousIdentities: z.number(), traceabilityCoverage: z.number() }), duplicates: z.object({ potentialLeadDuplicates: z.number(), confirmedLinks: z.number() }), integrity: z.array(z.object({ check: z.string(), failures: z.number(), severity: z.enum(["info", "warning", "error"]) })), missingness: z.array(z.object({ field: z.string(), missing: z.number(), total: z.number(), rate: z.number() })), discrepancies: z.array(z.object({ metric: z.string(), platform: z.number(), crm: z.number(), difference: z.number() })), immatureCohorts: z.number(), limitations: z.array(z.string()), monitoringSignals: z.array(z.object({ signal: z.string(), value: z.number(), threshold: z.number(), status: z.enum(["ok", "attention"]) })).optional() });
export type DataQualityData = z.infer<typeof dataQualitySchema>;

const strategyAssumptionsSchema = z.object({ scenario: z.enum(["conservative", "base", "optimistic"]), demandCaptureRate: z.number(), leadToSqlRate: z.number(), sqlToAltaRate: z.number(), capacityUtilization: z.number(), months: z.number() });
const strategyBetSchema = z.object({ rank: z.number(), municipalityId: z.string(), municipality: z.string(), service: z.string(), decision: z.enum(["prioritize", "reject"]), reason: z.string(), impact: z.enum(["low", "medium", "high"]), effort: z.enum(["low", "medium", "high"]), confidence: z.number(), dependencies: z.array(z.string()), owner: z.string(), estimatedIncrementalSql: z.number(), estimatedIncrementalAltas: z.number(), hypothesis: z.string(), mvp: z.string(), exclusions: z.array(z.string()), successCriteria: z.array(z.string()), decisionCriteria: z.object({ continue: z.string(), modify: z.string(), stop: z.string() }) });
export const strategySchema = z.object({ label: z.literal("Synthetic planning demonstration — not a forecast"), baseline: z.object({ sqlPerMonth: z.literal(2000), source: z.literal("planning_brief"), observedFilteredSql: z.number() }), assumptions: strategyAssumptionsSchema, scenarios: z.object({ conservative: strategyAssumptionsSchema.omit({ scenario: true, months: true }), base: strategyAssumptionsSchema.omit({ scenario: true, months: true }), optimistic: strategyAssumptionsSchema.omit({ scenario: true, months: true }) }), portfolioEstimate: z.object({ incrementalSql: z.number(), incrementalAltas: z.number(), periodMonths: z.number() }), prioritizedBets: z.array(strategyBetSchema), rejectedBets: z.array(strategyBetSchema), milestones: z.object({ first90Days: z.array(z.string()), sixMonths: z.array(z.string()) }), caveats: z.array(z.string()) });
export type StrategyData = z.infer<typeof strategySchema>;

const workbenchQuerySchema = z.object({ id: z.enum(["municipality_prioritization", "landing_cohort_outcomes", "quality_and_losses"]), title: z.string(), objective: z.string(), sql: z.string(), dataUsed: z.array(z.string()), resultRows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))), interpretation: z.string(), recommendedDecision: z.string(), proposedExtensionsUsed: z.array(z.string()) });
export const workbenchSchema = z.object({ executionMode: z.literal("curated_read_only"), generatedAt: z.string(), queries: z.array(workbenchQuerySchema).min(3), warning: z.string() });
export type WorkbenchData = z.infer<typeof workbenchSchema>;

export const filterOptionsSchema = z.object({ provinces: z.array(z.string()), municipalities: z.array(z.object({ id: z.string(), name: z.string(), province: z.string().optional() })), services: z.array(z.string()), channels: z.array(z.string()), languages: z.array(z.enum(["es", "ca"])).optional() });
export type FilterOptions = z.infer<typeof filterOptionsSchema>;

export const api = {
  overview: (filters: GlobalFilters) => request(`/overview${queryString(filters)}`, overviewSchema),
  opportunities: (filters: GlobalFilters, page = 1) => request(`/opportunities${queryString(filters, { page, pageSize: 25 })}`, opportunitiesSchema),
  opportunity: (municipalityId: string, service: string, filters: GlobalFilters) => request(`/opportunities/${encodeURIComponent(municipalityId)}/${encodeURIComponent(service)}${queryString(filters)}`, opportunityDetailSchema),
  journeys: (filters: GlobalFilters, search: string, page = 1) => request(`/journeys${queryString(filters, { page, pageSize: 25 }, { search: search || undefined })}`, journeysSchema),
  journey: (opportunityId: string) => request(`/journeys/${encodeURIComponent(opportunityId)}`, journeyDetailSchema),
  funnels: (filters: GlobalFilters) => request(`/funnels${queryString(filters)}`, funnelsSchema),
  landings: (filters: GlobalFilters) => request(`/landings${queryString(filters)}`, landingsSchema),
  draftLanding: (draft: LandingDraftRequest) => { const body = landingDraftRequestSchema.parse(draft); return request("/landings/drafts", landingMutationSchema, { method: "POST", body: JSON.stringify(body) }); },
  transitionLanding: (url: string, action: "review" | "approve" | "publish") => request(`/landings/${encodeURIComponent(url)}/${action}`, landingMutationSchema, { method: "POST", headers: action === "approve" || action === "publish" ? { "x-local-role": "growth_manager" } : {}, body: JSON.stringify(action === "approve" ? { approver: "Growth Manager (local simulation)" } : {}) }),
  seo: (filters: GlobalFilters) => request(`/seo${queryString(filters)}`, seoSchema),
  ads: (filters: GlobalFilters) => request(`/ads${queryString(filters)}`, adsSchema),
  experiments: (filters: GlobalFilters) => request(`/experiments${queryString(filters)}`, experimentsSchema),
  experiment: (id: string) => request(`/experiments/${encodeURIComponent(id)}`, experimentDetailSchema),
  dataQuality: (filters: GlobalFilters) => request(`/data-quality${queryString(filters)}`, dataQualitySchema),
  strategy: (assumptions: { scenario: "conservative" | "base" | "optimistic"; demandCaptureRate: number; leadToSqlRate: number; sqlToAltaRate: number; capacityUtilization: number; months: number }) => request(`/strategy${queryString({}, undefined, Object.fromEntries(Object.entries(assumptions).map(([key, value]) => [key, String(value)])))}`, strategySchema),
  workbench: () => request("/workbench", workbenchSchema),
  filters: () => request("/filters", filterOptionsSchema),
};
