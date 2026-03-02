import { pClr } from "../../cesium/topoUtils.js";

function fmt(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return String(n);
}

var _colorCache = new Map();
function cachedClr(pop) {
  var cached = _colorCache.get(pop);
  if (cached) return cached;
  var rgb = pClr(pop);
  var str = "rgb(" + rgb[0] + "," + rgb[1] + "," + rgb[2] + ")";
  _colorCache.set(pop, str);
  return str;
}

function itemKey(d) {
  if (d.t === "county") return "county:" + d.fips;
  if (d.t === "s") return "s:" + d.parentIso + ":" + (d.fp || d.sc || d.n);
  if (d.t === "city") return "city:" + d.la + ":" + d.lo;
  return "c:" + d.iso;
}

function tier(p) {
  if (p >= 2e7) return { l: "Mega", c: "#e74c3c" };
  if (p >= 1e7) return { l: "Large", c: "#e67e22" };
  if (p >= 5e6) return { l: "Medium", c: "#b7950b" };
  if (p >= 1e6) return { l: "Small", c: "#16a085" };
  return { l: "Micro", c: "#2980b9" };
}

export { fmt, cachedClr, itemKey, tier };
