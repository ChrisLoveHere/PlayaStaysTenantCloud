import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";

const filePath = (process.env.DATABASE_URL ?? "file:./local.db").replace(
  "file:",
  ""
);

const sqlite = new Database(filePath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

export const db = globalThis.__db ?? drizzle(sqlite, { schema });

if (process.env.NODE_ENV !== "production") {
  globalThis.__db = db;
}

export type Db = typeof db;
