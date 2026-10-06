import { Component } from "react";

class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    console.error("Application rendering failed.");
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="error-panel" role="alert">
          <p className="eyebrow">Something went wrong</p>
          <h1>This page could not be displayed.</h1>
          <p>Reload the page to try again. If the problem continues, contact support.</p>
          <button
            className="reload-button"
            onClick={() => window.location.reload()}
            type="button"
          >
            Reload page
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
