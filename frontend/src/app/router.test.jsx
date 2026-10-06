import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
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

afterEach(() => {
  cleanup();
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
        screen.getByRole("heading", { level: 1, name: heading }),
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
      screen.getByRole("heading", { level: 1, name: "Jira issues" }),
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
});
