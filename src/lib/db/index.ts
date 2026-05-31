import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

/** Pooled connection for serverless (Neon pooler) */
const client = postgres(connectionString, { prepare: false });

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export const db = globalThis.__db ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

export type Db = typeof db;
