import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });
config({ path: ".env" });

/** Use unpooled URL for migrations (Neon direct connection) */
const url =
  process.env.DATABASE_URL_UNPOOLED ??
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL_NON_POOLING;

if (!url) {
  throw new Error(
    "Set DATABASE_URL_UNPOOLED or DATABASE_URL for drizzle-kit"
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
});
