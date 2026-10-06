import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const envFilePath = fileURLToPath(new URL("../../.env", import.meta.url));

if (existsSync(envFilePath)) {
  dotenv.config({ path: envFilePath });
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
