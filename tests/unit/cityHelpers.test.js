import { minPopulationForCameraHeight } from "../../src/cesium/cityLayer.js";

describe("minPopulationForCameraHeight", function() {
  it("returns 10M for very high altitude (> 18M meters)", function() {
    expect(minPopulationForCameraHeight(20000000)).toBe(10000000);
  });

  it("returns 5M for high altitude (12M-18M meters)", function() {
    expect(minPopulationForCameraHeight(15000000)).toBe(5000000);
  });

  it("returns 1M for medium altitude (5M-12M meters)", function() {
    expect(minPopulationForCameraHeight(10000000)).toBe(1000000);
  });

  it("returns 100K for low altitude (< 5M meters)", function() {
    expect(minPopulationForCameraHeight(1000000)).toBe(100000);
  });

  it("returns 10M at boundary 18000001", function() {
    expect(minPopulationForCameraHeight(18000001)).toBe(10000000);
  });

  it("returns 5M at boundary 18000000 (not strictly greater)", function() {
    expect(minPopulationForCameraHeight(18000000)).toBe(5000000);
  });

  it("returns 5M at boundary 12000001", function() {
    expect(minPopulationForCameraHeight(12000001)).toBe(5000000);
  });

  it("returns 1M at boundary 12000000 (not strictly greater)", function() {
    expect(minPopulationForCameraHeight(12000000)).toBe(1000000);
  });

  it("returns 1M at boundary 5000001", function() {
    expect(minPopulationForCameraHeight(5000001)).toBe(1000000);
  });

  it("returns 100K at boundary 5000000 (not strictly greater)", function() {
    expect(minPopulationForCameraHeight(5000000)).toBe(100000);
  });

  it("returns 100K for very low altitude", function() {
    expect(minPopulationForCameraHeight(100)).toBe(100000);
  });
});
