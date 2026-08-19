import test from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";

const { errorHandler } = await import("../middleware/error.middleware.js");

const createResponse = () => ({
  headersSent: false,
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("errorHandler preserves known application status codes", () => {
  const response = createResponse();
  const error = Object.assign(new Error("Invalid request"), { statusCode: 400 });

  errorHandler(error, {}, response, () => {});

  assert.equal(response.statusCode, 400);
  assert.deepEqual(response.body, {
    success: false,
    message: "Invalid request",
  });
});

test("errorHandler produces a consistent server-error response", () => {
  const response = createResponse();

  errorHandler(new Error("Unexpected failure"), {}, response, () => {});

  assert.equal(response.statusCode, 500);
  assert.equal(response.body.success, false);
  assert.equal(response.body.message, "Unexpected failure");
});
