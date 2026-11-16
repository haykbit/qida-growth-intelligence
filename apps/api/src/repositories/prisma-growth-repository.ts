import { changeSchema, sqlResultSchema, weeklyNoteSchema, type WeeklyNote, type SqlResult } from "@qida/contracts";
import { experimentSql, sqlReadout } from "./experiment-sql.js";
import { createHash, randomUUID } from "node:crypto";
import { calculateLandingImpact, calculatePlanningDelta } from "@qida/analytics";
import type {
  IdentityStatus,
  JourneyDetail,
  JourneyRouteStep,
  JourneySummary,
  LandingDecisionRequest,
  LandingDraftRequest,
  OpportunityDetail,
  OpportunityFactor,
  OpportunityRow,
  OverviewResponse,
  Paginated,
} from "@qida/contracts";
import type {
  AdsRow,
  DataQualityResponse,
  ExperimentDetail,
  ExperimentSummary,
  FilterOptions,
  Filters,
  FunnelBreakdown,
  FunnelsResponse,
  GrowthRepository,
  GovernanceResponse,
  LandingApprovalInput,
  LandingCommandResult,
  LandingContent,
  LandingDecisionRecord,
  LandingDiagnosis,
  LandingInsightDetail,
  LandingInsightSummary,
  LandingPortfolio,
  LandingRecord,
  LandingReviewInput,
  LearningDecision,
  LearningResponse,
  PageRequest,
  SeoRow,
  StrategyAssumptions,
  StrategyBet,
  StrategyResponse,
  WorkbenchQuery,
  WorkbenchResponse,
  PlanningResponse,
} from "../domain/types.js";
import { AppError } from "../lib/errors.js";
import type { DatabaseClient } from "../lib/prisma.js";
import {
  booleanValue,
  isoValue,
  jsonRecord,
  nullableIso,
  nullableString,
  numberValue,
  rate,
  records,
  round,
  SqlBuilder,
  stringArray,
  stringValue,
  type SqlValue,
} from "./sql.js";

function decisionEvidence(metadata: Record<string, unknown>) {
  return {
    ...(metadata.change ? { change: changeSchema.parse(metadata.change) } : {}),
    ...(typeof metadata.author === "string" ? { author: metadata.author } : {}),
    ...(typeof metadata.evidenceDecisionId === "string" ? { evidenceDecisionId: metadata.evidenceDecisionId } : {}),
    ...(metadata.resultSnapshot ? { resultSnapshot: sqlResultSchema.parse(metadata.resultSnapshot) } : {}),
  };
}

type LeadAliases = { lead: string; municipality: string };
const LANDING_SELECTION_RULES_VERSION = "qgi-landing-selection-v1.0.0";

function leadWhere(filters: Filters, builder: SqlBuilder, aliases: LeadAliases = { lead: "l", municipality: "m" }): string {
  const clauses = [`${aliases.lead}.tipo_contacto <> 'cuidadora_empleo'`];
  if (filters.from !== undefined) clauses.push(`${aliases.lead}.fecha_creacion >= ${builder.add(filters.from)}::date`);
  if (filters.to !== undefined) clauses.push(`${aliases.lead}.fecha_creacion < (${builder.add(filters.to)}::date + interval '1 day')`);
  if (filters.province !== undefined) clauses.push(`${aliases.municipality}.provincia = ${builder.add(filters.province)}`);
  if (filters.municipalityId !== undefined) clauses.push(`${aliases.lead}.municipio_id = ${builder.add(filters.municipalityId)}`);
  if (filters.service !== undefined) clauses.push(`${aliases.lead}.servicio = ${builder.add(filters.service)}`);
  if (filters.channel !== undefined) clauses.push(`${aliases.lead}.canal = ${builder.add(filters.channel)}`);
  return clauses.join(" AND ");
}

function opportunityFromRow(row: Record<string, unknown>): OpportunityRow {
  const coverage = booleanValue(row.coverage);
  const caregivers = numberValue(row.caregivers_available);
  const ownMunicipalData = booleanValue(row.own_municipal_data);
  const demandMonthsObserved = numberValue(row.demand_months_observed);
  const eligibility: OpportunityRow["eligibility"] = !coverage ? "ineligible" : caregivers < 8 ? "constrained" : "eligible";
  const selectionReasons = [
    ...(!ownMunicipalData ? ["Solo hay agregados provinciales; falta evidencia municipal propia"] : []),
    ...(!coverage ? ["El servicio no tiene cobertura en el municipio"] : []),
    ...(caregivers < 8 ? ["Hay menos de ocho cuidadoras disponibles a 30 días"] : []),
    ...(demandMonthsObserved < 6 ? ["Hay menos de seis meses de demanda observada"] : []),
  ];
  const selectionEligibility: OpportunityRow["selectionEligibility"] = !ownMunicipalData || !coverage || demandMonthsObserved < 6
    ? "ineligible"
    : caregivers < 8
      ? "constrained"
      : "eligible";
  return {
    municipalityId: stringValue(row.municipio_id),
    municipality: stringValue(row.municipality),
    province: stringValue(row.province),
    service: stringValue(row.service),
    monthlySearches: Math.round(numberValue(row.monthly_searches)),
    estimatedCpc: round(numberValue(row.estimated_cpc), 2),
    leads: Math.round(numberValue(row.lead_count)),
    sql: Math.round(numberValue(row.sql_count)),
    altas: Math.round(numberValue(row.alta_count)),
    sqlToAlta: round(rate(numberValue(row.alta_count), numberValue(row.sql_count))),
    caregiversAvailable: caregivers,
    coverage,
    voiceSignals: Math.round(numberValue(row.voice_signals)),
    competitors: Math.round(numberValue(row.competitors)),
    score: round(numberValue(row.score), 1),
    eligibility,
    selectionEligibility,
    selectionReasons,
    dataSource: ownMunicipalData ? "municipal_own" : "province_fallback",
    demandMonthsObserved,
    latestDemandMonth: nullableString(row.latest_demand_month),
    latestLeadAt: nullableIso(row.latest_lead_at),
    selectionRulesVersion: LANDING_SELECTION_RULES_VERSION,
  };
}

function identityStatus(value: unknown): IdentityStatus {
  if (value === "confirmed" || value === "ambiguous") return value;
  return "unlinked";
}

function serviceLabel(value: string): string {
  const labels: Record<string, string> = {
    acompanamiento: "acompañamiento",
    ayuda_domicilio: "ayuda a domicilio",
    cuidado_personas_mayores: "cuidado de personas mayores",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function pseudonymousContactRef(sourceSystem: string, sourceIdentifier: string): string {
  const prefix = sourceSystem.toLowerCase() === "hubspot" ? "hs" : "crm";
  const digest = createHash("sha256").update(`${sourceSystem}:${sourceIdentifier}`).digest("hex").slice(0, 12);
  return `${prefix}_${digest}`;
}

function journeyRoute(value: unknown): JourneyRouteStep[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const eventType = stringValue(row.eventType);
    if (!eventType || row.occurredAt === undefined) return [];
    return [{
      eventType,
      occurredAt: isoValue(row.occurredAt),
      sourceSystem: stringValue(row.sourceSystem),
      channel: nullableString(row.channel),
      observed: booleanValue(row.observed),
    }];
  });
}

function funnelFromRow(row: Record<string, unknown>): FunnelBreakdown {
  const leads = numberValue(row.leads);
  const sql = numberValue(row.sql_count);
  const altas = numberValue(row.alta_count);
  return {
    name: stringValue(row.name),
    leads,
    sql,
    altas,
    leadToSql: round(rate(sql, leads)),
    sqlToAlta: round(rate(altas, sql)),
    averageDaysToSql: row.days_to_sql === null ? null : round(numberValue(row.days_to_sql), 1),
    averageDaysToAlta: row.days_to_alta === null ? null : round(numberValue(row.days_to_alta), 1),
    mature: row.mature === undefined ? true : booleanValue(row.mature),
  };
}

function diagnoseLanding(input: {
  status: LandingRecord["status"];
  sessions: number;
  leads: number;
  sessionToLead: number;
  leadToSql: number;
  sqlToAlta: number;
  benchmarkSessionToLead: number;
  benchmarkLeadToSql: number;
  benchmarkSqlToAlta: number;
  coverage: boolean;
  caregiversAvailable: number;
}): LandingDiagnosis {
  if (!input.coverage || input.caregiversAvailable < 8) {
    return {
      decision: "stop",
      headline: "No escalar hasta resolver la restricción operativa",
      rationale: [!input.coverage ? "El municipio no tiene cobertura activa." : `La capacidad disponible es de ${input.caregiversAvailable} cuidadoras, por debajo del umbral operativo.`],
      recommendedAction: "Detener nuevas activaciones y revisar cobertura o capacidad antes de generar más demanda.",
      primaryMetric: "sql_to_alta",
      guardrailMetric: "caregiver_capacity",
      evidenceLevel: "attributed",
    };
  }
  if (input.status !== "published") {
    return {
      decision: "iterate",
      headline: "La landing todavía no tiene una publicación medible",
      rationale: ["El estado editorial no permite evaluar un resultado completo."],
      recommendedAction: "Completar el flujo de publicación y declarar la métrica antes de empezar a comparar resultados.",
      primaryMetric: "session_to_lead",
      guardrailMetric: "lead_to_sql",
      evidenceLevel: "descriptive",
    };
  }
  if (input.sessions < 250 || input.leads < 10) {
    return {
      decision: "keep",
      headline: "Mantener mientras madura la muestra",
      rationale: [`Hay ${input.sessions} sesiones y ${input.leads} leads atribuidos; la lectura aún es sensible a pocos casos.`],
      recommendedAction: "No cambiar todavía. Esperar más observaciones y vigilar la calidad de los leads.",
      primaryMetric: "session_to_lead",
      guardrailMetric: "lead_to_sql",
      evidenceLevel: "attributed",
    };
  }
  if (input.benchmarkSessionToLead > 0 && input.sessionToLead < input.benchmarkSessionToLead * 0.8) {
    return {
      decision: "iterate",
      headline: "El principal margen está antes del lead",
      rationale: ["La conversión de sesión a lead está al menos un 20% por debajo del portfolio comparable."],
      recommendedAction: "Probar una nueva propuesta de valor o un CTA más directo en una versión controlada.",
      primaryMetric: "session_to_lead",
      guardrailMetric: "lead_to_sql",
      evidenceLevel: "attributed",
    };
  }
  if (input.benchmarkLeadToSql > 0 && input.leadToSql < input.benchmarkLeadToSql * 0.8) {
    return {
      decision: "iterate",
      headline: "La landing capta, pero la calidad del lead es menor",
      rationale: ["La conversión de lead a SQL está al menos un 20% por debajo del portfolio comparable."],
      recommendedAction: "Ajustar el mensaje y la cualificación del formulario sin optimizar únicamente el volumen.",
      primaryMetric: "lead_to_sql",
      guardrailMetric: "sql_to_alta",
      evidenceLevel: "attributed",
    };
  }
  if (input.benchmarkSqlToAlta > 0 && input.sqlToAlta < input.benchmarkSqlToAlta * 0.8) {
    return {
      decision: "iterate",
      headline: "El volumen llega a SQL, pero no se convierte en alta",
      rationale: ["La conversión de SQL a alta está al menos un 20% por debajo del portfolio comparable."],
      recommendedAction: "Revisar si el mensaje atrae necesidades atendibles y validar el cambio sin aumentar primero el volumen.",
      primaryMetric: "sql_to_alta",
      guardrailMetric: "caregiver_capacity",
      evidenceLevel: "attributed",
    };
  }
  return {
    decision: "keep",
    headline: "Rendimiento estable frente al portfolio",
    rationale: ["La captación y la calidad no presentan una brecha material frente al benchmark actual."],
    recommendedAction: "Mantener la versión y priorizar una prueba solo si existe una hipótesis específica.",
    primaryMetric: "lead_to_sql",
    guardrailMetric: "sql_to_alta",
    evidenceLevel: "attributed",
  };
}

function evaluateLanding(input: {
  indexedAt: string | null;
  clicks: number;
  averagePosition: number | null;
  sessionToLead: number;
  leadToSql: number;
  sqlToAlta: number;
  benchmarkSessionToLead: number;
  benchmarkLeadToSql: number;
  benchmarkSqlToAlta: number;
  coverage: boolean;
  caregiversAvailable: number;
}): LandingInsightSummary["evaluation"] {
  const boundedRatio = (value: number, benchmark: number): number => benchmark <= 0 ? 0 : Math.round(Math.min(100, (value / benchmark) * 100));
  const visibility = Math.min(100,
    (input.indexedAt === null ? 0 : 35)
    + (input.clicks > 0 ? 25 : 0)
    + (input.averagePosition !== null && input.averagePosition <= 10 ? 40 : input.averagePosition !== null && input.averagePosition <= 20 ? 20 : 0),
  );
  const acquisition = boundedRatio(input.sessionToLead, input.benchmarkSessionToLead);
  const quality = Math.round((boundedRatio(input.leadToSql, input.benchmarkLeadToSql) + boundedRatio(input.sqlToAlta, input.benchmarkSqlToAlta)) / 2);
  const operability = !input.coverage ? 0 : input.caregiversAvailable < 8 ? 40 : 100;
  const dimensions: LandingInsightSummary["evaluation"]["dimensions"] = [
    { key: "visibility", label: "Visibilidad", score: visibility, explanation: "Indexación, clics orgánicos y posición media observada." },
    { key: "acquisition", label: "Captación", score: acquisition, explanation: "Sesión → lead frente al benchmark filtrado." },
    { key: "quality", label: "Calidad", score: quality, explanation: "Lead → SQL y SQL → alta frente al benchmark filtrado." },
    { key: "operability", label: "Operabilidad", score: operability, explanation: "Cobertura activa y capacidad mínima de cuidadoras." },
  ];
  return { overall: Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length), version: "landing-evaluator-v1", dimensions };
}

export class PrismaGrowthRepository implements GrowthRepository {
  public constructor(
    private readonly db: DatabaseClient,
    private readonly seedVersion: string,
  ) {}

  private async query(sql: string, values: SqlValue[] = []): Promise<Array<Record<string, unknown>>> {
    const result: unknown = await this.db.$queryRawUnsafe(sql, ...values);
    return records(result);
  }

  private async execute(sql: string, values: SqlValue[] = []): Promise<number> {
    return this.db.$executeRawUnsafe(sql, ...values);
  }

  public async health(): Promise<{ database: "up" | "down"; seedVersion: string }> {
    try {
      await this.query("SELECT 1 AS ok");
      return { database: "up", seedVersion: this.seedVersion };
    } catch {
      return { database: "down", seedVersion: this.seedVersion };
    }
  }

  public async filters(): Promise<FilterOptions> {
    const [municipalities, services, channels, dates] = await Promise.all([
      this.query(`SELECT municipio_id, nombre, provincia FROM motor_municipio ORDER BY provincia, nombre`),
      this.query(`SELECT DISTINCT servicio FROM lead WHERE tipo_contacto <> 'cuidadora_empleo' ORDER BY servicio`),
      this.query(`SELECT DISTINCT canal FROM lead WHERE tipo_contacto <> 'cuidadora_empleo' ORDER BY canal`),
      this.query(`SELECT MIN(fecha_creacion) AS min_date, MAX(fecha_creacion) AS max_date FROM lead`),
    ]);
    return {
      dateRange: {
        min: dates[0]?.min_date === null || dates[0]?.min_date === undefined ? null : isoValue(dates[0].min_date).slice(0, 10),
        max: dates[0]?.max_date === null || dates[0]?.max_date === undefined ? null : isoValue(dates[0].max_date).slice(0, 10),
      },
      provinces: [...new Set(municipalities.map((row) => stringValue(row.provincia)))],
      municipalities: municipalities.map((row) => ({
        id: stringValue(row.municipio_id),
        name: stringValue(row.nombre),
        province: stringValue(row.provincia),
      })),
      services: services.map((row) => stringValue(row.servicio)),
      channels: channels.map((row) => stringValue(row.canal)),
      languages: ["es", "ca"],
    };
  }

  public async overview(filters: Filters): Promise<OverviewResponse> {
    const summaryBuilder = new SqlBuilder();
    const summaryWhere = leadWhere(filters, summaryBuilder);
    const spendFrom = filters.from === undefined ? "TRUE" : `a.fecha >= ${summaryBuilder.add(filters.from)}::date`;
    const spendTo = filters.to === undefined ? "TRUE" : `a.fecha <= ${summaryBuilder.add(filters.to)}::date`;
    const municipalityBuilder = new SqlBuilder();
    const municipalityWhere = leadWhere(filters, municipalityBuilder);
    const discardBuilder = new SqlBuilder();
    const discardWhere = leadWhere(filters, discardBuilder);
    const paidBuilder = new SqlBuilder();
    const paidWhere = leadWhere(filters, paidBuilder, { lead: "pl", municipality: "pm" });
    const conversionBuilder = new SqlBuilder();
    const conversionWhere = leadWhere(filters, conversionBuilder);
    const [summaryRows, paidRows, monthlyRows, conversionRows, channelRows, municipalityRows, discardRows, opportunities] = await Promise.all([
      this.query(
        `SELECT COUNT(*)::int AS leads,
          COUNT(*) FILTER (WHERE l.es_sql)::int AS sql_count,
          COUNT(*) FILTER (WHERE l.es_alta)::int AS alta_count,
          COUNT(*) FILTER (WHERE l.es_sql AND l.fecha_creacion <= CURRENT_DATE - interval '90 days')::int AS mature_sql_count,
          COUNT(*) FILTER (WHERE l.es_alta AND l.fecha_creacion <= CURRENT_DATE - interval '90 days')::int AS mature_alta_count,
          COUNT(DISTINCT l.lead_id) FILTER (WHERE EXISTS (
            SELECT 1 FROM care_opportunity co JOIN journey_event je ON je.opportunity_id = co.opportunity_id
            WHERE co.lead_id = l.lead_id
          ))::int AS traced,
          (SELECT GREATEST(COUNT(*) - COUNT(DISTINCT person_id), 0)::int FROM identity_map) AS duplicates,
          (SELECT COUNT(DISTINCT d.municipio_id)::int FROM motor_demanda_busqueda d
             JOIN motor_municipio om ON om.municipio_id = d.municipio_id
             WHERE om.tiene_cobertura AND d.tema = ANY(om.servicios_cubiertos)) AS opportunity_municipalities,
          (SELECT COUNT(*)::int FROM motor_municipio cm
             WHERE cm.tiene_cobertura AND cm.cuidadoras_disponibles_30d < 8) AS constrained_municipalities,
          COALESCE((SELECT SUM(a.coste_eur)::double precision FROM ads_diario a
            WHERE ${spendFrom} AND ${spendTo}), 0) AS spend
        FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id WHERE ${summaryWhere}`,
        summaryBuilder.values,
      ),
      this.query(
        `WITH campaign_leads AS (
           SELECT DISTINCT co.lead_id
           FROM journey_event je JOIN care_opportunity co ON co.opportunity_id = je.opportunity_id
           WHERE je.campaign IS NOT NULL AND co.lead_id IS NOT NULL
         )
         SELECT COUNT(*) FILTER (WHERE pl.es_sql)::int AS paid_sql_count,
                COUNT(*) FILTER (WHERE pl.es_alta)::int AS paid_alta_count
         FROM campaign_leads cl JOIN lead pl ON pl.lead_id = cl.lead_id
         LEFT JOIN motor_municipio pm ON pm.municipio_id = pl.municipio_id
         WHERE ${paidWhere}`,
        paidBuilder.values,
      ),
      this.aggregateFunnel(filters, "to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM')", "period"),
      this.query(
        `SELECT to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM') AS period,
          COUNT(*) FILTER (WHERE l.fecha_creacion <= CURRENT_DATE - interval '90 days')::int AS mature_leads,
          COUNT(*) FILTER (WHERE l.es_sql AND l.fecha_creacion <= CURRENT_DATE - interval '90 days')::int AS mature_sql,
          COUNT(*) FILTER (WHERE l.es_alta AND l.fecha_creacion <= CURRENT_DATE - interval '90 days')::int AS mature_altas
         FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
         WHERE ${conversionWhere}
         GROUP BY 1
         HAVING COUNT(*) FILTER (WHERE l.fecha_creacion <= CURRENT_DATE - interval '90 days') > 0
         ORDER BY 1`,
        conversionBuilder.values,
      ),
      this.aggregateFunnel(filters, "l.canal", "channel"),
      this.query(
        `SELECT m.nombre AS name, COUNT(*) FILTER (WHERE l.es_alta)::int AS value
         FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
         WHERE ${municipalityWhere} GROUP BY m.nombre ORDER BY value DESC, m.nombre LIMIT 15`,
        municipalityBuilder.values,
      ),
      this.query(
        `SELECT COALESCE(l.motivo_descarte, 'sin_especificar') AS name, COUNT(*)::int AS value
         FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
         WHERE ${discardWhere} AND NOT l.es_alta GROUP BY l.motivo_descarte ORDER BY value DESC`,
        discardBuilder.values,
      ),
      this.opportunities({ ...filters, page: 1, pageSize: 10 }),
    ]);

    const summary = summaryRows[0] ?? {};
    const leads = numberValue(summary.leads);
    const sql = numberValue(summary.sql_count);
    const altas = numberValue(summary.alta_count);
    const spend = numberValue(summary.spend);
    const paid = paidRows[0] ?? {};
    const matureSql = numberValue(summary.mature_sql_count);
    const matureAltas = numberValue(summary.mature_alta_count);
    const paidSql = numberValue(paid.paid_sql_count);
    const paidAltas = numberValue(paid.paid_alta_count);
    const hasUnassignableCostFilter = filters.province !== undefined
      || filters.municipalityId !== undefined
      || filters.service !== undefined
      || filters.channel !== undefined
      || filters.language !== undefined;
    return {
      kpis: {
        leads,
        sql,
        altas,
        leadToSql: round(rate(sql, leads)),
        sqlToAlta: round(rate(matureAltas, matureSql)),
        costPerSql: hasUnassignableCostFilter || paidSql === 0 ? null : round(spend / paidSql, 2),
        costPerAttributedAlta: hasUnassignableCostFilter || paidAltas === 0 ? null : round(spend / paidAltas, 2),
        traceabilityCoverage: round(rate(numberValue(summary.traced), leads)),
        duplicates: numberValue(summary.duplicates),
        opportunityMunicipalities: numberValue(summary.opportunity_municipalities),
        capacityConstrainedMunicipalities: numberValue(summary.constrained_municipalities),
      },
      monthlyFunnel: monthlyRows.map((row) => ({
        period: stringValue(row.period), leads: numberValue(row.leads), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      })),
      monthlyConversion: conversionRows.map((row) => ({
        period: stringValue(row.period),
        leadToSql: round(rate(numberValue(row.mature_sql), numberValue(row.mature_leads))),
        sqlToAlta: round(rate(numberValue(row.mature_altas), numberValue(row.mature_sql))),
        matureLeads: numberValue(row.mature_leads),
        matureSql: numberValue(row.mature_sql),
      })),
      channelFunnel: channelRows.map((row) => ({
        period: stringValue(row.channel), channel: stringValue(row.channel), leads: numberValue(row.leads), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      })),
      altasByMunicipality: municipalityRows.map((row) => ({ name: stringValue(row.name, "Sin municipio"), value: numberValue(row.value) })),
      opportunityRanking: opportunities.items,
      discardReasons: discardRows.map((row) => ({ name: stringValue(row.name), value: numberValue(row.value) })),
      caveats: [
        "Channel views are descriptive attribution and do not establish causal impact.",
        "SQL-to-alta uses opportunities created at least 90 days ago; headline SQL and altas remain period totals.",
        "Paid cost ratios use only CRM outcomes linked to an observed campaign event; they remain attribution ratios, not incrementality.",
        "Paid cost ratios are unavailable for dimensions that cannot be reconciled to Ads spend, and when no reconciled outcome exists.",
      ],
    };
  }

  private async aggregateFunnel(filters: Filters, expression: string, alias: string): Promise<Array<Record<string, unknown>>> {
    const builder = new SqlBuilder();
    const where = leadWhere(filters, builder);
    return this.query(
      `SELECT ${expression} AS ${alias}, COUNT(*)::int AS leads,
       COUNT(*) FILTER (WHERE l.es_sql)::int AS sql_count,
       COUNT(*) FILTER (WHERE l.es_alta)::int AS alta_count
       FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
       WHERE ${where} GROUP BY 1 ORDER BY 1`,
      builder.values,
    );
  }

  public async opportunities(input: PageRequest): Promise<Paginated<OpportunityRow>> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    if (input.province !== undefined) clauses.push(`m.provincia = ${builder.add(input.province)}`);
    if (input.municipalityId !== undefined) clauses.push(`m.municipio_id = ${builder.add(input.municipalityId)}`);
    if (input.service !== undefined) clauses.push(`d.tema = ${builder.add(input.service)}`);
    if (input.search !== undefined) clauses.push(`(m.nombre ILIKE ${builder.add(`%${input.search}%`)} OR d.tema ILIKE ${builder.add(`%${input.search}%`)})`);
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = builder.add(input.pageSize);
    const offset = builder.add((input.page - 1) * input.pageSize);
    const rows = await this.query(
      `WITH demand AS (
         SELECT municipio_id, tema, AVG(busquedas)::double precision AS monthly_searches,
                AVG(cpc_estimado_eur)::double precision AS estimated_cpc,
                COUNT(DISTINCT mes)::int AS demand_months_observed,
                to_char(MAX(mes), 'YYYY-MM') AS latest_demand_month
         FROM motor_demanda_busqueda
         ${input.from === undefined && input.to === undefined ? "" : `WHERE ${[
           input.from === undefined ? null : `mes >= ${builder.add(input.from)}::date`,
           input.to === undefined ? null : `mes <= ${builder.add(input.to)}::date`,
         ].filter((value): value is string => value !== null).join(" AND ")}`}
         GROUP BY municipio_id, tema
       ), lead_stats AS (
         SELECT municipio_id, servicio,
                COUNT(*)::int AS lead_count,
                COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
                COUNT(*) FILTER (WHERE es_alta)::int AS alta_count,
                MAX(fecha_creacion) AS latest_lead_at
         FROM lead WHERE tipo_contacto <> 'cuidadora_empleo'
           ${input.from === undefined ? "" : `AND fecha_creacion >= ${builder.add(input.from)}::date`}
           ${input.to === undefined ? "" : `AND fecha_creacion < (${builder.add(input.to)}::date + interval '1 day')`}
         GROUP BY municipio_id, servicio
       ), voice AS (
         SELECT municipio_id, tema, SUM(llamadas)::int AS voice_signals
         FROM motor_voz_cliente GROUP BY municipio_id, tema
       ), competition AS (
         SELECT municipio_id, COUNT(*)::int AS competitors FROM motor_competencia GROUP BY municipio_id
       ), base AS (
         SELECT m.municipio_id, m.nombre AS municipality, m.provincia AS province, d.tema AS service,
                d.monthly_searches, d.estimated_cpc,
                COALESCE(ls.lead_count, 0)::int AS lead_count,
                COALESCE(ls.sql_count, 0)::int AS sql_count, COALESCE(ls.alta_count, 0)::int AS alta_count,
                ls.latest_lead_at, d.demand_months_observed, d.latest_demand_month,
                m.datos_propios AS own_municipal_data,
                m.cuidadoras_disponibles_30d AS caregivers_available,
                (m.tiene_cobertura AND d.tema = ANY(m.servicios_cubiertos)) AS coverage,
                COALESCE(v.voice_signals, 0)::int AS voice_signals,
                COALESCE(c.competitors, 0)::int AS competitors
         FROM demand d JOIN motor_municipio m ON m.municipio_id = d.municipio_id
         LEFT JOIN lead_stats ls ON ls.municipio_id = d.municipio_id AND ls.servicio = d.tema
         LEFT JOIN voice v ON v.municipio_id = d.municipio_id AND v.tema = d.tema
         LEFT JOIN competition c ON c.municipio_id = d.municipio_id
         ${where}
       ), scored AS (
         SELECT *, CASE WHEN NOT coverage THEN 0
           ELSE LEAST(100, GREATEST(0,
             LEAST(monthly_searches / 20.0, 35)
             + LEAST(GREATEST(monthly_searches - sql_count * 3, 0) / 30.0, 25)
             + LEAST(caregivers_available / 2.0, 20)
             + LEAST(voice_signals / 10.0, 10)
             + CASE WHEN sql_count = 0 THEN 5 ELSE (1 - alta_count::double precision / NULLIF(sql_count, 0)) * 10 END
             - CASE WHEN caregivers_available < 8 THEN 20 ELSE 0 END
           )) END::double precision AS score
         FROM base
       )
       SELECT *, COUNT(*) OVER()::int AS total FROM scored
       ORDER BY score DESC, municipality, service LIMIT ${limit} OFFSET ${offset}`,
      builder.values,
    );
    return {
      items: rows.map(opportunityFromRow),
      page: input.page,
      pageSize: input.pageSize,
      total: numberValue(rows[0]?.total),
    };
  }

  public async opportunity(municipalityId: string, service: string): Promise<OpportunityDetail | null> {
    const result = await this.opportunities({ municipalityId, service, page: 1, pageSize: 1 });
    const row = result.items[0];
    if (row === undefined) return null;
    const demand = Math.min(row.monthlySearches / 20, 35);
    const gap = Math.min(Math.max(row.monthlySearches - row.sql * 3, 0) / 30, 25);
    const capacity = Math.min(row.caregiversAvailable / 2, 20) - (row.caregiversAvailable < 8 ? 20 : 0);
    const voice = Math.min(row.voiceSignals / 10, 10);
    const conversion = row.sql === 0 ? 5 : (1 - row.sqlToAlta) * 10;
    const factor = (key: string, label: string, normalizedValue: number, weight: number, contribution: number, evidence: string): OpportunityFactor => ({
      key, label, normalizedValue: round(normalizedValue), weight, contribution: round(contribution, 2), evidence,
    });
    const factors: OpportunityFactor[] = [
      factor("demand", "Demanda de búsqueda", Math.min(row.monthlySearches / 700, 1), 0.35, demand, `${row.monthlySearches} búsquedas mensuales observadas de media`),
      factor("capture_gap", "Brecha entre demanda y SQL", Math.min(gap / 25, 1), 0.25, gap, `${row.sql} SQL frente a la demanda observada`),
      factor("capacity", "Capacidad operativa", Math.min(row.caregiversAvailable / 40, 1), 0.2, capacity, `${row.caregiversAvailable} cuidadoras disponibles en 30 días`),
      factor("voice", "Señales de necesidad", Math.min(row.voiceSignals / 100, 1), 0.1, voice, `${row.voiceSignals} llamadas sintéticas de voz de cliente`),
      factor("conversion", "Oportunidad de conversión", 1 - row.sqlToAlta, 0.1, conversion, `${round(row.sqlToAlta * 100, 1)} % de conversión SQL a alta`),
    ];
    const constraints = row.selectionReasons;
    return {
      ...row,
      factors,
      constraints,
      proposedAction: row.selectionEligibility === "eligible"
        ? `Validar una iniciativa local de ${serviceLabel(row.service)} con presupuesto limitado.`
        : "Resolver las restricciones de datos, cobertura o capacidad antes de incluir el municipio en la prueba.",
      validationMetric: "SQL familiares elegibles por municipio-semana",
      rulesVersion: LANDING_SELECTION_RULES_VERSION,
      disclaimer: "Esta puntuación basada en reglas ordena dónde validar; no es una predicción.",
    };
  }

  public async journeys(input: PageRequest): Promise<Paginated<JourneySummary>> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    if (input.from !== undefined) clauses.push(`co.created_at >= ${builder.add(input.from)}::date`);
    if (input.to !== undefined) clauses.push(`co.created_at < (${builder.add(input.to)}::date + interval '1 day')`);
    if (input.province !== undefined) clauses.push(`m.provincia = ${builder.add(input.province)}`);
    if (input.municipalityId !== undefined) clauses.push(`co.municipio_id = ${builder.add(input.municipalityId)}`);
    if (input.service !== undefined) clauses.push(`co.servicio = ${builder.add(input.service)}`);
    if (input.search !== undefined) {
      const search = builder.add(`%${input.search}%`);
      clauses.push(`(co.opportunity_id ILIKE ${search} OR co.person_id ILIKE ${search} OR m.nombre ILIKE ${search}
        OR EXISTS (SELECT 1 FROM identity_map search_identity WHERE search_identity.person_id = co.person_id AND search_identity.source_identifier ILIKE ${search}))`);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = builder.add(input.pageSize);
    const offset = builder.add((input.page - 1) * input.pageSize);
    const rows = await this.query(
      `WITH selected AS (
         SELECT co.opportunity_id, co.person_id, m.nombre AS municipality, co.servicio AS service,
                co.status, co.created_at, COUNT(*) OVER()::int AS total
         FROM care_opportunity co JOIN motor_municipio m ON m.municipio_id = co.municipio_id
         ${where}
         ORDER BY co.created_at DESC, co.opportunity_id
         LIMIT ${limit} OFFSET ${offset}
       )
       SELECT selected.opportunity_id, selected.person_id, selected.municipality, selected.service,
              selected.status, selected.created_at,
              GREATEST(COALESCE(identity_summary.identity_count, 0) - 1, 0)::int AS linked_identity_count,
              CASE WHEN COALESCE(identity_summary.identity_count, 0) = 0 THEN 'unlinked'
                   WHEN identity_summary.has_ambiguous THEN 'ambiguous'
                   ELSE 'confirmed' END AS identity_status,
              crm_identity.source_system AS crm_source_system,
              crm_identity.source_identifier AS crm_source_identifier,
              crm_identity.match_method AS crm_match_method,
              journey.route,
              selected.total
       FROM selected
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS identity_count, BOOL_OR(im.ambiguous) AS has_ambiguous
         FROM identity_map im WHERE im.person_id = selected.person_id
       ) identity_summary ON TRUE
       LEFT JOIN LATERAL (
         SELECT im.source_system, im.source_identifier, im.match_method
         FROM identity_map im WHERE im.person_id = selected.person_id
         ORDER BY CASE WHEN im.source_system = 'hubspot' THEN 0 ELSE 1 END, im.created_at, im.identity_id
         LIMIT 1
       ) crm_identity ON TRUE
       LEFT JOIN LATERAL (
         SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'eventType', je.event_type,
           'occurredAt', je.occurred_at,
           'sourceSystem', je.source_system,
           'channel', je.channel,
           'observed', NOT COALESCE((je.metadata->>'inferred')::boolean, false)
         ) ORDER BY je.occurred_at, je.event_id), '[]'::jsonb) AS route
         FROM journey_event je WHERE je.opportunity_id = selected.opportunity_id
       ) journey ON TRUE
       ORDER BY selected.created_at DESC, selected.opportunity_id`,
      builder.values,
    );
    return {
      items: rows.map((row) => {
        const crmSourceSystem = nullableString(row.crm_source_system);
        const crmSourceIdentifier = nullableString(row.crm_source_identifier);
        return {
          opportunityId: stringValue(row.opportunity_id),
          personId: stringValue(row.person_id),
          municipality: stringValue(row.municipality),
          service: stringValue(row.service),
          status: stringValue(row.status),
          createdAt: isoValue(row.created_at),
          linkedIdentityCount: numberValue(row.linked_identity_count),
          identityStatus: identityStatus(row.identity_status),
          route: journeyRoute(row.route),
          crmProfile: crmSourceSystem !== null && crmSourceIdentifier !== null ? {
            sourceSystem: crmSourceSystem,
            contactRef: pseudonymousContactRef(crmSourceSystem, crmSourceIdentifier),
            matchMethod: stringValue(row.crm_match_method),
          } : null,
        };
      }),
      page: input.page,
      pageSize: input.pageSize,
      total: numberValue(rows[0]?.total),
    };
  }

  public async journey(opportunityId: string): Promise<JourneyDetail | null> {
    const summaries = await this.journeys({ page: 1, pageSize: 1, search: opportunityId });
    const summary = summaries.items.find((item) => item.opportunityId === opportunityId);
    if (summary === undefined) return null;
    const [eventRows, identityRows] = await Promise.all([
      this.query(
        `SELECT je.event_id, je.event_type, je.occurred_at, je.channel, je.campaign, je.landing_url,
                je.source_system, je.metadata,
                CASE WHEN je.person_id IS NULL THEN 'unlinked'
                     WHEN EXISTS (SELECT 1 FROM identity_map im WHERE im.person_id = je.person_id AND im.ambiguous) THEN 'ambiguous'
                     WHEN EXISTS (SELECT 1 FROM identity_map im WHERE im.person_id = je.person_id) THEN 'confirmed'
                     ELSE 'unlinked' END AS identity_status
         FROM journey_event je WHERE je.opportunity_id = $1 ORDER BY je.occurred_at, je.event_id`,
        [opportunityId],
      ),
      this.query(
        `SELECT source_system, source_identifier, match_method, ambiguous
         FROM identity_map WHERE person_id = $1 ORDER BY source_system, identity_id`,
        [summary.personId],
      ),
    ]);
    const events = eventRows.map((row) => {
      const metadata = jsonRecord(row.metadata);
      return {
        eventId: stringValue(row.event_id),
        eventType: stringValue(row.event_type),
        occurredAt: isoValue(row.occurred_at),
        channel: nullableString(row.channel),
        campaign: nullableString(row.campaign),
        landingUrl: nullableString(row.landing_url),
        sourceSystem: stringValue(row.source_system),
        observed: metadata.inferred !== true,
        identityStatus: identityStatus(row.identity_status),
        metadata,
      };
    });
    const attributableEventTypes = new Set(["ad_click", "landing_view", "page_view", "form_submit", "phone_call"]);
    const touchEvents = events.filter((event) => event.channel !== null && attributableEventTypes.has(event.eventType));
    const touches = new Map<string, number>();
    for (const event of touchEvents) {
      if (event.channel !== null) touches.set(event.channel, (touches.get(event.channel) ?? 0) + 1);
    }
    return {
      ...summary,
      events,
      identities: identityRows.map((row) => ({
        sourceSystem: stringValue(row.source_system),
        pseudonym: pseudonymousContactRef(stringValue(row.source_system), stringValue(row.source_identifier)),
        method: stringValue(row.match_method),
        ambiguous: booleanValue(row.ambiguous),
      })),
      attribution: {
        firstTouch: touchEvents[0]?.channel ?? null,
        lastTouch: touchEvents.at(-1)?.channel ?? null,
        multiTouch: [...touches.entries()].map(([channel, count]) => ({ channel, touches: count })),
      },
      warning: "First-touch, last-touch and multi-touch are descriptive attribution views; they do not demonstrate causality.",
    };
  }

  public async funnels(filters: Filters): Promise<FunnelsResponse> {
    const dimensions: Array<[string, string]> = [
      ["l.canal", "channel"], ["l.servicio", "service"], ["COALESCE(m.nombre, 'Sin municipio')", "municipality"],
    ];
    const results = await Promise.all(dimensions.map(([expression]) => this.funnelDimension(filters, expression)));
    const cohortBuilder = new SqlBuilder();
    const cohortWhere = leadWhere(filters, cohortBuilder);
    const cohorts = await this.query(
      `SELECT to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM') AS name,
              COUNT(*)::int AS leads, COUNT(*) FILTER (WHERE l.es_sql)::int AS sql_count,
              COUNT(*) FILTER (WHERE l.es_alta)::int AS alta_count,
              AVG(EXTRACT(EPOCH FROM (l.fecha_sql - l.fecha_creacion)) / 86400.0) FILTER (WHERE l.fecha_sql IS NOT NULL)::double precision AS days_to_sql,
              AVG(EXTRACT(EPOCH FROM (l.fecha_alta - l.fecha_creacion)) / 86400.0) FILTER (WHERE l.fecha_alta IS NOT NULL)::double precision AS days_to_alta,
              (date_trunc('month', l.fecha_creacion) < date_trunc('month', CURRENT_DATE - interval '90 days')) AS mature
       FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id WHERE ${cohortWhere}
       GROUP BY 1, date_trunc('month', l.fecha_creacion) ORDER BY 1`,
      cohortBuilder.values,
    );
    const discardBuilder = new SqlBuilder();
    const discardWhere = leadWhere(filters, discardBuilder);
    const discards = await this.query(
      `SELECT COALESCE(l.motivo_descarte, 'sin_especificar') AS name, COUNT(*)::int AS value
       FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
       WHERE ${discardWhere} AND NOT l.es_alta GROUP BY 1 ORDER BY value DESC`,
      discardBuilder.values,
    );
    return {
      byChannel: results[0] ?? [],
      byService: results[1] ?? [],
      byMunicipality: results[2] ?? [],
      byCohort: cohorts.map(funnelFromRow),
      discardReasons: discards.map((row) => ({ name: stringValue(row.name), value: numberValue(row.value) })),
      maturityWindowDays: 90,
      caveats: ["Immature cohorts are flagged and should not be compared directly with complete cohorts."],
    };
  }

  private async funnelDimension(filters: Filters, expression: string): Promise<FunnelBreakdown[]> {
    const builder = new SqlBuilder();
    const where = leadWhere(filters, builder);
    const rows = await this.query(
      `SELECT ${expression} AS name, COUNT(*)::int AS leads,
              COUNT(*) FILTER (WHERE l.es_sql)::int AS sql_count,
              COUNT(*) FILTER (WHERE l.es_alta)::int AS alta_count,
              AVG(EXTRACT(EPOCH FROM (l.fecha_sql - l.fecha_creacion)) / 86400.0) FILTER (WHERE l.fecha_sql IS NOT NULL)::double precision AS days_to_sql,
              AVG(EXTRACT(EPOCH FROM (l.fecha_alta - l.fecha_creacion)) / 86400.0) FILTER (WHERE l.fecha_alta IS NOT NULL)::double precision AS days_to_alta
       FROM lead l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
       WHERE ${where} GROUP BY 1 ORDER BY leads DESC`,
      builder.values,
    );
    return rows.map(funnelFromRow);
  }

  public async landings(input: PageRequest): Promise<Paginated<LandingRecord>> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    const webClauses: string[] = [];
    const gscClauses: string[] = [];
    const leadClauses = ["tipo_contacto <> 'cuidadora_empleo'"];
    if (input.from !== undefined) {
      clauses.push(`l.fecha_publicacion >= ${builder.add(input.from)}::date`);
      webClauses.push(`fecha >= ${builder.add(input.from)}::date`);
      gscClauses.push(`fecha >= ${builder.add(input.from)}::date`);
      leadClauses.push(`fecha_creacion >= ${builder.add(input.from)}::date`);
    }
    if (input.to !== undefined) {
      clauses.push(`l.fecha_publicacion < (${builder.add(input.to)}::date + interval '1 day')`);
      webClauses.push(`fecha <= ${builder.add(input.to)}::date`);
      gscClauses.push(`fecha <= ${builder.add(input.to)}::date`);
      leadClauses.push(`fecha_creacion < (${builder.add(input.to)}::date + interval '1 day')`);
    }
    if (input.province !== undefined) clauses.push(`m.provincia = ${builder.add(input.province)}`);
    if (input.municipalityId !== undefined) clauses.push(`l.municipio_id = ${builder.add(input.municipalityId)}`);
    if (input.service !== undefined) clauses.push(`lw.service = ${builder.add(input.service)}`);
    if (input.language !== undefined) clauses.push(`l.idioma = ${builder.add(input.language)}`);
    if (input.channel !== undefined) webClauses.push(`canal = ${builder.add(input.channel)}`);
    if (input.search !== undefined) {
      const search = builder.add(`%${input.search}%`);
      clauses.push(`(l.url ILIKE ${search} OR m.nombre ILIKE ${search})`);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = builder.add(input.pageSize);
    const offset = builder.add((input.page - 1) * input.pageSize);
    const rows = await this.query(
      `WITH web AS (
         SELECT url_entrada, SUM(sesiones)::int AS sessions, SUM(formularios)::int AS forms
         FROM web_sesiones_diarias ${webClauses.length > 0 ? `WHERE ${webClauses.join(" AND ")}` : ""} GROUP BY url_entrada
       ), search AS (
         SELECT url, SUM(impresiones)::int AS impressions, SUM(clics)::int AS clicks
         FROM gsc_diario ${gscClauses.length > 0 ? `WHERE ${gscClauses.join(" AND ")}` : ""} GROUP BY url
       ), lead_stats AS (
         SELECT url_entrada, COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
                COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
         FROM lead WHERE ${leadClauses.join(" AND ")} GROUP BY url_entrada
       )
       SELECT l.url, l.municipio_id, m.nombre AS municipality, l.idioma AS language, l.origen AS origin,
              lw.service, COALESCE(lw.status::text, CASE WHEN l.fecha_publicacion IS NULL THEN 'draft' ELSE 'published' END) AS status,
              l.fecha_publicacion AS published_at, l.fecha_primera_indexacion AS indexed_at,
              COALESCE(web.sessions, 0)::int AS sessions, COALESCE(web.forms, 0)::int AS forms,
              COALESCE(lead_stats.sql_count, 0)::int AS sql_count,
              COALESCE(lead_stats.alta_count, 0)::int AS alta_count,
              COALESCE(search.impressions, 0)::int AS impressions, COALESCE(search.clicks, 0)::int AS clicks,
              lw.content, lw.validation_issues, COUNT(*) OVER()::int AS total
       FROM landing l LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
       LEFT JOIN landing_workflow lw ON lw.url = l.url
       LEFT JOIN web ON web.url_entrada = l.url
       LEFT JOIN search ON search.url = l.url
       LEFT JOIN lead_stats ON lead_stats.url_entrada = l.url
       ${where}
       ORDER BY COALESCE(l.fecha_publicacion, lw.updated_at) DESC NULLS LAST, l.url
       LIMIT ${limit} OFFSET ${offset}`,
      builder.values,
    );
    return {
      items: rows.map((row) => this.landingFromRow(row)),
      page: input.page,
      pageSize: input.pageSize,
      total: numberValue(rows[0]?.total),
    };
  }

  private landingFromRow(row: Record<string, unknown>): LandingRecord {
    const language = stringValue(row.language) === "ca" ? "ca" : "es";
    const origin = stringValue(row.origin) === "generada" ? "generada" : "manual";
    const rawStatus = stringValue(row.status, "draft");
    const validStatuses: LandingRecord["status"][] = ["draft", "pending_review", "approved", "published", "rejected"];
    const status = validStatuses.includes(rawStatus as LandingRecord["status"])
      ? (rawStatus as LandingRecord["status"])
      : "draft";
    const contentRaw = jsonRecord(row.content);
    const blocksRaw = Array.isArray(contentRaw.blocks) ? contentRaw.blocks : [];
    const content: LandingContent | undefined = Object.keys(contentRaw).length === 0 ? undefined : {
      title: stringValue(contentRaw.title),
      description: stringValue(contentRaw.description),
      blocks: blocksRaw.map((block) => {
        const item = jsonRecord(block);
        return {
          type: stringValue(item.type),
          heading: stringValue(item.heading),
          body: stringValue(item.body),
        };
      }),
      generatedFrom: {
        municipalityId: stringValue(jsonRecord(contentRaw.generatedFrom).municipalityId),
        service: stringValue(jsonRecord(contentRaw.generatedFrom).service),
        language,
      },
    };
    return {
      url: stringValue(row.url), municipalityId: nullableString(row.municipio_id), municipality: nullableString(row.municipality),
      language, origin, service: nullableString(row.service), status,
      publishedAt: nullableIso(row.published_at), indexedAt: nullableIso(row.indexed_at),
      sessions: numberValue(row.sessions), forms: numberValue(row.forms), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      impressions: numberValue(row.impressions), clicks: numberValue(row.clicks),
      ...(content === undefined ? {} : { content }),
      validationIssues: stringArray(row.validation_issues),
    };
  }

  private landingInsightFromRow(row: Record<string, unknown>): LandingInsightSummary {
    const landing = this.landingFromRow(row);
    const leads = numberValue(row.lead_count);
    const sessions = landing.sessions;
    const sql = landing.sql;
    const benchmarkSessionToLead = round(rate(numberValue(row.benchmark_leads), numberValue(row.benchmark_sessions)), 4);
    const benchmarkLeadToSql = round(rate(numberValue(row.benchmark_sql), numberValue(row.benchmark_leads)), 4);
    const benchmarkSqlToAlta = round(rate(numberValue(row.benchmark_altas), numberValue(row.benchmark_sql)), 4);
    const coverage = booleanValue(row.coverage);
    const caregiversAvailable = numberValue(row.caregivers_available);
    const sessionToLead = round(rate(leads, sessions), 4);
    const leadToSql = round(rate(sql, leads), 4);
    const sqlToAlta = round(rate(landing.altas, sql), 4);
    const averagePosition = row.average_position === null || row.average_position === undefined ? null : round(numberValue(row.average_position), 1);
    return {
      ...landing,
      leads,
      phoneClicks: numberValue(row.phone_clicks),
      averagePosition,
      rates: {
        sessionToLead,
        leadToSql,
        sqlToAlta,
        organicCtr: round(rate(landing.clicks, landing.impressions), 4),
      },
      benchmark: { sessionToLead: benchmarkSessionToLead, leadToSql: benchmarkLeadToSql, sqlToAlta: benchmarkSqlToAlta },
      operations: { coverage, caregiversAvailable, eligible: coverage && caregiversAvailable >= 8 },
      opportunityScore: row.opportunity_score === null || row.opportunity_score === undefined ? null : round(numberValue(row.opportunity_score), 1),
      diagnosis: diagnoseLanding({
        status: landing.status,
        sessions,
        leads,
        sessionToLead,
        leadToSql,
        sqlToAlta,
        benchmarkSessionToLead,
        benchmarkLeadToSql,
        benchmarkSqlToAlta,
        coverage,
        caregiversAvailable,
      }),
      evaluation: evaluateLanding({
        indexedAt: landing.indexedAt,
        clicks: landing.clicks,
        averagePosition,
        sessionToLead,
        leadToSql,
        sqlToAlta,
        benchmarkSessionToLead,
        benchmarkLeadToSql,
        benchmarkSqlToAlta,
        coverage,
        caregiversAvailable,
      }),
    };
  }

  public async landingInsights(input: PageRequest): Promise<LandingPortfolio> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    const webClauses: string[] = [];
    const leadClauses = ["tipo_contacto <> 'cuidadora_empleo'"];
    const gscClauses: string[] = [];
    if (input.from !== undefined) {
      webClauses.push(`fecha >= ${builder.add(input.from)}::date`);
      leadClauses.push(`fecha_creacion >= ${builder.add(input.from)}::date`);
      gscClauses.push(`fecha >= ${builder.add(input.from)}::date`);
    }
    if (input.to !== undefined) {
      webClauses.push(`fecha <= ${builder.add(input.to)}::date`);
      leadClauses.push(`fecha_creacion < (${builder.add(input.to)}::date + interval '1 day')`);
      gscClauses.push(`fecha <= ${builder.add(input.to)}::date`);
    }
    if (input.channel !== undefined) {
      webClauses.push(`canal = ${builder.add(input.channel)}`);
      leadClauses.push(`canal = ${builder.add(input.channel)}`);
    }
    if (input.province !== undefined) clauses.push(`m.provincia = ${builder.add(input.province)}`);
    if (input.municipalityId !== undefined) clauses.push(`l.municipio_id = ${builder.add(input.municipalityId)}`);
    if (input.language !== undefined) clauses.push(`l.idioma = ${builder.add(input.language)}`);
    if (input.service !== undefined) clauses.push(`COALESCE(lw.service, lead_service.service) = ${builder.add(input.service)}`);
    if (input.search !== undefined) {
      const search = builder.add(`%${input.search}%`);
      clauses.push(`(l.url ILIKE ${search} OR m.nombre ILIKE ${search} OR COALESCE(lw.service, lead_service.service) ILIKE ${search})`);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = builder.add(input.pageSize);
    const offset = builder.add((input.page - 1) * input.pageSize);
    const rows = await this.query(
      `WITH web AS (
         SELECT url_entrada, SUM(sesiones)::int AS sessions, SUM(formularios)::int AS forms,
                SUM(clics_llamar)::int AS phone_clicks
         FROM web_sesiones_diarias ${webClauses.length > 0 ? `WHERE ${webClauses.join(" AND ")}` : ""}
         GROUP BY url_entrada
       ), lead_stats AS (
         SELECT url_entrada, COUNT(*)::int AS lead_count,
                COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
                COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
         FROM lead WHERE ${leadClauses.join(" AND ")} GROUP BY url_entrada
       ), lead_service AS (
         SELECT url_entrada, servicio AS service FROM (
           SELECT url_entrada, servicio, ROW_NUMBER() OVER (PARTITION BY url_entrada ORDER BY COUNT(*) DESC, servicio) AS rank
           FROM lead WHERE tipo_contacto <> 'cuidadora_empleo' AND url_entrada IS NOT NULL
           GROUP BY url_entrada, servicio
         ) ranked WHERE rank = 1
       ), search AS (
         SELECT url, SUM(impresiones)::int AS impressions, SUM(clics)::int AS clicks,
                (SUM(posicion_media * impresiones) / NULLIF(SUM(impresiones), 0))::double precision AS average_position
         FROM gsc_diario ${gscClauses.length > 0 ? `WHERE ${gscClauses.join(" AND ")}` : ""} GROUP BY url
       )
       SELECT l.url, l.municipio_id, m.nombre AS municipality, l.idioma AS language, l.origen AS origin,
              COALESCE(lw.service, lead_service.service) AS service,
              COALESCE(lw.status::text, CASE WHEN l.fecha_publicacion IS NULL THEN 'draft' ELSE 'published' END) AS status,
              l.fecha_publicacion AS published_at, l.fecha_primera_indexacion AS indexed_at,
              COALESCE(web.sessions, 0)::int AS sessions, COALESCE(web.forms, 0)::int AS forms,
              COALESCE(web.phone_clicks, 0)::int AS phone_clicks,
              COALESCE(lead_stats.lead_count, 0)::int AS lead_count,
              COALESCE(lead_stats.sql_count, 0)::int AS sql_count,
              COALESCE(lead_stats.alta_count, 0)::int AS alta_count,
              COALESCE(search.impressions, 0)::int AS impressions, COALESCE(search.clicks, 0)::int AS clicks,
              search.average_position, m.tiene_cobertura AS coverage,
              COALESCE(m.cuidadoras_disponibles_30d, 0)::int AS caregivers_available,
              recommendation.score AS opportunity_score, lw.content, lw.validation_issues,
              COUNT(*) OVER()::int AS total,
              COUNT(*) FILTER (WHERE l.fecha_publicacion IS NOT NULL) OVER()::int AS total_published,
              SUM(COALESCE(web.sessions, 0)) OVER()::int AS total_sessions,
              SUM(COALESCE(lead_stats.lead_count, 0)) OVER()::int AS total_leads,
              SUM(COALESCE(lead_stats.sql_count, 0)) OVER()::int AS total_sql,
              SUM(COALESCE(lead_stats.alta_count, 0)) OVER()::int AS total_altas,
              SUM(COALESCE(web.sessions, 0)) OVER()::int AS benchmark_sessions,
              SUM(COALESCE(lead_stats.lead_count, 0)) OVER()::int AS benchmark_leads,
              SUM(COALESCE(lead_stats.sql_count, 0)) OVER()::int AS benchmark_sql,
              SUM(COALESCE(lead_stats.alta_count, 0)) OVER()::int AS benchmark_altas
       FROM landing l
       LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
       LEFT JOIN landing_workflow lw ON lw.url = l.url
       LEFT JOIN web ON web.url_entrada = l.url
       LEFT JOIN lead_stats ON lead_stats.url_entrada = l.url
       LEFT JOIN lead_service ON lead_service.url_entrada = l.url
       LEFT JOIN search ON search.url = l.url
       LEFT JOIN LATERAL (
         SELECT gr.score FROM growth_recommendation gr
         WHERE gr.municipio_id = l.municipio_id AND gr.servicio = COALESCE(lw.service, lead_service.service)
         ORDER BY gr.created_at DESC LIMIT 1
       ) recommendation ON true
       ${where}
       ORDER BY COALESCE(lead_stats.sql_count, 0) DESC, COALESCE(web.sessions, 0) DESC, l.url
       LIMIT ${limit} OFFSET ${offset}`,
      builder.values,
    );
    const first = rows[0];
    return {
      items: rows.map((row) => this.landingInsightFromRow(row)),
      page: input.page,
      pageSize: input.pageSize,
      total: numberValue(first?.total),
      totals: {
        landings: numberValue(first?.total),
        published: numberValue(first?.total_published),
        sessions: numberValue(first?.total_sessions),
        leads: numberValue(first?.total_leads),
        sql: numberValue(first?.total_sql),
        altas: numberValue(first?.total_altas),
      },
    };
  }

  public async landingInsight(url: string, filters: Filters): Promise<LandingInsightDetail | null> {
    const [selectedPortfolio, benchmarkPortfolio] = await Promise.all([
      this.landingInsights({ ...filters, page: 1, pageSize: 10, search: url }),
      this.landingInsights({ ...filters, page: 1, pageSize: 1 }),
    ]);
    const selectedSummary = selectedPortfolio.items.find((item) => item.url === url);
    if (selectedSummary === undefined) return null;
    const benchmark = benchmarkPortfolio.items[0]?.benchmark ?? selectedSummary.benchmark;
    const summary: LandingInsightSummary = {
      ...selectedSummary,
      benchmark,
      diagnosis: diagnoseLanding({
        status: selectedSummary.status,
        sessions: selectedSummary.sessions,
        leads: selectedSummary.leads,
        sessionToLead: selectedSummary.rates.sessionToLead,
        leadToSql: selectedSummary.rates.leadToSql,
        sqlToAlta: selectedSummary.rates.sqlToAlta,
        benchmarkSessionToLead: benchmark.sessionToLead,
        benchmarkLeadToSql: benchmark.leadToSql,
        benchmarkSqlToAlta: benchmark.sqlToAlta,
        coverage: selectedSummary.operations.coverage,
        caregiversAvailable: selectedSummary.operations.caregiversAvailable,
      }),
      evaluation: evaluateLanding({
        indexedAt: selectedSummary.indexedAt,
        clicks: selectedSummary.clicks,
        averagePosition: selectedSummary.averagePosition,
        sessionToLead: selectedSummary.rates.sessionToLead,
        leadToSql: selectedSummary.rates.leadToSql,
        sqlToAlta: selectedSummary.rates.sqlToAlta,
        benchmarkSessionToLead: benchmark.sessionToLead,
        benchmarkLeadToSql: benchmark.leadToSql,
        benchmarkSqlToAlta: benchmark.sqlToAlta,
        coverage: selectedSummary.operations.coverage,
        caregiversAvailable: selectedSummary.operations.caregiversAvailable,
      }),
    };
    const builder = new SqlBuilder();
    const webClauses = [`url_entrada = ${builder.add(url)}`];
    const leadClauses = [`url_entrada = ${builder.add(url)}`, "tipo_contacto <> 'cuidadora_empleo'"];
    const gscClauses = [`url = ${builder.add(url)}`];
    if (filters.from !== undefined) {
      webClauses.push(`fecha >= ${builder.add(filters.from)}::date`);
      leadClauses.push(`fecha_creacion >= ${builder.add(filters.from)}::date`);
      gscClauses.push(`fecha >= ${builder.add(filters.from)}::date`);
    }
    if (filters.to !== undefined) {
      webClauses.push(`fecha <= ${builder.add(filters.to)}::date`);
      leadClauses.push(`fecha_creacion < (${builder.add(filters.to)}::date + interval '1 day')`);
      gscClauses.push(`fecha <= ${builder.add(filters.to)}::date`);
    }
    if (filters.channel !== undefined) {
      webClauses.push(`canal = ${builder.add(filters.channel)}`);
      leadClauses.push(`canal = ${builder.add(filters.channel)}`);
    }
    const [monthlyRows, experimentPage, decisionRows] = await Promise.all([
      this.query(
        `WITH web AS (
           SELECT TO_CHAR(fecha, 'YYYY-MM') AS period, SUM(sesiones)::int AS sessions,
                  SUM(formularios)::int AS forms, SUM(clics_llamar)::int AS phone_clicks
           FROM web_sesiones_diarias WHERE ${webClauses.join(" AND ")} GROUP BY 1
         ), leads AS (
           SELECT TO_CHAR(fecha_creacion, 'YYYY-MM') AS period, COUNT(*)::int AS leads,
                  COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
                  COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
           FROM lead WHERE ${leadClauses.join(" AND ")} GROUP BY 1
         ), search AS (
           SELECT TO_CHAR(fecha, 'YYYY-MM') AS period, SUM(impresiones)::int AS impressions, SUM(clics)::int AS clicks
           FROM gsc_diario WHERE ${gscClauses.join(" AND ")} GROUP BY 1
         ), periods AS (
           SELECT period FROM web UNION SELECT period FROM leads UNION SELECT period FROM search
         )
         SELECT periods.period, COALESCE(web.sessions, 0)::int AS sessions, COALESCE(web.forms, 0)::int AS forms,
                COALESCE(web.phone_clicks, 0)::int AS phone_clicks, COALESCE(leads.leads, 0)::int AS leads,
                COALESCE(leads.sql_count, 0)::int AS sql_count, COALESCE(leads.alta_count, 0)::int AS alta_count
         FROM periods LEFT JOIN web USING (period) LEFT JOIN leads USING (period) LEFT JOIN search USING (period)
         ORDER BY periods.period`,
        builder.values,
      ),
      summary.municipalityId === null
        ? Promise.resolve({ items: [], page: 1, pageSize: 10, total: 0 })
        : this.experiments({ page: 1, pageSize: 10, municipalityId: summary.municipalityId }),
      this.query(
        `SELECT audit_id, actor_role, metadata, created_at,
                ROW_NUMBER() OVER (ORDER BY COALESCE((metadata->>'version')::int,0), created_at, audit_id)::int AS version
         FROM audit_log WHERE entity_type = 'landing' AND entity_id = $1
           AND action = 'landing.decision_recorded' ORDER BY version DESC`,
        [url],
      ),
    ]);
    const decisions: LandingDecisionRecord[] = decisionRows.map((row) => {
      const metadata = jsonRecord(row.metadata);
      const rawDecision = stringValue(metadata.decision);
      const rawPrimaryMetric = stringValue(metadata.primaryMetric);
      const rawGuardrailMetric = stringValue(metadata.guardrailMetric);
      return {
        id: stringValue(row.audit_id),
        version: numberValue(row.version),
        actorRole: stringValue(row.actor_role),
        createdAt: isoValue(row.created_at),
        decision: rawDecision === "stop" || rawDecision === "iterate" ? rawDecision : "keep",
        ...decisionEvidence(metadata),
        hypothesis: stringValue(metadata.hypothesis),
        primaryMetric: rawPrimaryMetric === "sql_per_municipality_week" || rawPrimaryMetric === "lead_to_sql" || rawPrimaryMetric === "sql_to_alta" ? rawPrimaryMetric : "session_to_lead",
        guardrailMetric: rawGuardrailMetric === "sql_to_alta" || rawGuardrailMetric === "caregiver_capacity" ? rawGuardrailMetric : "lead_to_sql",
        ...(nullableString(metadata.note) === null ? {} : { note: stringValue(metadata.note) }),
      };
    });
    return {
      ...summary,
      monthly: monthlyRows.map((row) => {
        const sessions = numberValue(row.sessions);
        const leads = numberValue(row.leads);
        const sql = numberValue(row.sql_count);
        return {
          period: stringValue(row.period), sessions, forms: numberValue(row.forms), phoneClicks: numberValue(row.phone_clicks),
          leads, sql, altas: numberValue(row.alta_count), sessionToLead: round(rate(leads, sessions), 4), leadToSql: round(rate(sql, leads), 4),
        };
      }),
      experiments: experimentPage.items,
      decisions,
      caveats: [
        "Los leads, SQL y altas se atribuyen por URL de entrada observada; esta unión no demuestra causalidad.",
        "Las comparaciones usan el portfolio filtrado como benchmark y no sustituyen un grupo de control.",
        "Los experimentos municipales se muestran como contexto; su efecto solo es cuasi experimental cuando se exponen sus diagnósticos.",
      ],
    };
  }

  public async recordLandingDecision(url: string, input: LandingDecisionRequest, role: string, requestId: string): Promise<LandingDecisionRecord> {
    const landing = await this.query("SELECT municipio_id FROM landing WHERE url=$1", [url]);
    if (!landing.length) throw new AppError(404, "LANDING_NOT_FOUND", "Landing desconocida.");
    if (input.change?.experimentId) {
      const matched = await this.query(`SELECT 1 FROM experiment_assignment a JOIN growth_experiment e USING (experiment_id)
        WHERE a.experiment_id=$1 AND a.municipio_id=$2 AND a.variant='treatment' AND e.start_date > CURRENT_DATE`,
        [input.change.experimentId, nullableString(landing[0]?.municipio_id)]);
      if (!matched.length) throw new AppError(422, "INVALID_ASSIGNMENT", "Se requiere asignación previa a un tratamiento futuro.");
    }
    let resultSnapshot: SqlResult | undefined;
    if (input.evidenceDecisionId) {
      const [source] = await this.query(`SELECT metadata FROM audit_log WHERE audit_id=$1 AND entity_id=$2
        AND action='landing.decision_recorded' AND entity_type='landing'`, [input.evidenceDecisionId,url]);
      if (!source) throw new AppError(422, "INVALID_EVIDENCE", "La decisión de referencia no pertenece a la landing.");
      const experiment = decisionEvidence(jsonRecord(source.metadata)).change?.experimentId;
      if (experiment) resultSnapshot = await this.experimentSqlResult(experiment);
    }
    const metadata = { ...input, ...(resultSnapshot ? { resultSnapshot } : {}) };
    return this.db.$transaction(async tx => {
      // Serialize decisions on this landing so the returned version matches its audit history.
      await tx.$queryRawUnsafe("SELECT url FROM landing WHERE url=$1 FOR UPDATE", url);
      const [row] = records(await tx.$queryRawUnsafe(`INSERT INTO audit_log
        (audit_id,action,entity_type,entity_id,actor_role,request_id,metadata,created_at)
        SELECT $1,'landing.decision_recorded','landing',$2,$3,$4,$5::jsonb || jsonb_build_object('version',COUNT(*)+1),clock_timestamp()
        FROM audit_log WHERE entity_id=$2 AND action='landing.decision_recorded'
        RETURNING audit_id, created_at,(metadata->>'version')::int AS version`,randomUUID(),url,role,requestId,JSON.stringify(metadata)));
      return { ...metadata, id: stringValue(row?.audit_id), version: numberValue(row?.version), actorRole: role, createdAt: isoValue(row?.created_at) };
    });
  }

  public async experimentSqlResult(id: string): Promise<SqlResult> {
    const [experiment] = await this.query(`SELECT (SELECT to_char(MAX(simulation_date),'YYYY-MM-DD') FROM seed_run) AS cutoff
      FROM growth_experiment WHERE experiment_id=$1`, [id]);
    if (!experiment) throw new AppError(404, "EXPERIMENT_NOT_FOUND", "Experimento desconocido.");
    if (!experiment.cutoff) throw new AppError(422, "MISSING_CUTOFF", "Falta la fecha de corte de la simulación.");
    return sqlReadout(stringValue(experiment.cutoff), await this.query(experimentSql, [id]));
  }

  public async weeklyHistory(date: string): Promise<WeeklyNote[]> {
    const rows = await this.query(`SELECT metadata FROM audit_log WHERE entity_type='weekly' AND entity_id=$1
      AND action='weekly.saved' ORDER BY (metadata->>'revision')::int DESC`, [date]);
    return rows.map(row => weeklyNoteSchema.parse(row.metadata));
  }

  public async saveWeekly(input: WeeklyNote): Promise<WeeklyNote> {
    const note = { ...input, actions: input.actions.map(action => ({ ...action })) };
    const weekly = (await this.planning()).meetings.find(meeting => meeting.id === "weekly");
    if (!weekly?.dates.includes(note.date)) throw new AppError(422, "UNSCHEDULED_WEEKLY", "Fecha fuera del calendario de revisión.");
    const links = note.actions.flatMap(action => action.decisionId ? [action.decisionId] : []);
    const sources = links.length ? await this.query(`SELECT audit_id,entity_id FROM audit_log WHERE
      action='landing.decision_recorded' AND entity_type='landing' AND audit_id IN (SELECT jsonb_array_elements_text($1::jsonb))`,[JSON.stringify(links)]) : [];
    for (const action of note.actions) {
      delete action.decisionUrl;
      if (!action.decisionId) continue;
      const source = sources.find(row => row.audit_id === action.decisionId);
      if (!source) throw new AppError(422, "INVALID_EVIDENCE", "La acción referencia una decisión desconocida.");
      action.decisionUrl = stringValue(source.entity_id);
    }
    const id = `weekly:${note.date}:${note.revision}`;
    const inserted = await this.execute(`INSERT INTO audit_log (audit_id,action,entity_type,entity_id,actor_role,metadata,created_at)
      SELECT $1,'weekly.saved','weekly',$2,'growth_manager',$3::jsonb,CURRENT_TIMESTAMP
      WHERE $4::int = 1 + (SELECT COUNT(*) FROM audit_log WHERE entity_type='weekly' AND entity_id=$2 AND action='weekly.saved')
      ON CONFLICT (audit_id) DO NOTHING`,[id,note.date,JSON.stringify(note),note.revision]);
    if (!inserted) {
      const [same] = await this.query("SELECT 1 FROM audit_log WHERE audit_id=$1 AND metadata=$2::jsonb",[id,JSON.stringify(note)]);
      if (!same) throw new AppError(409, "WEEKLY_REVISION_CONFLICT", "Hay otra revisión guardada. Recarga el acta antes de continuar.");
    }
    return note;
  }

  public async createLandingDraft(input: LandingDraftRequest, requestId: string): Promise<LandingCommandResult> {
    const municipalities = await this.query(
      `SELECT municipio_id, nombre, provincia, tiene_cobertura, servicios_cubiertos,
              cuidadoras_disponibles_30d, datos_propios
       FROM motor_municipio WHERE municipio_id = $1`,
      [input.municipalityId],
    );
    const municipality = municipalities[0];
    if (municipality === undefined) throw new AppError(404, "MUNICIPALITY_NOT_FOUND", "Municipality was not found");
    const name = stringValue(municipality.nombre);
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const serviceSlug = input.service.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const url = `/local/${input.language}/${slug}/${serviceSlug}`;
    const copy = input.language === "ca"
      ? { title: `${input.service} a ${name}`, description: `Informació local sobre ${input.service} i cobertura disponible a ${name}.` }
      : { title: `${input.service} en ${name}`, description: `Información local sobre ${input.service} y cobertura disponible en ${name}.` };
    const content: LandingContent = {
      ...copy,
      blocks: input.blocks.map((block) => this.draftBlock(block, input.language, name, input.service)),
      generatedFrom: { municipalityId: input.municipalityId, service: input.service, language: input.language },
    };
    await this.execute(
      `INSERT INTO landing (url, municipio_id, idioma, origen, fecha_publicacion, fecha_primera_indexacion)
       VALUES ($1, $2, $3::"LandingLanguage", 'generada'::"LandingOrigin", NULL, NULL)
       ON CONFLICT (url) DO UPDATE SET municipio_id = EXCLUDED.municipio_id, idioma = EXCLUDED.idioma`,
      [url, input.municipalityId, input.language],
    );
    await this.execute(
      `INSERT INTO landing_workflow
        (url, service, status, blocks, content, validation_issues, reviewed_at, approved_at, published_at, approved_by, updated_at)
       VALUES ($1, $2, 'draft', $3::jsonb, $4::jsonb, '[]'::jsonb, NULL, NULL, NULL, NULL, CURRENT_TIMESTAMP)
       ON CONFLICT (url) DO UPDATE SET service = EXCLUDED.service, status = 'draft', blocks = EXCLUDED.blocks,
         content = EXCLUDED.content, validation_issues = '[]'::jsonb, reviewed_at = NULL, approved_at = NULL,
         published_at = NULL, approved_by = NULL, updated_at = CURRENT_TIMESTAMP`,
      [url, input.service, JSON.stringify(input.blocks), JSON.stringify(content)],
    );
    const auditId = await this.audit("landing.draft_created", url, "analyst", requestId, { municipalityId: input.municipalityId, service: input.service });
    return { landing: await this.getLandingOrThrow(url), auditId };
  }

  private draftBlock(block: string, language: "es" | "ca", municipality: string, service: string): { type: string; heading: string; body: string } {
    const text: Record<string, { es: [string, string]; ca: [string, string] }> = {
      hero: { es: [`Cuidado en ${municipality}`, `Conoce la disponibilidad de ${service} en tu municipio.`], ca: [`Cures a ${municipality}`, `Consulta la disponibilitat de ${service} al teu municipi.`] },
      coverage: { es: ["Cobertura local", "La disponibilidad se confirma individualmente antes de iniciar el servicio."], ca: ["Cobertura local", "La disponibilitat es confirma individualment abans d'iniciar el servei."] },
      how_it_works: { es: ["Cómo funciona", "Cuéntanos tu necesidad y el equipo valorará la cobertura y los siguientes pasos."], ca: ["Com funciona", "Explica'ns la teva necessitat i l'equip valorarà la cobertura i els següents passos."] },
      faq: { es: ["Preguntas frecuentes", "La propuesta se adapta a cada necesidad de cuidado y a la capacidad local."], ca: ["Preguntes freqüents", "La proposta s'adapta a cada necessitat de cura i a la capacitat local."] },
      contact: { es: ["Habla con el equipo", "Solicita información sin compromiso para validar la disponibilidad."], ca: ["Parla amb l'equip", "Demana informació sense compromís per validar la disponibilitat."] },
    };
    const selected = text[block]?.[language] ?? [block, ""];
    return { type: block, heading: selected[0], body: selected[1] };
  }

  public async reviewLanding(url: string, input: LandingReviewInput, requestId: string): Promise<LandingCommandResult> {
    const workflow = await this.getWorkflow(url);
    if (stringValue(workflow.status) !== "draft" && stringValue(workflow.status) !== "rejected") {
      throw new AppError(409, "INVALID_LANDING_TRANSITION", "Only draft or rejected landings can enter review");
    }
    const issues = await this.validateLanding(url, workflow);
    await this.execute(
      `UPDATE landing_workflow SET status = 'pending_review', validation_issues = $2::jsonb,
       reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE url = $1`,
      [url, JSON.stringify(issues)],
    );
    const auditId = await this.audit("landing.reviewed", url, "reviewer", requestId, { issues, note: input.reviewerNote ?? null });
    return { landing: await this.getLandingOrThrow(url), auditId };
  }

  public async approveLanding(url: string, input: LandingApprovalInput, role: string, requestId: string): Promise<LandingCommandResult> {
    if (!new Set(["growth_manager", "admin"]).has(role)) throw new AppError(403, "ROLE_FORBIDDEN", "Growth manager or admin role is required");
    const workflow = await this.getWorkflow(url);
    if (stringValue(workflow.status) !== "pending_review") {
      throw new AppError(409, "INVALID_LANDING_TRANSITION", "Landing must be pending review before approval");
    }
    const issues = stringArray(workflow.validation_issues);
    if (issues.length > 0) throw new AppError(422, "LANDING_POLICY_FAILED", "Landing has unresolved validation issues", issues);
    await this.execute(
      `UPDATE landing_workflow SET status = 'approved', approved_at = CURRENT_TIMESTAMP,
       approved_by = $2, updated_at = CURRENT_TIMESTAMP WHERE url = $1`,
      [url, input.approver],
    );
    const auditId = await this.audit("landing.approved", url, role, requestId, { approver: input.approver, note: input.note ?? null });
    return { landing: await this.getLandingOrThrow(url), auditId };
  }

  public async publishLanding(url: string, role: string, requestId: string): Promise<LandingCommandResult> {
    if (!new Set(["growth_manager", "admin"]).has(role)) throw new AppError(403, "ROLE_FORBIDDEN", "Growth manager or admin role is required");
    const workflow = await this.getWorkflow(url);
    if (stringValue(workflow.status) !== "approved") {
      throw new AppError(409, "INVALID_LANDING_TRANSITION", "Landing must be approved before simulated publication");
    }
    await this.execute(`UPDATE landing SET fecha_publicacion = CURRENT_TIMESTAMP WHERE url = $1`, [url]);
    await this.execute(
      `UPDATE landing_workflow SET status = 'published', published_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP WHERE url = $1`,
      [url],
    );
    const auditId = await this.audit("landing.published", url, role, requestId, { simulated: true });
    return { landing: await this.getLandingOrThrow(url), auditId };
  }

  private async getWorkflow(url: string): Promise<Record<string, unknown>> {
    const rows = await this.query(
      `SELECT lw.*, l.municipio_id, l.idioma, m.tiene_cobertura, m.servicios_cubiertos,
              m.cuidadoras_disponibles_30d, m.datos_propios
       FROM landing_workflow lw JOIN landing l ON l.url = lw.url
       LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id WHERE lw.url = $1`,
      [url],
    );
    const workflow = rows[0];
    if (workflow === undefined) throw new AppError(404, "LANDING_NOT_FOUND", "Landing was not found");
    return workflow;
  }

  private async validateLanding(url: string, workflow: Record<string, unknown>): Promise<string[]> {
    const issues: string[] = [];
    if (!booleanValue(workflow.datos_propios)) issues.push("Municipality has insufficient first-party data");
    if (!booleanValue(workflow.tiene_cobertura) || !stringArray(workflow.servicios_cubiertos).includes(stringValue(workflow.service))) {
      issues.push("Selected service is not covered in the municipality");
    }
    if (numberValue(workflow.cuidadoras_disponibles_30d) < 8) issues.push("Local caregiver capacity is constrained");
    const serialized = JSON.stringify(jsonRecord(workflow.content)).toLowerCase();
    const forbidden = ["testimonio", "cura garantizada", "precio desde", "paciente", "diagnóstico"];
    if (forbidden.some((term) => serialized.includes(term))) issues.push("Content contains a forbidden claim or personal/health wording");
    if (url.length > 500) issues.push("Landing URL exceeds the allowed length");
    return issues;
  }

  private async getLandingOrThrow(url: string): Promise<LandingRecord> {
    const result = await this.landings({ page: 1, pageSize: 1, search: url });
    const landing = result.items.find((item) => item.url === url);
    if (landing === undefined) throw new AppError(404, "LANDING_NOT_FOUND", "Landing was not found");
    return landing;
  }

  private async audit(action: string, entityId: string, role: string, requestId: string, metadata: Record<string, unknown>): Promise<string> {
    const auditId = randomUUID();
    await this.execute(
      `INSERT INTO audit_log (audit_id, action, entity_type, entity_id, actor_role, request_id, metadata, created_at)
       VALUES ($1, $2, 'landing', $3, $4, $5, $6::jsonb, CURRENT_TIMESTAMP)`,
      [auditId, action, entityId, role, requestId, JSON.stringify(metadata)],
    );
    return auditId;
  }

  public async seo(filters: Filters): Promise<{ rows: SeoRow[]; caveat: string }> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    const gscClauses: string[] = [];
    const webClauses = ["canal = 'organic'"];
    const leadClauses = ["tipo_contacto <> 'cuidadora_empleo'", "LOWER(canal) IN ('organic', 'seo')"];
    if (filters.from !== undefined) {
      gscClauses.push(`fecha >= ${builder.add(filters.from)}::date`);
      webClauses.push(`fecha >= ${builder.add(filters.from)}::date`);
      leadClauses.push(`fecha_creacion >= ${builder.add(filters.from)}::date`);
    }
    if (filters.to !== undefined) {
      gscClauses.push(`fecha <= ${builder.add(filters.to)}::date`);
      webClauses.push(`fecha <= ${builder.add(filters.to)}::date`);
      leadClauses.push(`fecha_creacion < (${builder.add(filters.to)}::date + interval '1 day')`);
    }
    if (filters.province !== undefined) clauses.push(`m.provincia = ${builder.add(filters.province)}`);
    if (filters.municipalityId !== undefined) clauses.push(`l.municipio_id = ${builder.add(filters.municipalityId)}`);
    if (filters.language !== undefined) clauses.push(`l.idioma = ${builder.add(filters.language)}`);
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await this.query(
      `WITH search AS (
         SELECT url, SUM(impresiones)::int AS impressions, SUM(clics)::int AS clicks,
                (SUM(posicion_media * impresiones) / NULLIF(SUM(impresiones), 0))::double precision AS average_position
         FROM gsc_diario ${gscClauses.length > 0 ? `WHERE ${gscClauses.join(" AND ")}` : ""} GROUP BY url
       ), web AS (
         SELECT url_entrada, SUM(sesiones)::int AS organic_sessions, SUM(formularios)::int AS forms
         FROM web_sesiones_diarias WHERE ${webClauses.join(" AND ")} GROUP BY url_entrada
       ), lead_stats AS (
         SELECT url_entrada, COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
                COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
         FROM lead WHERE ${leadClauses.join(" AND ")} GROUP BY url_entrada
       )
       SELECT l.origen AS origin,
              COALESCE(lw.status::text, CASE WHEN l.fecha_publicacion IS NULL THEN 'draft' ELSE 'published' END) AS status,
              COUNT(DISTINCT l.url)::int AS landings,
              COUNT(DISTINCT l.url) FILTER (WHERE l.fecha_publicacion IS NOT NULL)::int AS published,
              COUNT(DISTINCT l.url) FILTER (WHERE l.fecha_primera_indexacion IS NOT NULL)::int AS indexed,
              COALESCE(SUM(search.impressions), 0)::int AS impressions, COALESCE(SUM(search.clicks), 0)::int AS clicks,
              (SUM(search.average_position * search.impressions) / NULLIF(SUM(search.impressions), 0))::double precision AS average_position,
              COALESCE(SUM(web.organic_sessions), 0)::int AS organic_sessions,
              COALESCE(SUM(web.forms), 0)::int AS forms,
              COALESCE(SUM(lead_stats.sql_count), 0)::int AS sql_count,
              COALESCE(SUM(lead_stats.alta_count), 0)::int AS alta_count
       FROM landing l LEFT JOIN landing_workflow lw ON lw.url = l.url
       LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
       LEFT JOIN search ON search.url = l.url
       LEFT JOIN web ON web.url_entrada = l.url
       LEFT JOIN lead_stats ON lead_stats.url_entrada = l.url
       ${where} GROUP BY l.origen, 2 ORDER BY l.origen, 2`,
      builder.values,
    );
    return {
      rows: rows.map((row) => {
        const impressions = numberValue(row.impressions);
        return {
          origin: stringValue(row.origin), status: stringValue(row.status), landings: numberValue(row.landings),
          published: numberValue(row.published), indexed: numberValue(row.indexed), impressions,
          clicks: numberValue(row.clicks), ctr: round(rate(numberValue(row.clicks), impressions)),
          averagePosition: row.average_position === null ? null : round(numberValue(row.average_position), 2),
          organicSessions: numberValue(row.organic_sessions), forms: numberValue(row.forms), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
        };
      }),
      caveat: "Manual versus generated landing comparisons are descriptive and do not imply causal impact.",
    };
  }

  public async ads(filters: Filters): Promise<{ rows: AdsRow[]; caveats: string[] }> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    if (filters.from !== undefined) clauses.push(`a.fecha >= ${builder.add(filters.from)}::date`);
    if (filters.to !== undefined) clauses.push(`a.fecha <= ${builder.add(filters.to)}::date`);
    if (filters.municipalityId !== undefined) clauses.push(`a.municipio_id = ${builder.add(filters.municipalityId)}`);
    if (filters.province !== undefined) clauses.push(`m.provincia = ${builder.add(filters.province)}`);
    if (filters.channel !== undefined) clauses.push(`LOWER(a.plataforma) = LOWER(${builder.add(filters.channel)})`);
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const rows = await this.query(
      `WITH paid AS (
         SELECT a.plataforma, a.campania, a.municipio_id,
                SUM(a.coste_eur)::double precision AS spend, SUM(a.impresiones)::int AS impressions,
                SUM(a.clics)::int AS clicks, SUM(a.conversiones_plataforma)::int AS platform_conversions
         FROM ads_diario a LEFT JOIN motor_municipio m ON m.municipio_id = a.municipio_id
         ${where} GROUP BY a.plataforma, a.campania, a.municipio_id
       ), campaign_leads AS (
         SELECT DISTINCT je.campaign, co.municipio_id, co.lead_id
         FROM journey_event je JOIN care_opportunity co ON co.opportunity_id = je.opportunity_id
         WHERE je.campaign IS NOT NULL AND co.lead_id IS NOT NULL
       ), crm_local AS (
         SELECT cl.campaign, cl.municipio_id, COUNT(*) FILTER (WHERE l.es_sql)::int AS crm_sql,
                COUNT(*) FILTER (WHERE l.es_alta)::int AS crm_altas
         FROM campaign_leads cl JOIN lead l ON l.lead_id = cl.lead_id
         WHERE l.tipo_contacto <> 'cuidadora_empleo' GROUP BY cl.campaign, cl.municipio_id
       ), crm_campaign AS (
         SELECT cl.campaign, COUNT(*) FILTER (WHERE l.es_sql)::int AS crm_sql,
                COUNT(*) FILTER (WHERE l.es_alta)::int AS crm_altas
         FROM campaign_leads cl JOIN lead l ON l.lead_id = cl.lead_id
         WHERE l.tipo_contacto <> 'cuidadora_empleo' GROUP BY cl.campaign
       )
       SELECT p.*,
              COALESCE(CASE WHEN p.municipio_id IS NULL THEN cc.crm_sql ELSE cl.crm_sql END, 0)::int AS crm_sql,
              COALESCE(CASE WHEN p.municipio_id IS NULL THEN cc.crm_altas ELSE cl.crm_altas END, 0)::int AS crm_altas
       FROM paid p
       LEFT JOIN crm_campaign cc ON cc.campaign = p.campania AND p.municipio_id IS NULL
       LEFT JOIN crm_local cl ON cl.campaign = p.campania AND cl.municipio_id = p.municipio_id
       ORDER BY p.spend DESC, p.plataforma, p.campania`,
      builder.values,
    );
    return {
      rows: rows.map((row) => {
        const spend = numberValue(row.spend);
        const clicks = numberValue(row.clicks);
        const sql = numberValue(row.crm_sql);
        const altas = numberValue(row.crm_altas);
        const municipalityId = nullableString(row.municipio_id);
        return {
          platform: stringValue(row.plataforma), campaign: stringValue(row.campania), municipalityId,
          spend: round(spend, 2), impressions: numberValue(row.impressions), clicks, cpc: round(rate(spend, clicks), 2),
          platformConversions: numberValue(row.platform_conversions), crmSql: sql, crmAltas: altas,
          costPerSql: sql === 0 ? null : round(spend / sql, 2), costPerAlta: altas === 0 ? null : round(spend / altas, 2),
          allocationWarning: municipalityId === null ? "Campaign is not municipality-targeted; spend is not allocated to municipalities." : null,
        };
      }),
      caveats: [
        "Platform conversions and CRM-reconciled SQL/altas use different measurement systems and are reported separately.",
        "Channel credit is attribution, not evidence of causal incrementality.",
      ],
    };
  }

  public async experiments(input: PageRequest): Promise<Paginated<ExperimentSummary>> {
    const builder = new SqlBuilder();
    const clauses: string[] = [];
    if (input.from !== undefined) clauses.push(`ge.start_date >= ${builder.add(input.from)}::date`);
    if (input.to !== undefined) clauses.push(`ge.start_date <= ${builder.add(input.to)}::date`);
    if (input.municipalityId !== undefined) clauses.push(`EXISTS (SELECT 1 FROM experiment_assignment x WHERE x.experiment_id = ge.experiment_id AND x.municipio_id = ${builder.add(input.municipalityId)})`);
    if (input.search !== undefined) clauses.push(`(ge.name ILIKE ${builder.add(`%${input.search}%`)} OR ge.hypothesis ILIKE ${builder.add(`%${input.search}%`)})`);
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = builder.add(input.pageSize);
    const offset = builder.add((input.page - 1) * input.pageSize);
    const rows = await this.query(
      `SELECT ge.experiment_id, ge.name, ge.hypothesis, ge.start_date, ge.end_date, ge.status,
              ge.primary_metric, ge.methodology,
              COUNT(DISTINCT ea.municipio_id) FILTER (WHERE ea.variant = 'treatment')::int AS treatment_count,
              COUNT(DISTINCT ea.municipio_id) FILTER (WHERE ea.variant = 'control')::int AS control_count,
              COUNT(*) OVER()::int AS total
       FROM growth_experiment ge LEFT JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
       ${where} GROUP BY ge.experiment_id, ge.name, ge.hypothesis, ge.start_date, ge.end_date,
                         ge.status, ge.primary_metric, ge.methodology
       ORDER BY ge.start_date DESC, ge.experiment_id LIMIT ${limit} OFFSET ${offset}`,
      builder.values,
    );
    const items = await Promise.all(rows.map(async (row) => {
      const id = stringValue(row.experiment_id);
      const analysis = await this.experimentAnalysis(id, stringValue(row.primary_metric));
      return this.experimentSummaryFromRow(row, analysis);
    }));
    return { items, page: input.page, pageSize: input.pageSize, total: numberValue(rows[0]?.total) };
  }

  private experimentSummaryFromRow(row: Record<string, unknown>, analysis: ExperimentAnalysis): ExperimentSummary {
    const bothGroupsObserved = analysis.treatmentSample > 0 && analysis.controlSample > 0;
    const limitations = [
      ...(!bothGroupsObserved ? ["At least one variant has no observed landing sessions"] : []),
      ...(analysis.didEstimate === null ? ["Insufficient pre/post outcome data for Difference-in-Differences"] : []),
      "The reported Difference-in-Differences is descriptive: no inferential parallel-trends test or significance test is implemented.",
      "No causal claim is made.",
    ];
    return {
      id: stringValue(row.experiment_id), name: stringValue(row.name), hypothesis: stringValue(row.hypothesis),
      startDate: isoValue(row.start_date).slice(0, 10), endDate: nullableIso(row.end_date)?.slice(0, 10) ?? null,
      status: stringValue(row.status), primaryMetric: stringValue(row.primary_metric), methodology: stringValue(row.methodology),
      treatmentMunicipalities: numberValue(row.treatment_count), controlMunicipalities: numberValue(row.control_count),
      observedDifference: analysis.observedDifference, didEstimate: analysis.didEstimate,
      evidenceLevel: "descriptive", limitations,
    };
  }

  public async experiment(id: string): Promise<ExperimentDetail | null> {
    const rows = await this.query(
      `SELECT ge.experiment_id, ge.name, ge.hypothesis, ge.start_date, ge.end_date, ge.status,
              ge.primary_metric, ge.methodology,
              COUNT(DISTINCT ea.municipio_id) FILTER (WHERE ea.variant = 'treatment')::int AS treatment_count,
              COUNT(DISTINCT ea.municipio_id) FILTER (WHERE ea.variant = 'control')::int AS control_count
       FROM growth_experiment ge LEFT JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
       WHERE ge.experiment_id = $1
       GROUP BY ge.experiment_id, ge.name, ge.hypothesis, ge.start_date, ge.end_date, ge.status, ge.primary_metric, ge.methodology`,
      [id],
    );
    const row = rows[0];
    if (row === undefined) return null;
    const commercial = row.primary_metric === "sql_per_municipality_week" ? await this.experimentSqlResult(id) : null;
    const [assignmentRows, seriesRows, analysis] = await Promise.all([
      this.query(
        `SELECT ea.municipio_id, m.nombre AS municipality, ea.variant, ea.assigned_at
         FROM experiment_assignment ea JOIN motor_municipio m ON m.municipio_id = ea.municipio_id
         WHERE ea.experiment_id = $1 ORDER BY ea.variant, m.nombre`,
        [id],
      ),
      this.query(
        `SELECT to_char(date_trunc('month', ws.fecha), 'YYYY-MM') AS period, ea.variant,
                SUM(ws.formularios)::double precision / NULLIF(SUM(ws.sesiones), 0) AS value,
                SUM(ws.sesiones)::int AS sample_size
         FROM growth_experiment ge JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
         JOIN landing l ON l.municipio_id = ea.municipio_id
         JOIN web_sesiones_diarias ws ON ws.url_entrada = l.url
         WHERE ge.experiment_id = $1
           AND ws.fecha >= ge.start_date - interval '90 days'
           AND ws.fecha <= COALESCE(ge.end_date, CURRENT_DATE)
         GROUP BY 1, ea.variant ORDER BY 1, ea.variant`,
        [id],
      ),
      this.experimentAnalysis(id, stringValue(row.primary_metric), commercial),
    ]);
    const summary = this.experimentSummaryFromRow(row, analysis);
    return {
      ...summary,
      assignments: assignmentRows.map((item) => ({
        municipalityId: stringValue(item.municipio_id), municipality: stringValue(item.municipality),
        variant: stringValue(item.variant), assignedAt: isoValue(item.assigned_at),
      })),
      series: commercial ? commercial.weeks.map(w => ({ period: w.start, variant: w.group, value: w.sql / w.municipalities, sampleSize: w.municipalities })) : seriesRows.map((item) => ({
        period: stringValue(item.period), variant: stringValue(item.variant), value: round(numberValue(item.value)), sampleSize: numberValue(item.sample_size),
      })),
      diagnostics: {
        parallelTrendsPass: null,
        hasObservedDataInBothGroups: analysis.treatmentSample > 0 && analysis.controlSample > 0,
        preTrendDifference: analysis.preTrendDifference,
      },
    };
  }

  public async learning(): Promise<LearningResponse> {
    const [experimentPage, decisionRows] = await Promise.all([
      this.experiments({ page: 1, pageSize: 100 }),
      this.query(
        `WITH lead_service AS (
           SELECT url_entrada, servicio AS service FROM (
             SELECT url_entrada, servicio, ROW_NUMBER() OVER (PARTITION BY url_entrada ORDER BY COUNT(*) DESC, servicio) AS rank
             FROM lead WHERE tipo_contacto <> 'cuidadora_empleo' AND url_entrada IS NOT NULL
             GROUP BY url_entrada, servicio
           ) ranked WHERE rank = 1
         )
         SELECT a.audit_id, a.entity_id AS url, a.actor_role, a.metadata, a.created_at,
                ROW_NUMBER() OVER (PARTITION BY a.entity_id ORDER BY COALESCE((a.metadata->>'version')::int,0), a.created_at, a.audit_id)::int AS version,
                m.nombre AS municipality, COALESCE(lw.service, lead_service.service) AS service
         FROM audit_log a
         JOIN landing l ON l.url = a.entity_id
         LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
         LEFT JOIN landing_workflow lw ON lw.url = l.url
         LEFT JOIN lead_service ON lead_service.url_entrada = l.url
         WHERE a.entity_type = 'landing' AND a.action = 'landing.decision_recorded'
         ORDER BY a.created_at DESC, a.audit_id DESC LIMIT 50`,
      ),
    ]);
    const decisions: LearningDecision[] = decisionRows.map((row) => {
      const metadata = jsonRecord(row.metadata);
      const rawDecision = stringValue(metadata.decision);
      const rawPrimaryMetric = stringValue(metadata.primaryMetric);
      const rawGuardrailMetric = stringValue(metadata.guardrailMetric);
      return {
        id: stringValue(row.audit_id), url: stringValue(row.url), municipality: nullableString(row.municipality), service: nullableString(row.service),
        version: numberValue(row.version), actorRole: stringValue(row.actor_role), createdAt: isoValue(row.created_at),
        decision: rawDecision === "stop" || rawDecision === "iterate" ? rawDecision : "keep",
        ...decisionEvidence(metadata),
        hypothesis: stringValue(metadata.hypothesis),
        primaryMetric: rawPrimaryMetric === "sql_per_municipality_week" || rawPrimaryMetric === "lead_to_sql" || rawPrimaryMetric === "sql_to_alta" ? rawPrimaryMetric : "session_to_lead",
        guardrailMetric: rawGuardrailMetric === "sql_to_alta" || rawGuardrailMetric === "caregiver_capacity" ? rawGuardrailMetric : "lead_to_sql",
        ...(nullableString(metadata.note) === null ? {} : { note: stringValue(metadata.note) }),
      };
    });
    const positive = experimentPage.items.filter((experiment) => (experiment.didEstimate ?? 0) > 0.005).length;
    const negative = experimentPage.items.filter((experiment) => (experiment.didEstimate ?? 0) < -0.005).length;
    return {
      experiments: experimentPage.items,
      decisions,
      totals: { experiments: experimentPage.total, positive, negative, inconclusive: experimentPage.total - positive - negative, decisions: decisions.length },
      caveats: [
        "Las decisiones son registros humanos auditados; no prueban que el cambio haya causado el resultado.",
        "La clasificación positiva, negativa o inconclusa usa el estimador DiD sintético y mantiene visibles sus limitaciones.",
      ],
    };
  }

  private async experimentAnalysis(id: string, metric: string, cached?: SqlResult | null): Promise<ExperimentAnalysis> {
    if (metric === "sql_per_municipality_week") {
      const result = cached ?? await this.experimentSqlResult(id);
      const post = result.weeks.filter(w => w.week >= 0 && w.mature);
      return { observedDifference: null, didEstimate: result.difference, preTrendDifference: result.preTrendGap,
        treatmentSample: post.filter(w => w.group === "treatment").length, controlSample: post.filter(w => w.group === "control").length };
    }
    const rows = await this.query(
      `WITH outcomes AS (
         SELECT ea.variant,
                CASE WHEN ws.fecha < ge.start_date - interval '45 days' THEN 'pre_early'
                     WHEN ws.fecha < ge.start_date THEN 'pre_late'
                     ELSE 'post' END AS period,
                SUM(ws.formularios)::double precision / NULLIF(SUM(ws.sesiones), 0) AS conversion,
                SUM(ws.sesiones)::int AS sample_size
         FROM growth_experiment ge JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
         JOIN landing l ON l.municipio_id = ea.municipio_id
         JOIN web_sesiones_diarias ws ON ws.url_entrada = l.url
         WHERE ge.experiment_id = $1
           AND ws.fecha >= ge.start_date - interval '90 days'
           AND ws.fecha <= COALESCE(ge.end_date, CURRENT_DATE)
         GROUP BY ea.variant, 2
       ) SELECT * FROM outcomes`,
      [id],
    );
    const value = (variant: string, period: string): number | null => {
      const row = rows.find((item) => item.variant === variant && item.period === period);
      return row === undefined || row.conversion === null ? null : numberValue(row.conversion);
    };
    const sample = (variant: string): number => rows.filter((item) => item.variant === variant).reduce((sum, item) => sum + numberValue(item.sample_size), 0);
    const treatmentEarly = value("treatment", "pre_early");
    const treatmentPre = value("treatment", "pre_late");
    const treatmentPost = value("treatment", "post");
    const controlEarly = value("control", "pre_early");
    const controlPre = value("control", "pre_late");
    const controlPost = value("control", "post");
    return {
      observedDifference: treatmentPost === null || controlPost === null ? null : round(treatmentPost - controlPost),
      didEstimate: treatmentPre === null || treatmentPost === null || controlPre === null || controlPost === null
        ? null : round((treatmentPost - treatmentPre) - (controlPost - controlPre)),
      preTrendDifference: treatmentEarly === null || treatmentPre === null || controlEarly === null || controlPre === null
        ? null : round((treatmentPre - treatmentEarly) - (controlPre - controlEarly)),
      treatmentSample: sample("treatment"), controlSample: sample("control"),
    };
  }

  public async dataQuality(): Promise<DataQualityResponse> {
    const [freshnessRows, identityRows, duplicateRows, integrityRows, missingRows, discrepancyRows, immatureRows] = await Promise.all([
      this.query(
        `SELECT * FROM (VALUES
          ('lead', (SELECT MAX(fecha_creacion)::timestamp FROM lead)),
          ('ads_diario', (SELECT MAX(fecha)::timestamp FROM ads_diario)),
          ('gsc_diario', (SELECT MAX(fecha)::timestamp FROM gsc_diario)),
          ('web_sesiones_diarias', (SELECT MAX(fecha)::timestamp FROM web_sesiones_diarias)),
          ('journey_event', (SELECT MAX(occurred_at)::timestamp FROM journey_event))
        ) AS sources(source, latest_at)`,
      ),
      this.query(
        `SELECT COUNT(*)::int AS total_events,
                COUNT(*) FILTER (WHERE person_id IS NULL AND opportunity_id IS NULL)::int AS unlinked_events,
                (SELECT COUNT(*)::int FROM identity_map WHERE ambiguous) AS ambiguous_identities
         FROM journey_event`,
      ),
      this.query(
        `SELECT GREATEST(COUNT(*) - COUNT(DISTINCT person_id), 0)::int AS confirmed_links,
                COUNT(*) FILTER (WHERE ambiguous)::int AS potential_duplicates FROM identity_map`,
      ),
      this.query(
        `SELECT 'sql_before_lead' AS check, COUNT(*)::int AS failures, 'error' AS severity FROM lead WHERE fecha_sql < fecha_creacion
         UNION ALL SELECT 'alta_before_sql', COUNT(*)::int, 'error' FROM lead WHERE fecha_alta < fecha_sql
         UNION ALL SELECT 'alta_without_opportunity', COUNT(*)::int, 'error' FROM lead l WHERE l.es_alta AND NOT EXISTS (SELECT 1 FROM care_opportunity co WHERE co.lead_id = l.lead_id)
         UNION ALL SELECT 'gsc_clicks_non_indexed', COUNT(*)::int, 'error' FROM gsc_diario g JOIN landing l ON l.url = g.url WHERE g.clics > 0 AND l.fecha_primera_indexacion IS NULL`,
      ),
      this.query(
        `SELECT 'lead.municipio_id' AS field, COUNT(*) FILTER (WHERE municipio_id IS NULL)::int AS missing, COUNT(*)::int AS total FROM lead
         UNION ALL SELECT 'lead.url_entrada', COUNT(*) FILTER (WHERE url_entrada IS NULL)::int, COUNT(*)::int FROM lead
         UNION ALL SELECT 'journey_event.identity', COUNT(*) FILTER (WHERE person_id IS NULL)::int, COUNT(*)::int FROM journey_event
         UNION ALL SELECT 'motor_municipio.nps_12m', COUNT(*) FILTER (WHERE nps_12m IS NULL)::int, COUNT(*)::int FROM motor_municipio`,
      ),
      this.query(
        `WITH platform_totals AS (
           SELECT plataforma, SUM(conversiones_plataforma)::int AS platform
           FROM ads_diario GROUP BY plataforma
         ), campaigns AS (
           SELECT DISTINCT plataforma, campania FROM ads_diario
         ), crm_totals AS (
           SELECT c.plataforma,
                  COALESCE(COUNT(DISTINCT co.lead_id) FILTER (WHERE l.es_sql), 0)::int AS crm
           FROM campaigns c LEFT JOIN journey_event je ON je.campaign = c.campania
           LEFT JOIN care_opportunity co ON co.opportunity_id = je.opportunity_id
           LEFT JOIN lead l ON l.lead_id = co.lead_id
           GROUP BY c.plataforma
         )
         SELECT p.plataforma AS metric, p.platform, COALESCE(c.crm, 0)::int AS crm
         FROM platform_totals p LEFT JOIN crm_totals c ON c.plataforma = p.plataforma
         ORDER BY p.plataforma`,
      ),
      this.query(
        `SELECT COUNT(*)::int AS count
         FROM lead l JOIN motor_municipio m ON m.municipio_id = l.municipio_id
         WHERE l.tipo_contacto <> 'cuidadora_empleo'
           AND l.es_sql AND l.fecha_sql IS NOT NULL
           AND l.fecha_sql > CURRENT_DATE - interval '90 days'
           AND m.tiene_cobertura AND m.cuidadoras_disponibles_30d >= 8`,
      ),
    ]);
    const identity = identityRows[0] ?? {};
    const totalEvents = numberValue(identity.total_events);
    return {
      generatedAt: new Date().toISOString(),
      freshness: freshnessRows.map((row) => {
        const latestAt = nullableIso(row.latest_at);
        const lagDays = latestAt === null ? null : Math.max(0, Math.floor((Date.now() - new Date(latestAt).getTime()) / 86_400_000));
        return { source: stringValue(row.source), latestAt, lagDays, status: lagDays === null ? "missing" : lagDays <= 7 ? "fresh" : "stale" };
      }),
      identity: {
        totalEvents, unlinkedEvents: numberValue(identity.unlinked_events), ambiguousIdentities: numberValue(identity.ambiguous_identities),
        traceabilityCoverage: round(rate(totalEvents - numberValue(identity.unlinked_events), totalEvents)),
      },
      duplicates: { potentialLeadDuplicates: numberValue(duplicateRows[0]?.potential_duplicates), confirmedLinks: numberValue(duplicateRows[0]?.confirmed_links) },
      integrity: integrityRows.map((row) => ({
        check: stringValue(row.check), failures: numberValue(row.failures),
        severity: stringValue(row.severity) === "error" ? "error" : stringValue(row.severity) === "warning" ? "warning" : "info",
      })),
      missingness: missingRows.map((row) => {
        const missing = numberValue(row.missing); const total = numberValue(row.total);
        return { field: stringValue(row.field), missing, total, rate: round(rate(missing, total)) };
      }),
      discrepancies: discrepancyRows.map((row) => {
        const platform = numberValue(row.platform); const crm = numberValue(row.crm);
        return { metric: stringValue(row.metric), platform, crm, difference: platform - crm };
      }),
      pendingMaturitySql: numberValue(immatureRows[0]?.count),
      limitations: ["Late events and intentionally incomplete attribution are retained rather than imputed."],
      monitoringSignals: [
        { signal: "unlinked_events", value: numberValue(identity.unlinked_events), unit: "count", source: "journey_event" },
        { signal: "integrity_failures", value: integrityRows.reduce((sum, row) => sum + numberValue(row.failures), 0), unit: "count", source: "integrity_checks" },
        { signal: "ambiguous_identities", value: numberValue(identity.ambiguous_identities), unit: "count", source: "identity_map" },
      ],
    };
  }

  public async strategy(assumptions: StrategyAssumptions): Promise<StrategyResponse> {
    const [opportunities, observedRows] = await Promise.all([
      this.opportunities({ page: 1, pageSize: 100 }),
      this.query(
        `WITH latest AS (
           SELECT MAX(fecha_creacion) AS max_created_at FROM lead
         ), campaign_leads AS (
           SELECT DISTINCT co.lead_id
           FROM journey_event je
           JOIN care_opportunity co ON co.opportunity_id = je.opportunity_id
           WHERE je.campaign IS NOT NULL AND co.lead_id IS NOT NULL
         )
         SELECT COUNT(*) FILTER (WHERE l.es_sql)::int AS sql_count,
                COUNT(*) FILTER (WHERE l.es_sql AND cl.lead_id IS NOT NULL)::int AS paid_sql_count
         FROM lead l
         CROSS JOIN latest
         LEFT JOIN campaign_leads cl ON cl.lead_id = l.lead_id
         WHERE l.tipo_contacto <> 'cuidadora_empleo'
           AND l.fecha_creacion >= latest.max_created_at - interval '30 days'`,
      ),
    ]);
    const scenarioDefinitions = {
      conservative: { demandCaptureRate: 0.015, leadToSqlRate: 0.35, sqlToAltaRate: 0.12, capacityUtilization: 0.5 },
      base: { demandCaptureRate: 0.025, leadToSqlRate: 0.42, sqlToAltaRate: 0.18, capacityUtilization: 0.7 },
      optimistic: { demandCaptureRate: 0.04, leadToSqlRate: 0.5, sqlToAltaRate: 0.24, capacityUtilization: 0.85 },
    } as const;
    const impactMarkets = opportunities.items.map((row) => ({
      municipalityId: row.municipalityId,
      municipality: row.municipality,
      service: row.service,
      monthlySearches: row.monthlySearches,
      eligible: row.selectionEligibility === "eligible",
    }));
    const selectedImpact = calculateLandingImpact(impactMarkets, assumptions);
    const impactByMarket = new Map(selectedImpact.rows.map((row) => [`${row.municipalityId}:${row.service}`, row]));
    const scenarioValues = {
      conservative: calculateLandingImpact(impactMarkets, { ...scenarioDefinitions.conservative, months: assumptions.months, marketLimit: assumptions.marketLimit }).totals,
      base: calculateLandingImpact(impactMarkets, { ...scenarioDefinitions.base, months: assumptions.months, marketLimit: assumptions.marketLimit }).totals,
      optimistic: calculateLandingImpact(impactMarkets, { ...scenarioDefinitions.optimistic, months: assumptions.months, marketLimit: assumptions.marketLimit }).totals,
    };
    const makeBet = (row: OpportunityRow, rank: number): StrategyBet => {
      const eligible = row.selectionEligibility === "eligible";
      const impact = impactByMarket.get(`${row.municipalityId}:${row.service}`);
      const scenarioSql = impact?.scenarioSql ?? 0;
      const scenarioAltas = impact?.scenarioAltas ?? 0;
      const highImpact = scenarioSql >= 10;
      return {
        rank, municipalityId: row.municipalityId, municipality: row.municipality, service: row.service,
        decision: eligible ? "prioritize" : "reject",
        reason: eligible ? "Municipal data, coverage, capacity and persisted demand pass the versioned selection rules." : row.selectionReasons.join(" "),
        impact: highImpact ? "high" : scenarioSql >= 4 ? "medium" : "low",
        effort: row.competitors >= 5 || row.estimatedCpc >= 3 ? "high" : row.competitors >= 2 ? "medium" : "low",
        dependencies: ["Landing policy review", "CRM campaign tagging", ...(row.caregiversAvailable < 12 ? ["Capacity confirmation"] : [])],
        owner: eligible ? "Growth + Local Operations" : "Local Operations",
        scenarioSql, scenarioAltas,
        hypothesis: `A local ${row.service} test in ${row.municipality} can convert a bounded share of observed demand into eligible SQL.`,
        mvp: "Launch one reviewed landing and one geo-targeted campaign with a capped budget and holdout comparison.",
        exclusions: ["Caregiver job contacts", "Immature cohorts", "Unlinked CRM conversions"],
        successCriteria: ["Policy-safe published landing", "Complete campaign-to-CRM tracking for observed conversions", "Predeclared experiment readout completed on a mature cohort"],
        decisionCriteria: {
          continue: "Observed outcomes meet the predeclared experiment target, the cohort matures, and capacity remains healthy.",
          modify: "Demand is observed but conversion, traceability, or creative performance misses target.",
          stop: "No observed improvement in eligible SQL, policy failure, or sustained capacity constraint.",
        },
      };
    };
    const prioritizedRows = opportunities.items.filter((row) => impactByMarket.has(`${row.municipalityId}:${row.service}`));
    const rejectedRows = opportunities.items.filter((row) => row.selectionEligibility !== "eligible").slice(0, 12);
    const prioritizedBets = prioritizedRows.map((row, index) => makeBet(row, index + 1));
    const rejectedBets = rejectedRows.map((row, index) => makeBet(row, index + 1));
    const sqlScenarioValues = Object.values(scenarioValues).map((value) => value.sql);
    const altaScenarioValues = Object.values(scenarioValues).map((value) => value.altas);
    const observedFilteredSql = numberValue(observedRows[0]?.sql_count);
    const observedPaidSql = numberValue(observedRows[0]?.paid_sql_count);
    const qualificationRateChanges = { conservative: 0.01, base: 0.02, optimistic: 0.03 } as const;
    const paidEfficiencyChanges = { conservative: 0.05, base: 0.1, optimistic: 0.15 } as const;
    const qualificationValues = {
      conservative: calculatePlanningDelta({ baselineMonthlyVolume: observedFilteredSql, months: assumptions.months, assumedRateChange: qualificationRateChanges.conservative }),
      base: calculatePlanningDelta({ baselineMonthlyVolume: observedFilteredSql, months: assumptions.months, assumedRateChange: qualificationRateChanges.base }),
      optimistic: calculatePlanningDelta({ baselineMonthlyVolume: observedFilteredSql, months: assumptions.months, assumedRateChange: qualificationRateChanges.optimistic }),
    };
    const paidValues = {
      conservative: calculatePlanningDelta({ baselineMonthlyVolume: observedPaidSql, months: assumptions.months, assumedRateChange: paidEfficiencyChanges.conservative }),
      base: calculatePlanningDelta({ baselineMonthlyVolume: observedPaidSql, months: assumptions.months, assumedRateChange: paidEfficiencyChanges.base }),
      optimistic: calculatePlanningDelta({ baselineMonthlyVolume: observedPaidSql, months: assumptions.months, assumedRateChange: paidEfficiencyChanges.optimistic }),
    };
    return {
      label: "Synthetic planning demonstration — not a forecast",
      baseline: { sqlPerMonth: 2000, source: "planning_brief", observedFilteredSql },
      assumptions,
      scenarios: scenarioDefinitions,
      planningModel: {
        version: selectedImpact.modelVersion,
        formula: selectedImpact.formula,
        candidateRowsEvaluated: opportunities.items.length,
        eligibleMarketsInCandidateSet: selectedImpact.eligibleMarketsAvailable,
        marketsIncluded: selectedImpact.marketsIncluded,
        exclusions: ["Municipios sin cobertura", "Municipios con capacidad restringida", "Contactos de empleo de cuidadoras"],
      },
      scenarioProjection: {
        sql: selectedImpact.totals.sql,
        altas: selectedImpact.totals.altas,
        periodMonths: assumptions.months,
      },
      impactRange: {
        sql: { min: Math.min(...sqlScenarioValues), max: Math.max(...sqlScenarioValues) },
        altas: { min: Math.min(...altaScenarioValues), max: Math.max(...altaScenarioValues) },
        periodMonths: assumptions.months,
        scenarioValues,
      },
      enablingInitiatives: [{
        name: "Reparar trazabilidad",
        directScenarioSql: 0,
        directScenarioAltas: 0,
        value: "Permite reconciliar exposición, landing, campaña y resultado CRM; habilita decisiones fiables, pero no se contabiliza como crecimiento directo.",
      }],
      portfolioInitiatives: [
        {
          id: "local_landings", rank: 1, name: "Landings locales elegibles", outcome: "sql", evidence: "planning_assumption",
          formula: selectedImpact.formula,
          inputs: [`${String(selectedImpact.marketsIncluded)} municipios únicos`, `${String(assumptions.months)} meses`, "demanda persistida", "cobertura y capacidad"],
          scenarioValues: { conservative: scenarioValues.conservative.sql, base: scenarioValues.base.sql, optimistic: scenarioValues.optimistic.sql },
          range: { min: Math.min(...sqlScenarioValues), max: Math.max(...sqlScenarioValues) }, periodMonths: assumptions.months,
        },
        {
          id: "qualification", rank: 2, name: "Mejorar SQL → alta", outcome: "altas", evidence: "planning_assumption",
          formula: "SQL observados en los últimos 30 días × meses × mejora absoluta asumida de SQL→alta",
          inputs: [`${String(observedFilteredSql)} SQL/mes observados`, "mejora de 1, 2 o 3 puntos porcentuales"],
          scenarioValues: qualificationValues,
          range: { min: qualificationValues.conservative, max: qualificationValues.optimistic }, periodMonths: assumptions.months,
        },
        {
          id: "paid_reallocation", rank: 3, name: "Reasignar inversión con resultado CRM", outcome: "sql", evidence: "planning_assumption",
          formula: "SQL de pago reconciliados en los últimos 30 días × meses × mejora relativa asumida de eficiencia",
          inputs: [`${String(observedPaidSql)} SQL de pago reconciliados/mes`, "mejora de 5 %, 10 % o 15 % con presupuesto constante"],
          scenarioValues: paidValues,
          range: { min: paidValues.conservative, max: paidValues.optimistic }, periodMonths: assumptions.months,
        },
        {
          id: "traceability", rank: 4, name: "Reparar trazabilidad", outcome: "enabler", evidence: "enabling_initiative",
          formula: "No se atribuye crecimiento directo a una mejora de medición",
          inputs: ["0 SQL directos", "0 altas directas"],
          scenarioValues: { conservative: 0, base: 0, optimistic: 0 },
          range: { min: 0, max: 0 }, periodMonths: assumptions.months,
        },
      ],
      prioritizedBets, rejectedBets,
      milestones: {
        first90Days: ["Confirm capacity and tracking for the first three bets", "Publish policy-reviewed landing MVPs", "Run geo holdouts and weekly quality checks", "Read only mature eligible cohorts"],
        sixMonths: ["Scale only bets meeting continue criteria", "Document modified and stopped bets", "Refresh opportunity ranking from persisted outcomes", "Review portfolio incrementality and operational load"],
      },
      caveats: [
        "Coefficients are editable, bounded planning assumptions applied to synthetic data; they are not learned model parameters.",
        "Scenario outputs are planning arithmetic, not incremental estimates or causal forecasts. Experiments and holdouts are required for validation.",
        "The conservative-to-optimistic range uses the declared default coefficients; a manual override is reported separately in scenarioProjection.",
      ],
    };
  }

  public async workbench(): Promise<WorkbenchResponse> {
    const opportunitySql = `WITH demand AS (
  SELECT municipio_id, tema, AVG(busquedas)::double precision AS monthly_searches,
         COUNT(DISTINCT mes)::int AS demand_months_observed
  FROM motor_demanda_busqueda GROUP BY municipio_id, tema
), lead_stats AS (
  SELECT municipio_id, servicio, COUNT(*)::int AS leads,
         COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
         COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
  FROM lead WHERE tipo_contacto <> 'cuidadora_empleo'
  GROUP BY municipio_id, servicio
), voice AS (
  SELECT municipio_id, tema, SUM(llamadas)::int AS voice_signals
  FROM motor_voz_cliente GROUP BY municipio_id, tema
), competition AS (
  SELECT municipio_id, COUNT(*)::int AS competitors
  FROM motor_competencia GROUP BY municipio_id
), base AS (
  SELECT m.municipio_id, m.nombre AS municipality, d.tema AS service,
         d.monthly_searches, d.demand_months_observed,
         COALESCE(ls.leads, 0)::int AS leads,
         COALESCE(ls.sql_count, 0)::int AS sql_count,
         COALESCE(ls.alta_count, 0)::int AS alta_count,
         m.datos_propios AS own_municipal_data,
         m.cuidadoras_disponibles_30d AS caregivers_available,
         (m.tiene_cobertura AND d.tema = ANY(m.servicios_cubiertos)) AS coverage,
         COALESCE(v.voice_signals, 0)::int AS voice_signals,
         COALESCE(c.competitors, 0)::int AS competitors
  FROM demand d JOIN motor_municipio m ON m.municipio_id = d.municipio_id
  LEFT JOIN lead_stats ls ON ls.municipio_id = d.municipio_id AND ls.servicio = d.tema
  LEFT JOIN voice v ON v.municipio_id = d.municipio_id AND v.tema = d.tema
  LEFT JOIN competition c ON c.municipio_id = d.municipio_id
)
SELECT municipality AS municipio, service AS servicio,
       ROUND(monthly_searches)::int AS busquedas_mensuales, leads, sql_count AS sql,
       alta_count AS altas, caregivers_available AS cuidadoras_30d, coverage AS cobertura,
       CASE WHEN NOT coverage THEN 0 ELSE LEAST(100, GREATEST(0,
         LEAST(monthly_searches / 20.0, 35)
         + LEAST(GREATEST(monthly_searches - sql_count * 3, 0) / 30.0, 25)
         + LEAST(caregivers_available / 2.0, 20)
         + LEAST(voice_signals / 10.0, 10)
         + CASE WHEN sql_count = 0 THEN 5 ELSE (1 - alta_count::double precision / NULLIF(sql_count, 0)) * 10 END
         - CASE WHEN caregivers_available < 8 THEN 20 ELSE 0 END
       )) END::double precision AS puntuacion
FROM base ORDER BY puntuacion DESC, municipio, servicio LIMIT 20`;
    const landingPerformanceSql = `WITH web AS (
  SELECT url_entrada, SUM(sesiones)::int AS sessions, SUM(formularios)::int AS forms,
         SUM(clics_llamar)::int AS phone_clicks
  FROM web_sesiones_diarias GROUP BY url_entrada
), lead_stats AS (
  SELECT url_entrada, COUNT(*)::int AS leads,
         COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
         COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
  FROM lead WHERE tipo_contacto <> 'cuidadora_empleo' GROUP BY url_entrada
), search AS (
  SELECT url, SUM(impresiones)::int AS impressions, SUM(clics)::int AS clicks,
         (SUM(posicion_media * impresiones) / NULLIF(SUM(impresiones), 0))::double precision AS average_position
  FROM gsc_diario GROUP BY url
)
SELECT l.url, m.nombre AS municipality, COALESCE(web.sessions, 0)::int AS sessions,
       COALESCE(lead_stats.leads, 0)::int AS leads,
       COALESCE(lead_stats.sql_count, 0)::int AS sql_count,
       COALESCE(lead_stats.alta_count, 0)::int AS alta_count,
       COALESCE(search.impressions, 0)::int AS impressions,
       COALESCE(search.clicks, 0)::int AS clicks, search.average_position,
       m.tiene_cobertura AS coverage,
       COALESCE(m.cuidadoras_disponibles_30d, 0)::int AS caregivers_available
FROM landing l
LEFT JOIN motor_municipio m ON m.municipio_id = l.municipio_id
LEFT JOIN web ON web.url_entrada = l.url
LEFT JOIN lead_stats ON lead_stats.url_entrada = l.url
LEFT JOIN search ON search.url = l.url
ORDER BY COALESCE(lead_stats.sql_count, 0) DESC, COALESCE(web.sessions, 0) DESC, l.url
LIMIT 20`;
    const landingMonthlySql = `WITH web AS (
  SELECT TO_CHAR(fecha, 'YYYY-MM') AS period, SUM(sesiones)::int AS sessions,
         SUM(formularios)::int AS forms, SUM(clics_llamar)::int AS phone_clicks
  FROM web_sesiones_diarias WHERE url_entrada = $1 GROUP BY 1
), leads AS (
  SELECT TO_CHAR(fecha_creacion, 'YYYY-MM') AS period, COUNT(*)::int AS leads,
         COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
         COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
  FROM lead WHERE url_entrada = $1 AND tipo_contacto <> 'cuidadora_empleo' GROUP BY 1
), periods AS (
  SELECT period FROM web UNION SELECT period FROM leads
)
SELECT periods.period, COALESCE(web.sessions, 0)::int AS sesiones,
       COALESCE(web.forms, 0)::int AS formularios,
       COALESCE(web.phone_clicks, 0)::int AS clics_telefono,
       COALESCE(leads.leads, 0)::int AS leads,
       COALESCE(leads.sql_count, 0)::int AS sql,
       COALESCE(leads.alta_count, 0)::int AS altas
FROM periods LEFT JOIN web USING (period) LEFT JOIN leads USING (period)
ORDER BY periods.period`;
    const experimentCatalogSql = `SELECT ge.experiment_id, ge.name, ge.primary_metric, ge.methodology,
       COUNT(DISTINCT ea.municipio_id) FILTER (WHERE ea.variant = 'treatment')::int AS treatment_count,
       COUNT(DISTINCT ea.municipio_id) FILTER (WHERE ea.variant = 'control')::int AS control_count
FROM growth_experiment ge
LEFT JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
GROUP BY ge.experiment_id, ge.name, ge.primary_metric, ge.methodology
ORDER BY ge.start_date DESC, ge.experiment_id LIMIT 20`;
    const experimentOutcomesSql = `WITH outcomes AS (
  SELECT ea.variant,
         CASE WHEN ws.fecha < ge.start_date - interval '45 days' THEN 'pre_early'
              WHEN ws.fecha < ge.start_date THEN 'pre_late'
              ELSE 'post' END AS period,
         SUM(ws.formularios)::double precision / NULLIF(SUM(ws.sesiones), 0) AS conversion,
         SUM(ws.sesiones)::int AS sample_size
  FROM growth_experiment ge
  JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
  JOIN landing l ON l.municipio_id = ea.municipio_id
  JOIN web_sesiones_diarias ws ON ws.url_entrada = l.url
  WHERE ge.experiment_id = $1
    AND ws.fecha >= ge.start_date - interval '90 days'
    AND ws.fecha <= COALESCE(ge.end_date, CURRENT_DATE)
  GROUP BY ea.variant, 2
)
SELECT variant, period, conversion, sample_size FROM outcomes
ORDER BY variant, period`;
    const traceabilitySql = `SELECT COUNT(*)::int AS total_events,
       COUNT(*) FILTER (WHERE person_id IS NULL AND opportunity_id IS NULL)::int AS unlinked_events,
       (SELECT COUNT(*)::int FROM identity_map WHERE ambiguous) AS ambiguous_identities
FROM journey_event`;
    const integritySql = `SELECT 'sql_before_lead' AS check, COUNT(*)::int AS failures
FROM lead WHERE fecha_sql < fecha_creacion
UNION ALL SELECT 'alta_before_sql', COUNT(*)::int FROM lead WHERE fecha_alta < fecha_sql
UNION ALL SELECT 'alta_without_opportunity', COUNT(*)::int FROM lead l
  WHERE l.es_alta AND NOT EXISTS (SELECT 1 FROM care_opportunity co WHERE co.lead_id = l.lead_id)
UNION ALL SELECT 'gsc_clicks_non_indexed', COUNT(*)::int FROM gsc_diario g
  JOIN landing l ON l.url = g.url WHERE g.clics > 0 AND l.fecha_primera_indexacion IS NULL`;
    const maturitySql = `SELECT COUNT(*)::int AS pending_maturity_sql
FROM lead l JOIN motor_municipio m ON m.municipio_id = l.municipio_id
WHERE l.tipo_contacto <> 'cuidadora_empleo'
  AND l.es_sql AND l.fecha_sql IS NOT NULL
  AND l.fecha_sql > CURRENT_DATE - interval '90 days'
  AND m.tiene_cobertura AND m.cuidadoras_disponibles_30d >= 8`;

    const [opportunityRows, landingRows, experimentRows, traceabilityRows, integrityRows, maturityRows] = await Promise.all([
      this.query(opportunitySql), this.query(landingPerformanceSql), this.query(experimentCatalogSql),
      this.query(traceabilitySql), this.query(integritySql), this.query(maturitySql),
    ]);
    const sampleLandingUrl = nullableString(landingRows[0]?.url);
    const sampleExperiment = experimentRows.find(row => row.primary_metric === "formularios_por_sesion");
    const sampleExperimentId = nullableString(sampleExperiment?.experiment_id);
    const [monthlyRows, experimentOutcomeRows] = await Promise.all([
      sampleLandingUrl === null ? Promise.resolve([]) : this.query(landingMonthlySql, [sampleLandingUrl]),
      sampleExperimentId === null ? Promise.resolve([]) : this.query(experimentOutcomesSql, [sampleExperimentId]),
    ]);
    const experimentValue = (variant: string, period: string): number | null => {
      const row = experimentOutcomeRows.find((item) => item.variant === variant && item.period === period);
      return row === undefined || row.conversion === null ? null : numberValue(row.conversion);
    };
    const treatmentPre = experimentValue("treatment", "pre_late");
    const treatmentPost = experimentValue("treatment", "post");
    const controlPre = experimentValue("control", "pre_late");
    const controlPost = experimentValue("control", "post");
    const didEstimate = treatmentPre === null || treatmentPost === null || controlPre === null || controlPost === null
      ? null
      : round((treatmentPost - treatmentPre) - (controlPost - controlPre), 4);
    const landingResultRows = landingRows.map((row) => ({
      url: stringValue(row.url), municipio: nullableString(row.municipality), sesiones: numberValue(row.sessions),
      leads: numberValue(row.leads), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      sesion_a_lead: round(rate(numberValue(row.leads), numberValue(row.sessions)), 4),
      lead_a_sql: round(rate(numberValue(row.sql_count), numberValue(row.leads)), 4),
      sql_a_alta: round(rate(numberValue(row.alta_count), numberValue(row.sql_count)), 4),
    }));
    const traceability = traceabilityRows[0] ?? {};
    const totalEvents = numberValue(traceability.total_events);
    const unlinkedEvents = numberValue(traceability.unlinked_events);
    const qualityRows: Array<Record<string, unknown>> = [
      ...integrityRows.map((row) => ({ control: stringValue(row.check), casos: numberValue(row.failures) })),
      { control: "sql_pending_maturity", casos: numberValue(maturityRows[0]?.pending_maturity_sql) },
    ];
    const queries: WorkbenchQuery[] = [
      {
        id: "opportunity_score", area: "Oportunidades", title: "Puntuación de oportunidad por municipio y servicio",
        question: "¿Dónde coinciden demanda, baja captación y capacidad suficiente para hacer una prueba?",
        grain: "Una fila por municipio y servicio", evidence: "descriptive",
        implementation: { endpoint: "GET /opportunities", method: "PrismaGrowthRepository.opportunities" },
        statements: [{ title: "Demanda, embudo y puntuación", purpose: "Une las señales y aplica la regla versionada de priorización.", sql: opportunitySql, parameters: [] }],
        dataUsed: ["motor_demanda_busqueda", "motor_municipio", "lead", "motor_voz_cliente", "motor_competencia"],
        joins: [
          { left: "motor_demanda_busqueda", right: "motor_municipio", on: "municipio_id", purpose: "Añadir cobertura, datos propios y capacidad." },
          { left: "demanda", right: "lead", on: "municipio_id + servicio", purpose: "Comparar búsquedas con leads, SQL y altas." },
          { left: "demanda", right: "motor_voz_cliente", on: "municipio_id + tema", purpose: "Añadir frecuencia de la necesidad en llamadas." },
        ],
        metrics: [
          { name: "Búsquedas mensuales", definition: "Media mensual de búsquedas del tema en el municipio.", calculation: "AVG(motor_demanda_busqueda.busquedas)", calculatedIn: "sql", displayedAs: "Oportunidades · Demanda" },
          { name: "Brecha entre demanda y SQL", definition: "Parte de la demanda que no se refleja en SQL observados.", calculation: "min(max(búsquedas - SQL × 3, 0) / 30, 25)", calculatedIn: "sql", displayedAs: "Ficha de oportunidad · factor de captación" },
          { name: "Puntuación", definition: "Regla de ordenación; no es una predicción.", calculation: "demanda (35) + brecha (25) + capacidad (20) + voz (10) + conversión (10) - penalización de capacidad", calculatedIn: "sql", displayedAs: "Oportunidades · puntuación" },
          { name: "SQL → alta", definition: "Proporción de SQL que terminan en alta.", calculation: "altas / SQL", calculatedIn: "application", displayedAs: "Ficha de oportunidad · conversión" },
        ],
        shownIn: [{ page: "Oportunidades", component: "Ranking y factores" }, { page: "Ficha de oportunidad", component: "Demanda, embudo, capacidad y reglas" }],
        resultRows: this.workbenchRows(opportunityRows), resultDescription: "Primeras 20 combinaciones ordenadas por la misma regla de la pantalla Oportunidades.",
        exclusions: ["Contactos de empleo de cuidadoras", "Demanda de otros servicios", "Municipios sin cobertura reciben puntuación 0"],
        caveats: ["La puntuación ordena casos para revisar; no estima altas futuras."],
      },
      {
        id: "landing_performance", area: "Landings", title: "Rendimiento atribuido por landing",
        question: "¿Qué tráfico y resultados CRM se pueden enlazar con cada URL de entrada?",
        grain: "Una fila por URL de landing", evidence: "attribution",
        implementation: { endpoint: "GET /landing-insights", method: "PrismaGrowthRepository.landingInsights" },
        statements: [{ title: "Web, Google y CRM por URL", purpose: "Agrupa cada fuente y las une mediante la URL de la landing.", sql: landingPerformanceSql, parameters: [] }],
        dataUsed: ["landing", "web_sesiones_diarias", "gsc_diario", "lead", "motor_municipio"],
        joins: [
          { left: "web_sesiones_diarias.url_entrada", right: "landing.url", on: "URL exacta", purpose: "Atribuir sesiones y formularios." },
          { left: "lead.url_entrada", right: "landing.url", on: "URL exacta", purpose: "Atribuir leads, SQL y altas CRM." },
          { left: "gsc_diario.url", right: "landing.url", on: "URL exacta", purpose: "Añadir impresiones, clics y posición orgánica." },
        ],
        metrics: [
          { name: "Sesión → lead", definition: "Capacidad de la landing para generar un lead atribuido.", calculation: "leads / sesiones", calculatedIn: "application", displayedAs: "Landings y ficha · embudo" },
          { name: "Lead → SQL", definition: "Calidad comercial de los leads atribuidos.", calculation: "SQL / leads", calculatedIn: "application", displayedAs: "Landings y ficha · embudo" },
          { name: "SQL → alta", definition: "Resultado final del embudo CRM atribuido a la URL.", calculation: "altas / SQL", calculatedIn: "application", displayedAs: "Landings y ficha · embudo" },
          { name: "Evaluación", definition: "Media de visibilidad, captación, calidad y operabilidad.", calculation: "(visibilidad + captación + calidad + operabilidad) / 4", calculatedIn: "application", displayedAs: "Ficha de landing · evaluación multidimensional" },
        ],
        shownIn: [{ page: "Landings", component: "Listado, totales y tasas" }, { page: "Ficha de landing", component: "Embudo, benchmark y evaluación" }],
        resultRows: this.workbenchRows(landingResultRows), resultDescription: "Landings ordenadas por SQL y sesiones; las tasas se calculan después de leer los recuentos.",
        exclusions: ["Contactos de empleo de cuidadoras", "Leads sin URL de entrada", "Resultados no enlazados a la URL"],
        caveats: ["La URL permite atribuir el resultado observado, pero no demuestra que la landing lo causó."],
      },
      {
        id: "landing_monthly_funnel", area: "Landings", title: "Evolución mensual de una landing",
        question: "¿Cómo cambian el tráfico y los resultados CRM de la misma landing a lo largo del tiempo?",
        grain: "Una fila por landing y mes", evidence: "attribution",
        implementation: { endpoint: "GET /landing-insights/:url", method: "PrismaGrowthRepository.landingInsight" },
        statements: [{ title: "Serie mensual por URL", purpose: "Alinea web y CRM en el mismo mes para dibujar las gráficas.", sql: landingMonthlySql, parameters: [{ name: "$1", value: sampleLandingUrl ?? "Sin landing disponible" }] }],
        dataUsed: ["web_sesiones_diarias", "lead"],
        joins: [{ left: "web.period", right: "leads.period", on: "mes YYYY-MM", purpose: "Mostrar tráfico y embudo en el mismo eje temporal." }],
        metrics: [
          { name: "Sesiones mensuales", definition: "Sesiones cuya URL de entrada es la landing seleccionada.", calculation: "SUM(sesiones) por mes", calculatedIn: "sql", displayedAs: "Ficha de landing · evolución de tráfico" },
          { name: "Leads, SQL y altas mensuales", definition: "Resultados CRM atribuidos a la misma URL y mes.", calculation: "COUNT(lead), COUNT WHERE es_sql, COUNT WHERE es_alta", calculatedIn: "sql", displayedAs: "Ficha de landing · evolución del resultado" },
          { name: "Sesión → lead mensual", definition: "Conversión observada de cada mes.", calculation: "leads / sesiones", calculatedIn: "application", displayedAs: "Datos de la serie y tooltips" },
        ],
        shownIn: [{ page: "Ficha de landing", component: "Gráficas de tráfico y resultado" }],
        resultRows: this.workbenchRows(monthlyRows), resultDescription: sampleLandingUrl === null ? "No hay una landing disponible para ejecutar el ejemplo." : `Serie ejecutada para ${sampleLandingUrl}.`,
        exclusions: ["Contactos de empleo de cuidadoras", "Actividad de otras URL"],
        caveats: ["Un cambio mensual puede deberse a estacionalidad o mezcla de canales."],
      },
      {
        id: "experiment_effect", area: "Medición", title: "Cambio estimado con tratamiento y control",
        question: "¿La conversión cambió más en los municipios con la nueva landing que en el grupo de control?",
        grain: "Un resultado por experimento", evidence: "quasi_experimental",
        implementation: { endpoint: "GET /learning", method: "PrismaGrowthRepository.experimentAnalysis" },
        statements: [
          { title: "Definición y tamaño de grupos", purpose: "Identifica tratamiento, control y métrica declarada.", sql: experimentCatalogSql, parameters: [] },
          { title: "Conversión antes y después", purpose: "Calcula formularios por sesión en cada grupo y periodo.", sql: experimentOutcomesSql, parameters: [{ name: "$1", value: sampleExperimentId ?? "Sin experimento disponible" }] },
        ],
        dataUsed: ["growth_experiment", "experiment_assignment", "landing", "web_sesiones_diarias"],
        joins: [
          { left: "growth_experiment", right: "experiment_assignment", on: "experiment_id", purpose: "Saber qué municipios pertenecen a cada grupo." },
          { left: "experiment_assignment", right: "landing", on: "municipio_id", purpose: "Relacionar cada grupo con sus landings." },
          { left: "landing", right: "web_sesiones_diarias", on: "URL de entrada", purpose: "Medir sesiones y formularios pre/post." },
        ],
        metrics: [
          { name: "Conversión por grupo", definition: "Formularios divididos por sesiones en cada periodo.", calculation: "SUM(formularios) / SUM(sesiones)", calculatedIn: "sql", displayedAs: "Medición · resultado del experimento" },
          { name: "Cambio estimado", definition: "Diferencia entre el cambio de tratamiento y el cambio de control.", calculation: "(tratamiento_después - tratamiento_antes) - (control_después - control_antes)", calculatedIn: "application", displayedAs: "Medición · cambio estimado" },
        ],
        shownIn: [{ page: "Medición", component: "Resumen y tabla de experimentos" }, { page: "Ficha de landing", component: "Experimentos relacionados" }],
        resultRows: sampleExperimentId === null ? [] : this.workbenchRows([{
          experimento: stringValue(sampleExperiment?.name), tratamiento_antes: treatmentPre, tratamiento_despues: treatmentPost,
          control_antes: controlPre, control_despues: controlPost, cambio_estimado: didEstimate,
        }]),
        resultDescription: sampleExperimentId === null ? "No hay un experimento disponible para ejecutar el ejemplo." : "Resultado pre/post del experimento más reciente y cálculo aplicado por la API.",
        exclusions: ["Municipios no asignados al experimento", "Datos anteriores a la ventana de 90 días"],
        caveats: ["La demo no implementa una prueba estadística de tendencias paralelas ni significación; el resultado se etiqueta como descriptivo."],
      },
      {
        id: "traceability_coverage", area: "Medición", title: "Cobertura de trazabilidad entre eventos e identidad",
        question: "¿Qué porcentaje de eventos puede enlazarse con una persona seudónima o una oportunidad?",
        grain: "Un control global de trazabilidad", evidence: "quality",
        implementation: { endpoint: "GET /data-quality", method: "PrismaGrowthRepository.dataQuality" },
        statements: [{ title: "Eventos enlazados", purpose: "Cuenta eventos totales, no enlazados e identidades ambiguas.", sql: traceabilitySql, parameters: [] }],
        dataUsed: ["journey_event", "identity_map"],
        joins: [{ left: "journey_event.person_id / opportunity_id", right: "identity_map.person_id", on: "Identificadores seudónimos deterministas", purpose: "Separar eventos enlazados, no enlazados y ambiguos." }],
        metrics: [
          { name: "Eventos enlazados", definition: "Porcentaje de eventos con person_id u opportunity_id.", calculation: "(eventos totales - eventos no enlazados) / eventos totales", calculatedIn: "application", displayedAs: "Medición y Modelo de datos" },
          { name: "Identidades ambiguas", definition: "Identidades que el sistema conserva separadas por falta de coincidencia determinista.", calculation: "COUNT(identity_map WHERE ambiguous)", calculatedIn: "sql", displayedAs: "Medición · calidad del dato" },
        ],
        shownIn: [{ page: "Medición", component: "Eventos enlazados" }, { page: "Modelo de datos", component: "Cabecera y calidad" }],
        resultRows: this.workbenchRows([{
          eventos_totales: totalEvents, eventos_enlazados: totalEvents - unlinkedEvents, eventos_sin_enlace: unlinkedEvents,
          cobertura: round(rate(totalEvents - unlinkedEvents, totalEvents), 4), identidades_ambiguas: numberValue(traceability.ambiguous_identities),
        }]),
        resultDescription: "Control calculado sobre todos los eventos persistidos de la demo.",
        exclusions: ["Las identidades ambiguas no se fusionan", "No se infieren coincidencias probabilísticas"],
        caveats: ["Un evento no enlazado se conserva; no se imputa a una persona."],
      },
      {
        id: "quality_controls", area: "Calidad", title: "Integridad del embudo y maduración",
        question: "¿Los datos cumplen la cronología del embudo y qué SQL todavía no deben entrar en SQL → alta?",
        grain: "Un resultado por control", evidence: "quality",
        implementation: { endpoint: "GET /data-quality", method: "PrismaGrowthRepository.dataQuality" },
        statements: [
          { title: "Reglas de integridad", purpose: "Detecta fechas imposibles, altas huérfanas y clics orgánicos sin indexación.", sql: integritySql, parameters: [] },
          { title: "SQL pendientes de madurar", purpose: "Cuenta SQL elegibles con menos de 90 días desde fecha_sql.", sql: maturitySql, parameters: [] },
        ],
        dataUsed: ["lead", "care_opportunity", "landing", "gsc_diario", "motor_municipio"],
        joins: [
          { left: "lead", right: "care_opportunity", on: "lead_id", purpose: "Comprobar que cada alta pertenece a una oportunidad familiar." },
          { left: "gsc_diario", right: "landing", on: "URL", purpose: "Impedir clics orgánicos en landings no indexadas." },
          { left: "lead", right: "motor_municipio", on: "municipio_id", purpose: "Aplicar cobertura y capacidad al conjunto pendiente." },
        ],
        metrics: [
          { name: "Fallos de integridad", definition: "Suma de registros que incumplen invariantes del modelo.", calculation: "SUM(failures) de los cuatro controles", calculatedIn: "application", displayedAs: "Medición · fallos de integridad" },
          { name: "SQL pendientes de madurar", definition: "SQL elegibles con menos de 90 días; no entran en el denominador SQL → alta.", calculation: "COUNT(SQL WHERE fecha_sql > hoy - 90 días AND cobertura AND cuidadoras >= 8)", calculatedIn: "sql", displayedAs: "Medición · SQL pendientes de madurar" },
        ],
        shownIn: [{ page: "Medición", component: "Calidad del dato" }, { page: "Modelo de datos", component: "Reglas de integridad" }],
        resultRows: this.workbenchRows(qualityRows), resultDescription: "Un resultado por regla; cero significa que el control no encontró incidencias.",
        exclusions: ["Contactos de empleo de cuidadoras en el control de maduración", "SQL sin cobertura o con capacidad restringida"],
        caveats: ["Pendiente de madurar no significa fallo: evita comparar oportunidades que aún no han tenido tiempo de convertirse en alta."],
      },
    ];
    return {
      executionMode: "curated_read_only", generatedAt: new Date().toISOString(), queries,
      warning: "El catálogo solo ejecuta SQL de lectura definido en el servidor. No acepta SQL escrito por el usuario.",
    };
  }

  public async planning(): Promise<PlanningResponse> {
    const start = new Date("2026-11-16T00:00:00.000Z");
    const dateAtDay = (day: number): string => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + day - 1);
      return date.toISOString().slice(0, 10);
    };
    const recurringDates = (firstDay: number, lastDay: number, step: number): string[] => {
      const dates: string[] = [];
      for (let day = firstDay; day <= lastDay; day += step) dates.push(dateAtDay(day));
      return dates;
    };

    return {
      version: "qgi-90-day-operating-plan-v1.0.0",
      startDate: dateAtDay(1),
      endDate: dateAtDay(90),
      totalDays: 90,
      decisionMetric: "SQL familiares elegibles por municipio-semana",
      phases: [
        { id: "prepare", name: "Preparar y congelar", startDay: 1, endDay: 14, outcome: "Protocolo, elegibilidad, asignación e instrumentación aprobados.", owner: "Growth + Datos" },
        { id: "launch", name: "Publicar con control", startDay: 15, endDay: 28, outcome: "Primera ola publicada, indexada y trazable tras aprobación humana.", owner: "Marketing + Tech" },
        { id: "exposure", name: "Medir exposición", startDay: 29, endDay: 56, outcome: "Exposición estable sin declarar ganadores; incidencias y controles registrados.", owner: "Growth + Datos + Operaciones" },
        { id: "maturation", name: "Madurar y decidir", startDay: 57, endDay: 90, outcome: "Cohorte cerrada, lectura causal diagnosticada y decisión humana registrada.", owner: "Growth" },
      ],
      restrictions: [
        { id: "no_prices", rule: "No publicar precios.", evidence: "El manifiesto de contenido y la validación previa no contienen importes ni promesas económicas.", owner: "Marketing" },
        { id: "unique_qida_value", rule: "Cada landing debe aportar datos propios de Qida.", evidence: "La ficha conserva la instantánea municipal propia; no se publica si solo existe agregado provincial.", owner: "Datos + Marketing" },
        { id: "privacy_consent", rule: "No exponer datos personales, transcripciones ni testimonios sin consentimiento.", evidence: "La validación de privacidad pasa y cada testimonio publicado conserva una referencia de consentimiento.", owner: "Tech + Legal/Marketing" },
        { id: "marketing_approval", rule: "SEO y tono de marca requieren aprobación de Marketing.", evidence: "La versión aprobada, la persona revisora y la fecha quedan en el flujo y el registro de auditoría.", owner: "Dirección de Marketing" },
        { id: "no_health_claims", rule: "No hacer afirmaciones sanitarias.", evidence: "El control de contenido no detecta diagnósticos, resultados clínicos ni promesas de salud.", owner: "Marketing" },
        { id: "capacity_before_demand", rule: "No captar demanda sin cobertura y capacidad para atenderla.", evidence: "Operaciones confirma cobertura y umbral de cuidadoras antes de asignar y durante la exposición.", owner: "Operaciones" },
      ],
      meetings: [
        {
          id: "kickoff", name: "Inicio y congelación del protocolo", category: "decision", cadence: "Una vez · día 1", dates: [dateAtDay(1)], owner: "Growth",
          attendees: ["Growth", "Datos", "Marketing", "Tech", "Operaciones"],
          purpose: "Acordar qué decisión habilita la prueba y congelar hipótesis, unidad, métrica y responsabilidades.",
          inputs: ["Protocolo v0.1", "Clasificación de elegibilidad", "Matriz de responsabilidades", "Riesgos conocidos"],
          agenda: [
            { title: "Decisión y alcance", minutes: 5, content: "Abrir con la decisión de ampliar, modificar o detener; un servicio y municipio como unidad." },
            { title: "Hipótesis y métrica", minutes: 8, content: "Presentar SQL familiares elegibles por municipio-semana y separar mecanismos de guardarraíles." },
            { title: "Restricciones", minutes: 10, content: "Asignar dueño y evidencia exigida para las seis restricciones del caso." },
            { title: "Calendario y cierre", minutes: 7, content: "Confirmar hitos, foros, asistentes y decisiones pendientes con fecha." },
          ],
          decisions: ["Aprobar unidad experimental y métrica", "Aceptar el umbral de 15 % como hipótesis inicial", "Nombrar responsables"],
          outputs: ["Protocolo versionado", "Responsabilidades aprobadas", "Registro de decisiones"],
          restrictionIds: ["no_prices", "unique_qida_value", "privacy_consent", "marketing_approval", "no_health_claims", "capacity_before_demand"],
        },
        {
          id: "eligibility", name: "Revisión de elegibilidad y potencia", category: "control", cadence: "Una vez · día 5", dates: [dateAtDay(5)], owner: "Datos",
          attendees: ["Datos", "Growth", "Operaciones"], purpose: "Cerrar el conjunto candidato, los pares y el tipo de conclusión que permite la prueba.",
          inputs: ["12 semanas históricas", "Reglas de elegibilidad", "Simulación de potencia", "Mapa de campañas incompatibles"],
          agenda: [
            { title: "Población candidata", minutes: 8, content: "Mostrar exclusiones por dato propio, cobertura, capacidad, demanda y trazabilidad." },
            { title: "Emparejamiento", minutes: 8, content: "Comparar pares, solapamiento geográfico y equilibrio previo." },
            { title: "Potencia", minutes: 10, content: "Presentar probabilidad de detectar 15 % y etiquetar como experimento o piloto de viabilidad." },
            { title: "Decisión", minutes: 4, content: "Congelar conjunto, semilla y versión o devolver el diseño." },
          ],
          decisions: ["Aprobar conjunto y pares", "Clasificar experimento o piloto", "Congelar semilla y versión"],
          outputs: ["Asignación reproducible", "Informe de potencia", "Lista de exclusiones"],
          restrictionIds: ["unique_qida_value", "privacy_consent", "capacity_before_demand"],
        },
        {
          id: "content_gate", name: "Control de contenido, SEO y privacidad", category: "approval", cadence: "Antes de cada ola · días 12 y 26", dates: [dateAtDay(12), dateAtDay(26)], owner: "Marketing",
          attendees: ["Marketing", "Dirección de Marketing", "Tech", "Datos"], purpose: "Aprobar únicamente versiones útiles, verificables y seguras antes de publicación.",
          inputs: ["Landing versionada", "Instantánea de datos", "Informe SEO", "Validación de privacidad", "Consentimientos"],
          agenda: [
            { title: "Valor local", minutes: 8, content: "Demostrar qué datos propios diferencian la página y qué fallback queda excluido." },
            { title: "Contenido seguro", minutes: 8, content: "Revisar precios, PII, testimonios, afirmaciones sanitarias, cifras y tono." },
            { title: "SEO técnico", minutes: 7, content: "Revisar indexabilidad, canonical, hreflang, datos estructurados y riesgo de contenido en serie." },
            { title: "Aprobación", minutes: 7, content: "Aprobar una versión inmutable o devolver incidencias con responsable y fecha." },
          ],
          decisions: ["Aprobar o rechazar versión", "Autorizar indexación", "Registrar incidencias críticas"],
          outputs: ["Aprobación humana auditada", "Checklist SEO", "Informe de contenido y privacidad"],
          restrictionIds: ["no_prices", "unique_qida_value", "privacy_consent", "marketing_approval", "no_health_claims"],
        },
        {
          id: "launch_readiness", name: "Decisión de publicación", category: "decision", cadence: "Una vez · día 15", dates: [dateAtDay(15)], owner: "Tech",
          attendees: ["Tech", "Datos", "Marketing", "Operaciones", "Growth"], purpose: "Comprobar que publicación, medición y capacidad están listas antes de activar el grupo tratado.",
          inputs: ["Versión aprobada", "Eventos de prueba", "Asignación congelada", "Capacidad confirmada", "Plan de reversión"],
          agenda: [
            { title: "Publicación", minutes: 5, content: "Mostrar versión, URL, canonical, idioma y recibo esperado." },
            { title: "Medición", minutes: 8, content: "Reproducir sesión de prueba hasta CRM y verificar identidad no ambigua." },
            { title: "Operación", minutes: 7, content: "Confirmar cobertura, capacidad y umbral de parada." },
            { title: "Decisión", minutes: 5, content: "Registrar decisión, responsable, hora y condición de reversión." },
          ],
          decisions: ["Publicar, retrasar o cancelar", "Activar monitorización", "Confirmar reversión"],
          outputs: ["Recibo de publicación", "Prueba de instrumentación", "Decisión de publicación"],
          restrictionIds: ["privacy_consent", "marketing_approval", "capacity_before_demand"],
        },
        {
          id: "development_review", name: "Revisión de desarrollo", category: "working", cadence: "Semanal · 13 sesiones", dates: recurringDates(4, 88, 7), owner: "Tech",
          attendees: ["Tech", "Datos", "Growth"], purpose: "Mostrar el incremento que funciona, resolver dudas y cerrar el siguiente bloque de desarrollo.",
          inputs: ["Versión ejecutable", "Pruebas automáticas", "Dudas técnicas", "Bloqueos y dependencias"],
          agenda: [
            { title: "Demostración", minutes: 10, content: "Recorrer la funcionalidad terminada con datos de la API y comprobar el criterio de aceptación." },
            { title: "Calidad", minutes: 5, content: "Mostrar pruebas, errores abiertos y cualquier efecto sobre trazabilidad o privacidad." },
            { title: "Dudas", minutes: 10, content: "Resolver decisiones de producto, datos o integración que bloquean el siguiente incremento." },
            { title: "Siguiente entrega", minutes: 5, content: "Confirmar alcance, responsable y fecha de la próxima versión ejecutable." },
          ],
          decisions: ["Aceptar o corregir el incremento", "Resolver dudas de alcance", "Confirmar la siguiente entrega"],
          outputs: ["Incremento aceptado", "Dudas resueltas o escaladas", "Trabajo siguiente priorizado"],
          restrictionIds: ["privacy_consent", "capacity_before_demand"],
        },
        {
          id: "product_demo", name: "Demostración de producto", category: "working", cadence: "Quincenal · 6 sesiones", dates: recurringDates(14, 84, 14), owner: "Growth + Tech",
          attendees: ["Growth", "Tech", "Datos", "Marketing", "Operaciones"], purpose: "Presentar avances completos, recoger dudas de cada equipo y validar que la solución sirve para tomar decisiones.",
          inputs: ["Versión ejecutable", "Datos de demostración", "Cambios desde la sesión anterior", "Preguntas abiertas"],
          agenda: [
            { title: "Avance", minutes: 5, content: "Recordar qué se acordó y qué parte está terminada." },
            { title: "Recorrido", minutes: 15, content: "Usar la aplicación como lo haría Growth, desde la oportunidad hasta la medición." },
            { title: "Preguntas", minutes: 10, content: "Recoger dudas sobre datos, operación, contenido y uso diario." },
            { title: "Cierre", minutes: 5, content: "Aceptar el avance o registrar cambios con responsable y fecha." },
          ],
          decisions: ["Aceptar el avance", "Cambiar una prioridad", "Escalar una dependencia"],
          outputs: ["Acta de demostración", "Cambios priorizados", "Dudas con responsable"],
          restrictionIds: ["unique_qida_value", "privacy_consent", "marketing_approval", "capacity_before_demand"],
        },
        {
          id: "weekly", name: "Revisión semanal", category: "working", cadence: "Semanal · 12 sesiones", dates: recurringDates(8, 85, 7), owner: "Growth",
          attendees: ["Growth", "Datos", "Tech", "Operaciones", "Marketing"], purpose: "Resolver incidencias y vigilar la exposición sin declarar un ganador antes de madurez.",
          inputs: ["Calidad y trazabilidad", "Capacidad", "Indexación", "SQL por grupo", "Registro de incidencias"],
          agenda: [
            { title: "Datos", minutes: 5, content: "Empezar por frescura, eventos perdidos, identidad y contaminación." },
            { title: "Capacidad", minutes: 5, content: "Revisar cobertura, cuidadoras y municipios restringidos." },
            { title: "Exposición", minutes: 5, content: "Revisar publicación, indexación y alcance por grupo." },
            { title: "Métricas", minutes: 7, content: "Mostrar principal y mecanismos como lectura provisional, nunca como ganador." },
            { title: "Acciones", minutes: 3, content: "Cerrar responsables, fechas y motivos de cualquier parada temprana." },
          ],
          decisions: ["Continuar monitorizando", "Corregir medición", "Detener solo por seguridad, calidad, privacidad o capacidad"],
          outputs: ["Acta semanal", "Incidencias asignadas", "Decisiones auditadas"],
          restrictionIds: ["privacy_consent", "capacity_before_demand"],
        },
        {
          id: "data_clinic", name: "Clínica de datos e instrumentación", category: "control", cadence: "Semanal durante exposición · 8 sesiones", dates: recurringDates(5, 54, 7), owner: "Datos + Tech",
          attendees: ["Datos", "Tech"], purpose: "Resolver fallos de enlace, eventos, CRM e indexación antes de que invaliden la lectura.",
          inputs: ["Frescura", "Eventos sin enlace", "Discrepancias plataforma/CRM", "Errores de Search Console"],
          agenda: [
            { title: "Señales rojas", minutes: 5, content: "Ordenar por pérdida de trazabilidad y volumen afectado." },
            { title: "Diagnóstico", minutes: 10, content: "Seguir la clave seudónima desde landing hasta oportunidad CRM." },
            { title: "Reparación", minutes: 10, content: "Asignar corrección, recuperación permitida y prueba de regresión." },
            { title: "Cierre", minutes: 5, content: "Registrar impacto sobre la validez y contaminación." },
          ],
          decisions: ["Corregir o aceptar limitación", "Excluir periodo contaminado", "Escalar incidencia crítica"],
          outputs: ["Ticket técnico", "Evidencia de regresión", "Anotación de calidad"],
          restrictionIds: ["privacy_consent"],
        },
        {
          id: "capacity_review", name: "Revisión de capacidad", category: "control", cadence: "Quincenal · 6 sesiones", dates: recurringDates(10, 80, 14), owner: "Operaciones",
          attendees: ["Operaciones", "Growth", "Datos"], purpose: "Evitar que la captación supere la capacidad real del municipio o deteriore el servicio.",
          inputs: ["Cuidadoras disponibles 30d", "Cobertura", "SQL abiertos", "Descartes por capacidad"],
          agenda: [
            { title: "Mapa operativo", minutes: 7, content: "Mostrar capacidad y cobertura por municipio tratado." },
            { title: "Presión de demanda", minutes: 7, content: "Comparar SQL nuevos, cartera abierta y motivos de descarte." },
            { title: "Umbrales", minutes: 6, content: "Identificar municipios que cruzan restricción o requieren pausa." },
            { title: "Decisión", minutes: 5, content: "Mantener, limitar o pausar exposición con evidencia." },
          ],
          decisions: ["Mantener capacidad", "Restringir municipio", "Pausar captación"],
          outputs: ["Estado operativo por municipio", "Límites actualizados", "Decisión de pausa si aplica"],
          restrictionIds: ["capacity_before_demand"],
        },
        {
          id: "day30", name: "Revisión del día 30", category: "control", cadence: "Una vez · día 30", dates: [dateAtDay(30)], owner: "Growth + Datos",
          attendees: ["Growth", "Datos", "Marketing", "Tech", "Operaciones"], purpose: "Validar exposición y calidad sin tomar una decisión de impacto temprana.",
          inputs: ["Cuatro semanas de exposición", "Diagnósticos de datos", "Capacidad", "Indexación"],
          agenda: [
            { title: "Validez", minutes: 8, content: "Abrir con trazabilidad, contaminación y equilibrio de exposición." },
            { title: "Mecanismos", minutes: 8, content: "Mostrar impresiones, sesiones y tasas como señales provisionales." },
            { title: "Guardarraíles", minutes: 7, content: "Revisar capacidad, descartes e incidencias de publicación." },
            { title: "Siguientes 30 días", minutes: 7, content: "Acordar correcciones permitidas sin reescribir la hipótesis." },
          ],
          decisions: ["Continuar exposición", "Corregir instrumentación", "Parar por guardarraíl crítico"],
          outputs: ["Informe descriptivo", "Riesgos actualizados", "Acciones hasta día 60"],
          restrictionIds: ["privacy_consent", "capacity_before_demand"],
        },
        {
          id: "day60", name: "Revisión del día 60", category: "control", cadence: "Una vez · día 60", dates: [dateAtDay(60)], owner: "Datos",
          attendees: ["Datos", "Growth", "Operaciones", "Marketing"], purpose: "Cerrar exposición, congelar cohorte principal y comenzar la maduración de SQL.",
          inputs: ["Cohorte de días 1–56", "Estado de pares", "Pre-tendencias", "Guardarraíles"],
          agenda: [
            { title: "Cierre de cohorte", minutes: 7, content: "Confirmar qué leads entran y excluir los posteriores al día 56." },
            { title: "Diagnósticos", minutes: 10, content: "Mostrar tendencias previas, contaminación y pares extremos." },
            { title: "Lectura provisional", minutes: 8, content: "Separar descripción, atribución y estimación cuasi experimental." },
            { title: "Maduración", minutes: 5, content: "Congelar cambios y acordar seguimiento hasta el día 90." },
          ],
          decisions: ["Congelar cohorte", "Aceptar o limitar el análisis", "Definir sensibilidades"],
          outputs: ["Cohorte congelada", "Plan de análisis", "Registro de limitaciones"],
          restrictionIds: ["privacy_consent", "capacity_before_demand"],
        },
        {
          id: "day90", name: "Decisión día 90", category: "decision", cadence: "Una vez · día 90", dates: [dateAtDay(90)], owner: "Growth",
          attendees: ["Growth", "Dirección de Marketing", "Datos", "Operaciones", "Tech"], purpose: "Decidir continuar, modificar o detener usando evidencia madura y controles.",
          inputs: ["Diferencia en diferencias y diagnóstico", "Intervalos", "SQL→alta madura disponible", "Capacidad", "Incidencias", "Coste de escalar"],
          agenda: [
            { title: "Pregunta y protocolo", minutes: 5, content: "Recordar hipótesis y criterios congelados antes de mostrar resultados." },
            { title: "Validez", minutes: 8, content: "Presentar trazabilidad, tendencias previas, contaminación y sensibilidad." },
            { title: "Resultado", minutes: 10, content: "Mostrar efecto e intervalo; separar mecanismos, atribución y causalidad." },
            { title: "Guardarraíles", minutes: 7, content: "Revisar calidad comercial, capacidad y cumplimiento de publicación." },
            { title: "Decisión", minutes: 10, content: "Aplicar criterios de continuar, modificar o detener y registrar la siguiente hipótesis." },
          ],
          decisions: ["Continuar y ampliar", "Modificar y repetir", "Detener"],
          outputs: ["Decisión firmada", "Evidencia enlazada", "Siguiente versión o cierre"],
          restrictionIds: ["no_prices", "unique_qida_value", "privacy_consent", "marketing_approval", "no_health_claims", "capacity_before_demand"],
        },
      ],
    };
  }

  public async governance(): Promise<GovernanceResponse> {
    return {
      product: "Inteligencia de Growth de Qida",
      architectureStages: [
        { stage: 1, name: "Gobernar datos", purpose: "Actualizar y validar las tablas originales del motor sin cambiar su significado.", owner: "Datos", status: "existing", inputs: ["Fuentes de Qida", "Demanda pública", "Voz del cliente", "Competencia"], outputs: ["Tablas validadas en Databricks"] },
        { stage: 2, name: "Seleccionar", purpose: "Aplicar reglas versionadas de datos, cobertura, capacidad y demanda.", owner: "Growth + Datos", status: "demo", inputs: ["Tablas del motor", "Reglas de selección"], outputs: ["Municipios y servicios elegibles"] },
        { stage: 3, name: "Generar", purpose: "Crear una landing local desde una plantilla fija y una instantánea de datos.", owner: "Tech + Marketing", status: "existing", inputs: ["Candidato", "Instantánea de generación"], outputs: ["Borrador versionado", "Manifiesto de datos"] },
        { stage: 4, name: "Validar", purpose: "Comprobar privacidad, valor local, datos estructurados y SEO técnico.", owner: "Tech", status: "demo", inputs: ["Versión de landing", "Versión de políticas"], outputs: ["Resultado de validación"] },
        { stage: 5, name: "Aprobar", purpose: "Exigir una persona revisora de Marketing antes de publicar.", owner: "Marketing", status: "demo", inputs: ["Versión validada"], outputs: ["Aprobación auditada"] },
        { stage: 6, name: "Publicar", purpose: "Enviar a Strapi la versión aprobada e inmutable y guardar el recibo.", owner: "Tech", status: "proposed", inputs: ["Orden de publicación"], outputs: ["URL de qida.es", "Recibo de publicación"] },
        { stage: 7, name: "Medir", purpose: "Conciliar web, buscador, teléfono y CRM por municipio y cohorte.", owner: "Datos + Tech", status: "proposed", inputs: ["Analítica web y Search Console", "HubSpot/Odoo", "Aircall"], outputs: ["Resultado del experimento", "Controles de calidad"] },
        { stage: 8, name: "Decidir", purpose: "Registrar la decisión humana y la evidencia que la justifica.", owner: "Growth", status: "proposed", inputs: ["Resultado", "Capacidad", "Controles"], outputs: ["Decisión versionada", "Siguiente hipótesis"] },
      ],
      ownership: [
        { domain: "Motor, calidad y análisis", owner: "Datos", paths: ["Databricks", "prisma", "packages/analytics"], tools: ["Databricks", "Sigma/Metabase", "Vitest"] },
        { domain: "Fábrica, Strapi e instrumentación", owner: "Tech", paths: ["Fábrica de landings", "Strapi", "apps/api"], tools: ["AWS", "Strapi", "OpenAPI"] },
        { domain: "Contenido, tono y aprobación SEO", owner: "Marketing", paths: ["landing_version", "validation_run"], tools: ["Strapi", "Search Console", "Semrush"] },
        { domain: "Cobertura y capacidad", owner: "Operaciones", paths: ["motor_municipio", "reglas de selección"], tools: ["Odoo", "Acuerdo de nivel de servicio"] },
        { domain: "Cartera y decisiones", owner: "Growth", paths: ["apps/web", "landing_decision"], tools: ["Jira", "Slack", "Inteligencia de landings"] },
      ],
      integrations: [
        { name: "Motor de Databricks", mode: "existing", boundary: "Se representa en la demo local; no existe conexión remota." },
        { name: "Fábrica de landings", mode: "existing", boundary: "Los registros locales representan su versión y flujo de aprobación." },
        { name: "Analítica de demostración", mode: "existing", boundary: "Todas las métricas visibles proceden de datos sintéticos persistidos a través de la API." },
        { name: "Inicio de sesión empresarial", mode: "proposed", boundary: "Sustituirá el rol local por identidad y permisos verificados." },
        { name: "Publicación en Strapi", mode: "simulated", boundary: "La publicación solo cambia el estado local auditado." },
        { name: "Generación con modelo de lenguaje", mode: "simulated", boundary: "El borrador es determinista y usa datos estructurados persistidos." },
        { name: "Analítica y CRM de producción", mode: "proposed", boundary: "Conectará analítica, HubSpot, Odoo y Aircall con claves seudónimas." },
      ],
      controls: {
        validation: ["Zod en los límites HTTP", "Paginación y coeficientes acotados", "SQL parametrizado y revisado", "Controles de cobertura, capacidad y contenido"],
        monitoring: ["Retraso de actualización", "Identidades sin enlace o ambiguas", "Integridad de fechas y referencias", "Diferencias entre plataforma y CRM", "Cohortes sin madurar"],
        approval: "Una persona con rol autorizado debe aprobar antes de la publicación simulada; cada cambio genera un identificador de auditoría.",
        privacy: "Solo se exponen identidades sintéticas y seudónimas; los identificadores de origen se protegen y no aparecen en los registros.",
        evidenceLabels: [
          { label: "correlation", meaning: "Dos variables se mueven juntas sin asignar crédito ni causa." },
          { label: "attribution", meaning: "Una regla asigna la conversión a un canal observado." },
          { label: "causal", meaning: "Resultado de un diseño experimental o cuasiexperimental con controles válidos." },
        ],
      },
    };
  }

  private workbenchRows(rows: Array<Record<string, unknown>>): Array<Record<string, string | number | boolean | null>> {
    return rows.map((row) => {
      const entries: Array<[string, string | number | boolean | null]> = Object.entries(row).map(([key, value]) => {
        if (value === null || typeof value === "string" || typeof value === "boolean") return [key, value];
        if (value instanceof Date) return [key, value.toISOString()];
        return [key, numberValue(value)];
      });
      return Object.fromEntries(entries);
    });
  }
}

type ExperimentAnalysis = {
  observedDifference: number | null;
  didEstimate: number | null;
  preTrendDifference: number | null;
  treatmentSample: number;
  controlSample: number;
};
