import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { once } from "node:events";
import { errorHandler, notFoundHandler } from "../../src/middleware/error-handler.js";
import { requestIdMiddleware } from "../../src/middleware/request-id.js";
import { validateBody } from "../../src/middleware/validate-body.js";

test("invalid fields fail server-side before a route handler is invoked", async () => {
  let handlerCalls = 0;
  const app = express();
  app.use(requestIdMiddleware);
  app.use(express.json());
  app.post(
    "/test",
    validateBody({ summary: { required: true, type: "string" } }),
    (_request, response) => {
      handlerCalls += 1;
      response.status(201).json({ status: "created" });
    },
  );
  app.use(notFoundHandler);
  app.use(errorHandler);

  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");

  try {
    const address = server.address();
    const response = await fetch(`http://127.0.0.1:${address.port}/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error.code, "validation_failed");
    assert.equal(body.error.requestId, response.headers.get("x-request-id"));
    assert.deepEqual(body.error.details, [
      {
        field: "summary",
        code: "required",
        message: "summary is required.",
      },
    ]);
    assert.equal(handlerCalls, 0);
  } finally {
    server.close();
    await once(server, "close");
  }
});
