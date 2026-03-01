import * as Cesium from "cesium";

var OSM_BUILDINGS_ASSET_ID = 96188;

async function createBuildingsLayer(viewer) {
  try {
    var tileset = await Cesium.Cesium3DTileset.fromIonAssetId(OSM_BUILDINGS_ASSET_ID, {
      maximumMemoryUsage: 1024,
      maximumScreenSpaceError: 16,
    });
    viewer.scene.primitives.add(tileset);
    tileset.style = new Cesium.Cesium3DTileStyle({
      color: "color('rgb(95, 121, 145)', 0.62)",
    });
    return tileset;
  } catch (err) {
    console.warn("OSM buildings failed to load:", err);
    return null;
  }
}

export { createBuildingsLayer };
