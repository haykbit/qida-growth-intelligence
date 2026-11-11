import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import type { AppLogger } from "./logger.js";

export class AppError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(new AppError(404, "NOT_FOUND", `Route ${request.method} ${request.path} was not found`));
};

export function errorHandler(logger: AppLogger): ErrorRequestHandler {
  return (error: unknown, _request, response, _next) => {
    const requestId = String(response.locals.requestId ?? "unknown");
    if (error instanceof ZodError) {
      response.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten(),
          requestId,
        },
      });
      return;
    }

    if (error instanceof AppError) {
      response.status(error.status).json({
        error: { code: error.code, message: error.message, details: error.details, requestId },
      });
      return;
    }

    logger.error({ err: error, requestId }, "Unhandled request error");
    response.status(500).json({
      error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred", requestId },
    });
  };
}
