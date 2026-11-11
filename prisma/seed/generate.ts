import { createHash } from "node:crypto";
import { OPPORTUNITY_RULES_VERSION, scoreOpportunity } from "../../packages/analytics/src/scoring.js";
import { GENERATOR_VERSION, type SeedConfig } from "./config.js";
import { municipalityCatalog } from "./catalog.js";
import { SeededRandom } from "./random.js";
import type { JsonValue, SyntheticDataset } from "./types.js";

const SERVICES = ["cuidado_personas_mayores", "acompanamiento", "ayuda_domicilio"] as const;
const CHANNELS = ["paid_search", "paid_social", "organic", "direct", "referral", "phone"] as const;
const MS_DAY = 86_400_000;

const addDays = (date: Date, days: number): Date => new Date(date.getTime() + days * MS_DAY);
const addMinutes = (date: Date, minutes: number): Date => new Date(date.getTime() + minutes * 60_000);
const startOfUtcMonth = (date: Date): Date => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
const round = (value: number, digits = 2): number => Number(value.toFixed(digits));
const slug = (value: string): string => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function monthsBetween(start: Date, end: Date): Date[] {
  const months: Date[] = [];
  let cursor = startOfUtcMonth(start);
  while (cursor <= end) {
    months.push(cursor);
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }
  return months;
}

function timestampInMonth(month: Date, day: number, hour: number): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), Math.min(28, day), hour));
}

function stableChecksum(config: SeedConfig, dataset: Omit<SyntheticDataset, "seedRun">): string {
  const summary = {
    seed: config.seed,
    simulationDate: config.simulationDate.toISOString(),
    counts: Object.fromEntries(Object.entries(dataset).map(([key, value]) => [key, Array.isArray(value) ? value.length : 1])),
    firstLead: dataset.leads[0]?.leadId ?? null,
    lastLead: dataset.leads.at(-1)?.leadId ?? null,
    firstEvent: dataset.events[0]?.eventId ?? null,
    lastEvent: dataset.events.at(-1)?.eventId ?? null,
  };
  return createHash("sha256").update(JSON.stringify(summary)).digest("hex");
}

export function generateSyntheticDataset(config: SeedConfig): SyntheticDataset {
  const random = new SeededRandom(config.seed);
  const catalog = municipalityCatalog(config.municipalityCount);
  const months = monthsBetween(config.startDate, config.simulationDate);
  const generatedAt = new Date(config.simulationDate);
  const municipalityRows: SyntheticDataset["municipalities"] = catalog.map((entry, index) => {
    const noCoverage = index > 0 && index % 17 === 0;
    const constrained = index === 1 || index % 23 === 0;
    const dataResponseCount = index % 8 === 0 ? random.integer(2, 9) : random.integer(10, 70);
    const services = noCoverage ? [] : SERVICES.filter((_service, serviceIndex) => serviceIndex === 0 || (index + serviceIndex) % 4 !== 0);
    return {
      municipioId: entry.id,
      nombre: entry.name,
      provincia: entry.province,
      comunidadAutonoma: entry.autonomousCommunity,
      tieneCobertura: !noCoverage,
      serviciosCubiertos: [...services],
      cuidadorasDisponibles30d: constrained ? random.integer(0, 3) : random.integer(5, 32),
      oficinaMasCercanaKm: round(random.integer(2, 1_800) / 10, 1),
      familiasActivas: noCoverage ? random.integer(0, 5) : random.integer(8, 260),
      mesesMediosServicio: round(3.5 + random.next() * 14, 1),
      nps12m: dataResponseCount < 10 ? null : round(25 + random.next() * 55, 1),
      datosPropios: index < config.demandMunicipalityCount && index % 11 !== 0,
    };
  });

  // Scenario A must be eligible; scenario B is explicitly capacity constrained.
  const municipalityA = municipalityRows[0];
  const municipalityB = municipalityRows[1];
  if (municipalityA === undefined || municipalityB === undefined) throw new Error("Scenario municipalities are missing");
  municipalityA.tieneCobertura = true;
  municipalityA.serviciosCubiertos = [...SERVICES];
  municipalityA.cuidadorasDisponibles30d = 24;
  municipalityB.tieneCobertura = true;
  municipalityB.serviciosCubiertos = [...SERVICES];
  municipalityB.cuidadorasDisponibles30d = 2;

  const demand: SyntheticDataset["demand"] = [];
  const voice: SyntheticDataset["voice"] = [];
  const competitors: SyntheticDataset["competitors"] = [];
  for (const [municipalityIndex, municipality] of municipalityRows.entries()) {
    competitors.push(
      { municipioId: municipality.municipioId, competidor: `Competidor Sintético ${municipalityIndex % 7}`, servicios: [SERVICES[0]], tieneLandingLocal: municipalityIndex % 3 === 0, fechaRevision: startOfUtcMonth(config.simulationDate) },
      { municipioId: municipality.municipioId, competidor: `Red Local Sintética ${municipalityIndex % 11}`, servicios: [SERVICES[1], SERVICES[2]], tieneLandingLocal: municipalityIndex % 5 === 0, fechaRevision: startOfUtcMonth(config.simulationDate) },
    );
    if (municipalityIndex >= config.demandMunicipalityCount) continue;
    for (const [monthIndex, month] of months.entries()) {
      for (const [serviceIndex, service] of SERVICES.entries()) {
        const seasonal = 0.85 + ((month.getUTCMonth() + serviceIndex * 2) % 6) * 0.06;
        const base = 70 + (municipalityIndex % 29) * 17 + serviceIndex * 23;
        const scenarioDemand = municipalityIndex === 0 || municipalityIndex === 1 ? 3.2 : municipalityIndex === 3 ? 0.25 : 1;
        demand.push({
          municipioId: municipality.municipioId,
          tema: service,
          mes: month,
          busquedas: Math.round(base * seasonal * scenarioDemand * (0.95 + random.next() * 0.1)),
          competenciaAds: round(0.15 + random.next() * 0.8, 3),
          cpcEstimadoEur: round(1.2 + random.next() * 7.5, 2),
        });
      }
      if (municipalityIndex < Math.min(70, config.demandMunicipalityCount) && monthIndex % 2 === 0) {
        const total = random.integer(12, 90);
        const calls = random.integer(3, total);
        voice.push({
          municipioId: municipality.municipioId,
          mes: month,
          tema: SERVICES[municipalityIndex % SERVICES.length] as string,
          tipo: municipalityIndex % 2 === 0 ? "necesidad_no_cubierta" : "objecion",
          llamadas: calls,
          llamadasTotales: total,
          pctQidaDijoSi: round(calls / total, 4),
          expresiones: municipalityIndex % 2 === 0
            ? ["Necesitamos apoyo en casa", "Buscamos disponibilidad esta semana"]
            : ["Queremos entender el servicio", "Necesitamos coordinar horarios"],
        });
      }
    }
  }

  const landings: SyntheticDataset["landings"] = [];
  const landingCount = Math.min(140, config.demandMunicipalityCount);
  for (let index = 0; index < landingCount; index += 1) {
    const municipality = municipalityRows[index];
    if (municipality === undefined) continue;
    const isDraft = index > 5 && (index % 13 === 0 || index === 19);
    const published = isDraft ? null : addDays(config.startDate, 20 + (index % 320));
    const indexed = published === null || index % 9 === 0 ? null : addDays(published, 5 + (index % 12));
    landings.push({
      url: `/cuidados/${slug(municipality.nombre)}-${municipality.municipioId.toLowerCase()}`,
      municipioId: municipality.municipioId,
      idioma: municipality.comunidadAutonoma === "Cataluña" ? "ca" : "es",
      origen: index % 3 === 0 ? "manual" : "generada",
      fechaPublicacion: published,
      fechaPrimeraIndexacion: indexed,
    });
  }

  const gsc: SyntheticDataset["gsc"] = [];
  const webSessions: SyntheticDataset["webSessions"] = [];
  for (const [landingIndex, landing] of landings.entries()) {
    if (landing.fechaPublicacion === null) continue;
    for (const month of months) {
      if (month < startOfUtcMonth(landing.fechaPublicacion)) continue;
      const experimentJTreatment = landingIndex >= 20 && landingIndex < 40 && landingIndex % 2 === 0 && month >= new Date("2026-04-01T00:00:00.000Z");
      const negativeExperimentTreatment = landingIndex >= 60 && landingIndex < 80 && landingIndex % 2 === 0 && month >= new Date("2026-04-01T00:00:00.000Z");
      for (const [channelIndex, channel] of ["organic", "paid_search", "direct"].entries()) {
        if (channel === "organic" && landing.fechaPrimeraIndexacion === null) continue;
        const scenarioTrafficMultiplier = landingIndex === 4 ? 7 : landingIndex === 5 ? 0.25 : 1;
        const sessions = Math.max(1, Math.round((35 + (landingIndex % 21) * 6 + channelIndex * 12) * scenarioTrafficMultiplier));
        let formRate = 0.025 + (landingIndex % 5) * 0.008;
        if (landingIndex === 4) formRate = 0.004;
        if (landingIndex === 5) formRate = 0.18;
        if (experimentJTreatment) formRate *= 1.35;
        if (negativeExperimentTreatment) formRate *= 0.72;
        webSessions.push({
          fecha: timestampInMonth(month, 15, 0),
          urlEntrada: landing.url,
          canal: channel,
          dispositivo: "all",
          sesiones: sessions,
          formularios: Math.min(sessions, Math.round(sessions * formRate)),
          clicsLlamar: Math.min(sessions, Math.round(sessions * (formRate * 0.65))),
        });
      }
      if (landing.fechaPrimeraIndexacion !== null && month >= startOfUtcMonth(landing.fechaPrimeraIndexacion)) {
        const representativeDate = timestampInMonth(month, 15, 0);
        const gscDate = representativeDate < landing.fechaPrimeraIndexacion ? addDays(landing.fechaPrimeraIndexacion, 1) : representativeDate;
        for (const queryIndex of [0, 1]) {
          const impressions = 110 + (landingIndex % 17) * 24 + queryIndex * 31;
          const clicks = Math.min(impressions, Math.round(impressions * (0.025 + (landingIndex % 4) * 0.009)));
          gsc.push({
            fecha: gscDate,
            url: landing.url,
            consulta: queryIndex === 0 ? `cuidado domicilio ${landing.municipioId}` : `ayuda mayores ${landing.municipioId}`,
            impresiones: impressions,
            clics: clicks,
            posicionMedia: round(4.5 + (landingIndex % 16) * 0.7 + queryIndex, 1),
          });
        }
      }
    }
  }

  const ads: SyntheticDataset["ads"] = [];
  for (const [monthIndex, month] of months.entries()) {
    for (let campaignIndex = 0; campaignIndex < 36; campaignIndex += 1) {
      const platform = campaignIndex % 2 === 0 ? "Google Ads" : "Meta Ads";
      const badCampaign = campaignIndex === 0;
      const clicks = badCampaign ? 180 : random.integer(90, 520);
      const costPerClick = badCampaign ? 11.5 : round(1.1 + random.next() * 5.2, 2);
      const campaign = badCampaign ? "META-CAPTACION-INEFICIENTE" : `${platform === "Google Ads" ? "SEA" : "SOC"}-LOCAL-${String(campaignIndex).padStart(2, "0")}`;
      const municipality = municipalityRows[campaignIndex % Math.min(config.demandMunicipalityCount, municipalityRows.length)];
      ads.push({
        fecha: timestampInMonth(month, 15, 0),
        plataforma: platform,
        campania: campaign,
        municipioId: campaignIndex % 8 === 0 ? null : municipality?.municipioId ?? null,
        impresiones: clicks * random.integer(9, 28),
        clics: clicks,
        costeEur: round(clicks * costPerClick, 2),
        conversionesPlataforma: badCampaign ? 2 : Math.round(clicks * (0.025 + random.next() * 0.06)),
      });
    }
  }

  const experimentStart = new Date("2026-04-01T00:00:00.000Z");
  const leads: SyntheticDataset["leads"] = [];
  const identities: SyntheticDataset["identities"] = [];
  const opportunities: SyntheticDataset["opportunities"] = [];
  const events: SyntheticDataset["events"] = [];
  let leadSequence = 0;
  let eventSequence = 0;
  let opportunitySequence = 0;
  let specialJourneyOpportunityId = "";
  let duplicatePersonId = "";
  let incompleteEventId = "";
  let previousFamilyPerson: string | null = null;

  const pushEvent = (event: Omit<SyntheticDataset["events"][number], "eventId">): string => {
    const eventId = `evt-${String(eventSequence).padStart(8, "0")}`;
    eventSequence += 1;
    events.push({ eventId, ...event });
    return eventId;
  };

  for (const [monthIndex, month] of months.entries()) {
    const familyNonSql = Math.round(config.monthlySqlTarget * 0.55);
    const caregiverContacts = Math.max(20, Math.round(config.monthlySqlTarget * 0.08));
    const monthlyLeadCount = config.monthlySqlTarget + familyNonSql + caregiverContacts;
    for (let monthlyIndex = 0; monthlyIndex < monthlyLeadCount; monthlyIndex += 1) {
      const isCaregiver = monthlyIndex >= config.monthlySqlTarget + familyNonSql;
      const isSql = !isCaregiver && monthlyIndex < config.monthlySqlTarget;
      let municipalityIndex = random.integer(0, Math.max(0, config.demandMunicipalityCount - 1));
      if (isSql && monthlyIndex < 12) municipalityIndex = 0; // A: deliberately few SQL despite very high demand.
      else if (isSql && monthlyIndex < 82) municipalityIndex = 1; // B: demand exists but capacity is constrained.
      else if (isSql && monthlyIndex < 202) municipalityIndex = 2; // C: high SQL volume.
      else if (isSql && monthlyIndex < 227) municipalityIndex = 3; // D: low demand, strong conversion.
      if (!isCaregiver && monthlyIndex === config.monthlySqlTarget + familyNonSql - 1) municipalityIndex = 8; // I duplicate fixture.
      const municipality = municipalityRows[municipalityIndex];
      if (municipality === undefined) throw new Error("Generated lead references a missing municipality");
      const leadId = `lead-${String(leadSequence).padStart(7, "0")}`;
      leadSequence += 1;
      const createdAt = timestampInMonth(month, 2 + (monthlyIndex % 26), 8 + (monthlyIndex % 10));
      const duplicate: boolean = !isCaregiver && monthlyIndex === config.monthlySqlTarget + familyNonSql - 1 && previousFamilyPerson !== null;
      const personId: string = duplicate && previousFamilyPerson !== null ? previousFamilyPerson : `person-${String(leadSequence).padStart(7, "0")}`;
      if (!isCaregiver) previousFamilyPerson = personId;
      if (duplicate) duplicatePersonId = personId;
      const service = SERVICES[(monthlyIndex + monthIndex) % SERVICES.length] as string;
      const channel = CHANNELS[(monthlyIndex + municipalityIndex) % CHANNELS.length] as string;
      const landing = landings.find((row) => row.municipioId === municipality.municipioId) ?? null;
      const unattributed = !isCaregiver && monthlyIndex % 37 === 0;
      const sqlAt = isSql ? addMinutes(createdAt, 30 + (monthlyIndex % 6) * 180) : null;
      let altaProbability = 0.24;
      if (!municipality.tieneCobertura) altaProbability = 0.025;
      else if (municipality.cuidadorasDisponibles30d < 4) altaProbability = 0.08;
      if (municipalityIndex === 2) altaProbability = 0.07;
      if (municipalityIndex === 3) altaProbability = 0.58;
      if (month.getUTCMonth() === 7) altaProbability *= 0.86; // Shared August seasonality, not an experiment effect.
      if (month >= experimentStart && municipalityIndex >= 20 && municipalityIndex < 40 && municipalityIndex % 2 === 0) altaProbability *= 1.45;
      if (month >= experimentStart && municipalityIndex >= 60 && municipalityIndex < 80 && municipalityIndex % 2 === 0) altaProbability *= 0.55;
      const altaCandidate = isSql && sqlAt !== null && random.boolean(altaProbability) ? addDays(sqlAt, 2 + (monthlyIndex % 25)) : null;
      const altaAt = altaCandidate !== null && altaCandidate <= config.simulationDate ? altaCandidate : null;
      const isAlta = altaAt !== null;
      const discardReason = isAlta || isCaregiver
        ? null
        : !municipality.tieneCobertura
          ? "sin_cobertura"
          : municipality.cuidadorasDisponibles30d < 4
            ? "sin_capacidad"
            : isSql ? "no_convertido" : "no_cualificado";
      leads.push({
        leadId,
        fechaCreacion: createdAt,
        municipioId: isCaregiver && monthlyIndex % 5 === 0 ? null : municipality.municipioId,
        canal: channel,
        urlEntrada: unattributed ? null : landing?.url ?? null,
        tipoContacto: isCaregiver ? "cuidadora_empleo" : "familia_cuidado",
        esSql: isSql,
        fechaSql: sqlAt,
        esAlta: isAlta,
        fechaAlta: altaAt,
        servicio: service,
        motivoDescarte: discardReason,
      });

      const sourceSystem = leadSequence % 2 === 0 ? "hubspot" : "odoo";
      const ambiguousIdentity = !duplicate && leadSequence % 503 === 0;
      identities.push({
        identityId: `identity-${String(leadSequence).padStart(7, "0")}`,
        personId,
        sourceSystem,
        sourceIdentifier: `${sourceSystem}-${leadId}`,
        matchMethod: duplicate ? "confirmed_cross_system_identifier" : ambiguousIdentity ? "ambiguous_unmerged" : "explicit_lead_identifier",
        ambiguous: ambiguousIdentity,
        createdAt,
      });

      if (isCaregiver) {
        pushEvent({ personId, opportunityId: null, sessionId: null, eventType: "lead_created", sourceSystem, occurredAt: createdAt, channel, campaign: null, landingUrl: null, metadata: { contactType: "caregiver_job" } });
        continue;
      }

      const opportunityId = `opp-${String(opportunitySequence).padStart(7, "0")}`;
      opportunitySequence += 1;
      const status = isAlta ? "alta" : isSql ? "sql" : "discarded";
      opportunities.push({ opportunityId, personId, municipioId: municipality.municipioId, servicio: service, createdAt, status, leadId, sqlAt, altaAt });
      const sessionId = unattributed ? null : `session-${leadId}`;
      const campaign = channel.startsWith("paid") ? (channel === "paid_search" ? "SEA-LOCAL-02" : "SOC-LOCAL-01") : null;
      const specialJourney = monthIndex === 0 && monthlyIndex === 0;
      if (specialJourney) specialJourneyOpportunityId = opportunityId;
      const journeyChannels = specialJourney ? ["paid_search", "organic", "direct", "phone"] : [channel];
      for (const [touchIndex, touchChannel] of journeyChannels.entries()) {
        const eventType = touchChannel === "phone" ? "phone_call" : touchChannel === "paid_search" || touchChannel === "paid_social" ? "ad_click" : "landing_view";
        pushEvent({
          personId: unattributed && touchIndex === 0 ? null : personId,
          opportunityId: unattributed && touchIndex === 0 ? null : opportunityId,
          sessionId,
          eventType,
          sourceSystem: touchChannel === "phone" ? "telephony" : "web",
          occurredAt: addMinutes(createdAt, -240 + touchIndex * 60),
          channel: touchChannel,
          campaign: touchChannel.startsWith("paid") ? campaign : null,
          landingUrl: landing?.url ?? null,
          metadata: { observed: true, synthetic: true },
        });
      }
      pushEvent({ personId, opportunityId, sessionId, eventType: "form_submit", sourceSystem: "web", occurredAt: addMinutes(createdAt, -15), channel, campaign, landingUrl: landing?.url ?? null, metadata: { observed: true } });
      pushEvent({ personId, opportunityId, sessionId, eventType: "lead_created", sourceSystem, occurredAt: createdAt, channel, campaign, landingUrl: landing?.url ?? null, metadata: { observed: true } });
      if (sqlAt !== null) pushEvent({ personId, opportunityId, sessionId, eventType: "sql_qualified", sourceSystem: "hubspot", occurredAt: sqlAt, channel: "crm", campaign: null, landingUrl: null, metadata: { observed: true } });
      if (altaAt !== null) pushEvent({ personId, opportunityId, sessionId, eventType: "alta_completed", sourceSystem: "odoo", occurredAt: altaAt, channel: "crm", campaign: null, landingUrl: null, metadata: { observed: true } });
      else if (!isSql) pushEvent({ personId, opportunityId, sessionId, eventType: "opportunity_discarded", sourceSystem: "hubspot", occurredAt: addMinutes(createdAt, 90), channel: "crm", campaign: null, landingUrl: null, metadata: { reason: discardReason ?? "unknown" } });

      if (monthIndex === months.length - 1 && monthlyIndex === monthlyLeadCount - caregiverContacts - 2) {
        incompleteEventId = pushEvent({ personId: null, opportunityId: null, sessionId: "late-session-fixture", eventType: "page_view", sourceSystem: "web", occurredAt: createdAt, channel: "unknown", campaign: "misattributed-campaign", landingUrl: landing?.url ?? null, metadata: { ingestedLate: true, ingestionDelayHours: 72, attributionError: true } });
      }
    }
  }

  const experimentEnd = new Date("2026-09-30T00:00:00.000Z");
  const experiments: SyntheticDataset["experiments"] = [
    { experimentId: "exp-landing-value-proposition", name: "Propuesta de valor local — resultado positivo", hypothesis: "Una propuesta local más específica aumentará formularios por sesión sin canibalizar teléfono", startDate: experimentStart, endDate: experimentEnd, status: "completed", primaryMetric: "formularios_por_sesion", methodology: "DiD por municipio; comprobar tendencias previas, estacionalidad y canibalización entre formulario y teléfono" },
    { experimentId: "exp-landing-social-proof", name: "Bloque informativo — resultado inconcluso", hypothesis: "Un bloque informativo aumentará la conversión", startDate: experimentStart, endDate: experimentEnd, status: "completed", primaryMetric: "formularios_por_sesion", methodology: "DiD por municipio; sin mejora observable y muestra insuficiente para descartar efectos pequeños o estacionales" },
    { experimentId: "exp-landing-long-form", name: "Landing extensa — resultado negativo", hypothesis: "Más detalle aumentará formularios sin reducir llamadas", startDate: experimentStart, endDate: experimentEnd, status: "completed", primaryMetric: "formularios_por_sesion", methodology: "DiD por municipio; deterioro observable, con guardrail de clics de llamada y revisión de estacionalidad/canibalización" },
  ];
  const assignments: SyntheticDataset["assignments"] = [];
  for (let index = 20; index < Math.min(80, municipalityRows.length); index += 1) {
    const municipality = municipalityRows[index];
    if (municipality === undefined) continue;
    const experiment = index < 40 ? experiments[0] : index < 60 ? experiments[1] : experiments[2];
    if (experiment !== undefined) assignments.push({ experimentId: experiment.experimentId, municipioId: municipality.municipioId, variant: index % 2 === 0 ? "treatment" : "control", assignedAt: experimentStart });
  }

  const demandAtSimulation = demand.filter((row) => row.mes.getTime() === startOfUtcMonth(config.simulationDate).getTime());
  const recommendations: SyntheticDataset["recommendations"] = [];
  for (let index = 0; index < Math.min(80, municipalityRows.length); index += 1) {
    const municipality = municipalityRows[index];
    if (municipality === undefined) continue;
    const service = SERVICES[0];
    const demandRow = demandAtSimulation.find((row) => row.municipioId === municipality.municipioId && row.tema === service);
    const municipalityLeads = leads.filter((row) => row.municipioId === municipality.municipioId && row.servicio === service && row.fechaCreacion >= startOfUtcMonth(config.simulationDate));
    const score = scoreOpportunity({
      monthlySearches: demandRow?.busquedas ?? 0,
      p90MonthlySearches: 850,
      sqlCount: municipalityLeads.filter((row) => row.esSql).length,
      altaCount: municipalityLeads.filter((row) => row.esAlta).length,
      caregiversAvailable: municipality.cuidadorasDisponibles30d,
      hasCoverage: municipality.tieneCobertura,
      serviceCovered: municipality.serviciosCubiertos.includes(service),
      estimatedCpcEur: demandRow?.cpcEstimadoEur ?? 8,
      unmetNeedSignals: voice.filter((row) => row.municipioId === municipality.municipioId).at(-1)?.llamadas ?? 0,
    });
    recommendations.push({
      recommendationId: `rec-${String(index).padStart(4, "0")}`,
      municipioId: municipality.municipioId,
      servicio: service,
      score: score.score,
      expectedImpact: score.eligibility === "ineligible" ? "Sin impacto hasta resolver cobertura" : "Validar incremento de SQL elegibles en prueba acotada",
      explanation: { factors: score.factors as unknown as JsonValue, constraints: score.constraints, action: score.proposedAction, validationMetric: score.validationMetric, disclaimer: score.disclaimer },
      status: "proposed",
      rulesVersion: OPPORTUNITY_RULES_VERSION,
      createdAt: generatedAt,
    });
  }

  const workflows: SyntheticDataset["workflows"] = [];
  const auditLogs: SyntheticDataset["auditLogs"] = [];
  const workflowLandingIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 13, 19, 26, 39];
  for (const [index, landingIndex] of workflowLandingIndexes.entries()) {
    const landing = landings[landingIndex];
    if (landing === undefined) continue;
    const status = landing.fechaPublicacion !== null ? "published" as const : index % 3 === 0 ? "pending_review" as const : index % 3 === 1 ? "rejected" as const : "draft" as const;
    const reviewedAt = status === "published" ? addDays(landing.fechaPublicacion as Date, -2) : null;
    const approvedAt = status === "published" ? addDays(landing.fechaPublicacion as Date, -1) : null;
    workflows.push({
      url: landing.url,
      service: SERVICES[index % SERVICES.length] as string,
      status,
      blocks: ["hero", "coverage", "how_it_works", "faq", "contact"],
      content: {
        title: `Cuidado a domicilio en ${landing.municipioId}`,
        description: "Contenido sintético local sujeto a validación de cobertura y capacidad.",
        blocks: [{ type: "coverage", heading: "Cobertura local", body: "La disponibilidad se confirma antes de iniciar el servicio." }],
        generatedFrom: { municipalityId: landing.municipioId ?? "", service: SERVICES[index % SERVICES.length] as string, language: landing.idioma },
      },
      validationIssues: status === "rejected" ? ["Fixture sintético de rechazo para revisar restricciones"] : [],
      reviewedAt,
      approvedAt,
      publishedAt: landing.fechaPublicacion,
      approvedBy: status === "published" ? "local-reviewer" : null,
      updatedAt: landing.fechaPublicacion ?? generatedAt,
    });
    auditLogs.push({ auditId: `audit-${String(index).padStart(4, "0")}`, action: status === "published" ? "landing.published" : "landing.draft_created", entityType: "landing", entityId: landing.url, actorRole: status === "published" ? "reviewer" : "growth_analyst", requestId: null, metadata: { synthetic: true }, createdAt: landing.fechaPublicacion ?? generatedAt });
  }

  const scenarios: SyntheticDataset["scenarios"] = [
    { code: "A", name: "Demanda alta con poca captación", description: "Demanda elevada, buena cobertura y pocos SQL.", subjectType: "municipality", subjectId: municipalityRows[0]!.municipioId, metadata: { queryHint: "compare demand with SQL" }, createdAt: generatedAt },
    { code: "B", name: "Demanda limitada por capacidad", description: "Demanda elevada pero menos de cuatro cuidadoras disponibles.", subjectType: "municipality", subjectId: municipalityRows[1]!.municipioId, metadata: { constraint: "capacity" }, createdAt: generatedAt },
    { code: "C", name: "SQL altos y conversión baja", description: "Volumen alto de SQL con baja tasa de alta.", subjectType: "municipality", subjectId: municipalityRows[2]!.municipioId, metadata: { expected: "low_sql_to_alta" }, createdAt: generatedAt },
    { code: "D", name: "Poca demanda y gran conversión", description: "Demanda baja con conversión SQL a alta elevada.", subjectType: "municipality", subjectId: municipalityRows[3]!.municipioId, metadata: { expected: "high_sql_to_alta" }, createdAt: generatedAt },
    { code: "E", name: "Landing con fuga", description: "Landing con mucho tráfico y pocos formularios/SQL.", subjectType: "landing", subjectId: landings[4]!.url, metadata: { expected: "high_traffic_low_conversion" }, createdAt: generatedAt },
    { code: "F", name: "Landing eficiente con poco tráfico", description: "Landing con poco tráfico y buena conversión.", subjectType: "landing", subjectId: landings[5]!.url, metadata: { expected: "low_traffic_high_conversion" }, createdAt: generatedAt },
    { code: "G", name: "Ads ineficientes", description: "Campaña de coste alto y bajo rendimiento.", subjectType: "campaign", subjectId: "META-CAPTACION-INEFICIENTE", metadata: { expected: "high_cost_low_platform_conversions" }, createdAt: generatedAt },
    { code: "H", name: "Journey multicanal", description: "Familia con Ads, SEO, directo y teléfono antes de la conversión.", subjectType: "opportunity", subjectId: specialJourneyOpportunityId, metadata: { channels: ["paid_search", "organic", "direct", "phone"] }, createdAt: generatedAt },
    { code: "I", name: "Duplicado CRM", description: "Identidad confirmada compartida por leads de HubSpot y Odoo.", subjectType: "person", subjectId: duplicatePersonId, metadata: { matchMethod: "confirmed_cross_system_identifier" }, createdAt: generatedAt },
    { code: "J", name: "Experimento con mejora", description: "Experimento de landing con mejora observable en tratamiento; requiere revisar estacionalidad y canibalización.", subjectType: "experiment", subjectId: experiments[0]!.experimentId, metadata: { expected: "positive_observed_did", classification: "positive" }, createdAt: generatedAt },
    { code: "K", name: "Experimento inconcluso", description: "Experimento sin mejora positiva observable y evidencia insuficiente para concluir efecto nulo.", subjectType: "experiment", subjectId: experiments[1]!.experimentId, metadata: { expected: "no_positive_effect", classification: "inconclusive", relatedNegativeFixture: experiments[2]!.experimentId }, createdAt: generatedAt },
    { code: "L", name: "Calidad incompleta", description: "Evento tardío sin identidad y con atribución errónea marcada.", subjectType: "journey_event", subjectId: incompleteEventId, metadata: { issues: ["late", "unidentified", "misattributed"] }, createdAt: generatedAt },
  ];

  const withoutSeedRun = { municipalities: municipalityRows, demand, voice, competitors, landings, gsc, webSessions, ads, leads, identities, opportunities, events, experiments, assignments, recommendations, workflows, auditLogs, scenarios };
  const datasetChecksum = stableChecksum(config, withoutSeedRun);
  return {
    ...withoutSeedRun,
    seedRun: {
      runId: `seed-${config.seed}-${config.simulationDate.toISOString().slice(0, 10)}`,
      seed: config.seed,
      simulationDate: config.simulationDate,
      generatorVersion: GENERATOR_VERSION,
      datasetChecksum,
      createdAt: config.simulationDate,
    },
  };
}
