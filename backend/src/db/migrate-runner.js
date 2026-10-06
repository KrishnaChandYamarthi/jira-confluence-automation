import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_MIGRATIONS_DIR = fileURLToPath(
  new URL("../../migrations/", import.meta.url),
);
const LOCK_CLASS = 74_091;
const LOCK_ID = 1;

function parseMigration(filename) {
  const match = /^(\d+)_([a-z0-9_]+)\.sql$/.exec(filename);
  if (!match) {
    throw new Error(`Invalid migration filename: ${filename}`);
  }

  return { version: match[1], filename };
}

function compareVersions(left, right) {
  const leftVersion = BigInt(left.version);
  const rightVersion = BigInt(right.version);
  return leftVersion < rightVersion ? -1 : leftVersion > rightVersion ? 1 : 0;
}

export async function runMigrations({
  pool,
  migrationsDir = DEFAULT_MIGRATIONS_DIR,
}) {
  if (!pool || typeof pool.connect !== "function") {
    throw new TypeError("runMigrations requires a PostgreSQL pool.");
  }

  const files = (await readdir(migrationsDir))
    .filter((filename) => filename.endsWith(".sql"))
    .map(parseMigration)
    .sort(compareVersions);

  if (files.length === 0) {
    throw new Error("No SQL migrations were found.");
  }

  for (let index = 1; index < files.length; index += 1) {
    if (compareVersions(files[index - 1], files[index]) === 0) {
      throw new Error(`Duplicate migration version: ${files[index].version}`);
    }
  }

  const client = await pool.connect();
  let lockHeld = false;
  const appliedVersions = [];
  const skippedVersions = [];

  try {
    await client.query("SELECT pg_advisory_lock($1, $2)", [LOCK_CLASS, LOCK_ID]);
    lockHeld = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version TEXT PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        checksum TEXT NOT NULL CHECK (length(checksum) = 64),
        applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const migration of files) {
      const sql = await readFile(join(migrationsDir, migration.filename), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const existing = await client.query(
        "SELECT checksum FROM schema_migrations WHERE version = $1",
        [migration.version],
      );

      if (existing.rowCount > 0) {
        if (existing.rows[0].checksum !== checksum) {
          throw new Error(
            `Migration ${migration.version} checksum does not match the applied migration.`,
          );
        }
        skippedVersions.push(migration.version);
        continue;
      }

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations (version, filename, checksum) VALUES ($1, $2, $3)",
          [migration.version, migration.filename, checksum],
        );
        await client.query("COMMIT");
        appliedVersions.push(migration.version);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(
          `Migration ${migration.version} failed; changes were rolled back.`,
          { cause: error },
        );
      }
    }
  } finally {
    try {
      if (lockHeld) {
        await client.query("SELECT pg_advisory_unlock($1, $2)", [
          LOCK_CLASS,
          LOCK_ID,
        ]);
      }
    } finally {
      client.release();
    }
  }

  return { appliedVersions, skippedVersions };
}
