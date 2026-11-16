import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CountRow = { count: bigint };
type MonthlyFunnelRow = { month: Date; leads: bigint; sql: bigint; altas: bigint };

async function validatePersistedSeed(): Promise<void> {
  const [municipalities, demandMunicipalities, leads, events, scenarios, invalidLeadDates, altasWithoutOpportunity, caregiverOpportunities, nonIndexedClicks, monthlyFunnel] = await Promise.all([
    prisma.motorMunicipio.count(),
    prisma.motorDemandaBusqueda.findMany({ distinct: ["municipioId"], select: { municipioId: true } }).then((rows) => rows.length),
    prisma.lead.count(),
    prisma.journeyEvent.count(),
    prisma.syntheticScenario.count(),
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM lead WHERE (es_sql AND (fecha_sql IS NULL OR fecha_sql < fecha_creacion)) OR (es_alta AND (fecha_alta IS NULL OR fecha_sql IS NULL OR fecha_alta < fecha_sql))`,
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM lead l LEFT JOIN care_opportunity c ON c.lead_id = l.lead_id WHERE l.es_alta AND c.opportunity_id IS NULL`,
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM lead l JOIN care_opportunity c ON c.lead_id = l.lead_id WHERE l.tipo_contacto = 'cuidadora_empleo'`,
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM gsc_diario g JOIN landing l ON l.url = g.url WHERE l.fecha_primera_indexacion IS NULL AND g.clics > 0`,
    prisma.$queryRaw<MonthlyFunnelRow[]>`
      SELECT date_trunc('month', fecha_creacion) AS month,
             COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado')::bigint AS leads,
             COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado' AND es_sql)::bigint AS sql,
             COUNT(*) FILTER (WHERE tipo_contacto = 'familia_cuidado' AND es_alta)::bigint AS altas
      FROM lead GROUP BY 1 ORDER BY 1
    `,
  ]);

  const errors: string[] = [];
  if (municipalities < 250) errors.push(`Expected about 270 municipalities, found ${municipalities}`);
  if (demandMunicipalities < 175) errors.push(`Expected about 190 demand municipalities, found ${demandMunicipalities}`);
  if (leads === 0 || events === 0) errors.push("Lead and journey event tables must not be empty");
  if (scenarios !== 12) errors.push(`Expected scenarios A-L, found ${scenarios}`);
  if (Number(invalidLeadDates[0]?.count ?? 0n) > 0) errors.push("Invalid lead date sequences found");
  if (Number(altasWithoutOpportunity[0]?.count ?? 0n) > 0) errors.push("Altas without care opportunities found");
  if (Number(caregiverOpportunities[0]?.count ?? 0n) > 0) errors.push("Caregiver job contacts leaked into family opportunities");
  if (Number(nonIndexedClicks[0]?.count ?? 0n) > 0) errors.push("Non-indexed landing has GSC clicks");
  for (const row of monthlyFunnel) {
    const monthlyLeads = Number(row.leads);
    const monthlySql = Number(row.sql);
    const monthlyAltas = Number(row.altas);
    if (monthlySql < 1_100 || monthlySql > 2_900) errors.push(`${row.month.toISOString().slice(0, 7)} has ${monthlySql} SQL, outside the configured baseline range`);
    if (monthlyLeads < monthlySql || monthlySql < monthlyAltas) errors.push(`${row.month.toISOString().slice(0, 7)} has an incoherent funnel ${monthlyLeads}/${monthlySql}/${monthlyAltas}`);
  }
  if (new Set(monthlyFunnel.map((row) => Number(row.leads))).size < 2) errors.push("Monthly family lead volume is artificially flat");
  if (new Set(monthlyFunnel.map((row) => Number(row.sql))).size < 2) errors.push("Monthly SQL volume is artificially flat");
  if (new Set(monthlyFunnel.map((row) => Number(row.altas))).size < 2) errors.push("Monthly alta volume is artificially flat");
  if (errors.length > 0) throw new Error(`Persisted seed validation failed:\n${errors.join("\n")}`);

  console.info(JSON.stringify({ valid: true, municipalities, demandMunicipalities, leads, events, scenarios, months: monthlyFunnel.length }));
}

validatePersistedSeed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
