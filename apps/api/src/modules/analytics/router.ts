import { weeklyNoteSchema } from "@qida/contracts";
import { z } from "zod";
import { AppError } from "../../lib/errors.js";
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
  router.get("/planning", asyncHandler(async (_request, response) => { response.json(await repository.planning()); }));
  const weeklyDate = z.object({ date: z.string().date() });
  router.get("/planning/weekly/:date", asyncHandler(async (request, response) => {
    const { date } = parseWith(weeklyDate, request.params);
    response.json(await repository.weeklyHistory(date));
  }));
  router.post("/planning/weekly/:date", asyncHandler(async (request, response) => {
    const { date } = parseWith(weeklyDate, request.params);
    const note = parseWith(weeklyNoteSchema, request.body);
    if (note.date !== date) throw new AppError(400, "DATE_MISMATCH", "La fecha del acta no coincide.");
    response.status(201).json(await repository.saveWeekly(note));
  }));
  return router;
}
