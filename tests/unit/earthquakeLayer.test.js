/**
 * TDD Contract: src/cesium/earthquakeLayer.js
 * Phase 4 — Write this test FIRST, then implement earthquakeLayer.js
 *
 * This test is the exemplar for all new Cesium layer factories.
 * Every new layer follows this contract pattern:
 *   createXxxLayer(viewer, options) -> { destroy, dataSource, refresh? }
 */

import { createEarthquakeLayer } from "../../src/cesium/earthquakeLayer.js";
import { EARTHQUAKE_CONFIG } from "../../src/config/earthquakeConfig.js";

// ─── Fixtures ───

var SAMPLE_EARTHQUAKE_GEOJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        mag: 6.2,
        place: "45km NNE of Hualien City, Taiwan",
        time: 1709000000000,
        depth: 15.3,
        tsunami: 0,
        title: "M 6.2 - Taiwan",
      },
      geometry: { type: "Point", coordinates: [121.65, 24.18, 15.3] },
    },
    {
      type: "Feature",
      properties: {
        mag: 4.8,
        place: "12km SW of Ridgecrest, CA",
        time: 1709100000000,
        depth: 8.1,
        tsunami: 0,
        title: "M 4.8 - California",
      },
      geometry: { type: "Point", coordinates: [-117.67, 35.58, 8.1] },
    },
    {
      type: "Feature",
      properties: {
        mag: 7.5,
        place: "Noto Peninsula, Japan",
        time: 1709200000000,
        depth: 10.0,
        tsunami: 1,
        title: "M 7.5 - Japan",
      },
      geometry: { type: "Point", coordinates: [137.24, 37.50, 10.0] },
    },
  ],
};

var EMPTY_GEOJSON = { type: "FeatureCollection", features: [] };

// ─── Mock Viewer ───

function createMockViewer() {
  return {
    dataSources: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    scene: {
      requestRender: vi.fn(),
    },
    camera: {
      positionCartographic: { height: 10000000 },
      changed: {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    },
  };
}

function createMockFetch(data) {
  return vi.fn(function () {
    return Promise.resolve({
      ok: true,
      json: function () { return Promise.resolve(data); },
    });
  });
}

function createFailingFetch(status) {
  return vi.fn(function () {
    return Promise.resolve({ ok: false, status: status || 500 });
  });
}

// ─── Tests ───

describe("EARTHQUAKE_CONFIG", function () {
  it("has required configuration fields", function () {
    expect(EARTHQUAKE_CONFIG.feedUrl).toBeDefined();
    expect(typeof EARTHQUAKE_CONFIG.feedUrl).toBe("string");
    expect(EARTHQUAKE_CONFIG.feedUrl).toContain("earthquake.usgs.gov");

    expect(EARTHQUAKE_CONFIG.refreshIntervalMs).toBeDefined();
    expect(EARTHQUAKE_CONFIG.refreshIntervalMs).toBeGreaterThan(0);

    expect(EARTHQUAKE_CONFIG.magnitudeThresholds).toBeDefined();
    expect(EARTHQUAKE_CONFIG.colors).toBeDefined();
    expect(EARTHQUAKE_CONFIG.markerSizes).toBeDefined();
  });

  it("has no magic numbers (all thresholds are named)", function () {
    expect(typeof EARTHQUAKE_CONFIG.magnitudeThresholds.low).toBe("number");
    expect(typeof EARTHQUAKE_CONFIG.magnitudeThresholds.high).toBe("number");
    expect(EARTHQUAKE_CONFIG.magnitudeThresholds.low).toBeLessThan(EARTHQUAKE_CONFIG.magnitudeThresholds.high);
  });
});

describe("createEarthquakeLayer", function () {
  it("fetches from USGS significant_month endpoint", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(SAMPLE_EARTHQUAKE_GEOJSON);

    await createEarthquakeLayer(viewer, { fetchFn: mockFetch });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    var calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain("earthquake.usgs.gov");
  });

  it("adds a data source to the viewer", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(SAMPLE_EARTHQUAKE_GEOJSON);

    await createEarthquakeLayer(viewer, { fetchFn: mockFetch });

    expect(viewer.dataSources.add).toHaveBeenCalled();
  });

  it("returns an object with destroy function", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(SAMPLE_EARTHQUAKE_GEOJSON);

    var layer = await createEarthquakeLayer(viewer, { fetchFn: mockFetch });

    expect(layer).toBeDefined();
    expect(typeof layer.destroy).toBe("function");
  });

  it("returns a dataSource property", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(SAMPLE_EARTHQUAKE_GEOJSON);

    var layer = await createEarthquakeLayer(viewer, { fetchFn: mockFetch });

    expect(layer.dataSource).toBeDefined();
  });

  it("throws on failed fetch", async function () {
    var viewer = createMockViewer();
    var mockFetch = createFailingFetch(500);

    await expect(createEarthquakeLayer(viewer, { fetchFn: mockFetch }))
      .rejects.toThrow();
  });

  it("handles empty feature collection gracefully", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(EMPTY_GEOJSON);

    var layer = await createEarthquakeLayer(viewer, { fetchFn: mockFetch });

    expect(layer).toBeDefined();
    expect(typeof layer.destroy).toBe("function");
  });

  it("destroy removes data source from viewer", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(SAMPLE_EARTHQUAKE_GEOJSON);

    var layer = await createEarthquakeLayer(viewer, { fetchFn: mockFetch });
    layer.destroy();

    expect(viewer.dataSources.remove).toHaveBeenCalled();
  });
});

describe("Earthquake layer refresh", function () {
  it("returns a refresh function", async function () {
    var viewer = createMockViewer();
    var mockFetch = createMockFetch(SAMPLE_EARTHQUAKE_GEOJSON);

    var layer = await createEarthquakeLayer(viewer, { fetchFn: mockFetch });

    expect(typeof layer.refresh).toBe("function");
  });

  it("refresh replaces data with fresh fetch", async function () {
    var callCount = 0;
    var viewer = createMockViewer();
    var mockFetch = vi.fn(function () {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: function () { return Promise.resolve(SAMPLE_EARTHQUAKE_GEOJSON); },
      });
    });

    var layer = await createEarthquakeLayer(viewer, { fetchFn: mockFetch });
    expect(callCount).toBe(1);

    await layer.refresh();
    expect(callCount).toBe(2);
  });
});
