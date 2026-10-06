import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { getDatabaseUrl } from "../../src/config/env.js";
import { runMigrations } from "../../src/db/migrate-runner.js";

const { Pool } = pg;

async function createIsolatedPool(t) {
  const adminPool = new Pool({ connectionString: getDatabaseUrl() });
  const schema = `migration_test_${randomUUID().replaceAll("-", "")}`;
  await adminPool.query(`CREATE SCHEMA "${schema}"`);

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    options: `-c search_path=${schema}`,
  });

  t.after(async () => {
    await pool.end();
    await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
    await adminPool.end();
  });

  return pool;
}

test("migrations apply in order and record their versions", async (t) => {
  const pool = await createIsolatedPool(t);

  const result = await runMigrations({ pool });
  const recorded = await pool.query(
    "SELECT version FROM schema_migrations ORDER BY version",
  );
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema() ORDER BY table_name",
  );

  assert.deepEqual(result.appliedVersions, ["001"]);
  assert.deepEqual(recorded.rows.map((row) => row.version), ["001"]);
  assert.deepEqual(
    tables.rows.map((row) => row.table_name),
    [
      "audit_events",
      "automation_operations",
      "provider_connections",
      "schema_migrations",
      "users",
    ],
  );
});

test("re-running migrations is idempotent", async (t) => {
  const pool = await createIsolatedPool(t);

  const first = await runMigrations({ pool });
  const second = await runMigrations({ pool });
  const count = await pool.query("SELECT count(*)::int AS count FROM schema_migrations");

  assert.deepEqual(first.appliedVersions, ["001"]);
  assert.deepEqual(second.appliedVersions, []);
  assert.deepEqual(second.skippedVersions, ["001"]);
  assert.equal(count.rows[0].count, 1);
});

test("migration files are applied in numeric version order", async (t) => {
  const pool = await createIsolatedPool(t);
  const directory = await mkdtemp(join(tmpdir(), "jira-migrations-order-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(
    join(directory, "10_second.sql"),
    "INSERT INTO migration_order (step) VALUES (10);",
  );
  await writeFile(
    join(directory, "2_first.sql"),
    "CREATE TABLE migration_order (step integer PRIMARY KEY); INSERT INTO migration_order (step) VALUES (2);",
  );

  const result = await runMigrations({ pool, migrationsDir: directory });
  const steps = await pool.query(
    "SELECT step FROM migration_order ORDER BY step",
  );

  assert.deepEqual(result.appliedVersions, ["2", "10"]);
  assert.deepEqual(steps.rows.map((row) => row.step), [2, 10]);
});

test("request IDs are unique per user across operation types", async (t) => {
  const pool = await createIsolatedPool(t);
  await runMigrations({ pool });

  const owner = await pool.query(
    "INSERT INTO users (sso_subject) VALUES ($1) RETURNING id",
    [`subject-${randomUUID()}`],
  );
  const anotherOwner = await pool.query(
    "INSERT INTO users (sso_subject) VALUES ($1) RETURNING id",
    [`subject-${randomUUID()}`],
  );
  const requestId = randomUUID();
  const values = (userId, operationType) => [
    userId,
    requestId,
    operationType,
    operationType.startsWith("jira_") ? "jira" : "confluence",
    Buffer.alloc(32, 1),
  ];
  const insertOperation = `
    INSERT INTO automation_operations
      (requester_user_id, request_id, operation_type, provider, request_fingerprint)
    VALUES ($1, $2, $3, $4, $5)
  `;

  await pool.query(insertOperation, values(owner.rows[0].id, "jira_search"));
  await assert.rejects(
    pool.query(insertOperation, values(owner.rows[0].id, "confluence_search")),
    { code: "23505" },
  );
  await pool.query(
    insertOperation,
    values(anotherOwner.rows[0].id, "confluence_search"),
  );
});

test("schema enforces requester ownership and valid lifecycle states", async (t) => {
  const pool = await createIsolatedPool(t);
  await runMigrations({ pool });

  await assert.rejects(
    pool.query(
      `INSERT INTO automation_operations
        (requester_user_id, request_id, operation_type, provider, request_fingerprint)
       VALUES ($1, $2, 'jira_search', 'jira', $3)`,
      [randomUUID(), randomUUID(), Buffer.alloc(32, 1)],
    ),
    { code: "23503" },
  );

  const owner = await pool.query(
    "INSERT INTO users (sso_subject) VALUES ($1) RETURNING id",
    [`subject-${randomUUID()}`],
  );
  await assert.rejects(
    pool.query(
      `INSERT INTO automation_operations
        (requester_user_id, request_id, operation_type, provider, status, request_fingerprint)
       VALUES ($1, $2, 'jira_search', 'jira', 'running', $3)`,
      [owner.rows[0].id, randomUUID(), Buffer.alloc(32, 1)],
    ),
    { code: "23514" },
  );
  await assert.rejects(
    pool.query(
      `INSERT INTO automation_operations
        (requester_user_id, request_id, operation_type, provider, request_fingerprint)
       VALUES ($1, $2, 'jira_search', 'confluence', $3)`,
      [owner.rows[0].id, randomUUID(), Buffer.alloc(32, 1)],
    ),
    { code: "23514" },
  );
});

test("provider connection stores encrypted token columns only", async (t) => {
  const pool = await createIsolatedPool(t);
  await runMigrations({ pool });

  const owner = await pool.query(
    "INSERT INTO users (sso_subject) VALUES ($1) RETURNING id",
    [`subject-${randomUUID()}`],
  );
  const connection = await pool.query(
    `INSERT INTO provider_connections
      (user_id, provider, cloud_id, atlassian_account_id, token_ciphertext,
       token_nonce, token_auth_tag, encryption_key_id, access_token_expires_at)
     VALUES ($1, 'jira', $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
     RETURNING id`,
    [
      owner.rows[0].id,
      `cloud-${randomUUID()}`,
      `account-${randomUUID()}`,
      Buffer.from("ciphertext fixture"),
      Buffer.alloc(12, 2),
      Buffer.alloc(16, 3),
      "test-key-version",
    ],
  );
  const tokenColumns = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = current_schema()
       AND table_name = 'provider_connections'
       AND (column_name LIKE '%token%' OR column_name = 'encryption_key_id')
     ORDER BY column_name`,
  );

  assert.ok(connection.rows[0].id);
  assert.deepEqual(
    tokenColumns.rows.map((row) => row.column_name),
    [
      "access_token_expires_at",
      "encryption_key_id",
      "refresh_token_expires_at",
      "token_auth_tag",
      "token_ciphertext",
      "token_nonce",
    ],
  );
});

test("migration failure is surfaced and leaves its version unapplied", async (t) => {
  const pool = await createIsolatedPool(t);
  const directory = await mkdtemp(join(tmpdir(), "jira-migrations-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await writeFile(join(directory, "001_broken.sql"), "INVALID SQL;");

  await assert.rejects(
    runMigrations({ pool, migrationsDir: directory }),
    /Migration 001 failed; changes were rolled back/,
  );

  const recorded = await pool.query(
    "SELECT count(*)::int AS count FROM schema_migrations",
  );
  assert.equal(recorded.rows[0].count, 0);
});

test("a migration cannot be changed after it has been applied", async (t) => {
  const pool = await createIsolatedPool(t);
  const directory = await mkdtemp(join(tmpdir(), "jira-migrations-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const migration = join(directory, "001_initial.sql");
  await writeFile(migration, "CREATE TABLE sample (id integer PRIMARY KEY);");
  await runMigrations({ pool, migrationsDir: directory });

  const original = await readFile(migration, "utf8");
  await writeFile(migration, `${original}\n-- changed`);

  await assert.rejects(
    runMigrations({ pool, migrationsDir: directory }),
    /checksum does not match/,
  );
});
