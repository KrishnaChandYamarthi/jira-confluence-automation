import app from "./app.js";
import { getEnv, getMockAuthConfig } from "./config/env.js";
import { logger } from "./observability/logger.js";

const env = getEnv();
const host = getMockAuthConfig().enabled ? "127.0.0.1" : undefined;
const server = app.listen(env.port, host, () => {
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
