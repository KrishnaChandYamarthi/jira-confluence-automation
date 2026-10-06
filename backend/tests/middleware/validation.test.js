import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import request from "supertest";
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

  const response = await request(app).post("/test").send({});

  assert.equal(response.status, 400);
  assert.equal(response.body.error.code, "validation_failed");
  assert.equal(
    response.body.error.requestId,
    response.headers["x-request-id"],
  );
  assert.deepEqual(response.body.error.details, [
    {
      field: "summary",
      code: "required",
      message: "summary is required.",
    },
  ]);
  assert.equal(handlerCalls, 0);
});
