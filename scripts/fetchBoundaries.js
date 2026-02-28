#!/usr/bin/env node
/**
 * fetchBoundaries.js
 *
 * Downloads Natural Earth 10m admin-1 GeoJSON, filters by country,
 * converts to TopoJSON, simplifies, and writes to public/topo/.
 *
 * Special handling:
 * - France: departments merged into 13 metropolitan regions
 * - Australia: only 8 standard states/territories
 * - UK: 4 constituent countries from map_subunits
 *
 * Usage: node scripts/fetchBoundaries.js
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { topology } from "topojson-server";
import { presimplify, quantile, simplify } from "topojson-simplify";
import { merge } from "topojson-client";

var __dirname = dirname(fileURLToPath(import.meta.url));
var TOPO_DIR = join(__dirname, "..", "public", "topo");
mkdirSync(TOPO_DIR, { recursive: true });

var ADMIN1_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson";
var SUBUNITS_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_map_subunits.geojson";

// 8 standard Australian states/territories ISO codes
var AUS_VALID = new Set(["AU-NSW", "AU-VIC", "AU-QLD", "AU-SA", "AU-WA", "AU-TAS", "AU-NT", "AU-ACT"]);

// 4 UK constituent countries by SU_A3 code
var GBR_VALID = new Set(["ENG", "SCT", "WLS", "NIR"]);

// Mapping of French region names to ISO 3166-2:FR codes
var FRA_REGION_CODES = {
  "Auvergne-Rh\u00f4ne-Alpes": "ARA",
  "Bourgogne-Franche-Comt\u00e9": "BFC",
  "Bretagne": "BRE",
  "Centre-Val de Loire": "CVL",
  "Corse": "COR",
  "Grand Est": "GES",
  "Hauts-de-France": "HDF",
  "Normandie": "NOR",
  "\u00cele-de-France": "IDF",
  "Nouvelle-Aquitaine": "NAQ",
  "Occitanie": "OCC",
  "Pays de la Loire": "PDL",
  "Provence-Alpes-C\u00f4te-d'Azur": "PAC"
};

var CONFIGS = [
  {
    code: "DEU",
    file: "de-states.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "DEU"; },
  },
  {
    code: "FRA",
    file: "fr-regions.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    // This uses custom post-processing to merge departments into regions
    filter: function (f) {
      return f.properties.adm0_a3 === "FRA" && f.properties.type_en === "Metropolitan department";
    },
    postProcess: "mergeByRegion",
  },
  {
    code: "AUS",
    file: "au-states.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) {
      return f.properties.adm0_a3 === "AUS" &&
        AUS_VALID.has(f.properties.iso_3166_2) &&
        f.properties.name !== "Lord Howe Island";
    },
  },
  {
    code: "JPN",
    file: "jp-prefectures.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "JPN"; },
  },
  {
    code: "GBR",
    file: "gb-countries.json",
    objectName: "ne_10m_admin_0_map_subunits",
    source: "subunits",
    filter: function (f) { return GBR_VALID.has(f.properties.SU_A3); },
  },
  {
    code: "KOR",
    file: "kr-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "KOR"; },
  },
];

async function fetchJSON(url) {
  console.log("  Fetching " + url.split("/").pop() + " ...");
  var res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return res.json();
}

/**
 * Merge French departments into 13 regions using TopoJSON merge.
 * Returns a new GeoJSON FeatureCollection with 13 region features.
 */
function mergeFrenchRegions(departmentFeatures) {
  // Group departments by region name
  var groups = {};
  departmentFeatures.forEach(function (f) {
    var rg = f.properties.region;
    if (groups[rg] === undefined) groups[rg] = [];
    groups[rg].push(f);
  });

  // Build a topology from all departments first
  var deptCollection = { type: "FeatureCollection", features: departmentFeatures };
  var topo = topology({ depts: deptCollection });
  var deptGeoms = topo.objects.depts.geometries;

  // For each region, merge the department geometries
  var regionFeatures = Object.keys(groups).map(function (regionName) {
    var regionDepts = groups[regionName];
    var deptNames = new Set(regionDepts.map(function (f) { return f.properties.name; }));

    // Find matching geometries in the topology
    var matchingGeoms = deptGeoms.filter(function (g) {
      return deptNames.has(g.properties.name);
    });

    var merged = merge(topo, matchingGeoms);
    var code = FRA_REGION_CODES[regionName] || regionName;

    return {
      type: "Feature",
      properties: {
        name: regionName,
        iso_3166_2: "FR-" + code,
        adm0_a3: "FRA"
      },
      geometry: merged
    };
  });

  return { type: "FeatureCollection", features: regionFeatures };
}

async function main() {
  console.log("Downloading Natural Earth data...\n");

  var admin1 = await fetchJSON(ADMIN1_URL);
  var subunits = await fetchJSON(SUBUNITS_URL);

  var sources = { admin1: admin1, subunits: subunits };

  for (var cfg of CONFIGS) {
    var geojson = sources[cfg.source];
    var filtered = geojson.features.filter(cfg.filter);

    var collection;
    if (cfg.postProcess === "mergeByRegion") {
      collection = mergeFrenchRegions(filtered);
      console.log(cfg.code + ": " + filtered.length + " departments -> " + collection.features.length + " regions");
    } else {
      collection = { type: "FeatureCollection", features: filtered };
      console.log(cfg.code + ": " + collection.features.length + " features");
    }

    var topo = topology({ [cfg.objectName]: collection });

    // Simplify to reduce file size
    topo = presimplify(topo);
    var minWeight = quantile(topo, 0.05);
    topo = simplify(topo, minWeight);

    var outPath = join(TOPO_DIR, cfg.file);
    writeFileSync(outPath, JSON.stringify(topo));
    var sizeKB = (JSON.stringify(topo).length / 1024).toFixed(1);
    console.log("  -> " + outPath + " (" + sizeKB + " KB)\n");
  }

  console.log("Done! Generated " + CONFIGS.length + " TopoJSON files.");
}

main().catch(function (err) {
  console.error(err);
  process.exit(1);
});
