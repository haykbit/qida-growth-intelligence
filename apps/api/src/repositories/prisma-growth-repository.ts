import { createHash, randomUUID } from "node:crypto";
import type {
  JourneyDetail,
  JourneySummary,
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
  LandingRecord,
  LandingReviewInput,
  PageRequest,
  SeoRow,
  StrategyAssumptions,
  StrategyBet,
  StrategyResponse,
  WorkbenchQuery,
  WorkbenchResponse,
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

type LeadAliases = { lead: string; municipality: string };

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
  const confidence = round(numberValue(row.confidence, 0.5), 3);
  const eligibility: OpportunityRow["eligibility"] = !coverage ? "ineligible" : caregivers < 8 ? "constrained" : "eligible";
  return {
    municipalityId: stringValue(row.municipio_id),
    municipality: stringValue(row.municipality),
    province: stringValue(row.province),
    service: stringValue(row.service),
    monthlySearches: Math.round(numberValue(row.monthly_searches)),
    estimatedCpc: round(numberValue(row.estimated_cpc), 2),
    sql: Math.round(numberValue(row.sql_count)),
    altas: Math.round(numberValue(row.alta_count)),
    sqlToAlta: round(rate(numberValue(row.alta_count), numberValue(row.sql_count))),
    caregiversAvailable: caregivers,
    coverage,
    voiceSignals: Math.round(numberValue(row.voice_signals)),
    competitors: Math.round(numberValue(row.competitors)),
    score: round(numberValue(row.score), 1),
    eligibility,
    confidence,
  };
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
    const [summaryRows, monthlyRows, channelRows, municipalityRows, discardRows, opportunities] = await Promise.all([
      this.query(
        `SELECT COUNT(*)::int AS leads,
          COUNT(*) FILTER (WHERE l.es_sql)::int AS sql_count,
          COUNT(*) FILTER (WHERE l.es_alta)::int AS alta_count,
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
      this.aggregateFunnel(filters, "to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM')", "period"),
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
    return {
      kpis: {
        leads,
        sql,
        altas,
        leadToSql: round(rate(sql, leads)),
        sqlToAlta: round(rate(altas, sql)),
        costPerSql: round(rate(spend, sql), 2),
        costPerAttributedAlta: round(rate(spend, altas), 2),
        traceabilityCoverage: round(rate(numberValue(summary.traced), leads)),
        duplicates: numberValue(summary.duplicates),
        opportunityMunicipalities: numberValue(summary.opportunity_municipalities),
        capacityConstrainedMunicipalities: numberValue(summary.constrained_municipalities),
      },
      monthlyFunnel: monthlyRows.map((row) => ({
        period: stringValue(row.period), leads: numberValue(row.leads), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      })),
      channelFunnel: channelRows.map((row) => ({
        period: stringValue(row.channel), channel: stringValue(row.channel), leads: numberValue(row.leads), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      })),
      altasByMunicipality: municipalityRows.map((row) => ({ name: stringValue(row.name, "Sin municipio"), value: numberValue(row.value) })),
      opportunityRanking: opportunities.items,
      discardReasons: discardRows.map((row) => ({ name: stringValue(row.name), value: numberValue(row.value) })),
      caveats: [
        "Channel views are descriptive attribution and do not establish causal impact.",
        "SQL to alta conversion should be interpreted on mature cohorts.",
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
                AVG(cpc_estimado_eur)::double precision AS estimated_cpc
         FROM motor_demanda_busqueda
         ${input.from === undefined && input.to === undefined ? "" : `WHERE ${[
           input.from === undefined ? null : `mes >= ${builder.add(input.from)}::date`,
           input.to === undefined ? null : `mes <= ${builder.add(input.to)}::date`,
         ].filter((value): value is string => value !== null).join(" AND ")}`}
         GROUP BY municipio_id, tema
       ), lead_stats AS (
         SELECT municipio_id, servicio,
                COUNT(*) FILTER (WHERE es_sql)::int AS sql_count,
                COUNT(*) FILTER (WHERE es_alta)::int AS alta_count
         FROM lead WHERE tipo_contacto <> 'cuidadora_empleo'
         GROUP BY municipio_id, servicio
       ), voice AS (
         SELECT municipio_id, tema, SUM(llamadas)::int AS voice_signals
         FROM motor_voz_cliente GROUP BY municipio_id, tema
       ), competition AS (
         SELECT municipio_id, COUNT(*)::int AS competitors FROM motor_competencia GROUP BY municipio_id
       ), base AS (
         SELECT m.municipio_id, m.nombre AS municipality, m.provincia AS province, d.tema AS service,
                d.monthly_searches, d.estimated_cpc,
                COALESCE(ls.sql_count, 0)::int AS sql_count, COALESCE(ls.alta_count, 0)::int AS alta_count,
                m.cuidadoras_disponibles_30d AS caregivers_available,
                (m.tiene_cobertura AND d.tema = ANY(m.servicios_cubiertos)) AS coverage,
                COALESCE(v.voice_signals, 0)::int AS voice_signals,
                COALESCE(c.competitors, 0)::int AS competitors,
                LEAST(1.0, 0.45 + CASE WHEN m.datos_propios THEN 0.35 ELSE 0 END + CASE WHEN v.voice_signals > 0 THEN 0.2 ELSE 0 END)::double precision AS confidence
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
           )) * confidence END::double precision AS score
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
      factor("demand", "Search demand", Math.min(row.monthlySearches / 700, 1), 0.35, demand, `${row.monthlySearches} average monthly searches`),
      factor("capture_gap", "Demand-to-SQL gap", Math.min(gap / 25, 1), 0.25, gap, `${row.sql} SQL against observed demand`),
      factor("capacity", "Operational capacity", Math.min(row.caregiversAvailable / 40, 1), 0.2, capacity, `${row.caregiversAvailable} caregivers available in 30 days`),
      factor("voice", "Unmet-need signals", Math.min(row.voiceSignals / 100, 1), 0.1, voice, `${row.voiceSignals} synthetic voice-of-customer calls`),
      factor("conversion", "Conversion opportunity", 1 - row.sqlToAlta, 0.1, conversion, `${round(row.sqlToAlta * 100, 1)}% SQL-to-alta conversion`),
    ];
    const constraints = [
      ...(!row.coverage ? ["Service is not covered in this municipality"] : []),
      ...(row.caregiversAvailable < 8 ? ["Caregiver capacity is constrained"] : []),
      ...(row.confidence < 0.7 ? ["Limited first-party evidence lowers confidence"] : []),
    ];
    return {
      ...row,
      factors,
      constraints,
      proposedAction: row.eligibility === "eligible"
        ? `Test a local ${row.service} acquisition initiative with a capped budget.`
        : "Resolve coverage or capacity constraints before increasing acquisition.",
      validationMetric: "Mature-cohort incremental SQL per eligible municipality",
      rulesVersion: "opportunity-rules-v1",
      disclaimer: "This rules-based score prioritizes validation; it is not a validated prediction or causal estimate.",
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
      clauses.push(`(co.opportunity_id ILIKE ${search} OR co.person_id ILIKE ${search} OR m.nombre ILIKE ${search})`);
    }
    const where = clauses.length > 0 ? `WHERE ${clauses.join(" AND ")}` : "";
    const limit = builder.add(input.pageSize);
    const offset = builder.add((input.page - 1) * input.pageSize);
    const rows = await this.query(
      `SELECT co.opportunity_id, co.person_id, m.nombre AS municipality, co.servicio AS service,
              co.status, co.created_at,
              GREATEST(COUNT(DISTINCT im.identity_id) - 1, 0)::int AS duplicate_count,
              COALESCE(MIN(im.confidence), 0)::double precision AS identity_confidence,
              COUNT(*) OVER()::int AS total
       FROM care_opportunity co JOIN motor_municipio m ON m.municipio_id = co.municipio_id
       LEFT JOIN identity_map im ON im.person_id = co.person_id
       ${where}
       GROUP BY co.opportunity_id, co.person_id, m.nombre, co.servicio, co.status, co.created_at
       ORDER BY co.created_at DESC, co.opportunity_id LIMIT ${limit} OFFSET ${offset}`,
      builder.values,
    );
    return {
      items: rows.map((row) => ({
        opportunityId: stringValue(row.opportunity_id),
        personId: stringValue(row.person_id),
        municipality: stringValue(row.municipality),
        service: stringValue(row.service),
        status: stringValue(row.status),
        createdAt: isoValue(row.created_at),
        duplicateCount: numberValue(row.duplicate_count),
        identityConfidence: round(numberValue(row.identity_confidence), 3),
      })),
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
        `SELECT event_id, event_type, occurred_at, channel, campaign, landing_url, source_system,
                identity_confidence, metadata
         FROM journey_event WHERE opportunity_id = $1 ORDER BY occurred_at, event_id`,
        [opportunityId],
      ),
      this.query(
        `SELECT source_system, source_identifier, match_method, confidence, ambiguous
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
        identityConfidence: row.identity_confidence === null ? null : round(numberValue(row.identity_confidence), 3),
        metadata,
      };
    });
    const touches = new Map<string, number>();
    for (const event of events) {
      if (event.channel !== null) touches.set(event.channel, (touches.get(event.channel) ?? 0) + 1);
    }
    return {
      ...summary,
      events,
      identities: identityRows.map((row) => ({
        sourceSystem: stringValue(row.source_system),
        pseudonym: createHash("sha256").update(stringValue(row.source_identifier)).digest("hex").slice(0, 12),
        method: stringValue(row.match_method),
        confidence: round(numberValue(row.confidence), 3),
        ambiguous: booleanValue(row.ambiguous),
      })),
      attribution: {
        firstTouch: events.find((event) => event.channel !== null)?.channel ?? null,
        lastTouch: [...events].reverse().find((event) => event.channel !== null)?.channel ?? null,
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
        return { type: stringValue(item.type), heading: stringValue(item.heading), body: stringValue(item.body) };
      }),
      generatedFrom: {
        municipalityId: stringValue(jsonRecord(contentRaw.generatedFrom).municipalityId),
        service: stringValue(jsonRecord(contentRaw.generatedFrom).service),
        language,
      },
    };
    return {
      url: stringValue(row.url), municipalityId: nullableString(row.municipality_id), municipality: nullableString(row.municipality),
      language, origin, service: nullableString(row.service), status,
      publishedAt: nullableIso(row.published_at), indexedAt: nullableIso(row.indexed_at),
      sessions: numberValue(row.sessions), forms: numberValue(row.forms), sql: numberValue(row.sql_count), altas: numberValue(row.alta_count),
      impressions: numberValue(row.impressions), clicks: numberValue(row.clicks),
      ...(content === undefined ? {} : { content }),
      validationIssues: stringArray(row.validation_issues),
    };
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
    const leadClauses = ["tipo_contacto <> 'cuidadora_empleo'"];
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
         SELECT DISTINCT je.campaign, co.lead_id
         FROM journey_event je JOIN care_opportunity co ON co.opportunity_id = je.opportunity_id
         WHERE je.campaign IS NOT NULL AND co.lead_id IS NOT NULL
       ), crm AS (
         SELECT cl.campaign, COUNT(*) FILTER (WHERE l.es_sql)::int AS crm_sql,
                COUNT(*) FILTER (WHERE l.es_alta)::int AS crm_altas
         FROM campaign_leads cl JOIN lead l ON l.lead_id = cl.lead_id
         WHERE l.tipo_contacto <> 'cuidadora_empleo' GROUP BY cl.campaign
       )
       SELECT p.*, COALESCE(c.crm_sql, 0)::int AS crm_sql, COALESCE(c.crm_altas, 0)::int AS crm_altas
       FROM paid p LEFT JOIN crm c ON c.campaign = p.campania
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
      const analysis = await this.experimentAnalysis(id);
      return this.experimentSummaryFromRow(row, analysis);
    }));
    return { items, page: input.page, pageSize: input.pageSize, total: numberValue(rows[0]?.total) };
  }

  private experimentSummaryFromRow(row: Record<string, unknown>, analysis: ExperimentAnalysis): ExperimentSummary {
    const minimumSamplePass = analysis.treatmentSample >= 30 && analysis.controlSample >= 30;
    const parallelTrendsPass = analysis.preTrendDifference === null ? null : Math.abs(analysis.preTrendDifference) <= 0.1;
    const eligibleForDid = minimumSamplePass && parallelTrendsPass === true && analysis.didEstimate !== null;
    const limitations = [
      ...(!minimumSamplePass ? ["At least one variant has fewer than 30 mature opportunities"] : []),
      ...(parallelTrendsPass === false ? ["Pre-period trends differ beyond the 10% diagnostic threshold"] : []),
      ...(analysis.didEstimate === null ? ["Insufficient pre/post outcome data for Difference-in-Differences"] : []),
      "No automatic claim of statistical significance or causality is made.",
    ];
    return {
      id: stringValue(row.experiment_id), name: stringValue(row.name), hypothesis: stringValue(row.hypothesis),
      startDate: isoValue(row.start_date).slice(0, 10), endDate: nullableIso(row.end_date)?.slice(0, 10) ?? null,
      status: stringValue(row.status), primaryMetric: stringValue(row.primary_metric), methodology: stringValue(row.methodology),
      treatmentMunicipalities: numberValue(row.treatment_count), controlMunicipalities: numberValue(row.control_count),
      observedDifference: analysis.observedDifference, didEstimate: analysis.didEstimate,
      evidenceLevel: eligibleForDid ? "quasi_experimental" : "descriptive", limitations,
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
    const [assignmentRows, seriesRows, analysis] = await Promise.all([
      this.query(
        `SELECT ea.municipio_id, m.nombre AS municipality, ea.variant, ea.assigned_at
         FROM experiment_assignment ea JOIN motor_municipio m ON m.municipio_id = ea.municipio_id
         WHERE ea.experiment_id = $1 ORDER BY ea.variant, m.nombre`,
        [id],
      ),
      this.query(
        `SELECT to_char(date_trunc('month', l.fecha_creacion), 'YYYY-MM') AS period, ea.variant,
                COUNT(*) FILTER (WHERE l.es_alta)::double precision / NULLIF(COUNT(*) FILTER (WHERE l.es_sql), 0) AS value,
                COUNT(*) FILTER (WHERE l.es_sql)::int AS sample_size
         FROM growth_experiment ge JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
         JOIN lead l ON l.municipio_id = ea.municipio_id AND l.tipo_contacto <> 'cuidadora_empleo'
         WHERE ge.experiment_id = $1
         GROUP BY 1, ea.variant ORDER BY 1, ea.variant`,
        [id],
      ),
      this.experimentAnalysis(id),
    ]);
    const summary = this.experimentSummaryFromRow(row, analysis);
    return {
      ...summary,
      assignments: assignmentRows.map((item) => ({
        municipalityId: stringValue(item.municipio_id), municipality: stringValue(item.municipality),
        variant: stringValue(item.variant), assignedAt: isoValue(item.assigned_at),
      })),
      series: seriesRows.map((item) => ({
        period: stringValue(item.period), variant: stringValue(item.variant), value: round(numberValue(item.value)), sampleSize: numberValue(item.sample_size),
      })),
      diagnostics: {
        parallelTrendsPass: analysis.preTrendDifference === null ? null : Math.abs(analysis.preTrendDifference) <= 0.1,
        minimumSamplePass: analysis.treatmentSample >= 30 && analysis.controlSample >= 30,
        preTrendDifference: analysis.preTrendDifference,
      },
    };
  }

  private async experimentAnalysis(id: string): Promise<ExperimentAnalysis> {
    const rows = await this.query(
      `WITH outcomes AS (
         SELECT ea.variant,
                CASE WHEN l.fecha_creacion < ge.start_date THEN 'pre' ELSE 'post' END AS period,
                COUNT(*) FILTER (WHERE l.es_alta)::double precision / NULLIF(COUNT(*) FILTER (WHERE l.es_sql), 0) AS conversion,
                COUNT(*) FILTER (WHERE l.es_sql)::int AS sample_size
         FROM growth_experiment ge JOIN experiment_assignment ea ON ea.experiment_id = ge.experiment_id
         JOIN lead l ON l.municipio_id = ea.municipio_id AND l.tipo_contacto <> 'cuidadora_empleo'
         WHERE ge.experiment_id = $1
           AND l.fecha_creacion >= ge.start_date - interval '90 days'
           AND l.fecha_creacion <= COALESCE(ge.end_date, CURRENT_DATE)
         GROUP BY ea.variant, 2
       ) SELECT * FROM outcomes`,
      [id],
    );
    const value = (variant: string, period: string): number | null => {
      const row = rows.find((item) => item.variant === variant && item.period === period);
      return row === undefined || row.conversion === null ? null : numberValue(row.conversion);
    };
    const sample = (variant: string): number => rows.filter((item) => item.variant === variant).reduce((sum, item) => sum + numberValue(item.sample_size), 0);
    const treatmentPre = value("treatment", "pre");
    const treatmentPost = value("treatment", "post");
    const controlPre = value("control", "pre");
    const controlPost = value("control", "post");
    return {
      observedDifference: treatmentPost === null || controlPost === null ? null : round(treatmentPost - controlPost),
      didEstimate: treatmentPre === null || treatmentPost === null || controlPre === null || controlPost === null
        ? null : round((treatmentPost - treatmentPre) - (controlPost - controlPre)),
      preTrendDifference: treatmentPre === null || controlPre === null ? null : round(treatmentPre - controlPre),
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
        `SELECT a.plataforma AS metric, SUM(a.conversiones_plataforma)::int AS platform,
                COALESCE(COUNT(DISTINCT co.lead_id) FILTER (WHERE l.es_sql), 0)::int AS crm
         FROM ads_diario a LEFT JOIN journey_event je ON je.campaign = a.campania
         LEFT JOIN care_opportunity co ON co.opportunity_id = je.opportunity_id
         LEFT JOIN lead l ON l.lead_id = co.lead_id
         GROUP BY a.plataforma`,
      ),
      this.query(
        `SELECT COUNT(DISTINCT date_trunc('month', fecha_creacion))::int AS count
         FROM lead WHERE fecha_creacion >= CURRENT_DATE - interval '90 days' AND tipo_contacto <> 'cuidadora_empleo'`,
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
      immatureCohorts: numberValue(immatureRows[0]?.count),
      limitations: ["Late events and intentionally incomplete attribution are retained rather than imputed."],
      monitoringSignals: [
        { signal: "unlinked_event_rate", value: round(rate(numberValue(identity.unlinked_events), totalEvents)), threshold: 0.15, status: rate(numberValue(identity.unlinked_events), totalEvents) <= 0.15 ? "ok" : "attention" },
        { signal: "integrity_failures", value: integrityRows.reduce((sum, row) => sum + numberValue(row.failures), 0), threshold: 0, status: integrityRows.every((row) => numberValue(row.failures) === 0) ? "ok" : "attention" },
        { signal: "ambiguous_identity_rate", value: round(rate(numberValue(identity.ambiguous_identities), totalEvents)), threshold: 0.05, status: rate(numberValue(identity.ambiguous_identities), totalEvents) <= 0.05 ? "ok" : "attention" },
      ],
    };
  }

  public async strategy(assumptions: StrategyAssumptions): Promise<StrategyResponse> {
    const [opportunities, observedRows] = await Promise.all([
      this.opportunities({ page: 1, pageSize: 100 }),
      this.query(
        `SELECT COUNT(*) FILTER (WHERE es_sql)::int AS sql_count
         FROM lead WHERE tipo_contacto <> 'cuidadora_empleo'
           AND fecha_creacion >= (SELECT MAX(fecha_creacion) - interval '30 days' FROM lead)`,
      ),
    ]);
    const makeBet = (row: OpportunityRow, rank: number): StrategyBet => {
      const eligible = row.eligibility === "eligible";
      const potentialLeads = row.monthlySearches * assumptions.demandCaptureRate * assumptions.months;
      const capacityFactor = eligible ? assumptions.capacityUtilization : 0;
      const incrementalSql = round(potentialLeads * assumptions.leadToSqlRate * capacityFactor, 1);
      const incrementalAltas = round(incrementalSql * assumptions.sqlToAltaRate, 1);
      const highImpact = incrementalSql >= 10;
      return {
        rank, municipalityId: row.municipalityId, municipality: row.municipality, service: row.service,
        decision: eligible ? "prioritize" : "reject",
        reason: eligible ? "Coverage, capacity and persisted demand pass the v1 eligibility rules." : row.eligibility === "constrained" ? "Capacity constraint blocks responsible acquisition scaling." : "Coverage rule makes the municipality/service ineligible.",
        impact: highImpact ? "high" : incrementalSql >= 4 ? "medium" : "low",
        effort: row.competitors >= 5 || row.estimatedCpc >= 3 ? "high" : row.competitors >= 2 ? "medium" : "low",
        confidence: row.confidence,
        dependencies: ["Landing policy review", "CRM campaign tagging", ...(row.caregiversAvailable < 12 ? ["Capacity confirmation"] : [])],
        owner: eligible ? "Growth + Local Operations" : "Local Operations",
        estimatedIncrementalSql: incrementalSql, estimatedIncrementalAltas: incrementalAltas,
        hypothesis: `A local ${row.service} test in ${row.municipality} can convert a bounded share of observed demand into eligible SQL.`,
        mvp: "Launch one reviewed landing and one geo-targeted campaign with a capped budget and holdout comparison.",
        exclusions: ["Caregiver job contacts", "Immature cohorts", "Unlinked CRM conversions"],
        successCriteria: ["Policy-safe published landing", "Traceability coverage at or above 85%", `At least ${Math.max(3, Math.ceil(incrementalSql))} incremental SQL over the test window`],
        decisionCriteria: {
          continue: "Incremental SQL meets target, cohort matures, and capacity SLA remains healthy.",
          modify: "Demand is observed but conversion, traceability, or creative performance misses target.",
          stop: "No incremental eligible SQL, policy failure, or sustained capacity constraint.",
        },
      };
    };
    const bets = opportunities.items.map((row, index) => makeBet(row, index + 1));
    const prioritizedBets = bets.filter((bet) => bet.decision === "prioritize").slice(0, 12);
    const rejectedBets = bets.filter((bet) => bet.decision === "reject").slice(0, 12);
    return {
      label: "Synthetic planning demonstration — not a forecast",
      baseline: { sqlPerMonth: 2000, source: "planning_brief", observedFilteredSql: numberValue(observedRows[0]?.sql_count) },
      assumptions,
      scenarios: {
        conservative: { demandCaptureRate: 0.015, leadToSqlRate: 0.35, sqlToAltaRate: 0.12, capacityUtilization: 0.5 },
        base: { demandCaptureRate: 0.025, leadToSqlRate: 0.42, sqlToAltaRate: 0.18, capacityUtilization: 0.7 },
        optimistic: { demandCaptureRate: 0.04, leadToSqlRate: 0.5, sqlToAltaRate: 0.24, capacityUtilization: 0.85 },
      },
      portfolioEstimate: {
        incrementalSql: round(prioritizedBets.reduce((sum, bet) => sum + bet.estimatedIncrementalSql, 0), 1),
        incrementalAltas: round(prioritizedBets.reduce((sum, bet) => sum + bet.estimatedIncrementalAltas, 0), 1),
        periodMonths: assumptions.months,
      },
      prioritizedBets, rejectedBets,
      milestones: {
        first90Days: ["Confirm capacity and tracking for the first three bets", "Publish policy-reviewed landing MVPs", "Run geo holdouts and weekly quality checks", "Read only mature eligible cohorts"],
        sixMonths: ["Scale only bets meeting continue criteria", "Document modified and stopped bets", "Refresh opportunity ranking from persisted outcomes", "Review portfolio incrementality and operational load"],
      },
      caveats: [
        "Coefficients are editable, bounded planning assumptions applied to synthetic data; they are not learned model parameters.",
        "Incremental estimates are scenario arithmetic, not causal forecasts. Experiments and holdouts are required for validation.",
      ],
    };
  }

  public async workbench(): Promise<WorkbenchResponse> {
    const municipalitySql = `SELECT m.municipio_id, m.nombre, m.provincia, m.tiene_cobertura,
       m.cuidadoras_disponibles_30d,
       ROUND(AVG(d.busquedas)) AS busquedas_mensuales,
       COUNT(DISTINCT l.lead_id) FILTER (WHERE l.es_sql) AS sql,
       COUNT(DISTINCT l.lead_id) FILTER (WHERE l.es_alta) AS altas
FROM motor_municipio m
JOIN motor_demanda_busqueda d ON d.municipio_id = m.municipio_id
LEFT JOIN lead l ON l.municipio_id = m.municipio_id AND l.tipo_contacto <> 'cuidadora_empleo'
GROUP BY m.municipio_id, m.nombre, m.provincia, m.tiene_cobertura, m.cuidadoras_disponibles_30d
ORDER BY busquedas_mensuales DESC, sql ASC LIMIT 20`;
    const landingSql = `WITH web AS (
  SELECT url_entrada, SUM(sesiones) AS sesiones, SUM(formularios) AS formularios
  FROM web_sesiones_diarias GROUP BY url_entrada
), crm AS (
  SELECT url_entrada,
         COUNT(*) FILTER (WHERE es_sql) AS sql,
         COUNT(*) FILTER (WHERE es_alta) AS altas
  FROM lead WHERE tipo_contacto <> 'cuidadora_empleo' GROUP BY url_entrada
)
SELECT l.origen, DATE_TRUNC('quarter', l.fecha_publicacion) AS cohorte,
       COUNT(*) AS landings, SUM(COALESCE(web.sesiones, 0)) AS sesiones,
       SUM(COALESCE(web.formularios, 0)) AS formularios,
       SUM(COALESCE(crm.sql, 0)) AS sql, SUM(COALESCE(crm.altas, 0)) AS altas
FROM landing l LEFT JOIN web ON web.url_entrada = l.url LEFT JOIN crm ON crm.url_entrada = l.url
WHERE l.fecha_publicacion IS NOT NULL
GROUP BY l.origen, DATE_TRUNC('quarter', l.fecha_publicacion)
ORDER BY cohorte, l.origen`;
    const qualitySql = `SELECT m.municipio_id, m.nombre, m.tiene_cobertura,
       COUNT(DISTINCT l.lead_id) AS leads,
       COUNT(DISTINCT l.lead_id) FILTER (WHERE l.motivo_descarte IS NOT NULL) AS descartes,
       COUNT(DISTINCT im.identity_id) - COUNT(DISTINCT im.person_id) AS enlaces_duplicados,
       COUNT(DISTINCT l.lead_id) FILTER (WHERE l.url_entrada IS NULL) AS sin_atribucion
FROM motor_municipio m
LEFT JOIN lead l ON l.municipio_id = m.municipio_id AND l.tipo_contacto <> 'cuidadora_empleo'
LEFT JOIN care_opportunity co ON co.lead_id = l.lead_id
LEFT JOIN identity_map im ON im.person_id = co.person_id
GROUP BY m.municipio_id, m.nombre, m.tiene_cobertura
ORDER BY descartes DESC, sin_atribucion DESC LIMIT 20`;
    const [municipalityRows, landingRows, qualityRows] = await Promise.all([
      this.query(municipalitySql), this.query(landingSql), this.query(qualitySql),
    ]);
    const queries: WorkbenchQuery[] = [
      {
        id: "municipality_prioritization", title: "Municipality prioritization", objective: "Find demand-rich municipalities with weak SQL capture while respecting coverage and capacity.",
        sql: municipalitySql, dataUsed: ["motor_municipio", "motor_demanda_busqueda", "lead"], resultRows: this.workbenchRows(municipalityRows),
        interpretation: "High search demand plus low SQL can indicate an acquisition gap, but coverage and caregiver capacity remain eligibility gates.",
        recommendedDecision: "Validate the highest eligible gaps with a capped local acquisition test.", proposedExtensionsUsed: [],
      },
      {
        id: "landing_cohort_outcomes", title: "Comparable landing cohorts", objective: "Compare manual and generated landing outcomes within publication cohorts.",
        sql: landingSql, dataUsed: ["landing", "web_sesiones_diarias", "lead"], resultRows: this.workbenchRows(landingRows),
        interpretation: "Cohort grouping makes descriptive comparison more comparable, but origin is not randomized and causality is not identified.",
        recommendedDecision: "Use the comparison to select an experiment hypothesis, not to declare generated pages superior.", proposedExtensionsUsed: [],
      },
      {
        id: "quality_and_losses", title: "Quality and funnel losses", objective: "Locate discards, duplicate identity links, coverage gaps and missing landing attribution.",
        sql: qualitySql, dataUsed: ["motor_municipio", "lead", "care_opportunity", "identity_map"], resultRows: this.workbenchRows(qualityRows),
        interpretation: "Losses mix operational constraints and measurement gaps; duplicate links are surfaced without probabilistic merging.",
        recommendedDecision: "Fix high-volume attribution gaps first, then separate capacity losses from acquisition losses.", proposedExtensionsUsed: ["care_opportunity", "identity_map"],
      },
    ];
    return {
      executionMode: "curated_read_only", generatedAt: new Date().toISOString(), queries,
      warning: "Only server-curated SELECT statements are executable; the API does not accept or execute user-provided SQL.",
    };
  }

  public async governance(): Promise<GovernanceResponse> {
    return {
      product: "Qida Growth Intelligence",
      architectureStages: [
        { stage: 1, name: "Persist", purpose: "Store coherent synthetic source and extension data.", inputs: ["Deterministic seed"], outputs: ["PostgreSQL source of truth"] },
        { stage: 2, name: "Resolve and measure", purpose: "Link explicit identities and calculate governed metrics.", inputs: ["CRM, web, ads, SEO, operations"], outputs: ["Journeys, cohorts, attribution, quality"] },
        { stage: 3, name: "Prioritize", purpose: "Rank eligible municipality/service opportunities with explanations.", inputs: ["Demand, capacity, conversion, confidence"], outputs: ["Versioned rule scores and constraints"] },
        { stage: 4, name: "Act safely", purpose: "Run bounded experiments and simulated landing publication.", inputs: ["Prioritized bets", "Human review"], outputs: ["Audited decisions and outcomes"] },
      ],
      ownership: [
        { domain: "Source data and seed", owner: "Data / Analytics", paths: ["prisma", "packages/analytics"], tools: ["Prisma", "PostgreSQL", "Vitest"] },
        { domain: "Transport and persistence orchestration", owner: "Backend", paths: ["apps/api"], tools: ["Express", "Zod", "Pino", "OpenAPI"] },
        { domain: "Decision surfaces", owner: "Growth Product", paths: ["apps/web"], tools: ["React", "TanStack Query", "Recharts"] },
        { domain: "Landing approval", owner: "Growth Manager", paths: ["landing_workflow", "audit_log"], tools: ["Local role gate", "Policy validation"] },
      ],
      integrations: [
        { name: "Landing factory", mode: "existing", boundary: "Represented as a central product asset; local records preserve its workflow." },
        { name: "PostgreSQL analytics", mode: "existing", boundary: "All UI metrics originate in persisted synthetic data through the API." },
        { name: "Enterprise SSO", mode: "proposed", boundary: "Replace x-local-role with verified identity and role claims." },
        { name: "Strapi publication", mode: "simulated", boundary: "No remote CMS call; publication updates local audited state only." },
        { name: "External LLM generation", mode: "simulated", boundary: "Draft copy is deterministic and uses structured persisted inputs." },
      ],
      controls: {
        validation: ["Zod at HTTP boundaries", "Bounded pagination and scenario coefficients", "Parameterized curated SQL", "Landing coverage/capacity/content policy checks"],
        monitoring: ["Freshness lag", "Unlinked and ambiguous identity rates", "Referential/date integrity", "Platform-to-CRM discrepancies", "Immature cohort count"],
        approval: "A human growth_manager or admin transition is required before simulated publication; every mutation emits an audit identifier.",
        privacy: "Only synthetic pseudonymous identities are exposed; source identifiers are hashed in journey responses and redacted from logs.",
        evidenceLabels: [
          { label: "correlation", meaning: "Observed variables move together without assigned credit or causal identification." },
          { label: "attribution", meaning: "First-, last- or multi-touch rules assign descriptive channel credit." },
          { label: "causal", meaning: "Reserved for valid experimental or quasi-experimental evidence with explicit diagnostics and limitations." },
        ],
      },
    };
  }

  private workbenchRows(rows: Array<Record<string, unknown>>): Array<Record<string, string | number | boolean | null>> {
    return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => {
      if (value === null || typeof value === "string" || typeof value === "boolean") return [key, value];
      if (value instanceof Date) return [key, value.toISOString()];
      return [key, numberValue(value)];
    })));
  }
}

type ExperimentAnalysis = {
  observedDifference: number | null;
  didEstimate: number | null;
  preTrendDifference: number | null;
  treatmentSample: number;
  controlSample: number;
};
