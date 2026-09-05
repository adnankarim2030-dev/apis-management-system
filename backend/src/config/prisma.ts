const FALLBACK_DB_URL =
  'postgresql://neondb_owner:npg_OTMfBphb41Hq@ep-calm-rice-aerxsuly-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = FALLBACK_DB_URL;
}

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || FALLBACK_DB_URL,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
