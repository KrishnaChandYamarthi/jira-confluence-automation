import pg from "pg";
import { getDatabaseUrl } from "../config/env.js";

const { Pool } = pg;

export function createPool(options = {}) {
  return new Pool({
    connectionString: getDatabaseUrl(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    ...options,
  });
}
