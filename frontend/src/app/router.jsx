import { useEffect } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import RequireSession from "../auth/RequireSession.jsx";
import ConnectionsPage from "../features/connections/ConnectionsPage.jsx";
import ConfluencePagesPage from "../features/confluence/ConfluencePagesPage.jsx";
import LoginPage from "../features/auth/LoginPage.jsx";
import JiraIssuesPage from "../features/jira/JiraIssuesPage.jsx";
import OperationsPage from "../features/operations/OperationsPage.jsx";
import HomePage from "./HomePage.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

const pageTitles = {
  "/": "Workspace Automation",
  "/login": "Sign in | Workspace Automation",
  "/connections": "Connections | Workspace Automation",
  "/jira/issues": "Jira issues | Workspace Automation",
  "/confluence/pages": "Confluence pages | Workspace Automation",
  "/operations": "Operation history | Workspace Automation",
};

const navigation = [
  { to: "/login", label: "Sign in" },
  { to: "/connections", label: "Connections" },
  { to: "/jira/issues", label: "Jira issues" },
  { to: "/confluence/pages", label: "Confluence pages" },
  { to: "/operations", label: "Operation history" },
];

function ApplicationLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title =
      pageTitles[pathname] ?? "Page not found | Workspace Automation";
  }, [pathname]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="app-header">
        <Link
          className="brand"
          to="/"
          aria-label="Workspace Automation home"
        >
          <span className="brand-mark" aria-hidden="true">
            W
          </span>
          <span>Workspace Automation</span>
        </Link>
        <nav className="primary-nav" aria-label="Primary">
          {navigation.map(({ to, label }) => (
            <NavLink
              key={to}
              className={({ isActive }) =>
                isActive ? "nav-link is-active" : "nav-link"
              }
              to={to}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main id="main-content" className="main-content">
        <Outlet />
      </main>

      <footer className="app-footer">
        <p>Changes are made only after you review and confirm them.</p>
      </footer>
    </div>
  );
}

function ApplicationRoutes() {
  return (
    <Routes>
      <Route element={<ApplicationLayout />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route element={<RequireSession />}>
          <Route path="connections" element={<ConnectionsPage />} />
          <Route path="jira/issues" element={<JiraIssuesPage />} />
          <Route path="confluence/pages" element={<ConfluencePagesPage />} />
          <Route path="operations" element={<OperationsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export function ApplicationRouter() {
  return (
    <BrowserRouter>
      <ApplicationRoutes />
    </BrowserRouter>
  );
}
