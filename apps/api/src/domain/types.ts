import type { SqlResult, WeeklyNote } from "@qida/contracts";
import type {
  JourneyDetail,
  JourneySummary,
  LandingDecisionRequest,
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

export type LandingDecisionKind = "keep" | "iterate" | "stop";
export type LandingDiagnosis = {
  decision: LandingDecisionKind;
  headline: string;
  rationale: string[];
  recommendedAction: string;
  primaryMetric: "session_to_lead" | "lead_to_sql" | "sql_to_alta";
  guardrailMetric: "lead_to_sql" | "sql_to_alta" | "caregiver_capacity";
  evidenceLevel: "descriptive" | "attributed" | "quasi_experimental";
};
export type LandingInsightSummary = LandingRecord & {
  leads: number;
  phoneClicks: number;
  averagePosition: number | null;
  rates: { sessionToLead: number; leadToSql: number; sqlToAlta: number; organicCtr: number };
  benchmark: { sessionToLead: number; leadToSql: number; sqlToAlta: number };
  operations: { coverage: boolean; caregiversAvailable: number; eligible: boolean };
  opportunityScore: number | null;
  diagnosis: LandingDiagnosis;
  evaluation: {
    overall: number;
    version: "landing-evaluator-v1";
    dimensions: Array<{ key: "visibility" | "acquisition" | "quality" | "operability"; label: string; score: number; explanation: string }>;
  };
};
export type LandingPortfolio = Paginated<LandingInsightSummary> & {
  totals: { landings: number; published: number; sessions: number; leads: number; sql: number; altas: number };
};
export type LandingDecisionRecord = LandingDecisionRequest & {
  resultSnapshot?: SqlResult;
  id: string;
  version: number;
  actorRole: string;
  createdAt: string;
};
export type LandingInsightDetail = LandingInsightSummary & {
  monthly: Array<{ period: string; sessions: number; forms: number; phoneClicks: number; leads: number; sql: number; altas: number; sessionToLead: number; leadToSql: number }>;
  experiments: ExperimentSummary[];
  decisions: LandingDecisionRecord[];
  caveats: string[];
};
export type LearningDecision = LandingDecisionRecord & { url: string; municipality: string | null; service: string | null };
export type LearningResponse = {
  experiments: ExperimentSummary[];
  decisions: LearningDecision[];
  totals: { experiments: number; positive: number; inconclusive: number; negative: number; decisions: number };
  caveats: string[];
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
  diagnostics: { parallelTrendsPass: null; hasObservedDataInBothGroups: boolean; preTrendDifference: number | null };
};

export type DataQualityResponse = {
  generatedAt: string;
  freshness: Array<{ source: string; latestAt: string | null; lagDays: number | null; status: string }>;
  identity: { totalEvents: number; unlinkedEvents: number; ambiguousIdentities: number; traceabilityCoverage: number };
  duplicates: { potentialLeadDuplicates: number; confirmedLinks: number };
  integrity: Array<{ check: string; failures: number; severity: "info" | "warning" | "error" }>;
  missingness: Array<{ field: string; missing: number; total: number; rate: number }>;
  discrepancies: Array<{ metric: string; platform: number; crm: number; difference: number }>;
  pendingMaturitySql: number;
  limitations: string[];
  monitoringSignals?: Array<{ signal: string; value: number; unit: "count"; source: string }>;
};

export type StrategyAssumptions = {
  scenario: "conservative" | "base" | "optimistic";
  demandCaptureRate: number;
  leadToSqlRate: number;
  sqlToAltaRate: number;
  capacityUtilization: number;
  months: number;
  marketLimit: number;
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
  dependencies: string[];
  owner: string;
  scenarioSql: number;
  scenarioAltas: number;
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
  scenarios: Record<"conservative" | "base" | "optimistic", Omit<StrategyAssumptions, "scenario" | "months" | "marketLimit">>;
  planningModel: {
    version: string;
    formula: string;
    candidateRowsEvaluated: number;
    eligibleMarketsInCandidateSet: number;
    marketsIncluded: number;
    exclusions: string[];
  };
  scenarioProjection: { sql: number; altas: number; periodMonths: number };
  impactRange: {
    sql: { min: number; max: number };
    altas: { min: number; max: number };
    periodMonths: number;
    scenarioValues: Record<"conservative" | "base" | "optimistic", { sql: number; altas: number }>;
  };
  enablingInitiatives: Array<{
    name: string;
    directScenarioSql: 0;
    directScenarioAltas: 0;
    value: string;
  }>;
  portfolioInitiatives: Array<{
    id: "local_landings" | "qualification" | "paid_reallocation" | "traceability";
    rank: number;
    name: string;
    outcome: "sql" | "altas" | "enabler";
    evidence: "planning_assumption" | "enabling_initiative";
    formula: string;
    inputs: string[];
    scenarioValues: Record<"conservative" | "base" | "optimistic", number>;
    range: { min: number; max: number };
    periodMonths: number;
  }>;
  prioritizedBets: StrategyBet[];
  rejectedBets: StrategyBet[];
  milestones: { first90Days: string[]; sixMonths: string[] };
  caveats: string[];
};

export type WorkbenchQuery = {
  id:
    | "opportunity_score"
    | "landing_performance"
    | "landing_monthly_funnel"
    | "experiment_effect"
    | "traceability_coverage"
    | "quality_controls";
  area: "Oportunidades" | "Landings" | "Medición" | "Calidad";
  title: string;
  question: string;
  grain: string;
  evidence: "descriptive" | "attribution" | "quasi_experimental" | "quality";
  implementation: { endpoint: string; method: string };
  statements: Array<{ title: string; purpose: string; sql: string; parameters: Array<{ name: string; value: string }> }>;
  dataUsed: string[];
  joins: Array<{ left: string; right: string; on: string; purpose: string }>;
  metrics: Array<{
    name: string;
    definition: string;
    calculation: string;
    calculatedIn: "sql" | "application";
    displayedAs: string;
  }>;
  shownIn: Array<{ page: string; component: string }>;
  resultRows: Array<Record<string, string | number | boolean | null>>;
  resultDescription: string;
  exclusions: string[];
  caveats: string[];
};

export type WorkbenchResponse = {
  executionMode: "curated_read_only";
  generatedAt: string;
  queries: WorkbenchQuery[];
  warning: string;
};

export type GovernanceResponse = {
  product: string;
  architectureStages: Array<{ stage: number; name: string; purpose: string; owner: string; status: "existing" | "demo" | "proposed"; inputs: string[]; outputs: string[] }>;
  ownership: Array<{ domain: string; owner: string; paths: string[]; tools: string[] }>;
  integrations: Array<{ name: string; mode: "existing" | "proposed" | "simulated"; boundary: string }>;
  controls: {
    validation: string[];
    monitoring: string[];
    approval: string;
    privacy: string;
    evidenceLabels: Array<{ label: "correlation" | "attribution" | "causal"; meaning: string }>;
  };
};

export type PlanningRestrictionId =
  | "no_prices"
  | "unique_qida_value"
  | "privacy_consent"
  | "marketing_approval"
  | "no_health_claims"
  | "capacity_before_demand";

export type PlanningResponse = {
  version: string;
  startDate: string;
  endDate: string;
  totalDays: 90;
  decisionMetric: string;
  phases: Array<{
    id: "prepare" | "launch" | "exposure" | "maturation";
    name: string;
    startDay: number;
    endDay: number;
    outcome: string;
    owner: string;
  }>;
  restrictions: Array<{
    id: PlanningRestrictionId;
    rule: string;
    evidence: string;
    owner: string;
  }>;
  meetings: Array<{
    id: string;
    name: string;
    category: "working" | "control" | "approval" | "decision";
    cadence: string;
    dates: string[];
    owner: string;
    attendees: string[];
    purpose: string;
    inputs: string[];
    agenda: Array<{ title: string; minutes: number; content: string }>;
    decisions: string[];
    outputs: string[];
    restrictionIds: PlanningRestrictionId[];
  }>;
};

export type GrowthRepository = {
  health(): Promise<{ database: "up" | "down"; seedVersion: string }>;
  filters(): Promise<FilterOptions>;
  overview(filters: Filters): Promise<OverviewResponse>;
  opportunities(input: PageRequest): Promise<Paginated<OpportunityRow>>;
  opportunity(municipalityId: string, service: string): Promise<OpportunityDetail | null>;
  journeys(input: PageRequest): Promise<Paginated<JourneySummary>>;
  journey(opportunityId: string): Promise<JourneyDetail | null>;
  funnels(filters: Filters): Promise<FunnelsResponse>;
  landings(input: PageRequest): Promise<Paginated<LandingRecord>>;
  landingInsights(input: PageRequest): Promise<LandingPortfolio>;
  landingInsight(url: string, filters: Filters): Promise<LandingInsightDetail | null>;
  recordLandingDecision(url: string, input: LandingDecisionRequest, role: string, requestId: string): Promise<LandingDecisionRecord>;
  createLandingDraft(input: LandingDraftRequest, requestId: string): Promise<LandingCommandResult>;
  reviewLanding(url: string, input: LandingReviewInput, requestId: string): Promise<LandingCommandResult>;
  approveLanding(url: string, input: LandingApprovalInput, role: string, requestId: string): Promise<LandingCommandResult>;
  publishLanding(url: string, role: string, requestId: string): Promise<LandingCommandResult>;
  seo(filters: Filters): Promise<{ rows: SeoRow[]; caveat: string }>;
  ads(filters: Filters): Promise<{ rows: AdsRow[]; caveats: string[] }>;
  experiments(input: PageRequest): Promise<Paginated<ExperimentSummary>>;
  experiment(id: string): Promise<ExperimentDetail | null>;
  learning(): Promise<LearningResponse>;
  experimentSqlResult(id: string): Promise<SqlResult>;
  weeklyHistory(date: string): Promise<WeeklyNote[]>;
  saveWeekly(note: WeeklyNote): Promise<WeeklyNote>;
  dataQuality(): Promise<DataQualityResponse>;
  strategy(assumptions: StrategyAssumptions): Promise<StrategyResponse>;
  workbench(): Promise<WorkbenchResponse>;
  governance(): Promise<GovernanceResponse>;
  planning(): Promise<PlanningResponse>;
};
