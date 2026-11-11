import { Router } from "express";
import type { GrowthRepository } from "../../domain/types.js";
import { journeyParamsSchema, parseListQuery } from "../../domain/schemas.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, parseWith } from "../../lib/http.js";

export function journeysRouter(repository: GrowthRepository): Router {
  const router = Router();
  router.get("/journeys", asyncHandler(async (request, response) => { response.json(await repository.journeys(parseListQuery(request.query))); }));
  router.get("/journeys/:opportunityId", asyncHandler(async (request, response) => {
    const { opportunityId } = parseWith(journeyParamsSchema, request.params);
    const result = await repository.journey(opportunityId);
    if (result === null) throw new AppError(404, "JOURNEY_NOT_FOUND", "Journey was not found");
    response.json(result);
  }));
  return router;
}
