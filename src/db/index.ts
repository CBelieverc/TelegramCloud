import { createDatabase } from "@kilocode/app-builder-db";
import * as schema from "./schema";

export const db = createDatabase(schema);

let initialized = false;

export async function ensureTablesExist() {
  if (initialized) return;

  try {
    await db.select().from(schema.users).limit(1);
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
