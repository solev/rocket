import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { env } from "~/lib/env/env.server";
import * as schema from "./schema";

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";
