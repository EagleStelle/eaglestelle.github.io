import { defineConfig, env } from "prisma/config";

// Prisma 7 does NOT auto-load .env — load it ourselves (Node 21.7+ built-in).
process.loadEnvFile(".env");

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
