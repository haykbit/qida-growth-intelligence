import { sqlResultSchema, weeklyNoteSchema, type WeeklyNote } from "@qida/contracts";
import { z } from "zod";
import { landingDecisionRequestSchema, landingDraftRequestSchema, type GlobalFilters, type LandingDecisionRequest, type LandingDraftRequest } from "@qida/contracts";

const API_BASE = import.meta.env.VITE_API_URL ?? "/api/v1";
const STATIC_DEMO = import.meta.env.VITE_STATIC_DEMO === "true";

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
  if (STATIC_DEMO) {
    const { staticDemoRequest } = await import("./static-demo");
    const payload = await staticDemoRequest(path, init);
    const parsed = schema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const location = issue?.path.length ? issue.path.join(".") : "respuesta";
      throw new ApiClientError(`Los datos estáticos no cumplen el contrato esperado en ${location}.`, "CONTRACT_MISMATCH", "static-demo");
    }
    return parsed.data;
  }
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
const conversionPointSchema = z.object({ period: z.string(), leadToSql: z.number().min(0).max(1), sqlToAlta: z.number().min(0).max(1), matureLeads: z.number().int().nonnegative(), matureSql: z.number().int().nonnegative() });
const breakdownSchema = z.object({ name: z.string(), value: z.number(), secondary: z.number().optional() });
const opportunityRowSchema = z.object({
  municipalityId: z.string(), municipality: z.string(), province: z.string(), service: z.string(), monthlySearches: z.number(), estimatedCpc: z.number(), leads: z.number(), sql: z.number(), altas: z.number(), sqlToAlta: z.number(), caregiversAvailable: z.number(), coverage: z.boolean(), voiceSignals: z.number(), competitors: z.number(), score: z.number(), eligibility: z.enum(["eligible", "constrained", "ineligible"]), selectionEligibility: z.enum(["eligible", "constrained", "ineligible"]), selectionReasons: z.array(z.string()), dataSource: z.enum(["municipal_own", "province_fallback"]), demandMonthsObserved: z.number(), latestDemandMonth: z.string().nullable(), latestLeadAt: z.string().nullable(), selectionRulesVersion: z.string(),
});

export const overviewSchema = z.object({
  kpis: z.object({ leads: z.number(), sql: z.number(), altas: z.number(), leadToSql: z.number(), sqlToAlta: z.number(), costPerSql: z.number().nullable(), costPerAttributedAlta: z.number().nullable(), traceabilityCoverage: z.number(), duplicates: z.number(), opportunityMunicipalities: z.number(), capacityConstrainedMunicipalities: z.number() }),
  monthlyFunnel: z.array(seriesPointSchema),
  monthlyConversion: z.array(conversionPointSchema),
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

const funnelSegmentSchema = z.object({ name: z.string(), leads: z.number(), sql: z.number(), altas: z.number(), leadToSql: z.number(), sqlToAlta: z.number(), mature: z.boolean().optional() });
export const funnelsSchema = z.object({
  byChannel: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  byService: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  byMunicipality: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  byCohort: z.array(funnelSegmentSchema.extend({ averageDaysToSql: z.number().nullable(), averageDaysToAlta: z.number().nullable(), mature: z.boolean() })),
  discardReasons: z.array(breakdownSchema), maturityWindowDays: z.number(), caveats: z.array(z.string()),
});
export type FunnelsData = z.infer<typeof funnelsSchema>;

export const landingSchema = z.object({
  url: z.string(), municipalityId: z.string().nullable(), municipality: z.string().nullable(), language: z.enum(["es", "ca"]), service: z.string().nullable(), origin: z.enum(["manual", "generada"]), status: z.enum(["draft", "pending_review", "approved", "published", "rejected"]), publishedAt: z.string().nullable(), indexedAt: z.string().nullable(),
  sessions: z.number(), forms: z.number(), sql: z.number(), altas: z.number(), impressions: z.number(), clicks: z.number(),
  content: z.object({ title: z.string(), description: z.string(), blocks: z.array(z.object({ type: z.string(), heading: z.string(), body: z.string() })), generatedFrom: z.object({ municipalityId: z.string(), service: z.string(), language: z.enum(["es", "ca"]) }) }).optional(), validationIssues: z.array(z.string()).optional(),
});
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
  assignments: z.array(z.object({ municipalityId: z.string(), municipality: z.string(), variant: z.string(), assignedAt: z.string() })), series: z.array(z.object({ period: z.string(), variant: z.string(), value: z.number(), sampleSize: z.number() })), diagnostics: z.object({ parallelTrendsPass: z.null(), hasObservedDataInBothGroups: z.boolean(), preTrendDifference: z.number().nullable() }),
});
export type ExperimentDetailData = z.infer<typeof experimentDetailSchema>;

const landingDiagnosisSchema = z.object({
  decision: z.enum(["keep", "iterate", "stop"]), headline: z.string(), rationale: z.array(z.string()), recommendedAction: z.string(),
  primaryMetric: z.enum(["session_to_lead", "lead_to_sql", "sql_to_alta"]), guardrailMetric: z.enum(["lead_to_sql", "sql_to_alta", "caregiver_capacity"]),
  evidenceLevel: z.enum(["descriptive", "attributed", "quasi_experimental"]),
});
export const landingInsightSummarySchema = landingSchema.extend({
  leads: z.number(), phoneClicks: z.number(), averagePosition: z.number().nullable(),
  rates: z.object({ sessionToLead: z.number(), leadToSql: z.number(), sqlToAlta: z.number(), organicCtr: z.number() }),
  benchmark: z.object({ sessionToLead: z.number(), leadToSql: z.number(), sqlToAlta: z.number() }),
  operations: z.object({ coverage: z.boolean(), caregiversAvailable: z.number(), eligible: z.boolean() }),
  opportunityScore: z.number().nullable(), diagnosis: landingDiagnosisSchema,
  evaluation: z.object({
    overall: z.number().min(0).max(100),
    version: z.literal("landing-evaluator-v1"),
    dimensions: z.array(z.object({
      key: z.enum(["visibility", "acquisition", "quality", "operability"]),
      label: z.string(), score: z.number().min(0).max(100), explanation: z.string(),
    })),
  }),
});
export const landingPortfolioSchema = z.object({
  items: z.array(landingInsightSummarySchema), page: z.number(), pageSize: z.number(), total: z.number(),
  totals: z.object({ landings: z.number(), published: z.number(), sessions: z.number(), leads: z.number(), sql: z.number(), altas: z.number() }),
});
const landingDecisionRecordSchema = landingDecisionRequestSchema.extend({ resultSnapshot: sqlResultSchema.optional(), id: z.string(), version: z.number(), actorRole: z.string(), createdAt: z.string() });
export const landingInsightDetailSchema = landingInsightSummarySchema.extend({
  monthly: z.array(z.object({ period: z.string(), sessions: z.number(), forms: z.number(), phoneClicks: z.number(), leads: z.number(), sql: z.number(), altas: z.number(), sessionToLead: z.number(), leadToSql: z.number() })),
  advertising: z.object({
    rows: z.array(z.object({
      platform: z.string(), campaign: z.string(), firstSeen: z.string(), lastSeen: z.string(),
      spend: z.number(), impressions: z.number(), clicks: z.number(), cpc: z.number(),
      platformConversions: z.number(), trackedEvents: z.number(), trackedSessions: z.number(),
      leads: z.number(), crmSql: z.number(), crmAltas: z.number(),
      costPerSql: z.number().nullable(), costPerAlta: z.number().nullable(),
    })),
    caveats: z.array(z.string()),
  }),
  experiments: z.array(experimentSummarySchema), decisions: z.array(landingDecisionRecordSchema), caveats: z.array(z.string()),
});
export type LandingInsightSummaryData = z.infer<typeof landingInsightSummarySchema>;
export type LandingInsightDetailData = z.infer<typeof landingInsightDetailSchema>;

const learningDecisionSchema = landingDecisionRecordSchema.extend({ url: z.string(), municipality: z.string().nullable(), service: z.string().nullable() });
export const learningSchema = z.object({
  experiments: z.array(experimentSummarySchema),
  decisions: z.array(learningDecisionSchema),
  totals: z.object({ experiments: z.number(), positive: z.number(), inconclusive: z.number(), negative: z.number(), decisions: z.number() }),
  caveats: z.array(z.string()),
});
export type LearningData = z.infer<typeof learningSchema>;

export const dataQualitySchema = z.object({ generatedAt: z.string(), freshness: z.array(z.object({ source: z.string(), latestAt: z.string().nullable(), lagDays: z.number().nullable(), status: z.string() })), identity: z.object({ totalEvents: z.number(), unlinkedEvents: z.number(), ambiguousIdentities: z.number(), traceabilityCoverage: z.number() }), duplicates: z.object({ potentialLeadDuplicates: z.number(), confirmedLinks: z.number() }), integrity: z.array(z.object({ check: z.string(), failures: z.number(), severity: z.enum(["info", "warning", "error"]) })), missingness: z.array(z.object({ field: z.string(), missing: z.number(), total: z.number(), rate: z.number() })), discrepancies: z.array(z.object({ metric: z.string(), platform: z.number(), crm: z.number(), difference: z.number() })), pendingMaturitySql: z.number(), limitations: z.array(z.string()), monitoringSignals: z.array(z.object({ signal: z.string(), value: z.number(), unit: z.literal("count"), source: z.string() })).optional() });
export type DataQualityData = z.infer<typeof dataQualitySchema>;

const strategyAssumptionsSchema = z.object({ scenario: z.enum(["conservative", "base", "optimistic"]), demandCaptureRate: z.number(), leadToSqlRate: z.number(), sqlToAltaRate: z.number(), capacityUtilization: z.number(), months: z.number(), marketLimit: z.number() });
const strategyBetSchema = z.object({ rank: z.number(), municipalityId: z.string(), municipality: z.string(), service: z.string(), decision: z.enum(["prioritize", "reject"]), reason: z.string(), impact: z.enum(["low", "medium", "high"]), effort: z.enum(["low", "medium", "high"]), dependencies: z.array(z.string()), owner: z.string(), scenarioSql: z.number(), scenarioAltas: z.number(), hypothesis: z.string(), mvp: z.string(), exclusions: z.array(z.string()), successCriteria: z.array(z.string()), decisionCriteria: z.object({ continue: z.string(), modify: z.string(), stop: z.string() }) });
export const strategySchema = z.object({ label: z.literal("Synthetic planning demonstration — not a forecast"), baseline: z.object({ sqlPerMonth: z.literal(2000), source: z.literal("planning_brief"), observedFilteredSql: z.number() }), assumptions: strategyAssumptionsSchema, scenarios: z.object({ conservative: strategyAssumptionsSchema.omit({ scenario: true, months: true, marketLimit: true }), base: strategyAssumptionsSchema.omit({ scenario: true, months: true, marketLimit: true }), optimistic: strategyAssumptionsSchema.omit({ scenario: true, months: true, marketLimit: true }) }), planningModel: z.object({ version: z.string(), formula: z.string(), candidateRowsEvaluated: z.number(), eligibleMarketsInCandidateSet: z.number(), marketsIncluded: z.number(), exclusions: z.array(z.string()) }), scenarioProjection: z.object({ sql: z.number(), altas: z.number(), periodMonths: z.number() }), impactRange: z.object({ sql: z.object({ min: z.number(), max: z.number() }), altas: z.object({ min: z.number(), max: z.number() }), periodMonths: z.number(), scenarioValues: z.record(z.object({ sql: z.number(), altas: z.number() })) }), enablingInitiatives: z.array(z.object({ name: z.string(), directScenarioSql: z.literal(0), directScenarioAltas: z.literal(0), value: z.string() })), portfolioInitiatives: z.array(z.object({ id: z.enum(["local_landings", "qualification", "paid_reallocation", "traceability"]), rank: z.number(), name: z.string(), outcome: z.enum(["sql", "altas", "enabler"]), evidence: z.enum(["planning_assumption", "enabling_initiative"]), formula: z.string(), inputs: z.array(z.string()), scenarioValues: z.object({ conservative: z.number(), base: z.number(), optimistic: z.number() }), range: z.object({ min: z.number(), max: z.number() }), periodMonths: z.number() })), prioritizedBets: z.array(strategyBetSchema), rejectedBets: z.array(strategyBetSchema), milestones: z.object({ first90Days: z.array(z.string()), sixMonths: z.array(z.string()) }), caveats: z.array(z.string()) });
export type StrategyData = z.infer<typeof strategySchema>;

const workbenchQuerySchema = z.object({
  id: z.enum(["opportunity_score", "landing_performance", "landing_monthly_funnel", "experiment_effect", "traceability_coverage", "quality_controls"]),
  area: z.enum(["Oportunidades", "Landings", "Medición", "Calidad"]),
  title: z.string(),
  question: z.string(),
  grain: z.string(),
  evidence: z.enum(["descriptive", "attribution", "quasi_experimental", "quality"]),
  implementation: z.object({ endpoint: z.string(), method: z.string() }),
  statements: z.array(z.object({ title: z.string(), purpose: z.string(), sql: z.string(), parameters: z.array(z.object({ name: z.string(), value: z.string() })) })).min(1),
  dataUsed: z.array(z.string()),
  joins: z.array(z.object({ left: z.string(), right: z.string(), on: z.string(), purpose: z.string() })),
  metrics: z.array(z.object({ name: z.string(), definition: z.string(), calculation: z.string(), calculatedIn: z.enum(["sql", "application"]), displayedAs: z.string() })),
  shownIn: z.array(z.object({ page: z.string(), component: z.string() })),
  resultRows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
  resultDescription: z.string(),
  exclusions: z.array(z.string()),
  caveats: z.array(z.string()),
});
export const workbenchSchema = z.object({ executionMode: z.literal("curated_read_only"), generatedAt: z.string(), queries: z.array(workbenchQuerySchema).length(6), warning: z.string() });
export type WorkbenchData = z.infer<typeof workbenchSchema>;

export const governanceSchema = z.object({
  product: z.string(),
  architectureStages: z.array(z.object({ stage: z.number(), name: z.string(), purpose: z.string(), owner: z.string(), status: z.enum(["existing", "demo", "proposed"]), inputs: z.array(z.string()), outputs: z.array(z.string()) })),
  ownership: z.array(z.object({ domain: z.string(), owner: z.string(), paths: z.array(z.string()), tools: z.array(z.string()) })),
  integrations: z.array(z.object({ name: z.string(), mode: z.enum(["existing", "proposed", "simulated"]), boundary: z.string() })),
  controls: z.object({ validation: z.array(z.string()), monitoring: z.array(z.string()), approval: z.string(), privacy: z.string(), evidenceLabels: z.array(z.object({ label: z.enum(["correlation", "attribution", "causal"]), meaning: z.string() })) }),
});
export type GovernanceData = z.infer<typeof governanceSchema>;

const planningRestrictionIdSchema = z.enum(["no_prices", "unique_qida_value", "privacy_consent", "marketing_approval", "no_health_claims", "capacity_before_demand"]);
export const planningSchema = z.object({
  version: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  totalDays: z.literal(90),
  decisionMetric: z.string(),
  phases: z.array(z.object({ id: z.enum(["prepare", "launch", "exposure", "maturation"]), name: z.string(), startDay: z.number(), endDay: z.number(), outcome: z.string(), owner: z.string() })),
  restrictions: z.array(z.object({ id: planningRestrictionIdSchema, rule: z.string(), evidence: z.string(), owner: z.string() })),
  meetings: z.array(z.object({
    id: z.string(),
    name: z.string(),
    category: z.enum(["working", "control", "approval", "decision"]),
    cadence: z.string(),
    dates: z.array(z.string()),
    owner: z.string(),
    attendees: z.array(z.string()),
    purpose: z.string(),
    inputs: z.array(z.string()),
    agenda: z.array(z.object({ title: z.string(), minutes: z.number(), content: z.string() })),
    decisions: z.array(z.string()),
    outputs: z.array(z.string()),
    restrictionIds: z.array(planningRestrictionIdSchema),
  })),
});
export type PlanningData = z.infer<typeof planningSchema>;

export const filterOptionsSchema = z.object({ provinces: z.array(z.string()), municipalities: z.array(z.object({ id: z.string(), name: z.string(), province: z.string().optional() })), services: z.array(z.string()), channels: z.array(z.string()), languages: z.array(z.enum(["es", "ca"])).optional() });
export type FilterOptions = z.infer<typeof filterOptionsSchema>;

export const api = {
  overview: (filters: GlobalFilters) => request(`/overview${queryString(filters)}`, overviewSchema),
  opportunities: (filters: GlobalFilters, page = 1, pageSize = 12, search = "") => request(`/opportunities${queryString(filters, { page, pageSize }, { search: search || undefined })}`, opportunitiesSchema),
  opportunity: (municipalityId: string, service: string, filters: GlobalFilters) => request(`/opportunities/${encodeURIComponent(municipalityId)}/${encodeURIComponent(service)}${queryString(filters)}`, opportunityDetailSchema),
  funnels: (filters: GlobalFilters) => request(`/funnels${queryString(filters)}`, funnelsSchema),
  landings: (filters: GlobalFilters) => request(`/landings${queryString(filters)}`, landingsSchema),
  landingInsights: (filters: GlobalFilters, page = 1, pageSize = 12, search = "") => request(`/landing-insights${queryString(filters, { page, pageSize }, { search: search || undefined })}`, landingPortfolioSchema),
  landingInsight: (url: string, filters: GlobalFilters) => request(`/landing-insights/${encodeURIComponent(url)}${queryString(filters)}`, landingInsightDetailSchema),
  recordLandingDecision: (url: string, decision: LandingDecisionRequest) => { const body = landingDecisionRequestSchema.parse(decision); return request(`/landing-insights/${encodeURIComponent(url)}/decisions`, landingDecisionRecordSchema, { method: "POST", headers: { "x-local-role": "growth_manager" }, body: JSON.stringify(body) }); },
  draftLanding: (draft: LandingDraftRequest) => { const body = landingDraftRequestSchema.parse(draft); return request("/landings/drafts", landingMutationSchema, { method: "POST", body: JSON.stringify(body) }); },
  transitionLanding: (url: string, action: "review" | "approve" | "publish") => request(`/landings/${encodeURIComponent(url)}/${action}`, landingMutationSchema, { method: "POST", headers: action === "approve" || action === "publish" ? { "x-local-role": "growth_manager" } : {}, body: JSON.stringify(action === "approve" ? { approver: "Growth Manager (local simulation)" } : {}) }),
  seo: (filters: GlobalFilters) => request(`/seo${queryString(filters)}`, seoSchema),
  ads: (filters: GlobalFilters) => request(`/ads${queryString(filters)}`, adsSchema),
  experiments: (filters: GlobalFilters) => request(`/experiments${queryString(filters)}`, experimentsSchema),
  experiment: (id: string) => request(`/experiments/${encodeURIComponent(id)}`, experimentDetailSchema),
  experimentSql: (id: string) => request(`/experiments/${encodeURIComponent(id)}/sql`, sqlResultSchema),
  weeklyHistory: (date: string) => request(`/planning/weekly/${date}`, weeklyNoteSchema.array()),
  saveWeekly: (note: WeeklyNote) => request(`/planning/weekly/${note.date}`, weeklyNoteSchema, { method: "POST", body: JSON.stringify(note) }),
  learning: () => request("/learning", learningSchema),
  dataQuality: (filters: GlobalFilters) => request(`/data-quality${queryString(filters)}`, dataQualitySchema),
  strategy: (assumptions: { scenario: "conservative" | "base" | "optimistic"; demandCaptureRate: number; leadToSqlRate: number; sqlToAltaRate: number; capacityUtilization: number; months: number }) => request(`/strategy${queryString({}, undefined, Object.fromEntries(Object.entries(assumptions).map(([key, value]) => [key, String(value)])))}`, strategySchema),
  workbench: () => request("/workbench", workbenchSchema),
  governance: () => request("/governance", governanceSchema),
  planning: () => request("/planning", planningSchema),
  filters: () => request("/filters", filterOptionsSchema),
};
