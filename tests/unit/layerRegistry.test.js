/**
 * TDD Contract: src/utils/layerRegistry.js
 * Phase 7 — Write this test FIRST, then implement layerRegistry.js
 *
 * The layer registry is the central coordination point for all Cesium layers.
 * It enables the toggle panel, performance monitoring, and layer-to-layer
 * interactions (like temporal filtering across multiple event layers).
 */

import {
  createLayerRegistry,
} from "../../src/utils/layerRegistry.js";

// ─── Mock Layer ───

function createMockLayer(name) {
  return {
    name: name,
    dataSource: { show: true },
    destroy: vi.fn(),
    refresh: vi.fn(),
  };
}

// ─── Tests ───

describe("createLayerRegistry", function () {
  it("returns a registry object with required methods", function () {
    var registry = createLayerRegistry();

    expect(typeof registry.register).toBe("function");
    expect(typeof registry.unregister).toBe("function");
    expect(typeof registry.get).toBe("function");
    expect(typeof registry.getAll).toBe("function");
    expect(typeof registry.setVisible).toBe("function");
    expect(typeof registry.isVisible).toBe("function");
    expect(typeof registry.onChange).toBe("function");
    expect(typeof registry.destroy).toBe("function");
  });
});

describe("Layer registration", function () {
  it("register adds a layer by name", function () {
    var registry = createLayerRegistry();
    var layer = createMockLayer("earthquakes");

    registry.register("earthquakes", layer);

    expect(registry.get("earthquakes")).toBe(layer);
  });

  it("register throws for duplicate name", function () {
    var registry = createLayerRegistry();
    var layer = createMockLayer("earthquakes");

    registry.register("earthquakes", layer);

    expect(function () {
      registry.register("earthquakes", layer);
    }).toThrow();
  });

  it("register validates layer has destroy function", function () {
    var registry = createLayerRegistry();

    expect(function () {
      registry.register("bad", { name: "bad" });
    }).toThrow();
  });

  it("unregister removes a layer by name", function () {
    var registry = createLayerRegistry();
    var layer = createMockLayer("earthquakes");

    registry.register("earthquakes", layer);
    registry.unregister("earthquakes");

    expect(registry.get("earthquakes")).toBeNull();
  });

  it("unregister calls destroy on the removed layer", function () {
    var registry = createLayerRegistry();
    var layer = createMockLayer("earthquakes");

    registry.register("earthquakes", layer);
    registry.unregister("earthquakes");

    expect(layer.destroy).toHaveBeenCalledTimes(1);
  });

  it("unregister throws for unknown layer name", function () {
    var registry = createLayerRegistry();

    expect(function () {
      registry.unregister("nonexistent");
    }).toThrow();
  });
});

describe("Layer retrieval", function () {
  it("get returns null for unregistered name", function () {
    var registry = createLayerRegistry();

    expect(registry.get("unknown")).toBeNull();
  });

  it("getAll returns array of all registered layers", function () {
    var registry = createLayerRegistry();
    var quakes = createMockLayer("earthquakes");
    var cities = createMockLayer("cities");

    registry.register("earthquakes", quakes);
    registry.register("cities", cities);

    var all = registry.getAll();
    expect(all).toHaveLength(2);
    expect(all).toContain(quakes);
    expect(all).toContain(cities);
  });

  it("getAll returns empty array when no layers registered", function () {
    var registry = createLayerRegistry();
    expect(registry.getAll()).toEqual([]);
  });
});

describe("Layer visibility", function () {
  it("setVisible toggles layer.dataSource.show", function () {
    var registry = createLayerRegistry();
    var layer = createMockLayer("earthquakes");

    registry.register("earthquakes", layer);
    registry.setVisible("earthquakes", false);

    expect(layer.dataSource.show).toBe(false);
  });

  it("isVisible returns current visibility state", function () {
    var registry = createLayerRegistry();
    var layer = createMockLayer("earthquakes");

    registry.register("earthquakes", layer);

    expect(registry.isVisible("earthquakes")).toBe(true);

    registry.setVisible("earthquakes", false);
    expect(registry.isVisible("earthquakes")).toBe(false);
  });

  it("setVisible throws for unregistered layer", function () {
    var registry = createLayerRegistry();

    expect(function () {
      registry.setVisible("unknown", false);
    }).toThrow();
  });
});

describe("Change notifications", function () {
  it("onChange registers a callback that fires on register", function () {
    var registry = createLayerRegistry();
    var callback = vi.fn();

    registry.onChange(callback);
    registry.register("earthquakes", createMockLayer("earthquakes"));

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("onChange fires on unregister", function () {
    var registry = createLayerRegistry();
    var callback = vi.fn();

    registry.register("earthquakes", createMockLayer("earthquakes"));
    registry.onChange(callback);
    registry.unregister("earthquakes");

    expect(callback).toHaveBeenCalled();
  });

  it("onChange fires on visibility change", function () {
    var registry = createLayerRegistry();
    var callback = vi.fn();

    registry.register("earthquakes", createMockLayer("earthquakes"));
    registry.onChange(callback);
    registry.setVisible("earthquakes", false);

    expect(callback).toHaveBeenCalled();
  });

  it("onChange returns unsubscribe function", function () {
    var registry = createLayerRegistry();
    var callback = vi.fn();

    var unsubscribe = registry.onChange(callback);
    unsubscribe();

    registry.register("earthquakes", createMockLayer("earthquakes"));
    expect(callback).not.toHaveBeenCalled();
  });
});

describe("Registry cleanup", function () {
  it("destroy calls destroy on all registered layers", function () {
    var registry = createLayerRegistry();
    var quakes = createMockLayer("earthquakes");
    var cities = createMockLayer("cities");

    registry.register("earthquakes", quakes);
    registry.register("cities", cities);
    registry.destroy();

    expect(quakes.destroy).toHaveBeenCalledTimes(1);
    expect(cities.destroy).toHaveBeenCalledTimes(1);
  });

  it("destroy clears all registrations", function () {
    var registry = createLayerRegistry();
    registry.register("earthquakes", createMockLayer("earthquakes"));
    registry.destroy();

    expect(registry.getAll()).toEqual([]);
  });

  it("operations after destroy throw", function () {
    var registry = createLayerRegistry();
    registry.destroy();

    expect(function () {
      registry.register("new", createMockLayer("new"));
    }).toThrow();
  });
});
