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


db.prepare(`
  CREATE TABLE IF NOT EXISTS apis (
    id TEXT PRIMARY KEY,
    collection_id TEXT NOT NULL,
    method TEXT NOT NULL,
    endpoint TEXT NOT NULL,         -- e.g. /users/:id
    status_code INTEGER NOT NULL DEFAULT 200,
    response_type TEXT NOT NULL DEFAULT 'json', -- 'json' | 'text' | 'html'
    response_body TEXT NOT NULL,
    delay INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (collection_id) REFERENCES collections(id)
  );
`).run();

