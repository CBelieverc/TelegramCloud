import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let _initialized = false;

function getDb() {
  if (_db) return _db;

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");

  _db = drizzle(sqlite, { schema });

  if (!_initialized) {
    try {
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          telegram_user_id TEXT,
          telegram_group_chat_id TEXT,
          registration_code TEXT,
          bot_username TEXT,
          linked_at INTEGER,
          created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS bots (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          bot_username TEXT NOT NULL,
          bot_token TEXT,
          telegram_user_id TEXT,
          telegram_chat_id TEXT,
          registration_code TEXT,
          active INTEGER DEFAULT 0,
          linked_at INTEGER,
          created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS folders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          bot_id INTEGER,
          name TEXT NOT NULL,
          parent_id INTEGER,
          created_at INTEGER DEFAULT (unixepoch())
        );

        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          bot_id INTEGER,
          name TEXT NOT NULL,
          original_name TEXT NOT NULL,
          mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
          size INTEGER NOT NULL DEFAULT 0,
          telegram_file_id TEXT NOT NULL,
          telegram_message_id INTEGER NOT NULL,
          folder_id INTEGER,
          created_at INTEGER DEFAULT (unixepoch())
        );
      `);
      _initialized = true;
    } catch (err) {
      console.error("Table creation error:", err);
    }
  }

  return _db;
}

export const db = new Proxy({} as Record<string, unknown>, {
  get(_target, prop) {
    const database = getDb();
    const value = (database as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(database);
    }
    return value;
  },
}) as unknown as ReturnType<typeof drizzle<typeof schema>>;

export function isDbConfigured(): boolean {
  return true;
}

export async function ensureTablesExist() {
  getDb();
}
