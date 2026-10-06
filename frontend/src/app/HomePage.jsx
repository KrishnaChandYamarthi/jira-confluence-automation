function HomePage() {
  return (
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
  );
}

export default HomePage;
