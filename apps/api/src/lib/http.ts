import type { RequestHandler } from "express";
import type { ZodType } from "zod";

export type AsyncHandler = (
  request: Parameters<RequestHandler>[0],
  response: Parameters<RequestHandler>[1],
  next: Parameters<RequestHandler>[2],
) => Promise<void>;

export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return (request, response, next) => {
    void handler(request, response, next).catch(next);
  };
}

export function parseWith<T>(schema: ZodType<T>, value: unknown): T {
  return schema.parse(value);
}
