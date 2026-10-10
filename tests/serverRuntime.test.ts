import assert from "node:assert/strict";
import { test } from "node:test";
import type { ServerResponse } from "node:http";
import { getAllowedOrigins, getServerPort } from "../server/src/runtimeConfig.js";
import { createHealthHandler } from "../server/src/health.js";

test("runtime accepts Render port and requires explicit HTTPS origins in production", () => {
  assert.equal(getServerPort(undefined), 3001);
  assert.equal(getServerPort("10000"), 10000);
  for (const value of ["0", "65536", "1.5", "10000junk", ""]) assert.throws(() => getServerPort(value));
  assert.throws(() => getAllowedOrigins({ NODE_ENV: "production" }));
  for (const origin of ["*", "http://example.com", "https://example.com/path"]) {
    assert.throws(() => getAllowedOrigins({ NODE_ENV: "production", ALLOWED_ORIGINS: origin }));
  }
  assert.deepEqual(getAllowedOrigins({ NODE_ENV: "production", ALLOWED_ORIGINS: "https://example.com, https://game.test" }), ["https://example.com", "https://game.test"]);
});

test("health reports database failure without leaking credentials or driver errors", async () => {
  let status = 0;
  let body = "";
  const response = {
    writeHead(code: number) { status = code; return response; },
    end(value?: string) { body = value ?? ""; return response; },
  } as unknown as Pick<ServerResponse, "writeHead" | "end">;
  await createHealthHandler(async () => {} )({ method: "GET", url: "/healthz" }, response);
  assert.equal(status, 200);
  assert.deepEqual(JSON.parse(body), { status: "ok" });
  await createHealthHandler(async () => { throw new Error("secret database URL"); })({ method: "GET", url: "/healthz" }, response);
  assert.equal(status, 503);
  assert.equal(body.includes("secret"), false);
  await createHealthHandler(async () => { throw new Error("must not query"); })({ method: "GET", url: "/" }, response);
  assert.equal(status, 404);
});
