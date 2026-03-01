import * as Cesium from "cesium";
import { ID_MAP, ISO_MAP, SUB_CONFIGS, findCountry } from "../data/index.js";
import { decodeTopo, pClr } from "./topoUtils.js";
import { safeFetch } from "../utils/fetchUtils.js";

var EARTH_TOPO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function buildSubdivisionMaps() {
  var maps = {};
  SUB_CONFIGS.forEach(function(cfg) {
    var country = ISO_MAP[cfg.iso];
    if (!country || !country.subdivisions.length) return;
    var map = {};
    country.subdivisions.forEach(function(s) {
      var code = s[cfg.codeField];
      if (code) map[code] = s;
    });
    maps[cfg.iso] = map;
  });
  return maps;
}

function getSelectionKey(entry) {
  if (!entry) return null;
  if (entry.t === "c") return "c:" + entry.iso;
  if (entry.t === "s") {
    var code = entry.fp || entry.sc || entry.n;
    return "s:" + entry.parentIso + ":" + code;
  }
  if (entry.t === "county") return "county:" + entry.fips;
  if (entry.t === "city") return "city:" + entry.n + ":" + entry.la + ":" + entry.lo;
  return null;
}

function getEntityProperty(entity, key) {
  if (!entity.properties || !entity.properties[key]) return null;
  return entity.properties[key].getValue(Cesium.JulianDate.now());
}

function colorFromPopulation(pop, alpha) {
  var rgb = pClr(Math.max(1, pop || 1));
  return Cesium.Color.fromBytes(rgb[0], rgb[1], rgb[2], alpha);
}

function stylePopulationEntity(entity, pop) {
  if (!entity.polygon) return;
  var fill = colorFromPopulation(pop, 170);
  entity.__baseFill = fill;
  entity.polygon.material = fill;
  entity.polygon.outline = false;
}

async function createPopulationLayer(viewer, options) {
  var fetchFn = (options && options.fetchFn) || fetch;
  var subdivisionMaps = buildSubdivisionMaps();
  var skipNames = {};
  SUB_CONFIGS.forEach(function(cfg) {
    if (cfg.skipName) skipNames[cfg.skipName] = true;
  });

  var selectionIndex = new Map();
  var highlighted = [];
  var loadedSubs = new Map();

  var configByIso = {};
  SUB_CONFIGS.forEach(function(cfg) {
    configByIso[cfg.iso] = cfg;
  });

  function indexEntity(entity, entry) {
    var key = getSelectionKey(entry);
    if (!key) return;
    var list = selectionIndex.get(key) || [];
    list.push(entity);
    selectionIndex.set(key, list);
  }

  function assignEntityEntry(entity, entry) {
    if (!entry) return;
    entity.__entry = entry;
    indexEntity(entity, entry);
  }

  // --- Only fetch world boundaries at startup ---
  var worldTopo = await safeFetch(EARTH_TOPO_URL, fetchFn);
  if (!worldTopo) throw new Error("Failed to load world TopoJSON");

  var worldGeo = decodeTopo(worldTopo, "countries");
  worldTopo = null;
  var worldFeatures = [];
  var countryByFeatureId = new Map();

  worldGeo.features.forEach(function(f) {
    if (!f.geometry) return;
    var featureId = String(f.id);
    var name = ID_MAP[featureId];
    if (name && skipNames[name]) return;
    var entry = findCountry(f.id);
    if (entry) countryByFeatureId.set(featureId, entry);
    worldFeatures.push({
      type: "Feature",
      id: featureId,
      properties: { __featureId: featureId },
      geometry: f.geometry,
    });
  });

  worldGeo = null;

  var countryDataSource = await Cesium.GeoJsonDataSource.load(
    { type: "FeatureCollection", features: worldFeatures },
    {
      clampToGround: true,
      fill: Cesium.Color.fromCssColorString("#1b3552").withAlpha(0.5),
      stroke: Cesium.Color.TRANSPARENT,
      strokeWidth: 0,
    },
  );

  worldFeatures = null;
  viewer.dataSources.add(countryDataSource);

  countryDataSource.entities.values.forEach(function(entity) {
    var featureId = String(getEntityProperty(entity, "__featureId") || "");
    var entry = countryByFeatureId.get(featureId) || null;
    stylePopulationEntity(entity, entry ? entry.p : 1);
    assignEntityEntry(entity, entry);
  });

  // --- On-demand subdivision loading ---

  async function loadSubdivision(iso) {
    if (loadedSubs.has(iso)) return;
    var cfg = configByIso[iso];
    if (!cfg) return;

    var topo = await safeFetch(cfg.url, fetchFn);
    if (!topo) return;

    var geo = decodeTopo(topo, cfg.objectName);
    topo = null;

    var map = subdivisionMaps[cfg.iso] || {};
    var featureToEntry = new Map();
    var features = [];

    geo.features.forEach(function(f) {
      if (!f.geometry) return;
      if (cfg.skipFeature && cfg.skipFeature(f)) return;
      var code = cfg.extractCode(f);
      var entry = code ? map[code] : null;
      var featureId = cfg.iso + ":" + String(f.id != null ? f.id : code || Math.random());
      if (entry) featureToEntry.set(featureId, entry);
      features.push({
        type: "Feature",
        id: featureId,
        properties: { __featureId: featureId },
        geometry: f.geometry,
      });
    });

    geo = null;

    var ds = await Cesium.GeoJsonDataSource.load(
      { type: "FeatureCollection", features: features },
      {
        clampToGround: true,
        fill: Cesium.Color.fromCssColorString("#2a4662").withAlpha(0.55),
        stroke: Cesium.Color.TRANSPARENT,
        strokeWidth: 0,
      },
    );

    features = null;
    viewer.dataSources.add(ds);

    var indexedKeys = [];
    ds.entities.values.forEach(function(entity) {
      var featureId = String(getEntityProperty(entity, "__featureId") || "");
      var entry = featureToEntry.get(featureId) || null;
      stylePopulationEntity(entity, entry ? entry.p : 1);
      assignEntityEntry(entity, entry);
      if (entry) {
        var key = getSelectionKey(entry);
        if (key) indexedKeys.push(key);
      }
    });

    featureToEntry = null;
    loadedSubs.set(iso, { ds: ds, keys: indexedKeys });
    viewer.scene.requestRender();
  }

  function unloadSubdivision(iso) {
    var record = loadedSubs.get(iso);
    if (!record) return;

    clearHighlight();

    record.keys.forEach(function(key) {
      selectionIndex.delete(key);
    });

    viewer.dataSources.remove(record.ds, true);
    loadedSubs.delete(iso);
    viewer.scene.requestRender();
  }

  function clearHighlight() {
    highlighted.forEach(function(entity) {
      if (!entity || !entity.polygon || !entity.__baseFill) return;
      entity.polygon.material = entity.__baseFill;
    });
    highlighted = [];
  }

  function highlightSelection(selection) {
    clearHighlight();
    var key = getSelectionKey(selection);
    if (!key) return;
    var entities = selectionIndex.get(key) || [];
    entities.forEach(function(entity) {
      if (!entity || !entity.polygon || !entity.__baseFill) return;
      var bright = entity.__baseFill.brighten(0.33, new Cesium.Color());
      entity.polygon.material = Cesium.Color.fromAlpha(bright, 0.85);
      highlighted.push(entity);
    });
  }

  function setSubdivisionsVisible(show) {
    loadedSubs.forEach(function(record) {
      record.ds.show = show;
    });
  }

  function destroy() {
    clearHighlight();
    viewer.dataSources.remove(countryDataSource, true);
    loadedSubs.forEach(function(record) {
      viewer.dataSources.remove(record.ds, true);
    });
    loadedSubs.clear();
    selectionIndex.clear();
  }

  return {
    countryDataSource: countryDataSource,
    destroy: destroy,
    highlightSelection: highlightSelection,
    setSubdivisionsVisible: setSubdivisionsVisible,
    loadSubdivision: loadSubdivision,
    unloadSubdivision: unloadSubdivision,
  };
}

export { createPopulationLayer, getSelectionKey, buildSubdivisionMaps };
