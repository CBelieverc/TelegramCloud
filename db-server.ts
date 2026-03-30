import { Database } from "bun:sqlite";

export {};

const DB_PATH = process.env.DB_PATH || "./data.db";
const DB_TOKEN = process.env.DB_TOKEN || "local-dev-token";

const db = new Database(DB_PATH, { create: true });
db.exec("PRAGMA journal_mode=WAL");
db.exec("PRAGMA foreign_keys=ON");

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

function execute(sql: string, params: unknown[], method: string) {
  // Handle CREATE TABLE / migrations
  if (/^\s*(CREATE|ALTER|DROP)\s/i.test(sql)) {
    db.exec(sql);
    return { rows: [] };
  }

  // Handle INSERT ... RETURNING
  if (/^\s*INSERT\s/i.test(sql) && /RETURNING/i.test(sql)) {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return { rows: row ? [normalizeRow(row)] : [] };
  }

  // Handle INSERT
  if (/^\s*INSERT\s/i.test(sql)) {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { rows: [{ id: result.lastInsertRowid, changes: result.changes }] };
  }

  // Handle UPDATE
  if (/^\s*UPDATE\s/i.test(sql)) {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { rows: [{ changes: result.changes }] };
  }

  // Handle DELETE
  if (/^\s*DELETE\s/i.test(sql)) {
    const stmt = db.prepare(sql);
    const result = stmt.run(...params);
    return { rows: [{ changes: result.changes }] };
  }

  // SELECT / get / all
  if (method === "get") {
    const stmt = db.prepare(sql);
    const row = stmt.get(...params);
    return { rows: row ? [normalizeRow(row)] : [] };
  }

  const stmt = db.prepare(sql);
  const rows = stmt.all(...params);
  return { rows: rows.map(normalizeRow) };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeRow(row: any): any {
  if (!row || typeof row !== "object") return row;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    // Convert BigInt to number
    result[key] = typeof value === "bigint" ? Number(value) : value;
  }
  return result;
}

console.log(`[db-server] SQLite HTTP server running on http://127.0.0.1:${server.port}`);
console.log(`[db-server] Database file: ${DB_PATH}`);
console.log(`[db-server] Token: ${DB_TOKEN}`);
console.log(`[db-server] Add to .env.local:`);
console.log(`  DB_URL=http://127.0.0.1:${server.port}`);
console.log(`  DB_TOKEN=${DB_TOKEN}`);
