import { PrismaClient } from "@prisma/client";

// Prisma 7 uses prisma.config.ts for database URL
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();