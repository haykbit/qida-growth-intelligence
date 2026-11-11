import { Router } from "express";
import type { GrowthRepository } from "../../domain/types.js";
import {
  approveLandingSchema,
  createLandingSchema,
  landingParamsSchema,
  parseListQuery,
  localRoleSchema,
  reviewLandingSchema,
} from "../../domain/schemas.js";
import { asyncHandler, parseWith } from "../../lib/http.js";
import { AppError } from "../../lib/errors.js";

function requireApprovalRole(role: string): void {
  if (role !== "growth_manager" && role !== "admin") {
    throw new AppError(403, "ROLE_FORBIDDEN", "Growth manager or admin role is required");
  }
}

export function landingsRouter(repository: GrowthRepository): Router {
  const router = Router();
  router.get("/landings", asyncHandler(async (request, response) => { response.json(await repository.landings(parseListQuery(request.query))); }));
  router.post("/landings/drafts", asyncHandler(async (request, response) => {
    response.status(201).json(await repository.createLandingDraft(parseWith(createLandingSchema, request.body), String(response.locals.requestId)));
  }));
  router.post("/landings/:url/review", asyncHandler(async (request, response) => {
    const { url } = parseWith(landingParamsSchema, request.params);
    response.json(await repository.reviewLanding(url, parseWith(reviewLandingSchema, request.body), String(response.locals.requestId)));
  }));
  router.post("/landings/:url/approve", asyncHandler(async (request, response) => {
    const { url } = parseWith(landingParamsSchema, request.params);
    const role = parseWith(localRoleSchema, request.header("x-local-role") ?? "analyst");
    requireApprovalRole(role);
    response.json(await repository.approveLanding(url, parseWith(approveLandingSchema, request.body), role, String(response.locals.requestId)));
  }));
  router.post("/landings/:url/publish", asyncHandler(async (request, response) => {
    const { url } = parseWith(landingParamsSchema, request.params);
    const role = parseWith(localRoleSchema, request.header("x-local-role") ?? "analyst");
    requireApprovalRole(role);
    response.json(await repository.publishLanding(url, role, String(response.locals.requestId)));
  }));
  return router;
}
