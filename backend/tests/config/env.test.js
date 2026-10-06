import test from "node:test";
import assert from "node:assert/strict";
import { getDatabaseUrl, parseEnv } from "../../src/config/env.js";

test("parseEnv requires a valid non-secret port", () => {
  assert.throws(() => parseEnv({}), /Missing required environment variable PORT/);
  assert.throws(() => parseEnv({ PORT: "not-a-port" }), /PORT must be an integer/);
  assert.throws(() => parseEnv({ PORT: "65536" }), /PORT must be an integer/);
  assert.deepEqual(parseEnv({ PORT: "3000" }), {
    port: 3000,
    nodeEnv: "development",
  });
});

test("parseEnv accepts only supported runtime modes", () => {
  assert.deepEqual(parseEnv({ PORT: "8080", NODE_ENV: "production" }), {
    port: 8080,
    nodeEnv: "production",
  });
  assert.throws(
    () => parseEnv({ PORT: "8080", NODE_ENV: "prod" }),
    /NODE_ENV must be development, test, or production/,
  );
});

test("getDatabaseUrl supports DATABASE_URL and encoded local credentials", () => {
  assert.equal(
    getDatabaseUrl({ DATABASE_URL: "postgresql://app:secret@localhost:5432/app" }),
    "postgresql://app:secret@localhost:5432/app",
  );
  assert.equal(
    getDatabaseUrl({
      POSTGRES_DB: "jira automation",
      POSTGRES_USER: "app user",
      POSTGRES_PASSWORD: "local@secret",
      POSTGRES_PORT: "5433",
    }),
    "postgresql://app%20user:local%40secret@localhost:5433/jira%20automation",
  );
});

test("getDatabaseUrl rejects missing and malformed database settings safely", () => {
  assert.throws(
    () => getDatabaseUrl({}),
    /Missing database configuration: set DATABASE_URL or POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD/,
  );
  assert.throws(
    () => getDatabaseUrl({ DATABASE_URL: "https://example.test" }),
    /DATABASE_URL must be a valid PostgreSQL connection URL/,
  );
  assert.throws(
    () =>
      getDatabaseUrl({
        POSTGRES_DB: "db",
        POSTGRES_USER: "user",
        POSTGRES_PASSWORD: "secret",
        POSTGRES_PORT: "70000",
      }),
    /POSTGRES_PORT must be an integer between 1 and 65535/,
  );
});
