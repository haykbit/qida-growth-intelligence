import { Router } from "express";
import type { GrowthRepository } from "../../domain/types.js";
import { asyncHandler } from "../../lib/http.js";
import { openApiDocument } from "../../openapi.js";

export function systemRouter(repository: GrowthRepository): Router {
  const router = Router();
  router.get("/health", asyncHandler(async (_request, response) => {
    const health = await repository.health();
    response.status(health.database === "up" ? 200 : 503).json({ status: health.database === "up" ? "ok" : "degraded", ...health });
  }));
  router.get("/filters", asyncHandler(async (_request, response) => { response.json(await repository.filters()); }));
  router.get("/openapi.json", (_request, response) => { response.json(openApiDocument); });
  return router;
}
