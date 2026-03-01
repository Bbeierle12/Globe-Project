# Out of Memory Fixes

## Problem

The app crashes with `Error: out of memory` during CesiumJS rendering. The browser's WebGL context runs out of GPU/system memory because data is loaded eagerly and never freed.

**Estimated memory at startup:** ~8-10MB of entities/datasources
**With layers expanded:** easily exceeds browser WebGL limits, especially on mobile

---

## Root Causes

### 1. All subdivision data loads at startup in parallel

**File:** `src/cesium/populationLayer.js` (lines 79-93)

All 37 country subdivision TopoJSON files (~2.5MB total) are fetched simultaneously via `Promise.allSettled()` and decoded into GeoJSON datasources — regardless of what the user is looking at.

### 2. Entities are hidden, never removed

**File:** `src/CesiumGlobe.jsx` (lines 302-315)

When layers are toggled off, entities get `entity.show = false` but remain in `viewer.entities`. All geometry stays allocated in GPU/system memory.

### 3. County entities accumulate

**File:** `src/CesiumGlobe.jsx` (lines 292-317)

Expanding a US state adds county entities to `viewer.entities`. Collapsing the state only sets `show = false` — entities are never removed. Expanding multiple states causes unbounded growth.

### 4. 4,000+ city features with per-frame clustering

**File:** `src/cesium/cityLayer.js` (lines 10-13)

A 540KB GeoJSON with 4,000+ cities is loaded. Clustering runs per-frame on all features even when most are off-screen.

### 5. OSM Buildings tileset streams without memory cap

The Cesium 3D tileset (Ion asset 96188) continuously streams high-detail building data with no `maximumMemoryUsage` configured.

---

## Proposed Fixes

### Fix 1: On-demand subdivision loading (highest impact)

**Current behavior:** All 37 countries' subdivisions load at startup.
**Target behavior:** Load only the selected/zoomed country's subdivisions; unload when navigating away.

In `populationLayer.js`:

- Remove the bulk `Promise.allSettled()` fetch of all subdivision configs at startup
- Add a `loadSubdivision(iso)` function that fetches, decodes, and adds a single country's TopoJSON on demand
- Add an `unloadSubdivision(iso)` function that removes the datasource from `viewer.dataSources` and clears its entities from `selectionIndex`
- Track which country is currently loaded; when a new country is selected, unload the previous one first
- Only one country's subdivision data in memory at a time

Flow:
1. User clicks France -> fetch `fr-departments.json`, decode, render
2. User clicks Japan -> **remove** France datasource, fetch `jp-prefectures.json`, decode, render

### Fix 2: Remove entities on visibility toggle (not just hide)

**Files:** `src/CesiumGlobe.jsx`, `src/cesium/populationLayer.js`

- When `setSubdivisionsVisible(false)` is called, actually remove the datasource from `viewer.dataSources` instead of setting `ds.show = false`
- Cache the config so it can be re-fetched when needed again
- For county entities: when a state is collapsed, call `viewer.entities.remove(entity)` for each county entity and clear the reference from `markersRef.current.countiesByFp`

### Fix 3: Cap city layer entities with viewport culling

**File:** `src/cesium/cityLayer.js`

- Increase the minimum population threshold at high altitudes (currently 5,000,000 at max zoom-out — could be higher)
- Instead of just hiding low-population cities (`show = false`), remove them from the datasource entirely and re-add when zooming in
- Consider reducing the cities.geojson dataset to ~1,000 entries (capital cities + major metros)

### Fix 4: High-performance GPU context injection

**File:** `src/CesiumGlobe.jsx`

Browsers often default to integrated graphics to save power, which bottlenecks high-render mapping. Explicitly request the discrete GPU and trim VRAM waste:

```javascript
const viewer = new Cesium.Viewer("cesiumContainer", {
  contextOptions: {
    get webgl() {
      return {
        powerPreference: "high-performance", // Force discrete GPU
        antialias: false,                    // Saves VRAM if data is pixel-dense
        preserveDrawingBuffer: false,
      };
    },
  },
  scene3DOnly: true,
});
```

### Fix 5: Hard memory cap on tilesets and terrain (OOM prevention)

**File:** `src/cesium/buildingsLayer.js`

Without `maximumMemoryUsage`, Cesium continues caching tiles until the browser tab hits its ~4GB limit and crashes. Cap it explicitly:

```javascript
const osmBuildings = await Cesium.createOsmBuildingsAsync({
  maximumMemoryUsage: 1024,        // 1GB cap for buildings
  maximumScreenSpaceError: 16,     // Increase to 32 if zooming out feels heavy
});

viewer.scene.globe.tileCacheSize = 500; // Limits terrain tiles in RAM
```

- Ensure the tileset is fully destroyed (not just hidden) when toggled off

### Fix 6: REST API transition for Ion asset optimization

**Current behavior:** Assets uploaded manually to Cesium Ion without pre-processing.
**Target behavior:** Use the Ion REST API to upload and tile assets with compression enabled.

Benefits of the REST API pipeline:
- **Draco Geometry Compression** — essential for the 1.8M+ building segments in OSM data, drastically reduces geometry size in memory
- **KTX2 Textures** — lowers VRAM pressure compared to raw JPEGs by using GPU-native compressed formats
- Eliminates the manual upload workflow (current "thorn")

### Fix 7: Clean up selection index

**File:** `src/cesium/populationLayer.js`

- When unloading a subdivision datasource, remove its entries from the `selectionIndex` Map
- When clearing counties, remove their entries too
- This prevents the Map from growing unboundedly across session

### Fix 8: Batch render requests

**Files:** Multiple

- Consolidate `viewer.scene.requestRender()` calls — many places trigger re-renders individually per entity update
- Use `viewer.scene.requestRenderMode = true` with a debounced render request after batch operations

### Fix 9: Dispose decoded TopoJSON geometry

**File:** `src/utils/topoUtils.js`, `src/cesium/populationLayer.js`

- After creating the `GeoJsonDataSource` from decoded TopoJSON, discard the intermediate GeoJSON object (set references to `null`)
- The decoded geometry arrays from `topojson.feature()` are kept in memory alongside the Cesium datasource — only the datasource copy is needed

---

## Priority Order

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| 1 | On-demand subdivision loading | High — eliminates ~2.5MB upfront | Medium |
| 2 | Remove entities on toggle | High — prevents accumulation | Low |
| 3 | Cap city layer entities | Medium — reduces baseline memory | Medium |
| 4 | High-performance GPU context | Medium — unlocks discrete GPU | Low |
| 5 | Hard memory cap on tilesets | High — prevents OOM crash | Low |
| 6 | REST API + Draco/KTX2 compression | High — smaller assets in VRAM | Medium |
| 7 | Clean up selection index | Low — prevents slow leak | Low |
| 8 | Batch render requests | Low — performance, not memory | Low |
| 9 | Dispose decoded TopoJSON | Medium — frees intermediate data | Low |

---

## Key File Locations

| File | Role |
|------|------|
| `src/cesium/populationLayer.js` | Subdivision polygon loading, highlighting, selection index |
| `src/CesiumGlobe.jsx` | Layer init, camera toggles, entity visibility, click handlers |
| `src/cesium/cityLayer.js` | City markers and clustering |
| `src/cesium/buildingsLayer.js` | OSM 3D buildings tileset |
| `src/cesium/earthquakeLayer.js` | Earthquake data layer |
| `src/utils/layerRegistry.js` | Layer lifecycle management |
| `src/utils/topoUtils.js` | TopoJSON decoding |
| `src/data/subdivisionConfig.js` | List of all 37 subdivision TopoJSON configs |
| `public/topo/` | 39 TopoJSON files (~2.5MB total) |
| `public/data/cities.geojson` | 4,000+ city features (540KB) |
| `src/data/us-counties/` | 48 county data files (448KB total) |
