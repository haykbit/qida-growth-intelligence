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
  summary: z.object({ leads: z.number(), sql: z.number(), altas: z.number(), leadToSql: z.number(), sqlToAlta: z.number(), averageDaysToSql: z.number(), averageDaysToAlta: z.number() }),
  byChannel: z.array(funnelSegmentSchema), byService: z.array(funnelSegmentSchema), byMunicipality: z.array(funnelSegmentSchema), cohorts: z.array(funnelSegmentSchema), timeline: z.array(seriesPointSchema), discardReasons: z.array(breakdownSchema), caveats: z.array(z.string()),
});
export type FunnelsData = z.infer<typeof funnelsSchema>;

export const landingSchema = z.object({ url: z.string(), municipalityId: z.string().nullable(), municipality: z.string().optional(), language: z.enum(["es", "ca"]), service: z.string().optional(), origin: z.enum(["manual", "generated", "generada"]), status: z.enum(["draft", "pending_review", "approved", "published", "rejected"]), publishedAt: z.string().nullable().optional(), indexedAt: z.string().nullable().optional(), sessions: z.number().optional(), forms: z.number().optional(), sql: z.number().optional(), altas: z.number().optional(), validationIssues: z.array(z.string()).optional() });
const landingListObjectSchema = z.object({ items: z.array(landingSchema), page: z.number().default(1), pageSize: z.number().default(25), total: z.number().default(0), caveats: z.array(z.string()).default([]) });
export const landingsSchema = landingListObjectSchema;
export type LandingData = z.infer<typeof landingSchema>;

export const landingMutationSchema = z.object({ landing: landingSchema.optional(), url: z.string().optional(), status: z.string().optional(), auditId: z.string() });

const seoRowSchema = z.object({ url: z.string(), municipality: z.string().optional(), origin: z.string(), status: z.string(), impressions: z.number(), clicks: z.number(), ctr: z.number(), averagePosition: z.number(), organicSessions: z.number(), forms: z.number(), sql: z.number(), altas: z.number() });
export const seoSchema = z.object({ summary: z.object({ published: z.number(), indexed: z.number(), pendingIndexation: z.number(), impressions: z.number(), clicks: z.number(), ctr: z.number(), averagePosition: z.number(), organicSessions: z.number(), forms: z.number(), sql: z.number(), altas: z.number() }), landings: z.array(seoRowSchema), byOrigin: z.array(z.object({ name: z.string(), sessions: z.number(), sql: z.number(), altas: z.number() })), timeline: z.array(z.object({ period: z.string(), impressions: z.number(), clicks: z.number(), sessions: z.number() })), caveats: z.array(z.string()) });
export type SeoData = z.infer<typeof seoSchema>;

const adRowSchema = z.object({ campaign: z.string(), platform: z.string(), municipality: z.string().nullable().optional(), spend: z.number(), impressions: z.number(), clicks: z.number(), cpc: z.number(), platformConversions: z.number(), sql: z.number(), altas: z.number(), costPerSql: z.number(), costPerAlta: z.number() });
export const adsSchema = z.object({ summary: z.object({ spend: z.number(), impressions: z.number(), clicks: z.number(), cpc: z.number(), platformConversions: z.number(), sql: z.number(), altas: z.number(), costPerSql: z.number(), costPerAlta: z.number() }), campaigns: z.array(adRowSchema), platforms: z.array(z.object({ name: z.string(), spend: z.number(), platformConversions: z.number(), sql: z.number(), altas: z.number() })), caveats: z.array(z.string()) });
export type AdsData = z.infer<typeof adsSchema>;

const experimentSummarySchema = z.object({ experimentId: z.string(), name: z.string(), hypothesis: z.string(), startDate: z.string(), endDate: z.string().nullable(), status: z.string(), primaryMetric: z.string(), methodology: z.string(), treatmentMunicipalities: z.number(), controlMunicipalities: z.number(), observedDifference: z.number().nullable(), result: z.string(), causalReady: z.boolean() });
const experimentListSchema = paginated(experimentSummarySchema).extend({ caveats: z.array(z.string()).default([]) });
export const experimentsSchema = experimentListSchema;
export type ExperimentSummaryData = z.infer<typeof experimentSummarySchema>;
export const experimentDetailSchema = experimentSummarySchema.extend({
  hypothesis: z.string(), treatment: z.string(), control: z.string(), municipalities: z.array(z.object({ municipality: z.string(), variant: z.string(), sampleSize: z.number() })), series: z.array(z.object({ period: z.string(), control: z.number(), treatment: z.number(), phase: z.enum(["pre", "post"]) })), diagnostics: z.object({ preTrendPassed: z.boolean(), sampleSizeSufficient: z.boolean(), differenceInDifferences: z.number().nullable(), confidenceInterval: z.tuple([z.number(), z.number()]).nullable().optional() }), limitations: z.array(z.string()),
});
export type ExperimentDetailData = z.infer<typeof experimentDetailSchema>;

const qualityMetricSchema = z.object({ key: z.string(), label: z.string(), value: z.number(), unit: z.enum(["count", "percent", "hours", "days"]), status: z.enum(["healthy", "warning", "critical"]), description: z.string() });
export const dataQualitySchema = z.object({ metrics: z.array(qualityMetricSchema), sources: z.array(z.object({ source: z.string(), lastUpdatedAt: z.string(), freshnessHours: z.number(), status: z.enum(["healthy", "warning", "critical"]), records: z.number() })), issues: z.array(z.object({ id: z.string(), category: z.string(), severity: z.enum(["info", "warning", "critical"]), title: z.string(), description: z.string(), affectedRecords: z.number(), detectedAt: z.string() })), caveats: z.array(z.string()) });
export type DataQualityData = z.infer<typeof dataQualitySchema>;

const strategyBetSchema = z.object({
  id: z.string(), title: z.string(), problem: z.string(), hypothesis: z.string(), impact: z.enum(["low", "medium", "high"]), effort: z.enum(["low", "medium", "high"]), confidence: z.number(), dependencies: z.array(z.string()), owner: z.string(), status: z.enum(["prioritized", "candidate", "rejected"]), rationale: z.string(), mvp: z.string(), exclusions: z.array(z.string()), successMetric: z.string(), criteria: z.object({ continue: z.string(), modify: z.string(), stop: z.string() }), activationAsset: z.enum(["landing_factory", "paid_media", "seo", "crm", "data"]),
});
const metricNodeSchema = z.object({ label: z.string(), definition: z.string(), source: z.string(), limitation: z.string().optional() });
export const strategySchema = z.object({ bets: z.array(strategyBetSchema), roadmap: z.array(z.object({ phase: z.string(), horizon: z.string(), objective: z.string(), betIds: z.array(z.string()), deliverables: z.array(z.string()) })), metricTree: z.object({ business: z.array(metricNodeSchema), operational: z.array(metricNodeSchema), guardrails: z.array(metricNodeSchema) }), caveats: z.array(z.string()) });
export type StrategyData = z.infer<typeof strategySchema>;

const workbenchQuerySchema = z.object({ id: z.string(), title: z.string(), objective: z.string(), sql: z.string(), dataSources: z.array(z.string()), result: z.object({ columns: z.array(z.string()), rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))), rowCount: z.number(), executedAt: z.string() }).nullable(), interpretation: z.string(), recommendedDecision: z.string() });
export const workbenchSchema = z.object({ queries: z.array(workbenchQuerySchema).min(3), caveats: z.array(z.string()) });
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
  transitionLanding: (url: string, action: "review" | "approve" | "publish") => request(`/landings/${encodeURIComponent(url)}/${action}`, landingMutationSchema, { method: "POST", body: JSON.stringify({}) }),
  seo: (filters: GlobalFilters) => request(`/seo${queryString(filters)}`, seoSchema),
  ads: (filters: GlobalFilters) => request(`/ads${queryString(filters)}`, adsSchema),
  experiments: (filters: GlobalFilters) => request(`/experiments${queryString(filters)}`, experimentsSchema),
  experiment: (id: string) => request(`/experiments/${encodeURIComponent(id)}`, experimentDetailSchema),
  dataQuality: (filters: GlobalFilters) => request(`/data-quality${queryString(filters)}`, dataQualitySchema),
  strategy: (filters: GlobalFilters) => request(`/strategy${queryString(filters)}`, strategySchema),
  workbench: (filters: GlobalFilters) => request(`/workbench${queryString(filters)}`, workbenchSchema),
  runWorkbenchQuery: (id: string, filters: GlobalFilters) => request(`/workbench/${encodeURIComponent(id)}/run${queryString(filters)}`, workbenchQuerySchema, { method: "POST", body: JSON.stringify({}) }),
  filters: () => request("/filters", filterOptionsSchema),
};
