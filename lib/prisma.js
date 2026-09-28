import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = global;

// DATABASE_URL aapke .env file se uthega (e.g. mysql://root:password@localhost:3306/cert__gen_db)
const adapter = new PrismaMariaDb(process.env.DATABASE_URL);

export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}