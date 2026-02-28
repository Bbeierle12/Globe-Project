import * as Cesium from "cesium";
import { EARTHQUAKE_CONFIG } from "../config/earthquakeConfig.js";

function getMagnitudeCategory(mag) {
  if (mag >= EARTHQUAKE_CONFIG.magnitudeThresholds.high) return "high";
  if (mag >= EARTHQUAKE_CONFIG.magnitudeThresholds.low) return "medium";
  return "low";
}

async function createEarthquakeLayer(viewer, options) {
  var fetchFn = (options && options.fetchFn) || fetch;
  var dataSource = new Cesium.CustomDataSource("earthquakes");

  async function loadData() {
    var res = await fetchFn(EARTHQUAKE_CONFIG.feedUrl);
    if (!res.ok) throw new Error("HTTP " + res.status);
    var geo = await res.json();

    if (dataSource.entities.removeAll) {
      dataSource.entities.removeAll();
    }

    (geo.features || []).forEach(function (feature) {
      if (!feature.geometry || feature.geometry.type !== "Point") return;
      var coords = feature.geometry.coordinates || [];
      if (coords.length < 2) return;

      var props = feature.properties || {};
      var mag = Number(props.mag || 0);
      var category = getMagnitudeCategory(mag);

      dataSource.entities.add({
        position: Cesium.Cartesian3.fromDegrees(coords[0], coords[1], 0),
        point: {
          pixelSize: EARTHQUAKE_CONFIG.markerSizes[category],
          color: Cesium.Color.fromCssColorString(EARTHQUAKE_CONFIG.colors[category]).withAlpha(0.85),
          outlineColor: Cesium.Color.fromCssColorString("#ffffff").withAlpha(0.5),
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: 15000000,
          scaleByDistance: new Cesium.NearFarScalar(50000, 1.2, 16000000, 0.3),
        },
      });
    });
  }

  await loadData();
  viewer.dataSources.add(dataSource);

  function destroy() {
    viewer.dataSources.remove(dataSource, true);
  }

  async function refresh() {
    await loadData();
  }

  return {
    destroy: destroy,
    dataSource: dataSource,
    refresh: refresh,
  };
}

export { createEarthquakeLayer };
