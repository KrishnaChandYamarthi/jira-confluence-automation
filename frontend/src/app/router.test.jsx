import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "../App.jsx";

const routes = [
  {
    path: "/login",
    heading: "Sign in",
    title: "Sign in | Workspace Automation",
  },
  {
    path: "/connections",
    heading: "Atlassian connections",
    title: "Connections | Workspace Automation",
  },
  {
    path: "/jira/issues",
    heading: "Jira issues",
    title: "Jira issues | Workspace Automation",
  },
  {
    path: "/confluence/pages",
    heading: "Confluence pages",
    title: "Confluence pages | Workspace Automation",
  },
  {
    path: "/operations",
    heading: "Operation history",
    title: "Operation history | Workspace Automation",
  },
];

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (name) =>
        name.toLowerCase() === "x-request-id" ? "server-request-1" : null,
    },
    json: async () => payload,
  };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      jsonResponse({ user: { id: "user-1", displayName: "Test User" } }),
    ),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
  document.title = "Workspace Automation";
});

describe("application routes", () => {
  it.each(routes)(
    "renders the $path route with its heading and browser title",
    async ({ path, heading, title }) => {
      window.history.replaceState({}, "", path);

      render(<App />);

      expect(
        await screen.findByRole("heading", { level: 1, name: heading }),
      ).toBeTruthy();
      expect(screen.getByRole("main")).toBeTruthy();
      await waitFor(() => expect(document.title).toBe(title));
    },
  );

  it("provides navigation between routes without a full page load", async () => {
    render(<App />);

    fireEvent.click(screen.getByRole("link", { name: "Jira issues" }));

    expect(window.location.pathname).toBe("/jira/issues");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Jira issues" }),
    ).toBeTruthy();
    await waitFor(() =>
      expect(document.title).toBe("Jira issues | Workspace Automation"),
    );
  });

  it("shows a not-found page with a way back home for unknown paths", async () => {
    window.history.replaceState({}, "", "/unknown");

    render(<App />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeTruthy();
    await waitFor(() =>
      expect(document.title).toBe("Page not found | Workspace Automation"),
    );

    fireEvent.click(screen.getByRole("link", { name: "Return to workspace home" }));

    expect(window.location.pathname).toBe("/");
    expect(
      screen.getByRole("heading", {
        name: "Make workspace updates with confidence.",
      }),
    ).toBeTruthy();
  });

  it("keeps protected content hidden while checking the session", async () => {
    window.history.replaceState({}, "", "/jira/issues");
    let resolveResponse;
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise((resolve) => {
            resolveResponse = resolve;
          }),
      ),
    );

    render(<App />);

    expect(screen.getByRole("status").textContent).toContain(
      "Checking your sign-in status",
    );
    expect(
      screen.queryByRole("heading", { name: "Jira issues" }),
    ).toBeNull();

    resolveResponse(
      jsonResponse({ user: { id: "user-1", displayName: "Test User" } }),
    );

    expect(
      await screen.findByRole("heading", { level: 1, name: "Jira issues" }),
    ).toBeTruthy();
  });

  it("redirects unauthenticated users to the public sign-in route", async () => {
    window.history.replaceState({}, "", "/jira/issues");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "unauthenticated",
              message: "Sign-in is required.",
              requestId: "request-unauthenticated",
            },
          },
          401,
        ),
      ),
    );

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
    expect(window.location.pathname).toBe("/login");
  });

  it("displays safe session errors and their request IDs", async () => {
    window.history.replaceState({}, "", "/connections");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            error: {
              code: "not_implemented",
              message: "This API route is reserved and is not implemented yet.",
              requestId: "request-session-unavailable",
            },
          },
          501,
        ),
      ),
    );

    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Sign-in unavailable" }),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "This API route is reserved and is not implemented yet.",
      ),
    ).toBeTruthy();
    expect(screen.getByText("Error code: not_implemented")).toBeTruthy();
    expect(screen.getByText("Request ID: request-session-unavailable")).toBeTruthy();
  });
});
