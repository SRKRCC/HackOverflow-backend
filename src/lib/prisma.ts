import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectPrisma(retries = 3, delayMs = 500): Promise<void> {
  let attempt = 0;
  while (true) {
    try {
      attempt++;
      await prisma.$connect();
      console.log('Prisma connected.');
      return;
    } catch (err) {
      console.error(`Prisma connection attempt ${attempt} failed:`, err instanceof Error ? err.message : err);
      if (attempt >= retries) {
        console.error('Could not connect to Prisma after', retries, 'attempts.');
        throw err;
      }
      // exponential backoff with jitter
      const jitter = Math.floor(Math.random() * 100);
      const wait = delayMs * Math.pow(2, attempt) + jitter;
      console.log(`Retrying Prisma connection in ${wait}ms...`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
}

process.on('SIGINT', async () => {
  try {
    await prisma.$disconnect();
    console.log('Prisma disconnected (SIGINT).');
  } catch (e) {
    /* ignore */
  }
  process.exit(0);
});