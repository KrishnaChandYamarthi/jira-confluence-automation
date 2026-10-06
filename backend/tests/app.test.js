import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import app from "../src/app.js";

test("app can be imported and serves a non-production health response", async () => {
  const response = await request(app).get("/health");

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { status: "ok" });
  assert.match(response.headers["x-request-id"], /^[0-9a-f-]{36}$/);
});

test("reserved API areas return structured not-implemented errors", async () => {
  for (const path of [
    "/api/auth",
    "/api/jira",
    "/api/confluence",
    "/api/connections",
    "/api/operations",
  ]) {
    const response = await request(app).get(path);

    assert.equal(response.status, 501);
    assert.equal(response.body.error.code, "not_implemented");
    assert.equal(
      response.body.error.requestId,
      response.headers["x-request-id"],
    );
    assert.doesNotMatch(JSON.stringify(response.body), /stack|secret|token/i);
  }
});

test("malformed JSON is rejected with a stable field-level error", async () => {
  const response = await request(app)
    .post("/api/jira/issues")
    .set("Content-Type", "application/json")
    .send('{"summary":');

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "invalid_json");
  assert.equal(
    response.body.error.requestId,
    response.headers["x-request-id"],
  );
  assert.deepEqual(response.body.error.details, [
    {
      field: "body",
      code: "invalid_json",
      message: "Check the request body syntax and send valid JSON.",
    },
  ]);
});
