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

// Italian region names to ISO 3166-2:IT codes
var ITA_REGION_CODES = {
  "Piemonte": "21", "Valle d'Aosta": "23", "Lombardia": "25", "Trentino-Alto Adige": "32",
  "Veneto": "34", "Friuli-Venezia Giulia": "36", "Liguria": "42", "Emilia-Romagna": "45",
  "Toscana": "52", "Umbria": "55", "Marche": "57", "Lazio": "62",
  "Abruzzo": "65", "Molise": "67", "Campania": "72", "Apulia": "75",
  "Basilicata": "77", "Calabria": "78", "Sicily": "82", "Sardegna": "88"
};

// Spanish autonomous community names to ISO 3166-2:ES codes
var ESP_REGION_CODES = {
  "Andalucía": "AN", "Aragón": "AR", "Asturias": "AS", "Islas Baleares": "IB",
  "Canary Is.": "CN", "Cantabria": "CB", "Castilla y León": "CL",
  "Castilla-La Mancha": "CM", "Cataluña": "CT", "Valenciana": "VC",
  "Extremadura": "EX", "Galicia": "GA", "Madrid": "MD", "Murcia": "MC",
  "Foral de Navarra": "NC", "País Vasco": "PV", "La Rioja": "RI",
  "Ceuta": "CE", "Melilla": "ML"
};

// Philippine region names to short codes
var PHL_REGION_CODES = {
  "National Capital Region": "NCR",
  "Cordillera Administrative Region (CAR)": "CAR",
  "Ilocos (Region I)": "01", "Cagayan Valley (Region II)": "02",
  "Central Luzon (Region III)": "03", "CALABARZON (Region IV-A)": "4A",
  "MIMAROPA (Region IV-B)": "4B", "Bicol (Region V)": "05",
  "Western Visayas (Region VI)": "06", "Central Visayas (Region VII)": "07",
  "Eastern Visayas (Region VIII)": "08", "Zamboanga Peninsula (Region IX)": "09",
  "Northern Mindanao (Region X)": "10", "Davao (Region XI)": "11",
  "SOCCSKSARGEN (Region XII)": "12", "Dinagat Islands (Region XIII)": "13",
  "Autonomous Region in Muslim Mindanao (ARMM)": "ARMM"
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
    filter: function (f) {
      return f.properties.adm0_a3 === "FRA" && f.properties.type_en === "Metropolitan department";
    },
    postProcess: "mergeByRegion",
    regionCodeMap: FRA_REGION_CODES,
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
  {
    code: "ETH",
    file: "et-regions.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "ETH"; },
  },
  {
    code: "EGY",
    file: "eg-governorates.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "EGY"; },
  },
  {
    code: "PHL",
    file: "ph-regions.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "PHL"; },
    postProcess: "mergeByRegion",
    regionCodeMap: PHL_REGION_CODES,
  },
  {
    code: "COD",
    file: "cd-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "COD"; },
  },
  {
    code: "VNM",
    file: "vn-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "VNM"; },
  },
  {
    code: "IRN",
    file: "ir-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "IRN"; },
  },
  {
    code: "TUR",
    file: "tr-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "TUR"; },
  },
  {
    code: "TZA",
    file: "tz-regions.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "TZA"; },
  },
  {
    code: "THA",
    file: "th-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "THA"; },
  },
  {
    code: "ZAF",
    file: "za-provinces.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "ZAF"; },
  },
  {
    code: "ITA",
    file: "it-regions.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "ITA"; },
    postProcess: "mergeByRegion",
    regionCodeMap: ITA_REGION_CODES,
  },
  {
    code: "KEN",
    file: "ke-counties.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "KEN"; },
  },
  {
    code: "MMR",
    file: "mm-states.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "MMR"; },
  },
  {
    code: "ESP",
    file: "es-communities.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "ESP"; },
    postProcess: "mergeByRegion",
    regionCodeMap: ESP_REGION_CODES,
  },
  {
    code: "POL",
    file: "pl-voivodeships.json",
    objectName: "ne_10m_admin_1_states_provinces",
    source: "admin1",
    filter: function (f) { return f.properties.adm0_a3 === "POL"; },
  },
];

async function fetchJSON(url) {
  console.log("  Fetching " + url.split("/").pop() + " ...");
  var res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status + " for " + url);
  return res.json();
}

/**
 * Generic merge of sub-features by their "region" property.
 * Returns a new GeoJSON FeatureCollection with merged region features.
 * Used for France (departments→regions), Italy (provinces→regions),
 * Spain (provinces→communities), Philippines (provinces→regions).
 */
function mergeByRegionField(features, countryCode, regionCodeMap) {
  // Group features by region name
  var groups = {};
  features.forEach(function (f) {
    var rg = f.properties.region;
    if (!rg) return;
    if (groups[rg] === undefined) groups[rg] = [];
    groups[rg].push(f);
  });

  // Build a topology from all features first
  var collection = { type: "FeatureCollection", features: features };
  var topo = topology({ parts: collection });
  var partGeoms = topo.objects.parts.geometries;

  // For each region, merge geometries
  var regionFeatures = Object.keys(groups).map(function (regionName) {
    var regionParts = groups[regionName];
    var partNames = new Set(regionParts.map(function (f) { return f.properties.name; }));

    var matchingGeoms = partGeoms.filter(function (g) {
      return partNames.has(g.properties.name);
    });

    var merged = merge(topo, matchingGeoms);
    var code = (regionCodeMap && regionCodeMap[regionName]) || regionName;
    var isoPrefix = countryCode.substring(0, 2).toUpperCase();

    return {
      type: "Feature",
      properties: {
        name: regionName,
        iso_3166_2: isoPrefix + "-" + code,
        adm0_a3: countryCode
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
      collection = mergeByRegionField(filtered, cfg.code, cfg.regionCodeMap);
      console.log(cfg.code + ": " + filtered.length + " features -> " + collection.features.length + " regions");
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
