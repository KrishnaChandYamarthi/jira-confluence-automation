import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { ApiClientError, getSession } from "../api/client.js";

function hasAuthenticatedUser(session) {
  return (
    session?.user &&
    typeof session.user === "object" &&
    typeof session.user.id === "string" &&
    session.user.id.length > 0
  );
}

function RequireSession() {
  const location = useLocation();
  const [attempt, setAttempt] = useState(0);
  const [sessionState, setSessionState] = useState({ status: "loading" });

  useEffect(() => {
    let active = true;
    setSessionState({ status: "loading" });

    getSession()
      .then((session) => {
        if (!active) {
          return;
        }

        if (hasAuthenticatedUser(session)) {
          setSessionState({ status: "authenticated" });
          return;
        }

        setSessionState({
          status: "error",
          message: "The server returned an invalid session response.",
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof ApiClientError && error.status === 401) {
          setSessionState({ status: "unauthenticated" });
          return;
        }

        setSessionState({
          status: "error",
          message:
            error instanceof ApiClientError
              ? error.message
              : "Sign-in status could not be checked. Check your connection and try again.",
          errorCode:
            error instanceof ApiClientError ? error.code : undefined,
          requestId:
            error instanceof ApiClientError ? error.requestId : undefined,
        });
      });

    return () => {
      active = false;
    };
  }, [attempt]);

  if (sessionState.status === "loading") {
    return (
      <section className="route-panel" role="status" aria-live="polite">
        <p className="eyebrow">Account</p>
        <h1>Checking your sign-in status</h1>
        <p className="route-description">Please wait while we verify your session.</p>
      </section>
    );
  }

  if (sessionState.status === "unauthenticated") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (sessionState.status === "error") {
    return (
      <section
        className="route-panel"
        role="alert"
        aria-labelledby="session-error-title"
      >
        <p className="eyebrow">Account</p>
        <h1 id="session-error-title">Sign-in unavailable</h1>
        <p className="route-description">{sessionState.message}</p>
        {sessionState.errorCode ? (
          <p className="request-id">Error code: {sessionState.errorCode}</p>
        ) : null}
        {sessionState.requestId ? (
          <p className="request-id">Request ID: {sessionState.requestId}</p>
        ) : null}
        <button
          className="reload-button"
          type="button"
          onClick={() => {
            setSessionState({ status: "loading" });
            setAttempt((currentAttempt) => currentAttempt + 1);
          }}
        >
          Try again
        </button>
      </section>
    );
  }

  return <Outlet />;
}

export default RequireSession;
