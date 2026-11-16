import { z } from "zod";

const text = z.string().trim().min(1).max(500);
const snapshot = z.object({ title: text, cta: text });
export const changeSchema = z
  .object({
    element: text,
    before: snapshot,
    after: snapshot,
    event: text,
    experimentId: z.string().min(1).max(100).nullable(),
  })
  .refine(
    (c) => c.before.title !== c.after.title || c.before.cta !== c.after.cta,
    "Las versiones son iguales",
  );

export const weeklyStatus = z.enum([
  "En curso",
  "Sin datos",
  "En riesgo",
  "Listo para decidir",
  "Cerrado",
]);
export const weeklyActionSchema = z.object({
  decisionUrl: z.string().max(500).optional(),
  decisionId: z.string().min(1).max(100).optional(),
  task: text,
  owner: text,
  reviewDate: z.string().date(),
  status: weeklyStatus,
});
export const weeklyNoteSchema = z
  .object({
    date: z.string().date(),
    revision: z.number().int().positive(),
    author: text,
    summary: text,
    actions: z.array(weeklyActionSchema).max(30),
  })
  .strict()
  .refine(
    (note) => note.actions.every((action) => action.reviewDate >= note.date),
    "La revisión es anterior al acta",
  );
export type WeeklyNote = z.infer<typeof weeklyNoteSchema>;

export const sqlWeekSchema = z.object({
  week: z.number().int(),
  start: z.string().date(),
  group: z.enum(["treatment", "control"]),
  mature: z.boolean(),
  municipalities: z.number(),
  sql: z.number(),
  altas: z.number(),
  matureSql: z.number(),
  phone: z.number(),
  paid: z.number(),
  sessions: z.number(),
});
export type SqlWeek = z.infer<typeof sqlWeekSchema>;
export const sqlResultSchema = z.object({
  asOf: z.string().date(),
  weeks: z.array(sqlWeekSchema),
  difference: z.number().nullable(),
  preTrendGap: z.number().nullable(),
  warnings: z.array(z.string()),
});
export type SqlResult = z.infer<typeof sqlResultSchema>;
export type LandingChange = z.infer<typeof changeSchema>;
