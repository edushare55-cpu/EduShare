/**
 * lib/prisma.ts
 *
 * Prisma Client singleton.
 * Prevents multiple PrismaClient instances in development (hot reload creates
 * new module instances repeatedly, which would exhaust DB connections).
 *
 * In production a fresh instance is created per cold start.
 */

import { PrismaClient } from "@prisma/client";

// Extend the global type to hold the prisma instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
