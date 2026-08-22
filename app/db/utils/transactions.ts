import type { db as appDb } from "../client";

type Database = typeof appDb;
type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

// Helper wrapper to ensure consistent transaction usage.
export async function withTransaction<T>(
  database: Database,
  fn: (tx: Transaction) => Promise<T>,
): Promise<T> {
  return database.transaction((tx) => fn(tx));
}
