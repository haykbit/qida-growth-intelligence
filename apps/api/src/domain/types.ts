import type {
  JourneyDetail,
  JourneySummary,
  LandingDraftRequest,
  OpportunityDetail,
  OpportunityRow,
  OverviewResponse,
  Paginated,
} from "@qida/contracts";

export type Filters = {
  from?: string | undefined;
  to?: string | undefined;
  province?: string | undefined;
  municipalityId?: string | undefined;
  service?: string | undefined;
  channel?: string | undefined;
  language?: "es" | "ca" | undefined;
};

export type PageRequest = Filters & { page: number; pageSize: number; search?: string | undefined };

export type FilterOptions = {
  dateRange: { min: string | null; max: string | null };
  provinces: string[];
  municipalities: Array<{ id: string; name: string; province: string }>;
  services: string[];
  channels: string[];
  languages: Array<"es" | "ca">;
};

export type FunnelBreakdown = {
  name: string;
  leads: number;
  sql: number;
  altas: number;
  leadToSql: number;
  sqlToAlta: number;
  averageDaysToSql: number | null;
  averageDaysToAlta: number | null;
  mature: boolean;
};

export type FunnelsResponse = {
  byChannel: FunnelBreakdown[];
  byService: FunnelBreakdown[];
  byMunicipality: FunnelBreakdown[];
  byCohort: FunnelBreakdown[];
  discardReasons: Array<{ name: string; value: number }>;
  maturityWindowDays: number;
  caveats: string[];
};

export type LandingRecord = {
  url: string;
  municipalityId: string | null;
  municipality: string | null;
  language: "es" | "ca";
  origin: "manual" | "generada";
  service: string | null;
  status: "draft" | "pending_review" | "approved" | "published" | "rejected";
  publishedAt: string | null;
  indexedAt: string | null;
  sessions: number;
  forms: number;
  sql: number;
  altas: number;
  impressions: number;
  clicks: number;
  content?: LandingContent;
  validationIssues?: string[];
};

export type LandingContent = {
  title: string;
  description: string;
  blocks: Array<{ type: string; heading: string; body: string }>;
  generatedFrom: { municipalityId: string; service: string; language: "es" | "ca" };
};

export type LandingCommandResult = {
  landing: LandingRecord;
  auditId: string;
};

export type LandingReviewInput = { reviewerNote?: string | undefined };
export type LandingApprovalInput = { approver: string; note?: string | undefined };

export type SeoRow = {
  origin: string;
  status: string;
  landings: number;
  published: number;
  indexed: number;
  impressions: number;
  clicks: number;
  ctr: number;
  averagePosition: number | null;
  organicSessions: number;
  forms: number;
  sql: number;
  altas: number;
};

export type AdsRow = {
  platform: string;
  campaign: string;
  municipalityId: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  platformConversions: number;
  crmSql: number;
  crmAltas: number;
  costPerSql: number | null;
  costPerAlta: number | null;
  allocationWarning: string | null;
};

export type ExperimentSummary = {
  id: string;
  name: string;
  hypothesis: string;
  startDate: string;
  endDate: string | null;
  status: string;
  primaryMetric: string;
  methodology: string;
  treatmentMunicipalities: number;
  controlMunicipalities: number;
  observedDifference: number | null;
  didEstimate: number | null;
  evidenceLevel: "descriptive" | "quasi_experimental";
  limitations: string[];
};

export type ExperimentDetail = ExperimentSummary & {
  assignments: Array<{ municipalityId: string; municipality: string; variant: string; assignedAt: string }>;
  series: Array<{ period: string; variant: string; value: number; sampleSize: number }>;
  diagnostics: { parallelTrendsPass: boolean | null; minimumSamplePass: boolean; preTrendDifference: number | null };
};

export type DataQualityResponse = {
  generatedAt: string;
  freshness: Array<{ source: string; latestAt: string | null; lagDays: number | null; status: string }>;
  identity: { totalEvents: number; unlinkedEvents: number; ambiguousIdentities: number; traceabilityCoverage: number };
  duplicates: { potentialLeadDuplicates: number; confirmedLinks: number };
  integrity: Array<{ check: string; failures: number; severity: "info" | "warning" | "error" }>;
  missingness: Array<{ field: string; missing: number; total: number; rate: number }>;
  discrepancies: Array<{ metric: string; platform: number; crm: number; difference: number }>;
  immatureCohorts: number;
  limitations: string[];
  monitoringSignals?: Array<{ signal: string; value: number; threshold: number; status: "ok" | "attention" }>;
};

export type StrategyAssumptions = {
  scenario: "conservative" | "base" | "optimistic";
  demandCaptureRate: number;
  leadToSqlRate: number;
  sqlToAltaRate: number;
  capacityUtilization: number;
  months: number;
};

export type StrategyBet = {
  rank: number;
  municipalityId: string;
  municipality: string;
  service: string;
  decision: "prioritize" | "reject";
  reason: string;
  impact: "low" | "medium" | "high";
  effort: "low" | "medium" | "high";
  confidence: number;
  dependencies: string[];
  owner: string;
  estimatedIncrementalSql: number;
  estimatedIncrementalAltas: number;
  hypothesis: string;
  mvp: string;
  exclusions: string[];
  successCriteria: string[];
  decisionCriteria: { continue: string; modify: string; stop: string };
};

export type StrategyResponse = {
  label: "Synthetic planning demonstration — not a forecast";
  baseline: { sqlPerMonth: 2000; source: "planning_brief"; observedFilteredSql: number };
  assumptions: StrategyAssumptions;
  scenarios: Record<"conservative" | "base" | "optimistic", Omit<StrategyAssumptions, "scenario" | "months">>;
  portfolioEstimate: { incrementalSql: number; incrementalAltas: number; periodMonths: number };
  prioritizedBets: StrategyBet[];
  rejectedBets: StrategyBet[];
  milestones: { first90Days: string[]; sixMonths: string[] };
  caveats: string[];
};

export type WorkbenchQuery = {
  id: "municipality_prioritization" | "landing_cohort_outcomes" | "quality_and_losses";
  title: string;
  objective: string;
  sql: string;
  dataUsed: string[];
  resultRows: Array<Record<string, string | number | boolean | null>>;
  interpretation: string;
  recommendedDecision: string;
  proposedExtensionsUsed: string[];
};

export type WorkbenchResponse = {
  executionMode: "curated_read_only";
  generatedAt: string;
  queries: WorkbenchQuery[];
  warning: string;
};

export interface GrowthRepository {
  health(): Promise<{ database: "up" | "down"; seedVersion: string }>;
  filters(): Promise<FilterOptions>;
  overview(filters: Filters): Promise<OverviewResponse>;
  opportunities(input: PageRequest): Promise<Paginated<OpportunityRow>>;
  opportunity(municipalityId: string, service: string): Promise<OpportunityDetail | null>;
  journeys(input: PageRequest): Promise<Paginated<JourneySummary>>;
  journey(opportunityId: string): Promise<JourneyDetail | null>;
  funnels(filters: Filters): Promise<FunnelsResponse>;
  landings(input: PageRequest): Promise<Paginated<LandingRecord>>;
  createLandingDraft(input: LandingDraftRequest, requestId: string): Promise<LandingCommandResult>;
  reviewLanding(url: string, input: LandingReviewInput, requestId: string): Promise<LandingCommandResult>;
  approveLanding(url: string, input: LandingApprovalInput, role: string, requestId: string): Promise<LandingCommandResult>;
  publishLanding(url: string, role: string, requestId: string): Promise<LandingCommandResult>;
  seo(filters: Filters): Promise<{ rows: SeoRow[]; caveat: string }>;
  ads(filters: Filters): Promise<{ rows: AdsRow[]; caveats: string[] }>;
  experiments(input: PageRequest): Promise<Paginated<ExperimentSummary>>;
  experiment(id: string): Promise<ExperimentDetail | null>;
  dataQuality(): Promise<DataQualityResponse>;
  strategy(assumptions: StrategyAssumptions): Promise<StrategyResponse>;
  workbench(): Promise<WorkbenchResponse>;
}
