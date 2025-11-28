import { PrismaClient } from '../generated/prisma/index.js';
import dotenv from 'dotenv';
dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const accelerateUrl = process.env.ACCELERATE_URL ?? process.env.DATABASE_URL ?? "";
const prismaOptions = accelerateUrl ? { accelerateUrl } : undefined;

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient(prismaOptions as any);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}