import app from "./app.js";
import { getEnv } from "./config/env.js";

const env = getEnv();
const server = app.listen(env.port, () => {
  console.info(`Backend listening on port ${env.port} (${env.nodeEnv}).`);
});

function stop(signal) {
  server.close((error) => {
    if (error) {
      console.error(`Failed to stop backend cleanly after ${signal}.`);
      process.exitCode = 1;
      return;
    }

    process.exit(0);
  });
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));
