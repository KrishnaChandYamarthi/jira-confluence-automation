import { apiBaseUrl } from "../config.js";

export class ApiClientError extends Error {
  constructor(status, code, message, requestId) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

export async function apiRequest(path, { method = "GET", body, signal } = {}) {
  if (!path.startsWith("/") || path.startsWith("//")) {
    throw new TypeError("API paths must be root-relative.");
  }

  const headers = { Accept: "application/json" };
  const requestOptions = {
    method,
    headers,
    credentials: "include",
    signal,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, requestOptions);
  let payload;

  try {
    payload = await response.json();
  } catch {
    throw new ApiClientError(
      response.status,
      "invalid_response",
      "The server returned an invalid response.",
      response.headers.get("X-Request-Id"),
    );
  }

  if (!response.ok) {
    const error = payload?.error;
    throw new ApiClientError(
      response.status,
      typeof error?.code === "string" ? error.code : "request_failed",
      typeof error?.message === "string"
        ? error.message
        : "The API request could not be completed.",
      typeof error?.requestId === "string"
        ? error.requestId
        : response.headers.get("X-Request-Id"),
    );
  }

  return payload;
}

export function getSession() {
  return apiRequest("/api/auth/session");
}
