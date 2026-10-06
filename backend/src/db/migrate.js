import { createPool } from "./pool.js";
import { runMigrations } from "./migrate-runner.js";
import { logger } from "../observability/logger.js";

async function main() {
  let pool;

  try {
    pool = createPool();
    const result = await runMigrations({ pool });
    logger.info("database_migrations_complete", {
      appliedCount: result.appliedVersions.length,
      skippedCount: result.skippedVersions.length,
    });
  } catch (error) {
    logger.error("database_migration_failed", { error });
    process.exitCode = 1;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

await main();
