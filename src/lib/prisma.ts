/**
 * Prisma Client Instance
 *
 * This file exports a singleton Prisma client instance to be used throughout
 * the application. Using a singleton prevents multiple Prisma client instances
 * from being created during hot reloading in development.
 *
 * @see https://www.prisma.io/docs/guides/other/troubleshooting-orm/help-articles/nextjs-prisma-client-dev-practices
 */

import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton
 *
 * In development, this prevents creating multiple Prisma client instances
 * due to hot module replacement. In production, a new instance is created.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? // ? ['query', 'error', 'warn']
          ["error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/**
 * Helper function to safely disconnect Prisma on application shutdown
 *
 * Call this during graceful shutdown to ensure all database connections
 * are properly closed.
 *
 * @example
 * ```typescript
 * process.on('SIGTERM', async () => {
 *   await disconnectPrisma();
 *   process.exit(0);
 * });
 * ```
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
