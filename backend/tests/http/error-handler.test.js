import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
import { errorHandler, notFoundHandler } from "../../src/middleware/error-handler.js";
import { requestIdMiddleware } from "../../src/middleware/request-id.js";

test("unexpected errors return safe JSON and log only correlation context", async () => {
  const app = express();
  app.use(requestIdMiddleware);
  app.get("/failure", (_request, _response, next) => {
    next(new Error("private provider credential sentinel"));
  });
  app.use(notFoundHandler);
  app.use(errorHandler);

  const capturedLogs = [];
  const originalConsoleError = console.error;
  console.error = (line) => capturedLogs.push(String(line));

  try {
    const response = await request(app).get("/failure");

    assert.equal(response.status, 500);
    assert.equal(response.body.error.code, "internal_error");
    assert.equal(response.body.error.message, "The request could not be completed.");
    assert.equal(
      response.body.error.requestId,
      response.headers["x-request-id"],
    );
    assert.doesNotMatch(JSON.stringify(response.body), /stack|credential sentinel/i);
    assert.equal(capturedLogs.length, 1);
    assert.equal(
      JSON.parse(capturedLogs[0]).requestId,
      response.body.error.requestId,
    );
    assert.doesNotMatch(capturedLogs[0], /credential sentinel/i);
  } finally {
    console.error = originalConsoleError;
  }
});
