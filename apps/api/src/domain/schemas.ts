import { filterSchema, landingDraftRequestSchema, paginationSchema } from "@qida/contracts";
import { z } from "zod";
import type { PageRequest, StrategyAssumptions } from "./types.js";

export const filtersSchema = filterSchema.superRefine((value, context) => {
  if (value.from !== undefined && value.to !== undefined && value.from > value.to) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["from"], message: "from must not be after to" });
  }
});

export const listQuerySchema = filtersSchema.and(paginationSchema).and(
  z.object({ search: z.string().trim().min(1).max(100).optional() }),
);

export const opportunityParamsSchema = z.object({
  municipalityId: z.string().trim().min(1).max(32),
  service: z.string().trim().min(1).max(100),
});

export const idParamsSchema = z.object({ id: z.string().trim().min(1).max(100) });
export const journeyParamsSchema = z.object({ opportunityId: z.string().trim().min(1).max(100) });
export const landingParamsSchema = z.object({ url: z.string().trim().min(1).max(500) });

export const createLandingSchema = landingDraftRequestSchema.extend({
  municipalityId: z.string().trim().min(1).max(32),
  service: z.string().trim().min(1).max(100),
});

export const reviewLandingSchema = z.object({ reviewerNote: z.string().trim().max(500).optional() }).strict();
export const approveLandingSchema = z.object({
  approver: z.string().trim().min(2).max(100),
  note: z.string().trim().max(500).optional(),
}).strict();

export const localRoleSchema = z.enum(["analyst", "reviewer", "growth_manager", "admin"]);

const scenarioDefaults = {
  conservative: { demandCaptureRate: 0.015, leadToSqlRate: 0.35, sqlToAltaRate: 0.12, capacityUtilization: 0.5 },
  base: { demandCaptureRate: 0.025, leadToSqlRate: 0.42, sqlToAltaRate: 0.18, capacityUtilization: 0.7 },
  optimistic: { demandCaptureRate: 0.04, leadToSqlRate: 0.5, sqlToAltaRate: 0.24, capacityUtilization: 0.85 },
} as const;

export const strategyQuerySchema = z.object({
  scenario: z.enum(["conservative", "base", "optimistic"]).default("base"),
  demandCaptureRate: z.coerce.number().min(0).max(0.2).optional(),
  leadToSqlRate: z.coerce.number().min(0).max(1).optional(),
  sqlToAltaRate: z.coerce.number().min(0).max(1).optional(),
  capacityUtilization: z.coerce.number().min(0).max(1).optional(),
  months: z.coerce.number().int().min(1).max(24).default(6),
}).transform((value): StrategyAssumptions => {
  const defaults = scenarioDefaults[value.scenario];
  return {
    scenario: value.scenario,
    demandCaptureRate: value.demandCaptureRate ?? defaults.demandCaptureRate,
    leadToSqlRate: value.leadToSqlRate ?? defaults.leadToSqlRate,
    sqlToAltaRate: value.sqlToAltaRate ?? defaults.sqlToAltaRate,
    capacityUtilization: value.capacityUtilization ?? defaults.capacityUtilization,
    months: value.months,
  };
});

export function parseListQuery(value: unknown): PageRequest {
  const parsed = listQuerySchema.parse(value);
  return { ...parsed, page: parsed.page ?? 1, pageSize: parsed.pageSize ?? 25 };
}

export function encodeLandingUrl(value: string): string {
  return decodeURIComponent(value);
}
