import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const backendEnvFilePath = fileURLToPath(
  new URL("../../.env", import.meta.url),
);
const rootEnvFilePath = fileURLToPath(
  new URL("../../../.env", import.meta.url),
);

for (const envFilePath of [rootEnvFilePath, backendEnvFilePath]) {
  if (existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  }
}

export function parseEnv(source) {
  const portValue = source.PORT;

  if (!portValue) {
    throw new Error(
      "Missing required environment variable PORT. Set it in backend/.env or the process environment.",
    );
  }

  if (!/^\d+$/.test(portValue)) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const port = Number(portValue);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }

  const nodeEnv = source.NODE_ENV ?? "development";
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production.");
  }
  getMockAuthConfig(source);

  return Object.freeze({ port, nodeEnv });
}

export function getEnv() {
  return parseEnv(process.env);
}

export function getMockAuthConfig(source = process.env) {
  const flag = source.MOCK_AUTH_ENABLED ?? "false";
  if (!["true", "false"].includes(flag)) {
    throw new Error("MOCK_AUTH_ENABLED must be true or false.");
  }
  const enabled = flag === "true";
  if (enabled && (source.NODE_ENV ?? "development") !== "development") {
    throw new Error("Mock authentication is allowed only in development.");
  }
  const origin = source.MOCK_AUTH_ORIGIN ?? "http://127.0.0.1:5173";
  if (enabled) {
    let url;
    try {
      url = new URL(origin);
    } catch {
      throw new Error("MOCK_AUTH_ORIGIN must be a loopback HTTP origin.");
    }
    if (
      url.protocol !== "http:" ||
      !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) ||
      url.origin !== origin
    ) {
      throw new Error("MOCK_AUTH_ORIGIN must be a loopback HTTP origin.");
    }
  }
  return Object.freeze({ enabled, origin });
}

export function getDatabaseUrl(source = process.env) {
  if (source.DATABASE_URL) {
    let databaseUrl;
    try {
      databaseUrl = new URL(source.DATABASE_URL);
    } catch {
      throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }

    if (
      !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
      !databaseUrl.hostname
    ) {
      throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
    }

    return source.DATABASE_URL;
  }

  const required = ["POSTGRES_DB", "POSTGRES_USER", "POSTGRES_PASSWORD"];
  const missing = required.filter((name) => !source[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing database configuration: set DATABASE_URL or ${required.join(", ")}.`,
    );
  }

  const host = source.POSTGRES_HOST ?? "localhost";
  const portValue = source.POSTGRES_PORT ?? "5432";
  if (!/^\d+$/.test(portValue)) {
    throw new Error("POSTGRES_PORT must be an integer between 1 and 65535.");
  }
  const port = Number(portValue);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
    throw new Error("POSTGRES_PORT must be an integer between 1 and 65535.");
  }

  const databaseUrl = new URL("postgresql://localhost");
  databaseUrl.hostname = host;
  databaseUrl.port = String(port);
  databaseUrl.username = source.POSTGRES_USER;
  databaseUrl.password = source.POSTGRES_PASSWORD;
  databaseUrl.pathname = `/${source.POSTGRES_DB}`;
  return databaseUrl.toString();
}
