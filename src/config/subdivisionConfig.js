/**
 * Subdivision and county configuration.
 * Extracted from src/data/index.js per Phase 0.
 *
 * Each SUB_CONFIGS entry defines how to fetch, decode, and map a country's
 * administrative subdivisions from TopoJSON sources.
 */

function extractIso3166_2Suffix(f) {
  var code = f.properties && f.properties.iso_3166_2;
  if (!code) return null;
  var parts = code.split("-");
  return parts.length > 1 ? parts[1] : code;
}

var SUB_CONFIGS = [
  {
    iso: "USA",
    url: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
    objectName: "states",
    codeField: "fp",
    extractCode: function(f) { return String(f.id).padStart(2, "0"); },
    skipName: "United States of America"
  },
  {
    iso: "CAN",
    url: "https://gist.githubusercontent.com/Brideau/2391df60938462571ca9/raw/f5a1f3b47ff671eaf2fb7e7b798bacfc6962606a/canadaprovtopo.json",
    objectName: "canadaprov",
    codeField: "pc",
    extractCode: function(f) { return (f.properties && f.properties.id) || f.id || null; },
    skipName: "Canada"
  },
  {
    iso: "MEX",
    url: "https://gist.githubusercontent.com/diegovalle/5129746/raw/c1c35e439b1d5e688bca20b79f0e53a1fc12bf9e/mx_tj.json",
    objectName: "states",
    codeField: "sc",
    extractCode: function(f) {
      return f.properties && f.properties.state_code != null
        ? String(f.properties.state_code).padStart(2, "0") : null;
    },
    skipName: "Mexico"
  },
  {
    iso: "IND",
    url: "https://cdn.jsdelivr.net/gh/udit-001/india-maps-data@ef25ebc/topojson/india.json",
    objectName: "states",
    codeField: "sc",
    extractCode: function(f) {
      return f.properties && f.properties.st_code != null
        ? String(f.properties.st_code).padStart(2, "0") : null;
    },
    skipName: "India"
  },
  {
    iso: "CHN",
    url: "https://cdn.jsdelivr.net/npm/cn-atlas@0.1.2/cn-atlas.json",
    objectName: "provinces",
    codeField: "sc",
    extractCode: function(f) { return String(f.properties.id || f.id || "").substring(0, 2); },
    skipFeature: function(f) {
      var code = String(f.properties.id || f.id || "").substring(0, 2);
      return code === "71";
    },
    skipName: "China"
  },
  { iso: "BRA", url: "/topo/br-states.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Brazil" },
  { iso: "COL", url: "/topo/co-departments.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Colombia" },
  { iso: "PER", url: "/topo/pe-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Peru" },
  { iso: "ARG", url: "/topo/ar-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Argentina" },
  { iso: "VEN", url: "/topo/ve-states.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Venezuela" },
  { iso: "CHL", url: "/topo/cl-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Chile" },
  { iso: "ECU", url: "/topo/ec-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Ecuador" },
  { iso: "BOL", url: "/topo/bo-departments.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Bolivia" },
  { iso: "PRY", url: "/topo/py-departments.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Paraguay" },
  { iso: "URY", url: "/topo/uy-departments.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Uruguay" },
  { iso: "GUY", url: "/topo/gy-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Guyana" },
  { iso: "SUR", url: "/topo/sr-districts.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Suriname" },
  { iso: "GUF", url: "/topo/gf-territory.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "French Guiana" },
  { iso: "IDN", url: "/topo/id-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Indonesia" },
  { iso: "PAK", url: "/topo/pk-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Pakistan" },
  { iso: "NGA", url: "/topo/ng-states.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Nigeria" },
  { iso: "BGD", url: "/topo/bd-divisions.json", objectName: "bd_divisions", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Bangladesh" },
  { iso: "RUS", url: "/topo/ru-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Russia" },
  { iso: "DEU", url: "/topo/de-states.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Germany" },
  { iso: "FRA", url: "/topo/fr-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "France" },
  { iso: "AUS", url: "/topo/au-states.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Australia" },
  { iso: "JPN", url: "/topo/jp-prefectures.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Japan" },
  {
    iso: "GBR",
    url: "/topo/gb-countries.json",
    objectName: "ne_10m_admin_0_map_subunits",
    codeField: "sc",
    extractCode: function(f) {
      var nameMap = { "England": "ENG", "Scotland": "SCT", "Wales": "WLS", "N. Ireland": "NIR" };
      var name = f.properties && f.properties.NAME;
      return nameMap[name] || null;
    },
    skipName: "United Kingdom"
  },
  { iso: "KOR", url: "/topo/kr-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "South Korea" },
  { iso: "ETH", url: "/topo/et-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Ethiopia" },
  { iso: "EGY", url: "/topo/eg-governorates.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Egypt" },
  { iso: "PHL", url: "/topo/ph-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Philippines" },
  { iso: "COD", url: "/topo/cd-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "DR Congo" },
  { iso: "VNM", url: "/topo/vn-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Vietnam" },
  { iso: "IRN", url: "/topo/ir-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Iran" },
  { iso: "TUR", url: "/topo/tr-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Turkey" },
  { iso: "TZA", url: "/topo/tz-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Tanzania" },
  { iso: "THA", url: "/topo/th-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Thailand" },
  { iso: "ZAF", url: "/topo/za-provinces.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "South Africa" },
  { iso: "ITA", url: "/topo/it-regions.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Italy" },
  { iso: "KEN", url: "/topo/ke-counties.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Kenya" },
  { iso: "MMR", url: "/topo/mm-states.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Myanmar" },
  { iso: "ESP", url: "/topo/es-communities.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Spain" },
  { iso: "POL", url: "/topo/pl-voivodeships.json", objectName: "ne_10m_admin_1_states_provinces", codeField: "sc", extractCode: extractIso3166_2Suffix, skipName: "Poland" }
];

var COUNTY_CONFIG = {
  topoUrl: "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
  objectName: "counties",
  extractCode: function(f) { return String(f.id); },
  extractStateFips: function(f) { return String(f.id).substring(0, 2); }
};

export { SUB_CONFIGS, COUNTY_CONFIG, extractIso3166_2Suffix };
