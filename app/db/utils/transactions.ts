import type { PgTransaction, PgDatabase } from "drizzle-orm/pg-core"; // types only

// Helper wrapper to ensure consistent transaction usage.
export async function withTransaction<T>(db: any, fn: (tx: any) => Promise<T>): Promise<T> {
  return db.transaction(async (tx: any) => fn(tx));
}
