import { afterEach, describe, expect, it, vi } from "vitest";
import { apiBaseUrl } from "../config.js";
import { ApiClientError, apiRequest } from "./client.js";

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) =>
        name.toLowerCase() === "x-request-id" ? "response-request-id" : null,
    },
    json: async () => payload,
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("API client", () => {
  it("uses the configured API origin and includes the HttpOnly cookie transport", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ user: { id: "user-1" } }));
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest("/api/auth/session");

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiBaseUrl}/api/auth/session`,
      expect.objectContaining({
        credentials: "include",
        method: "GET",
      }),
    );
    const [, requestOptions] = fetchMock.mock.calls[0];
    expect(requestOptions.headers).toEqual({ Accept: "application/json" });
    expect(requestOptions.headers.Cookie).toBeUndefined();
  });

  it("preserves safe API error details and the request ID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "forbidden",
              message: "This operation is not permitted.",
              requestId: "request-error-123",
            },
          },
          403,
        ),
      ),
    );

    await expect(apiRequest("/api/operations")).rejects.toMatchObject({
      name: "ApiClientError",
      code: "forbidden",
      message: "This operation is not permitted.",
      requestId: "request-error-123",
      status: 403,
    });
  });

  it("uses the response request-ID header when an error body has no ID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "service_unavailable",
              message: "The service is temporarily unavailable.",
            },
          },
          503,
        ),
      ),
    );

    await expect(apiRequest("/api/operations")).rejects.toBeInstanceOf(
      ApiClientError,
    );
    await expect(apiRequest("/api/operations")).rejects.toMatchObject({
      requestId: "response-request-id",
    });
  });
});
