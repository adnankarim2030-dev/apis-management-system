import { PrismaClient } from '@prisma/client';

const dbUrl =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_OTMfBphb41Hq@ep-calm-rice-aerxsuly-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
