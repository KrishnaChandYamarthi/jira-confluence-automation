import { createPool } from "./pool.js";
import { runMigrations } from "./migrate-runner.js";

async function main() {
  let pool;

  try {
    pool = createPool();
    const result = await runMigrations({ pool });
    console.info(
      `Database migrations complete: ${result.appliedVersions.length} applied, ${result.skippedVersions.length} already applied.`,
    );
  } catch (error) {
    console.error(`Database migration failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

await main();
