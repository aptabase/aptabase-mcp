import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { AptabaseClient } from "./client.js";

describe("AptabaseClient errors", () => {
  const realFetch = globalThis.fetch;
  let requested: URL[];

  beforeEach(() => {
    requested = [];
    globalThis.fetch = (async (url: URL | string) => {
      requested.push(new URL(url));
      return new Response("{}");
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  const client = () =>
    new AptabaseClient({ baseUrl: "https://eu.aptabase.com", authSession: "x" });

  it("getErrors maps filters and paging to query params", async () => {
    await client().getErrors({
      appId: "app1",
      startDate: "2026-01-01T00:00:00Z",
      endDate: "2026-01-02T00:00:00Z",
      osName: "Android",
      errorType: "WebException",
      severity: "fatal",
      offset: 40,
      limit: 20,
    });
    const url = requested[0];
    assert.equal(url.pathname, "/api/v0/apps/app1/errors");
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      buildMode: "release",
      startDate: "2026-01-01T00:00:00Z",
      endDate: "2026-01-02T00:00:00Z",
      osName: "Android",
      errorType: "WebException",
      severity: "fatal",
      offset: "40",
      limit: "20",
    });
  });

  it("getErrors defaults to the first page and omits unset filters", async () => {
    await client().getErrors({ appId: "app1", buildMode: "debug" });
    const params = Object.fromEntries(requested[0].searchParams);
    assert.deepEqual(params, {
      buildMode: "debug",
      offset: "0",
      limit: "20",
    });
  });

  it("getErrors resolves period presets to a date range", async () => {
    await client().getErrors({ appId: "app1", period: "7d" });
    assert.ok(requested[0].searchParams.get("startDate"));
    assert.ok(requested[0].searchParams.get("endDate"));
  });

  it("getErrorTypes hits the types endpoint", async () => {
    await client().getErrorTypes({ appId: "app1", period: "24h" });
    assert.equal(requested[0].pathname, "/api/v0/apps/app1/errors/types");
  });

  it("getErrorDetails encodes the error id", async () => {
    await client().getErrorDetails({ appId: "app1", errorId: "a/b" });
    assert.equal(requested[0].pathname, "/api/v0/apps/app1/errors/a%2Fb");
    assert.equal(requested[0].searchParams.get("buildMode"), "release");
  });
});
