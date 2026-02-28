import { ID_MAP } from "./idMap.js";
import { COUNTRIES } from "./countries.js";
import { SUB_CONFIGS, COUNTY_CONFIG, extractIso3166_2Suffix } from "../config/subdivisionConfig.js";

var ISO_MAP = {};
COUNTRIES.forEach(function(c) { ISO_MAP[c.iso] = c; });

var MP = 0;
COUNTRIES.forEach(function(c) { if (c.p > MP) MP = c.p; });

var WORLD_POP = 0;
COUNTRIES.forEach(function(c) { WORLD_POP += c.p; });

var RC = { South: "#e67e22", West: "#2e86c1", Midwest: "#27ae60", Northeast: "#8e44ad", Atlantic: "#1abc9c", Central: "#e74c3c", Prairies: "#d4ac0d", "West Coast": "#3498db", North: "#7f8c8d", "MX Central": "#e74c3c", "MX Northwest": "#2e86c1", "MX Northeast": "#e67e22", "MX West": "#27ae60", "MX South": "#8e44ad", "MX Southeast": "#1abc9c", "IN North": "#e67e22", "IN South": "#27ae60", "IN East": "#2e86c1", "IN West": "#e74c3c", "IN Central": "#d4ac0d", "IN Northeast": "#8e44ad", "CN North": "#e74c3c", "CN Northeast": "#2e86c1", "CN East": "#27ae60", "CN South Central": "#e67e22", "CN Southwest": "#8e44ad", "CN Northwest": "#d4ac0d", "BR Southeast": "#e74c3c", "BR South": "#2e86c1", "BR Northeast": "#e67e22", "BR North": "#27ae60", "BR Central-West": "#d4ac0d", "CO Andean": "#e74c3c", "CO Caribbean": "#2e86c1", "CO Pacific": "#27ae60", "CO Orinoco": "#e67e22", "CO Amazon": "#8e44ad", "PE Coast": "#e74c3c", "PE Sierra": "#27ae60", "PE Selva": "#2e86c1", "AR Pampa": "#e74c3c", "AR Patagonia": "#2e86c1", "AR Cuyo": "#e67e22", "AR Northwest": "#8e44ad", "AR Northeast": "#27ae60", "VE Central": "#e74c3c", "VE Western": "#2e86c1", "VE Eastern": "#e67e22", "VE Southern": "#27ae60", "VE Capital": "#8e44ad", "CL Norte Grande": "#e67e22", "CL Norte Chico": "#d4ac0d", "CL Central": "#e74c3c", "CL Sur": "#27ae60", "CL Austral": "#2e86c1", "EC Costa": "#2e86c1", "EC Sierra": "#e74c3c", "EC Oriente": "#27ae60", "EC Insular": "#d4ac0d", "BO Altiplano": "#e74c3c", "BO Valleys": "#27ae60", "BO Lowlands": "#2e86c1", "PY Eastern": "#e74c3c", "PY Western": "#2e86c1", "UY South": "#e74c3c", "UY Central": "#27ae60", "UY North": "#2e86c1", "GY Coastal": "#e74c3c", "GY Interior": "#27ae60", "SR Coastal": "#e74c3c", "SR Interior": "#27ae60", "GF Territory": "#8e44ad", "ID Java": "#e74c3c", "ID Sumatra": "#2e86c1", "ID Kalimantan": "#27ae60", "ID Sulawesi": "#e67e22", "ID Nusa Tenggara": "#d4ac0d", "ID Maluku": "#8e44ad", "ID Papua": "#1abc9c", "PK Punjab": "#e74c3c", "PK Sindh": "#2e86c1", "PK Northwest": "#27ae60", "PK Balochistan": "#e67e22", "NG North Central": "#e74c3c", "NG North East": "#2e86c1", "NG North West": "#e67e22", "NG South East": "#27ae60", "NG South South": "#8e44ad", "NG South West": "#d4ac0d", "BD Central": "#e74c3c", "BD West": "#2e86c1", "BD East": "#27ae60", "BD South": "#e67e22", "RU Central": "#e74c3c", "RU Northwest": "#2e86c1", "RU South": "#e67e22", "RU Caucasus": "#8e44ad", "RU Volga": "#27ae60", "RU Ural": "#d4ac0d", "RU Siberia": "#1abc9c", "RU Far East": "#3498db" };

var _countryByAlias = {};
COUNTRIES.forEach(function(c) {
  if (c.al) {
    c.al.forEach(function(a) { _countryByAlias[a.toLowerCase()] = c; });
  }
});

function findCountry(featureId) {
  var name = ID_MAP[String(featureId)];
  if (!name) return null;
  return _countryByAlias[name.toLowerCase()] || null;
}

export { COUNTRIES, ID_MAP, ISO_MAP, MP, WORLD_POP, RC, SUB_CONFIGS, COUNTY_CONFIG, findCountry, extractIso3166_2Suffix };
