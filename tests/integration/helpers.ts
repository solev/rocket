import { sql } from "drizzle-orm";

import { db } from "~/db/client";
import { account, member, organization, session, user } from "~/db/schema";

/** Empties every table the auth and ownership tests touch. */
export async function resetDatabase(): Promise<void> {
  await db.execute(
    sql`TRUNCATE TABLE ${session}, ${account}, ${member}, ${organization}, ${user} RESTART IDENTITY CASCADE`,
  );
}

export async function countRows(table: "organization" | "member" | "user") {
  const tables = { organization, member, user } as const;
  const rows = await db.select().from(tables[table]);
  return rows.length;
}
