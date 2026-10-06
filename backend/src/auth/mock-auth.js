import { createHash, randomBytes } from "node:crypto";
import express from "express";
import { ApiError } from "../errors/api-error.js";
import { getMockAuthConfig } from "../config/env.js";
import { logger } from "../observability/logger.js";

const COOKIE_NAME = "workspace_mock_session";
const SESSION_TTL = 60 * 60 * 1000;
const user = Object.freeze({
  id: "local-demo-user",
  displayName: "Local demo user",
});
const cookieOptions = { httpOnly: true, sameSite: "strict", path: "/api/auth" };

function sessionKey(token) {
  return createHash("sha256").update(token).digest("hex");
}

function readToken(request) {
  const entry = (request.headers.cookie ?? "")
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(`${COOKIE_NAME}=`));
  const token = entry?.slice(COOKIE_NAME.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}

export function createMockAuthRouter({
  source = process.env,
  now = Date.now,
} = {}) {
  const config = getMockAuthConfig(source);
  const router = express.Router();
  const sessions = new Map();

  router.get("/config", (_request, response) => {
    response.set("Cache-Control", "no-store").json({ mockEnabled: config.enabled });
  });

  if (!config.enabled) return router;

  logger.warn("development_mock_auth_enabled");
  router.use((request, response, next) => {
    response.set("Cache-Control", "no-store");
    if (!["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress)) {
      return next(new ApiError(403, "mock_local_only", "Mock sign-in is available only on this machine."));
    }
    for (const [key, session] of sessions) {
      if (session.expiresAt <= now()) sessions.delete(key);
    }
    next();
  });

  router.get("/session", (request, response, next) => {
    const token = readToken(request);
    const session = token ? sessions.get(sessionKey(token)) : undefined;
    if (!session) {
      return next(new ApiError(401, "unauthenticated", "Sign-in is required."));
    }
    response.json({ user, authentication: "mock" });
  });

  function requireOrigin(request, _response, next) {
    if (request.headers.origin !== config.origin) {
      return next(new ApiError(403, "invalid_origin", "The sign-in request origin is not allowed."));
    }
    next();
  }

  router.post("/mock-login", requireOrigin, (request, response, next) => {
    if (request.body?.acknowledged !== true || Object.keys(request.body).length !== 1) {
      return next(new ApiError(400, "validation_failed", "Confirm that you understand this is a local demo, not company SSO."));
    }
    const previousToken = readToken(request);
    if (previousToken) sessions.delete(sessionKey(previousToken));
    if (sessions.size >= 256) {
      return next(new ApiError(503, "mock_session_limit", "The local demo session limit has been reached."));
    }
    const token = randomBytes(32).toString("hex");
    sessions.set(sessionKey(token), { expiresAt: now() + SESSION_TTL });
    response.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: SESSION_TTL });
    logger.info("mock_sign_in", { requestId: request.requestId });
    response.json({ user, authentication: "mock" });
  });

  router.post("/logout", requireOrigin, (request, response) => {
    const token = readToken(request);
    if (token) sessions.delete(sessionKey(token));
    response.clearCookie(COOKIE_NAME, cookieOptions);
    response.json({ signedOut: true });
  });

  return router;
}
