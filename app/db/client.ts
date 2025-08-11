import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({ connectionString });
export const db = drizzle(pool, { schema });

export * from "./schema";
