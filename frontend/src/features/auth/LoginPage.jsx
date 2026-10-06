import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiRequest, ApiClientError } from "../../api/client.js";

function LoginPage() {
  const [config, setConfig] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let active = true;
    apiRequest("/api/auth/config")
      .then((value) => {
        if (typeof value?.mockEnabled !== "boolean") {
          throw new Error("Invalid authentication configuration.");
        }
        if (active) setConfig(value);
      })
      .catch((failure) => {
        if (active) setError(failure);
      });
    return () => { active = false; };
  }, []);

  async function signIn(event) {
    event.preventDefault();
    if (!acknowledged || busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await apiRequest("/api/auth/mock-login", {
        method: "POST",
        body: { acknowledged: true },
      });
      if (session?.authentication !== "mock" || !session?.user?.id) {
        throw new Error("Invalid sign-in response.");
      }
      const destination = location.state?.from;
      navigate(
        ["/connections", "/jira/issues", "/confluence/pages", "/operations"].includes(destination)
          ? destination
          : "/connections",
        { replace: true },
      );
    } catch (failure) {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="route-panel" aria-labelledby="login-title">
      <p className="eyebrow">Account</p>
      <h1 id="login-title">Sign in</h1>
      {config?.mockEnabled ? (
        <form className="mock-login-form" onSubmit={signIn}>
          <p className="route-description">
            Development demo only. Sign in as Local demo user. This does not
            authenticate with company SAML or authorize Jira and Confluence access.
          </p>
          <label className="mock-confirmation">
            <input type="checkbox" required checked={acknowledged}
              onChange={(event) => setAcknowledged(event.target.checked)} />
            I understand this is a local demo, not company SSO.
          </label>
          <button className="reload-button" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign in to local demo"}
          </button>
        </form>
      ) : (
        <p className="route-description" role="status">
          {config
            ? "Company single sign-on will be available when authentication is implemented."
            : "Checking sign-in availability..."}
        </p>
      )}
      {error ? (
        <div role="alert">
          <p className="route-description">
            {error instanceof ApiClientError ? error.message : "Sign-in could not be completed. Reload this page and try again."}
          </p>
          {error instanceof ApiClientError && error.requestId ? (
            <p className="request-id">Request ID: {error.requestId}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export default LoginPage;
