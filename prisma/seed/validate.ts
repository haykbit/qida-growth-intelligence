import type { SyntheticDataset } from "./types.js";

export type DatasetValidation = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  metrics: Record<string, number>;
};

function monthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function validateSyntheticDataset(dataset: SyntheticDataset, expectedMonthlySqlBaseline?: number): DatasetValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const opportunitiesByLead = new Map(dataset.opportunities.map((row) => [row.leadId, row]));
  const landingsByUrl = new Map(dataset.landings.map((row) => [row.url, row]));
  const municipalitiesById = new Map(dataset.municipalities.map((row) => [row.municipioId, row]));
  const sqlEventOpportunities = new Set(dataset.events.filter((row) => row.eventType === "sql_qualified" && row.opportunityId !== null).map((row) => row.opportunityId as string));
  const altaEventOpportunities = new Set(dataset.events.filter((row) => row.eventType === "alta_completed" && row.opportunityId !== null).map((row) => row.opportunityId as string));

  for (const lead of dataset.leads) {
    if (lead.esSql && lead.fechaSql === null) errors.push(`${lead.leadId}: SQL without fecha_sql`);
    if (!lead.esSql && lead.fechaSql !== null) errors.push(`${lead.leadId}: non-SQL with fecha_sql`);
    if (lead.fechaSql !== null && lead.fechaSql < lead.fechaCreacion) errors.push(`${lead.leadId}: fecha_sql before creation`);
    if (lead.esAlta && lead.fechaAlta === null) errors.push(`${lead.leadId}: alta without fecha_alta`);
    if (lead.fechaAlta !== null && (lead.fechaSql === null || lead.fechaAlta < lead.fechaSql)) errors.push(`${lead.leadId}: fecha_alta before SQL`);
    if (lead.esAlta && !opportunitiesByLead.has(lead.leadId)) errors.push(`${lead.leadId}: alta without care opportunity`);
    if (lead.tipoContacto === "cuidadora_empleo" && opportunitiesByLead.has(lead.leadId)) errors.push(`${lead.leadId}: caregiver contact became family opportunity`);
    if (lead.tipoContacto === "familia_cuidado") {
      const opportunity = opportunitiesByLead.get(lead.leadId);
      if (opportunity === undefined) errors.push(`${lead.leadId}: family lead without care opportunity`);
      else {
        if (opportunity.sqlAt?.getTime() !== lead.fechaSql?.getTime()) errors.push(`${lead.leadId}: SQL timestamp differs from its opportunity`);
        if (opportunity.altaAt?.getTime() !== lead.fechaAlta?.getTime()) errors.push(`${lead.leadId}: alta timestamp differs from its opportunity`);
        if (lead.esSql && !sqlEventOpportunities.has(opportunity.opportunityId)) errors.push(`${lead.leadId}: SQL missing its journey event`);
        if (lead.esAlta && !altaEventOpportunities.has(opportunity.opportunityId)) errors.push(`${lead.leadId}: alta missing its journey event`);
      }
    }
  }

  for (const opportunity of dataset.opportunities) {
    if (!municipalitiesById.has(opportunity.municipioId)) errors.push(`${opportunity.opportunityId}: missing municipality`);
    if (opportunity.sqlAt !== null && opportunity.sqlAt < opportunity.createdAt) errors.push(`${opportunity.opportunityId}: SQL before opportunity`);
    if (opportunity.altaAt !== null && (opportunity.sqlAt === null || opportunity.altaAt < opportunity.sqlAt)) errors.push(`${opportunity.opportunityId}: alta before SQL`);
  }

  for (const row of dataset.gsc) {
    const landing = landingsByUrl.get(row.url);
    if (landing === undefined) errors.push(`${row.url}: GSC row references missing landing`);
    else if (landing.fechaPrimeraIndexacion === null && row.clics > 0) errors.push(`${row.url}: non-indexed landing has organic clicks`);
    else if (landing.fechaPrimeraIndexacion !== null && row.fecha < landing.fechaPrimeraIndexacion) errors.push(`${row.url}: GSC before first indexation`);
  }

  const monthlySql = new Map<string, number>();
  for (const lead of dataset.leads) {
    if (lead.tipoContacto !== "familia_cuidado") continue;
    const key = monthKey(lead.fechaCreacion);
    monthlySql.set(key, (monthlySql.get(key) ?? 0) + (lead.esSql ? 1 : 0));
  }
  if (expectedMonthlySqlBaseline !== undefined) {
    const minimum = Math.floor(expectedMonthlySqlBaseline * 0.55);
    const maximum = Math.ceil(expectedMonthlySqlBaseline * 1.45);
    for (const [month, count] of monthlySql) {
      if (count < minimum || count > maximum) errors.push(`${month}: ${count} SQL falls outside the realistic baseline range ${minimum}-${maximum}`);
    }
    if (monthlySql.size > 1 && new Set(monthlySql.values()).size === 1) errors.push("Monthly SQL cohorts must vary around the configured baseline");
  }

  const scenarioCodes = new Set(dataset.scenarios.map((row) => row.code));
  for (const code of "ABCDEFGHIJKL") if (!scenarioCodes.has(code)) errors.push(`Scenario ${code} is missing`);
  if (dataset.leads.length <= dataset.leads.filter((row) => row.esSql).length) errors.push("Lead volume must exceed SQL volume");
  if (!dataset.events.some((row) => row.personId === null)) errors.push("Dataset must contain unlinked events");
  if (!dataset.leads.some((row) => row.urlEntrada === null && row.tipoContacto === "familia_cuidado")) errors.push("Dataset must contain unattributed family leads");
  if (!dataset.municipalities.some((row) => row.tieneCobertura && row.cuidadorasDisponibles30d < 4)) errors.push("Dataset must contain capacity-constrained municipalities");
  if (!dataset.municipalities.some((row) => row.nps12m === null)) errors.push("Dataset must contain null NPS for low-response municipalities");

  const identityCounts = new Map<string, number>();
  for (const identity of dataset.identities) identityCounts.set(identity.personId, (identityCounts.get(identity.personId) ?? 0) + 1);
  if (![...identityCounts.values()].some((count) => count > 1)) errors.push("Dataset must contain deterministic cross-system duplicates");

  const altaCount = dataset.leads.filter((row) => row.esAlta).length;
  if (altaCount === 0) warnings.push("No altas were generated; increase the dataset size");
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      municipalities: dataset.municipalities.length,
      demandMunicipalities: new Set(dataset.demand.map((row) => row.municipioId)).size,
      leads: dataset.leads.length,
      sql: dataset.leads.filter((row) => row.esSql).length,
      altas: altaCount,
      events: dataset.events.length,
      scenarios: dataset.scenarios.length,
      months: monthlySql.size,
    },
  };
}
