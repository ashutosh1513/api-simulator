import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const dbPath = path.join(dbDir, "app.db");
export const db = new Database(dbPath);

// Projects table (if not already present)
db.prepare(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
  );
`).run();

// Collections table
db.prepare(`
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects (id)
  );
`).run();


// APIs table
db.prepare(`
  CREATE TABLE IF NOT EXISTS apis (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    status_code INTEGER NOT NULL DEFAULT 200,
    response_type TEXT NOT NULL DEFAULT 'application/json',
    response_body TEXT NOT NULL,
    delay_ms INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (collection_id) REFERENCES collections(id)
  );
`).run();

// Migration: Add delay_ms column if it doesn't exist (for existing databases)
try {
  const tableInfo = db.prepare("PRAGMA table_info(apis)").all() as Array<{ name: string }>;
  const hasDelayMs = tableInfo.some((col) => col.name === "delay_ms");
  
  if (!hasDelayMs) {
    console.log("Migrating: Adding delay_ms column to apis table...");
    db.prepare("ALTER TABLE apis ADD COLUMN delay_ms INTEGER NOT NULL DEFAULT 0").run();
    console.log("Migration complete: delay_ms column added");
  }
} catch (err) {
  console.error("Migration error (non-fatal):", err);
}

// Migration: Add updated_at column if it doesn't exist (for existing databases)
try {
  const tableInfo = db.prepare("PRAGMA table_info(apis)").all() as Array<{ name: string }>;
  const hasUpdatedAt = tableInfo.some((col) => col.name === "updated_at");
  
  if (!hasUpdatedAt) {
    console.log("Migrating: Adding updated_at column to apis table...");
    db.prepare("ALTER TABLE apis ADD COLUMN updated_at TEXT").run();
    console.log("Migration complete: updated_at column added");
  }
} catch (err) {
  console.error("Migration error (non-fatal):", err);
}

// Request logs table
db.prepare(`
  CREATE TABLE IF NOT EXISTS request_logs (
    id TEXT PRIMARY KEY,
    api_id TEXT,
    timestamp TEXT,
    request_meta TEXT,
    request_body TEXT,
    response_sent TEXT,
    FOREIGN KEY (api_id) REFERENCES apis(id)
  );
`).run();

