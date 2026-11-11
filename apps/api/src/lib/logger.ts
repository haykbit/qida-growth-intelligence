import pino from "pino";
import type { ApiConfig } from "../config/env.js";

export function createLogger(config: Pick<ApiConfig, "LOG_LEVEL">) {
  return pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "*.sourceIdentifier", "*.pseudonym"],
      censor: "[REDACTED]",
    },
  });
}

export type AppLogger = ReturnType<typeof createLogger>;
