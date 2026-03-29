import { runMigrations } from "@kilocode/app-builder-db";
import { db } from "./index";

try {
  await runMigrations(db, {}, { migrationsFolder: "./src/db/migrations" });
  console.log("Migrations completed successfully");
} catch (err) {
  console.error("Migration error:", err);
}
