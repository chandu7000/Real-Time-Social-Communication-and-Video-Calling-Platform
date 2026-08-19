import test, { after, before } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { default: app } = await import("../app.js");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test("health endpoint returns a successful response", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body, { success: true, status: "ok" });
});

test("unknown API endpoint returns the standardized 404 response", async () => {
  const response = await fetch(`${baseUrl}/api/does-not-exist`);
  const body = await response.json();

  assert.equal(response.status, 404);
  assert.equal(body.success, false);
  assert.match(body.message, /Route not found/);
});
