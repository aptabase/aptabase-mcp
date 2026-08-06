import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { granularityFromRange, resolvePeriod } from "./period.js";

describe("resolvePeriod", () => {
  const fixed = new Date("2026-08-05T18:30:00.000Z");

  it("maps 7d to day granularity with ~7 days span", () => {
    const resolved = resolvePeriod("7d", fixed);
    assert.equal(resolved.granularity, "day");
    const hours =
      (new Date(resolved.endDate).getTime() -
        new Date(resolved.startDate).getTime()) /
      3600_000;
    assert.ok(hours >= 7 * 24 - 1);
    assert.ok(hours <= 7 * 24 + 1);
  });

  it("maps 24h to hour granularity", () => {
    const resolved = resolvePeriod("24h", fixed);
    assert.equal(resolved.granularity, "hour");
  });

  it("maps 365d to month granularity", () => {
    const resolved = resolvePeriod("365d", fixed);
    assert.equal(resolved.granularity, "month");
  });
});

describe("granularityFromRange", () => {
  it("uses hour under 72h", () => {
    assert.equal(
      granularityFromRange("2026-08-05T00:00:00.000Z", "2026-08-06T00:00:00.000Z"),
      "hour",
    );
  });

  it("uses day between 72h and 90d", () => {
    assert.equal(
      granularityFromRange("2026-07-01T00:00:00.000Z", "2026-07-15T00:00:00.000Z"),
      "day",
    );
  });

  it("uses month over 90d", () => {
    assert.equal(
      granularityFromRange("2026-01-01T00:00:00.000Z", "2026-08-01T00:00:00.000Z"),
      "month",
    );
  });
});
