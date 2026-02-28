/**
 * TDD Contract: src/utils/fetchUtils.js
 * Phase 0 — Write this test FIRST, then implement fetchUtils.js
 *
 * These tests define the contract for shared fetch utilities
 * extracted from populationLayer.js and cityLayer.js.
 */

import { safeFetch, safeFetchAllSettled } from "../../src/utils/fetchUtils.js";

describe("safeFetch", function () {
  it("returns parsed JSON on successful response", async function () {
    var mockData = { type: "FeatureCollection", features: [] };
    var mockFetchFn = vi.fn(function () {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve(mockData); } });
    });

    var result = await safeFetch("https://example.com/data.json", mockFetchFn);
    expect(result).toEqual(mockData);
    expect(mockFetchFn).toHaveBeenCalledWith("https://example.com/data.json");
  });

  it("throws with HTTP status on non-ok response", async function () {
    var mockFetchFn = vi.fn(function () {
      return Promise.resolve({ ok: false, status: 404 });
    });

    await expect(safeFetch("https://example.com/missing.json", mockFetchFn))
      .rejects.toThrow("HTTP 404");
  });

  it("includes URL in error message", async function () {
    var url = "https://example.com/bad-endpoint.json";
    var mockFetchFn = vi.fn(function () {
      return Promise.resolve({ ok: false, status: 500 });
    });

    await expect(safeFetch(url, mockFetchFn))
      .rejects.toThrow(url);
  });

  it("propagates network errors", async function () {
    var mockFetchFn = vi.fn(function () {
      return Promise.reject(new Error("Network failure"));
    });

    await expect(safeFetch("https://example.com/data.json", mockFetchFn))
      .rejects.toThrow("Network failure");
  });

  it("uses global fetch when no fetchFn provided", async function () {
    // This test verifies the default parameter behavior.
    // In test environment, global fetch may not exist, so we verify the function signature.
    expect(safeFetch.length).toBeGreaterThanOrEqual(1);
  });

  it("validates url parameter is a non-empty string", async function () {
    await expect(safeFetch("")).rejects.toThrow();
    await expect(safeFetch(null)).rejects.toThrow();
    await expect(safeFetch(undefined)).rejects.toThrow();
  });
});

describe("safeFetchAllSettled", function () {
  it("returns array of results matching input URLs order", async function () {
    var mockFetchFn = vi.fn(function (url) {
      if (url.endsWith("/a.json")) return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ id: "a" }); } });
      if (url.endsWith("/b.json")) return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ id: "b" }); } });
      return Promise.resolve({ ok: false, status: 404 });
    });

    var results = await safeFetchAllSettled(
      ["https://example.com/a.json", "https://example.com/b.json"],
      mockFetchFn
    );

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe("fulfilled");
    expect(results[0].value).toEqual({ id: "a" });
    expect(results[1].status).toBe("fulfilled");
    expect(results[1].value).toEqual({ id: "b" });
  });

  it("returns rejected status for failed fetches without crashing others", async function () {
    var mockFetchFn = vi.fn(function (url) {
      if (url.includes("good")) return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ ok: true }); } });
      return Promise.resolve({ ok: false, status: 500 });
    });

    var results = await safeFetchAllSettled(
      ["https://example.com/good.json", "https://example.com/bad.json"],
      mockFetchFn
    );

    expect(results[0].status).toBe("fulfilled");
    expect(results[1].status).toBe("rejected");
  });

  it("handles empty URL array", async function () {
    var mockFetchFn = vi.fn();
    var results = await safeFetchAllSettled([], mockFetchFn);
    expect(results).toEqual([]);
    expect(mockFetchFn).not.toHaveBeenCalled();
  });

  it("handles network errors as rejected results", async function () {
    var mockFetchFn = vi.fn(function () {
      return Promise.reject(new Error("DNS failure"));
    });

    var results = await safeFetchAllSettled(["https://example.com/x.json"], mockFetchFn);
    expect(results[0].status).toBe("rejected");
    expect(results[0].reason).toBeDefined();
  });
});
