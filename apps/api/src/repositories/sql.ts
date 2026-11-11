import { AppError } from "../lib/errors.js";

export type SqlValue = string | number | boolean | Date | null;

export class SqlBuilder {
  public readonly values: SqlValue[] = [];

  public add(value: SqlValue): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

export function records(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) {
    throw new AppError(500, "DATABASE_SHAPE_ERROR", "Database returned a non-list result");
  }
  return value.map((item) => {
    if (typeof item !== "object" || item === null || Array.isArray(item)) {
      throw new AppError(500, "DATABASE_SHAPE_ERROR", "Database returned an invalid row");
    }
    return item as Record<string, unknown>;
  });
}

export function stringValue(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function numberValue(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    const candidate = value as { toNumber: () => number };
    const parsed = candidate.toNumber();
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function booleanValue(value: unknown): boolean {
  return value === true || value === "true" || value === 1;
}

export function isoValue(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  throw new AppError(500, "DATABASE_SHAPE_ERROR", "Expected a date value");
}

export function nullableIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return isoValue(value);
}

export function jsonRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export function rate(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

export function round(value: number, digits = 4): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
