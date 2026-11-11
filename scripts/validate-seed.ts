import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type CountRow = { count: bigint };
type MonthlySqlRow = { month: Date; count: bigint };

async function validatePersistedSeed(): Promise<void> {
  const [municipalities, demandMunicipalities, leads, events, scenarios, invalidLeadDates, altasWithoutOpportunity, caregiverOpportunities, nonIndexedClicks, monthlySql] = await Promise.all([
    prisma.motorMunicipio.count(),
    prisma.motorDemandaBusqueda.findMany({ distinct: ["municipioId"], select: { municipioId: true } }).then((rows) => rows.length),
    prisma.lead.count(),
    prisma.journeyEvent.count(),
    prisma.syntheticScenario.count(),
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM lead WHERE (es_sql AND (fecha_sql IS NULL OR fecha_sql < fecha_creacion)) OR (es_alta AND (fecha_alta IS NULL OR fecha_sql IS NULL OR fecha_alta < fecha_sql))`,
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM lead l LEFT JOIN care_opportunity c ON c.lead_id = l.lead_id WHERE l.es_alta AND c.opportunity_id IS NULL`,
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM lead l JOIN care_opportunity c ON c.lead_id = l.lead_id WHERE l.tipo_contacto = 'cuidadora_empleo'`,
    prisma.$queryRaw<CountRow[]>`SELECT COUNT(*)::bigint AS count FROM gsc_diario g JOIN landing l ON l.url = g.url WHERE l.fecha_primera_indexacion IS NULL AND g.clics > 0`,
    prisma.$queryRaw<MonthlySqlRow[]>`SELECT date_trunc('month', fecha_creacion) AS month, COUNT(*)::bigint AS count FROM lead WHERE es_sql AND tipo_contacto = 'familia_cuidado' GROUP BY 1 ORDER BY 1`,
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
  for (const row of monthlySql) if (Number(row.count) < 1_900 || Number(row.count) > 2_100) errors.push(`${row.month.toISOString().slice(0, 7)} has ${row.count} SQL, outside expected range`);
  if (errors.length > 0) throw new Error(`Persisted seed validation failed:\n${errors.join("\n")}`);

  console.info(JSON.stringify({ valid: true, municipalities, demandMunicipalities, leads, events, scenarios, months: monthlySql.length }));
}

validatePersistedSeed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
