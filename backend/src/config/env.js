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

  return Object.freeze({ port, nodeEnv });
}

export function getEnv() {
  return parseEnv(process.env);
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
