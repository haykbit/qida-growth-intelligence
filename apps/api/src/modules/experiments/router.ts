import { Router } from "express";
import type { GrowthRepository } from "../../domain/types.js";
import { idParamsSchema, parseListQuery } from "../../domain/schemas.js";
import { AppError } from "../../lib/errors.js";
import { asyncHandler, parseWith } from "../../lib/http.js";

export function experimentsRouter(repository: GrowthRepository): Router {
  const router = Router();
  router.get("/experiments", asyncHandler(async (request, response) => { response.json(await repository.experiments(parseListQuery(request.query))); }));
  router.get("/experiments/:id", asyncHandler(async (request, response) => {
    const { id } = parseWith(idParamsSchema, request.params);
    const result = await repository.experiment(id);
    if (result === null) throw new AppError(404, "EXPERIMENT_NOT_FOUND", "Experiment was not found");
    response.json(result);
  }));
  return router;
}
