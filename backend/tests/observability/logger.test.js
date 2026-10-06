import test from "node:test";
import assert from "node:assert/strict";
import { logger } from "../../src/observability/logger.js";

test("logger emits structured events with request and operation context", () => {
  const capturedLogs = [];
  const originalConsoleInfo = console.info;
  console.info = (line) => capturedLogs.push(String(line));

  try {
    logger.info("operation_accepted", {
      requestId: "request-123",
      operationId: "operation-456",
      state: "pending",
    });

    assert.equal(capturedLogs.length, 1);
    const { timestamp, ...event } = JSON.parse(capturedLogs[0]);
    assert.match(timestamp, /^\d{4}-\d{2}-\d{2}T.*Z$/);
    assert.deepEqual(event, {
      requestId: "request-123",
      operationId: "operation-456",
      state: "pending",
      level: "info",
      event: "operation_accepted",
    });
  } finally {
    console.info = originalConsoleInfo;
  }
});

test("logger redacts credentials and provider content recursively", () => {
  const capturedLogs = [];
  const originalConsoleError = console.error;
  console.error = (line) => capturedLogs.push(String(line));

  try {
    logger.error("provider_request_failed", {
      requestId: "request-789",
      operationId: "operation-456",
      accessToken: "access-token-sentinel",
      refresh_token: "refresh-token-sentinel",
      client_secret: "client-secret-sentinel",
      authorization: "Bearer authorization-sentinel",
      providerError: {
        code: "ATLASSIAN_DENIED",
        nested: {
          refresh_token: "nested-token-sentinel",
          message: "provider-content-sentinel",
          errors: ["provider-error-list-sentinel"],
        },
        response: {
          status: 403,
          data: {
            access_token: "response-token-sentinel",
          },
        },
      },
    });

    assert.equal(capturedLogs.length, 1);
    const logLine = capturedLogs[0];
    const event = JSON.parse(logLine);
    assert.equal(event.requestId, "request-789");
    assert.equal(event.operationId, "operation-456");
    assert.equal(event.providerError.code, "ATLASSIAN_DENIED");
    assert.equal(event.providerError.nested.refresh_token, "[REDACTED]");
    assert.equal(event.providerError.nested.message, "[OMITTED]");
    assert.equal(event.providerError.nested.errors, "[OMITTED]");
    assert.equal(event.providerError.response, "[OMITTED]");
    assert.doesNotMatch(
      logLine,
      /access-token-sentinel|refresh-token-sentinel|client-secret-sentinel|authorization-sentinel|nested-token-sentinel|response-token-sentinel|provider-content-sentinel|provider-error-list-sentinel/,
    );
  } finally {
    console.error = originalConsoleError;
  }
});
