import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

const requestIdPattern = /^[A-Za-z0-9._:-]{1,100}$/;

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const supplied = request.header("x-request-id");
  const requestId = supplied !== undefined && requestIdPattern.test(supplied) ? supplied : randomUUID();
  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
};
