import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import App from "../../App.jsx";

function response(body, status = 200) {
  return { ok: status < 400, status, headers: { get: () => null }, json: async () => body };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

it("signs in with explicit acknowledgement, accesses the destination, and signs out", async () => {
  window.history.replaceState({}, "", "/jira/issues");
  let signedIn = false;
  const fetch = vi.fn(async (path, options) => {
    if (path === "/api/auth/config") return response({ mockEnabled: true });
    if (path === "/api/auth/mock-login") {
      expect(JSON.parse(options.body)).toEqual({ acknowledged: true });
      expect(options.credentials).toBe("include");
      signedIn = true;
    }
    if (path === "/api/auth/logout") {
      signedIn = false;
      return response({ signedOut: true });
    }
    return signedIn
      ? response({ user: { id: "local-demo-user" }, authentication: "mock" })
      : response({ error: { code: "unauthenticated", message: "Sign-in is required." } }, 401);
  });
  vi.stubGlobal("fetch", fetch);
  render(<App />);
  const button = await screen.findByRole("button", { name: "Sign in to local demo" });
  expect(screen.getByRole("checkbox").required).toBe(true);
  fireEvent.click(button);
  expect(fetch.mock.calls.some(([path]) => path === "/api/auth/mock-login")).toBe(false);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(button);
  expect(await screen.findByRole("heading", { name: "Jira issues" })).toBeTruthy();
  expect(window.location.pathname).toBe("/jira/issues");
  expect(screen.getByLabelText("Development demo session").textContent).toContain("mock session only");
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
  expect(signedIn).toBe(false);
});

it("does not expose mock sign-in when disabled", async () => {
  window.history.replaceState({}, "", "/login");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response({ mockEnabled: false })));
  render(<App />);
  expect(await screen.findByText("Company single sign-on will be available when authentication is implemented.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Sign in to local demo" })).toBeNull();
});

it("displays sign-in failures without navigating or exposing protected content", async () => {
  window.history.replaceState({}, "", "/login");
  vi.stubGlobal("fetch", vi.fn(async (path) => path === "/api/auth/config"
    ? response({ mockEnabled: true })
    : response({ error: { message: "The sign-in request origin is not allowed.", requestId: "request-1" } }, 403)));
  render(<App />);
  await screen.findByRole("button", { name: "Sign in to local demo" });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Sign in to local demo" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("origin is not allowed"));
  expect(screen.getByText("Request ID: request-1")).toBeTruthy();
  expect(window.location.pathname).toBe("/login");
});
