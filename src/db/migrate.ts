import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import path from "path";

const dbPath = path.join(process.cwd(), "data.db");
const sqlite = new Database(dbPath);

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

  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    parent_id INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
    size INTEGER NOT NULL DEFAULT 0,
    telegram_file_id TEXT NOT NULL,
    telegram_message_id INTEGER NOT NULL,
    folder_id INTEGER,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (folder_id) REFERENCES folders(id)
  );
`);

sqlite.close();
console.log("Database tables created successfully");
