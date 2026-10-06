import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <a className="brand" href="/" aria-label="Workspace Automation home">
          <span className="brand-mark" aria-hidden="true">
            W
          </span>
          <span>Workspace Automation</span>
        </a>
        <span className="environment-label">Internal workspace</span>
      </header>

      <main id="main-content" className="main-content">
        <section className="welcome-panel" aria-labelledby="welcome-title">
          <p className="eyebrow">Jira + Confluence</p>
          <h1 id="welcome-title">Make workspace updates with confidence.</h1>
          <p className="welcome-copy">
            Find the work you need, review every proposed change, and confirm it
            before it reaches your team.
          </p>
          <div className="status-card" role="status">
            <span className="status-indicator" aria-hidden="true" />
            <span>Your automation workspace is ready to get started.</span>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <p>Changes are made only after you review and confirm them.</p>
      </footer>
    </div>
  );
}

export default App;
