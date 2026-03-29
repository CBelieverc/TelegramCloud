import * as schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any = null;
let _dbError: Error | null = null;
let _attempted = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function initDb(): any {
  if (_db) return _db;
  if (_attempted && _dbError) throw _dbError;
  _attempted = true;
  try {
    // Use require to defer module evaluation
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createDatabase } = require("@kilocode/app-builder-db");
    _db = createDatabase(schema);
    return _db;
  } catch (err) {
    _dbError = err instanceof Error ? err : new Error(String(err));
    throw _dbError;
  }
}

export function isDbConfigured(): boolean {
  try {
    initDb();
    return true;
  } catch {
    return false;
  }
}

// Lazy proxy - defers database creation until first actual use
// This allows the module to be imported even when DB is not configured
export const db = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    const database = initDb();
    const value = database[prop as string];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
}) as unknown as ReturnType<typeof import("@kilocode/app-builder-db").createDatabase<typeof schema>>;

let initialized = false;

export async function ensureTablesExist() {
  if (initialized) return;
  if (!isDbConfigured()) return;

  try {
    await (db as any).select().from(schema.users).limit(1);
    initialized = true;
    return;
  } catch {
    // Table doesn't exist, try to run migrations
    console.log("Users table not found, attempting migration...");
  }

  try {
    const { runMigrations } = await import("@kilocode/app-builder-db");
    await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
    console.log("Migrations completed");
    initialized = true;
  } catch (err) {
    console.error("Migration failed:", err);
  }
}
