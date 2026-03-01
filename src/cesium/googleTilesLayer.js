import * as Cesium from "cesium";

function getGoogleApiKey() {
  return (typeof import.meta !== "undefined" && import.meta.env)
    ? import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
    : "";
}

/**
 * Loads Google Photorealistic 3D Tiles and hides the OSM base imagery layer,
 * since Google tiles include their own photorealistic imagery and buildings.
 *
 * Returns the tileset primitive on success, or null if no API key is set or
 * the tileset fails to load.
 *
 * @param {Cesium.Viewer} viewer
 * @returns {Promise<Cesium.Cesium3DTileset|null>}
 */
async function createGoogleTilesLayer(viewer) {
  var key = getGoogleApiKey();
  if (!key) return null;

  try {
    Cesium.GoogleMaps.defaultApiKey = key;
    var tileset = await Cesium.createGooglePhotorealistic3DTileset(undefined, {
      showCreditsOnScreen: false,
    });
    viewer.scene.primitives.add(tileset);

    // Google tiles include photorealistic imagery — hide the OSM base layer.
    var baseLayer = viewer.imageryLayers.get(0);
    if (baseLayer) baseLayer.show = false;

    return tileset;
  } catch (err) {
    console.warn("Google Photorealistic 3D Tiles failed to load:", err);
    return null;
  }
}

export { createGoogleTilesLayer, getGoogleApiKey };
