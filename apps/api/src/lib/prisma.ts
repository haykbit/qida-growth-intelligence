import { PrismaClient } from "@prisma/client";

export type DatabaseClient = Pick<PrismaClient, "$queryRawUnsafe" | "$executeRawUnsafe" | "$transaction" | "$disconnect">;

export function createDatabaseClient(): PrismaClient {
  return new PrismaClient({ log: ["warn", "error"] });
}
