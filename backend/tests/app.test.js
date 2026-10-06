import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import app from "../src/app.js";

test("app can be imported and serves a non-production health response", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/health`);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
    assert.match(response.headers.get("x-request-id"), /^[0-9a-f-]{36}$/);
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("reserved API areas return structured not-implemented errors", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    for (const path of [
      "/api/auth",
      "/api/jira",
      "/api/confluence",
      "/api/connections",
      "/api/operations",
    ]) {
      const response = await fetch(`http://127.0.0.1:${address.port}${path}`);
      const body = await response.json();

      assert.equal(response.status, 501);
      assert.equal(body.error.code, "not_implemented");
      assert.equal(body.error.requestId, response.headers.get("x-request-id"));
      assert.doesNotMatch(JSON.stringify(body), /stack|secret|token/i);
    }
  } finally {
    server.close();
    await once(server, "close");
  }
});

test("malformed JSON is rejected with a stable field-level error", async () => {
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    const response = await fetch(
      `http://127.0.0.1:${address.port}/api/jira/issues`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: '{"summary":',
      },
    );
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "invalid_json");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
    assert.deepEqual(body.error.details, [
      {
        field: "body",
        code: "invalid_json",
        message: "Check the request body syntax and send valid JSON.",
      },
    ]);
  } finally {
    server.close();
    await once(server, "close");
  }
});
