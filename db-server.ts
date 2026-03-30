import { Database } from "bun:sqlite";

export {};

const DB_PATH = process.env.DB_PATH || "./data.db";
const DB_TOKEN = process.env.DB_TOKEN || "local-dev-token";

const sqlite = new Database(DB_PATH, { create: true });
sqlite.exec("PRAGMA journal_mode=WAL");
sqlite.exec("PRAGMA foreign_keys=ON");

const server = Bun.serve({
  port: 5432,
  hostname: "127.0.0.1",
  async fetch(req) {
    const auth = req.headers.get("Authorization");
    if (auth !== `Bearer ${DB_TOKEN}`) {
      return new Response(JSON.stringify({ error: { message: "Unauthorized" } }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: { message: "Method not allowed" } }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    try {
      const body = await req.json();
      const { sql, params, method } = body;

      if (!sql) {
        return new Response(JSON.stringify({ error: { message: "Missing sql" } }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = execute(sql, params ?? [], method ?? "all");
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Query failed";
      return new Response(JSON.stringify({ error: { message: msg } }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
});

// Convert object row to array based on column names in SQL
// Drizzle sqlite-proxy expects rows as arrays (indexed by column position)
function rowToArray(row: Record<string, unknown>, columns: string[]): unknown[] {
  return columns.map((col) => {
    const val = row[col];
    return typeof val === "bigint" ? Number(val) : val;
  });
}

// Extract column names from a SELECT query
function extractColumns(sql: string): string[] {
  const match = sql.match(/^\s*SELECT\s+(.*?)\s+FROM\s/i);
  if (!match) return [];
  return match[1].split(",").map((c) => {
    // Remove quotes and whitespace, get the column name
    const cleaned = c.trim().replace(/^["']|["']$/g, "").trim();
    // Handle "table"."column" or "column" formats
    const parts = cleaned.split(".");
    return parts[parts.length - 1].replace(/^["']|["']$/g, "");
  });
}

function execute(sql: string, params: unknown[], method: string) {
  // Handle CREATE TABLE / migrations / DDL
  if (/^\s*(CREATE|ALTER|DROP)\s/i.test(sql)) {
    sqlite.exec(sql);
    return { rows: [] };
  }

  // Handle INSERT ... RETURNING (returns rows as arrays for Drizzle mapping)
  if (/^\s*INSERT\s/i.test(sql) && /RETURNING/i.test(sql)) {
    const stmt = sqlite.prepare(sql);
    const row = stmt.get(...params);
    if (!row) return { rows: [] };
    const columns = extractColumns(sql);
    if (columns.length > 0) {
      return { rows: [rowToArray(row as Record<string, unknown>, columns)] };
    }
    return { rows: [row] };
  }

  // Handle INSERT
  if (/^\s*INSERT\s/i.test(sql)) {
    const stmt = sqlite.prepare(sql);
    const result = stmt.run(...params);
    return { rows: [{ id: result.lastInsertRowid, changes: result.changes }] };
  }

  // Handle UPDATE
  if (/^\s*UPDATE\s/i.test(sql)) {
    const stmt = sqlite.prepare(sql);
    const result = stmt.run(...params);
    return { rows: [{ changes: result.changes }] };
  }

  // Handle DELETE
  if (/^\s*DELETE\s/i.test(sql)) {
    const stmt = sqlite.prepare(sql);
    const result = stmt.run(...params);
    return { rows: [{ changes: result.changes }] };
  }

  // SELECT queries - return rows as arrays for Drizzle mapResultRow
  const columns = extractColumns(sql);

  if (method === "get") {
    const stmt = sqlite.prepare(sql);
    const row = stmt.get(...params);
    if (!row) return { rows: [] };
    if (columns.length > 0) {
      return { rows: [rowToArray(row as Record<string, unknown>, columns)] };
    }
    return { rows: [row] };
  }

  const stmt = sqlite.prepare(sql);
  const rows = stmt.all(...params);
  if (columns.length > 0) {
    return { rows: rows.map((r) => rowToArray(r as Record<string, unknown>, columns)) };
  }
  return { rows };
}

console.log(`[db-server] SQLite HTTP server running on http://127.0.0.1:${server.port}`);
console.log(`[db-server] Database file: ${DB_PATH}`);
console.log(`[db-server] Token: ${DB_TOKEN}`);
