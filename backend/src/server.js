import app from "./app.js";
import { getEnv } from "./config/env.js";
import { logger } from "./observability/logger.js";

const env = getEnv();
const server = app.listen(env.port, () => {
  logger.info("backend_started", {
    port: env.port,
    environment: env.nodeEnv,
  });
});

function stop(signal) {
  server.close((error) => {
    if (error) {
      logger.error("backend_shutdown_failed", { signal, error });
      process.exitCode = 1;
      return;
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
