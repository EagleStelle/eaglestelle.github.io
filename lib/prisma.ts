import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

// Prisma 7 has no built-in engine — it needs a driver adapter at runtime.
// PrismaNeon uses Neon's serverless driver (works local + on Vercel/edge).
const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL,
});

// Reuse one PrismaClient across hot-reloads in dev.
// Without this, Next.js dev spawns a new client (and DB connection) on every
// file change until Neon runs out of connections.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
