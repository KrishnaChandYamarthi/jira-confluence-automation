import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
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

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const capturedLogs = [];
  const originalConsoleError = console.error;
  console.error = (line) => capturedLogs.push(String(line));

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/failure`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error.code, "internal_error");
    assert.equal(body.error.message, "The request could not be completed.");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
    assert.doesNotMatch(JSON.stringify(body), /stack|credential sentinel/i);
    assert.equal(capturedLogs.length, 1);
    assert.equal(JSON.parse(capturedLogs[0]).requestId, body.error.requestId);
    assert.doesNotMatch(capturedLogs[0], /credential sentinel/i);
  } finally {
    console.error = originalConsoleError;
    server.close();
    await once(server, "close");
  }
});
