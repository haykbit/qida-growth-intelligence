import { Router } from "express";
import type { GrowthRepository } from "../../domain/types.js";
import type { StrategyAssumptions } from "../../domain/types.js";
import { filtersSchema, strategyQuerySchema } from "../../domain/schemas.js";
import { asyncHandler, parseWith } from "../../lib/http.js";

export function analyticsRouter(repository: GrowthRepository): Router {
  const router = Router();
  router.get("/overview", asyncHandler(async (request, response) => { response.json(await repository.overview(parseWith(filtersSchema, request.query))); }));
  router.get("/funnels", asyncHandler(async (request, response) => { response.json(await repository.funnels(parseWith(filtersSchema, request.query))); }));
  router.get("/seo", asyncHandler(async (request, response) => { response.json(await repository.seo(parseWith(filtersSchema, request.query))); }));
  router.get("/ads", asyncHandler(async (request, response) => { response.json(await repository.ads(parseWith(filtersSchema, request.query))); }));
  router.get("/data-quality", asyncHandler(async (_request, response) => { response.json(await repository.dataQuality()); }));
  router.get("/strategy", asyncHandler(async (request, response) => {
    const assumptions: StrategyAssumptions = strategyQuerySchema.parse(request.query);
    response.json(await repository.strategy(assumptions));
  }));
  router.get("/workbench", asyncHandler(async (_request, response) => { response.json(await repository.workbench()); }));
  router.get("/governance", asyncHandler(async (_request, response) => { response.json(await repository.governance()); }));
  return router;
}
