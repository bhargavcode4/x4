/**
 * Turso HTTP API client — no native bindings, works on ALL Vercel runtimes.
 * Drop-in replacement for @libsql/client.
 * Usage: import { sql, initDb } from "@/lib/db"
 *        const result = await sql("SELECT * FROM users WHERE email = ?", [email])
 *        result.rows  => array of value arrays
 *        result.lastInsertRowid => number | null
 */

const getUrl = () =>
  (process.env.TURSO_DATABASE_URL || "").replace("libsql://", "https://");

async function tursoRequest(statements) {
  const url = `${getUrl()}/v2/pipeline`;
  const token = process.env.TURSO_AUTH_TOKEN;

  const requests = [
    ...statements.map((s) => ({
      type: "execute",
      stmt: {
        sql: s.sql,
        args: (s.args || []).map((a) => {
          if (a === null || a === undefined) return { type: "null" };
          if (typeof a === "number" && Number.isInteger(a))
            return { type: "integer", value: String(a) };
          if (typeof a === "number")
            return { type: "float", value: a };
          return { type: "text", value: String(a) };
        }),
      },
    })),
    { type: "close" },
  ];

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ requests }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Turso HTTP ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  return data.results;
}

/** Execute a single SQL statement with optional args. */
export async function sql(query, args = []) {
  const results = await tursoRequest([{ sql: query, args }]);
  const r = results?.[0];
  if (r?.type === "error") throw new Error(`SQL error: ${r.error?.message}`);

  const result = r?.response?.result;
  if (!result) return { rows: [], lastInsertRowid: null };

  const rows = (result.rows || []).map((row) =>
    row.map((cell) => {
      if (!cell || cell.type === "null") return null;
      if (cell.type === "integer") return Number(cell.value);
      if (cell.type === "float") return parseFloat(cell.value);
      return cell.value ?? null;
    })
  );

  return {
    rows,
    cols: (result.cols || []).map((c) => c.name),
    lastInsertRowid: result.last_insert_rowid
      ? Number(result.last_insert_rowid)
      : null,
  };
}

/** Run multiple statements in one round-trip (for batch inserts). */
export async function sqlBatch(statements) {
  const results = await tursoRequest(statements);
  return results.map((r, i) => {
    if (r?.type === "error")
      throw new Error(`Batch SQL error at index ${i}: ${r.error?.message}`);
    const result = r?.response?.result;
    if (!result) return { rows: [], lastInsertRowid: null };
    const rows = (result.rows || []).map((row) =>
      row.map((cell) => {
        if (!cell || cell.type === "null") return null;
        if (cell.type === "integer") return Number(cell.value);
        return cell.value ?? null;
      })
    );
    return { rows, lastInsertRowid: result.last_insert_rowid ? Number(result.last_insert_rowid) : null };
  });
}

let dbInitialized = false;

export async function initDb() {
  if (dbInitialized) return;
  await tursoRequest([
    {
      sql: `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        phone TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS otp_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT NOT NULL,
        code TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        used INTEGER DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS repos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        repo_url TEXT NOT NULL,
        repo_name TEXT NOT NULL,
        analysed_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id INTEGER NOT NULL,
        file_name TEXT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding TEXT NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS cached_answers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_id INTEGER NOT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      )`,
      args: [],
    },
  ]);
  dbInitialized = true;
}
