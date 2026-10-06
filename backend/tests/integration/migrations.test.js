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
  try {
    const version = await adminPool.query("SHOW server_version_num");
    assert.match(version.rows[0].server_version_num, /^15/, "PostgreSQL 15 is required");
    await adminPool.query(`CREATE SCHEMA "${schema}"`);
  } catch (error) {
    await adminPool.end();
    throw error;
  }

  const pool = new Pool({
    connectionString: getDatabaseUrl(),
    options: `-c search_path=${schema}`,
  });

  t.after(async () => {
    try {
      await pool.end();
    } finally {
      try {
        await adminPool.query(`DROP SCHEMA "${schema}" CASCADE`);
      } finally {
        await adminPool.end();
      }
    }
  });

  return pool;
}

test("a pending operation is durably written and read back from PostgreSQL", async (t) => {
  const pool = await createIsolatedPool(t);
  await runMigrations({ pool });

  const owner = await pool.query(
    "INSERT INTO users (sso_subject) VALUES ($1) RETURNING id",
    [`subject-${randomUUID()}`],
  );
  const requestId = randomUUID();
  const fingerprint = Buffer.alloc(32, 7);
  const inserted = await pool.query(
    `INSERT INTO automation_operations
      (requester_user_id, request_id, operation_type, provider, status,
       request_fingerprint, target_ref)
     VALUES ($1, $2, 'jira_issue_create', 'jira', 'pending', $3, $4)
     RETURNING id`,
    [owner.rows[0].id, requestId, fingerprint, "project-123"],
  );

  const persisted = await pool.query(
    `SELECT id, requester_user_id, request_id, operation_type, provider,
            status, request_fingerprint, target_ref, completed_at, expires_at
     FROM automation_operations
     WHERE id = $1`,
    [inserted.rows[0].id],
  );

  assert.equal(persisted.rowCount, 1);
  assert.equal(persisted.rows[0].id, inserted.rows[0].id);
  assert.equal(persisted.rows[0].requester_user_id, owner.rows[0].id);
  assert.equal(persisted.rows[0].request_id, requestId);
  assert.equal(persisted.rows[0].operation_type, "jira_issue_create");
  assert.equal(persisted.rows[0].provider, "jira");
  assert.equal(persisted.rows[0].status, "pending");
  assert.deepEqual(persisted.rows[0].request_fingerprint, fingerprint);
  assert.equal(persisted.rows[0].target_ref, "project-123");
  assert.equal(persisted.rows[0].completed_at, null);
  assert.ok(new Date(persisted.rows[0].expires_at) > new Date());
});

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
  const duplicates = await pool.query(
    `SELECT count(*)::int AS count
     FROM automation_operations
     WHERE requester_user_id = $1 AND request_id = $2`,
    [owner.rows[0].id, requestId],
  );
  assert.equal(duplicates.rows[0].count, 1);
  await pool.query(
    insertOperation,
    values(anotherOwner.rows[0].id, "confluence_search"),
  );
});

test("a failed transaction leaves no partial operation or audit records", async (t) => {
  const pool = await createIsolatedPool(t);
  await runMigrations({ pool });

  const owner = await pool.query(
    "INSERT INTO users (sso_subject) VALUES ($1) RETURNING id",
    [`subject-${randomUUID()}`],
  );
  const operationId = randomUUID();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO automation_operations
        (id, requester_user_id, request_id, operation_type, provider,
         request_fingerprint)
       VALUES ($1, $2, $3, 'jira_issue_create', 'jira', $4)`,
      [operationId, owner.rows[0].id, randomUUID(), Buffer.alloc(32, 9)],
    );
    await assert.rejects(
      client.query(
        `INSERT INTO audit_events
          (actor_user_id, operation_id, event_type, result)
         VALUES ($1, $2, 'operation_created', '')`,
        [owner.rows[0].id, operationId],
      ),
      { code: "23514" },
    );
    await client.query("ROLLBACK");
  } finally {
    client.release();
  }

  const counts = await pool.query(
    `SELECT
       (SELECT count(*)::int FROM automation_operations WHERE id = $1) AS operations,
       (SELECT count(*)::int FROM audit_events WHERE operation_id = $1) AS audit_events`,
    [operationId],
  );
  assert.deepEqual(counts.rows[0], { operations: 0, audit_events: 0 });
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
