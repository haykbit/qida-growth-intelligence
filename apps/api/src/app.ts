import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import pinoHttp from "pino-http";
import type { GrowthRepository } from "./domain/types.js";
import { errorHandler, notFoundHandler } from "./lib/errors.js";
import type { AppLogger } from "./lib/logger.js";
import { requestIdMiddleware } from "./lib/request-id.js";
import { analyticsRouter } from "./modules/analytics/router.js";
import { experimentsRouter } from "./modules/experiments/router.js";
import { journeysRouter } from "./modules/journeys/router.js";
import { landingsRouter } from "./modules/landings/router.js";
import { opportunitiesRouter } from "./modules/opportunities/router.js";
import { systemRouter } from "./modules/system/router.js";

export type AppDependencies = { repository: GrowthRepository; logger: AppLogger };

export function createApp({ repository, logger }: AppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: true, credentials: false, maxAge: 600 }));
  app.use(express.json({ limit: "64kb", strict: true }));
  app.use(requestIdMiddleware);
  app.use(pinoHttp({
    logger,
    genReqId: (_request, response) => String(response.getHeader("x-request-id") ?? "unknown"),
    customProps: (_request, response) => ({ requestId: String(response.getHeader("x-request-id") ?? "unknown") }),
    serializers: { req: (request) => ({ method: request.method, url: request.url }) },
  }));

  const api = express.Router();
  api.use(systemRouter(repository));
  api.use(analyticsRouter(repository));
  api.use(opportunitiesRouter(repository));
  api.use(journeysRouter(repository));
  api.use(landingsRouter(repository));
  api.use(experimentsRouter(repository));
  app.use("/api/v1", api);
  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}
