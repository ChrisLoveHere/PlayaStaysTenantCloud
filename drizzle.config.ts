import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL ?? "file:./local.db";
const isSqlite = url.startsWith("file:");

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: isSqlite ? "sqlite" : "postgresql",
  dbCredentials: isSqlite ? { url } : { url },
});
