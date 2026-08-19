import test from "node:test";
import assert from "node:assert/strict";

import { validateEnvironment } from "../config/env.js";

test("validateEnvironment accepts a complete configuration", () => {
  const config = {
    mongoUri: "mongodb://localhost:27017/zenvio_test",
    jwtSecret: "test-secret",
    streamApiKey: "test-key",
    streamApiSecret: "test-stream-secret",
    cloudinaryCloudName: "test-cloud",
    cloudinaryApiKey: "test-api-key",
    cloudinaryApiSecret: "test-api-secret",
  };

  assert.equal(validateEnvironment(config), config);
});

test("validateEnvironment reports missing required configuration", () => {
  assert.throws(
    () =>
      validateEnvironment({
        mongoUri: "",
        jwtSecret: "test-secret",
        streamApiKey: undefined,
        streamApiSecret: "test-stream-secret",
        cloudinaryCloudName: "test-cloud",
        cloudinaryApiKey: "test-api-key",
        cloudinaryApiSecret: "test-api-secret",
      }),
    /mongoUri, streamApiKey/
  );
});