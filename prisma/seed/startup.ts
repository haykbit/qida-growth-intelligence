import { PrismaClient } from "@prisma/client";
import { seedDecisionExamples } from "./decision-examples.js";

async function prepare() {
  const db = new PrismaClient();
  try {
    if (await db.seedRun.count()) await db.$transaction(seedDecisionExamples);
    else await import("./index.js");
  } finally {
    await db.$disconnect();
  }
}
prepare().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
