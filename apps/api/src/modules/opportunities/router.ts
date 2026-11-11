import { Router } from "express";
import type { GrowthRepository } from "../../domain/types.js";
import { opportunityParamsSchema, parseListQuery } from "../../domain/schemas.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, parseWith } from "../../lib/http.js";

export function opportunitiesRouter(repository: GrowthRepository): Router {
  const router = Router();
  router.get("/opportunities", asyncHandler(async (request, response) => { response.json(await repository.opportunities(parseListQuery(request.query))); }));
  router.get("/opportunities/:municipalityId/:service", asyncHandler(async (request, response) => {
    const params = parseWith(opportunityParamsSchema, request.params);
    const result = await repository.opportunity(params.municipalityId, params.service);
    if (result === null) throw new AppError(404, "OPPORTUNITY_NOT_FOUND", "Opportunity was not found");
    response.json(result);
  }));
  return router;
}
