import test from "node:test";
import assert from "node:assert/strict";
import { parseEnv } from "../../src/config/env.js";

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
