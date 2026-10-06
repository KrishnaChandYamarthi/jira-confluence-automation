import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

describe("application shell", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the visible, keyboard-skippable workspace shell", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", {
        name: "Make workspace updates with confidence.",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Skip to main content" }).getAttribute("href"),
    ).toBe("#main-content");
    expect(screen.getByRole("status").textContent).toContain(
      "Your automation workspace is ready to get started.",
    );
  });

  it("reports render failures without displaying diagnostic details", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const suppressReactError = (event) => event.preventDefault();
    window.addEventListener("error", suppressReactError);

    function BrokenContent() {
      throw new Error("private render diagnostic");
    }

    try {
      render(
        <ErrorBoundary>
          <BrokenContent />
        </ErrorBoundary>,
      );

      expect(
        screen.getByRole("heading", {
          name: "This page could not be displayed.",
        }),
      ).toBeTruthy();
      expect(screen.queryByText("private render diagnostic")).toBeNull();
      expect(console.error).toHaveBeenCalledWith("Application rendering failed.");
    } finally {
      window.removeEventListener("error", suppressReactError);
    }
  });
});
