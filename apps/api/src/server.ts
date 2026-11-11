import { createApp } from "./app.js";
import { loadConfig } from "./config/env.js";
import { createLogger } from "./lib/logger.js";
import { createDatabaseClient } from "./lib/prisma.js";
import { PrismaGrowthRepository } from "./repositories/prisma-growth-repository.js";

const config = loadConfig();
const logger = createLogger(config);
const database = createDatabaseClient();
const repository = new PrismaGrowthRepository(database, config.SEED_VERSION);
const app = createApp({ repository, logger });

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT }, "Qida Growth Intelligence API listening");
});

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, "Shutting down API");
  server.close(async () => {
    await database.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => { void shutdown("SIGTERM"); });
process.on("SIGINT", () => { void shutdown("SIGINT"); });
