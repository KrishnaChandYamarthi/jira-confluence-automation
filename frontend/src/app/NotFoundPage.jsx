import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <section className="route-panel" aria-labelledby="page-title">
      <p className="eyebrow">Workspace</p>
      <h1 id="page-title">Page not found</h1>
      <p className="route-description">
        This address does not match a page in the workspace.
      </p>
      <Link className="home-link" to="/">
        Return to workspace home
      </Link>
    </section>
  );
}

export default NotFoundPage;
