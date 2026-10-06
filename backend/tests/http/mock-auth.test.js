import test from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { getMockAuthConfig } from "../../src/config/env.js";

const origin = "http://127.0.0.1:5173";
function mockApp(options = {}) {
  return createApp({
    source: { NODE_ENV: "development", MOCK_AUTH_ENABLED: "true" },
    ...options,
  });
}

test("mock auth is disabled by default and forbidden outside development", async () => {
  const app = createApp({ source: {} });
  assert.deepEqual((await request(app).get("/api/auth/config")).body, { mockEnabled: false });
  assert.equal((await request(app).post("/api/auth/mock-login").send({ acknowledged: true })).status, 501);
  assert.equal((await request(app).get("/api/auth/session")).status, 501);
  for (const NODE_ENV of ["production", "test"]) {
    assert.throws(() => getMockAuthConfig({ NODE_ENV, MOCK_AUTH_ENABLED: "true" }), /only in development/);
  }
  assert.throws(() => getMockAuthConfig({ MOCK_AUTH_ENABLED: "yes" }), /true or false/);
  for (const value of ["https://example.com", "http://127.0.0.1:5173/path", "http://user@localhost:5173", "invalid"]) {
    assert.throws(() => getMockAuthConfig({ MOCK_AUTH_ENABLED: "true", MOCK_AUTH_ORIGIN: value }), /loopback HTTP origin/);
  }
});

test("sign-in creates an opaque session, survives read-back, and logout revokes it", async () => {
  const app = mockApp();
  const agent = request.agent(app);
  assert.equal((await agent.get("/api/auth/session")).status, 401);
  const login = await agent.post("/api/auth/mock-login").set("Origin", origin).send({ acknowledged: true });
  assert.equal(login.status, 200);
  assert.deepEqual(login.body, { user: { id: "local-demo-user", displayName: "Local demo user" }, authentication: "mock" });
  const cookie = login.headers["set-cookie"][0];
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
  assert.match(cookie, /Path=\/api\/auth/);
  assert.equal(login.headers["cache-control"], "no-store");
  assert.deepEqual((await agent.get("/api/auth/session")).body, login.body);
  assert.equal((await request(app).get("/api/auth/session")).status, 401);
  assert.equal((await request(app).get("/api/auth/session").set("Cookie", "workspace_mock_session=forged")).status, 401);
  assert.equal((await agent.post("/api/auth/logout").set("Origin", origin).send({})).status, 200);
  assert.equal((await request(app).get("/api/auth/session").set("Cookie", cookie.split(";")[0])).status, 401);
  assert.equal((await agent.get("/api/auth/session")).status, 401);
  assert.equal((await agent.get("/api/connections")).status, 501);
});

test("sign-in and sign-out reject foreign or absent origins and missing acknowledgement", async () => {
  const app = mockApp();
  for (const path of ["/api/auth/mock-login", "/api/auth/logout"]) {
    assert.equal((await request(app).post(path).send({ acknowledged: true })).status, 403);
    assert.equal((await request(app).post(path).set("Origin", "http://evil.test").send({ acknowledged: true })).status, 403);
  }
  for (const body of [{}, { acknowledged: false }, { acknowledged: true, user: "admin" }]) {
    assert.equal((await request(app).post("/api/auth/mock-login").set("Origin", origin).send(body)).status, 400);
  }
});

test("mock sessions expire and a second sign-in rotates the session", async () => {
  let time = 0;
  const app = mockApp({ now: () => time });
  const agent = request.agent(app);
  const first = await agent.post("/api/auth/mock-login").set("Origin", origin).send({ acknowledged: true });
  const firstCookie = first.headers["set-cookie"][0].split(";")[0];
  await agent.post("/api/auth/mock-login").set("Origin", origin).send({ acknowledged: true });
  assert.equal((await request(app).get("/api/auth/session").set("Cookie", firstCookie)).status, 401);
  assert.equal((await agent.get("/api/auth/session")).status, 200);
  time = 60 * 60 * 1000;
  assert.equal((await agent.get("/api/auth/session")).status, 401);
});
