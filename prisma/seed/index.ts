import { Prisma, PrismaClient } from "@prisma/client";
import { configFromEnvironment } from "./config.js";
import { generateSyntheticDataset } from "./generate.js";
import { validateSyntheticDataset } from "./validate.js";

const prisma = new PrismaClient();

function chunks<T>(values: readonly T[], size = 1_000): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) result.push(values.slice(index, index + size));
  return result;
}

async function seed(): Promise<void> {
  const config = configFromEnvironment();
  const dataset = generateSyntheticDataset(config);
  const validation = validateSyntheticDataset(dataset, config.monthlySqlTarget);
  if (!validation.valid) throw new Error(`Generated dataset failed validation:\n${validation.errors.join("\n")}`);

  await prisma.$transaction(async (tx) => {
    await tx.auditLog.deleteMany();
    await tx.landingWorkflow.deleteMany();
    await tx.syntheticScenario.deleteMany();
    await tx.growthRecommendation.deleteMany();
    await tx.experimentAssignment.deleteMany();
    await tx.growthExperiment.deleteMany();
    await tx.journeyEvent.deleteMany();
    await tx.careOpportunity.deleteMany();
    await tx.identityMap.deleteMany();
    await tx.lead.deleteMany();
    await tx.adsDiario.deleteMany();
    await tx.webSesionesDiarias.deleteMany();
    await tx.gscDiario.deleteMany();
    await tx.landing.deleteMany();
    await tx.motorCompetencia.deleteMany();
    await tx.motorVozCliente.deleteMany();
    await tx.motorDemandaBusqueda.deleteMany();
    await tx.motorMunicipio.deleteMany();
    await tx.seedRun.deleteMany();

    await tx.motorMunicipio.createMany({ data: dataset.municipalities });
    for (const data of chunks(dataset.demand)) await tx.motorDemandaBusqueda.createMany({ data });
    for (const data of chunks(dataset.voice)) await tx.motorVozCliente.createMany({ data });
    await tx.motorCompetencia.createMany({ data: dataset.competitors });
    await tx.landing.createMany({ data: dataset.landings });
    for (const data of chunks(dataset.gsc)) await tx.gscDiario.createMany({ data });
    for (const data of chunks(dataset.webSessions)) await tx.webSesionesDiarias.createMany({ data });
    for (const data of chunks(dataset.ads)) await tx.adsDiario.createMany({ data });
    for (const data of chunks(dataset.leads)) await tx.lead.createMany({ data });
    for (const data of chunks(dataset.identities)) await tx.identityMap.createMany({ data });
    for (const data of chunks(dataset.opportunities)) await tx.careOpportunity.createMany({ data });
    for (const batch of chunks(dataset.events)) {
      await tx.journeyEvent.createMany({ data: batch.map((row) => ({ ...row, metadata: row.metadata as Prisma.InputJsonValue })) });
    }
    await tx.growthExperiment.createMany({ data: dataset.experiments });
    await tx.experimentAssignment.createMany({ data: dataset.assignments });
    await tx.growthRecommendation.createMany({ data: dataset.recommendations.map((row) => ({ ...row, explanation: row.explanation as Prisma.InputJsonValue })) });
    await tx.landingWorkflow.createMany({ data: dataset.workflows.map((row) => ({ ...row, blocks: row.blocks as Prisma.InputJsonValue, content: row.content as Prisma.InputJsonValue, validationIssues: row.validationIssues as Prisma.InputJsonValue })) });
    await tx.auditLog.createMany({ data: dataset.auditLogs.map((row) => ({ ...row, metadata: row.metadata as Prisma.InputJsonValue })) });
    await tx.syntheticScenario.createMany({ data: dataset.scenarios.map((row) => ({ ...row, metadata: row.metadata as Prisma.InputJsonValue })) });
    await tx.seedRun.create({ data: dataset.seedRun });
  }, { timeout: 180_000, maxWait: 10_000 });

  console.info(JSON.stringify({ message: "Synthetic dataset seeded", checksum: dataset.seedRun.datasetChecksum, ...validation.metrics }));
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => prisma.$disconnect());
