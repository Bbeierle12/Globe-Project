/**
 * Extracts country border arcs from world-atlas countries-110m.json and
 * writes rust/globe_desktop/assets/borders.bin — a flat binary of f32
 * sphere XYZ triples for use as a LineList vertex buffer.
 *
 * Usage: node scripts/extract_borders.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const root  = join(__dir, '..');

// ── Load topology ─────────────────────────────────────────────────────────────
const topo = JSON.parse(readFileSync('/tmp/countries-110m.json', 'utf-8'));

const { scale, translate } = topo.transform;

// Decode a single quantized arc to [lon, lat] pairs.
function decodeArc(arc) {
  const pts = [];
  let x = 0, y = 0;
  for (const [dx, dy] of arc) {
    x += dx;
    y += dy;
    const lon = x * scale[0] + translate[0];
    const lat = y * scale[1] + translate[1];
    pts.push([lon, lat]);
  }
  return pts;
}

// Convert geographic lon/lat (degrees) to unit-sphere XYZ (Y-up, same as Rust).
function toXYZ(lon, lat) {
  const φ = lat  * Math.PI / 180;
  const λ = lon  * Math.PI / 180;
  return [
    Math.cos(φ) * Math.sin(λ),
    Math.sin(φ),
    Math.cos(φ) * Math.cos(λ),
  ];
}

// ── Decode all arcs ───────────────────────────────────────────────────────────
const decodedArcs = topo.arcs.map(decodeArc);

// ── Collect unique arcs used by country geometries ────────────────────────────
// We emit line segments (pairs of XYZ) for every consecutive point in each arc.
const floats = [];  // flat f32 array: x0,y0,z0, x1,y1,z1, ...

function processGeometry(geom) {
  const rings = geom.type === 'Polygon'
    ? geom.arcs
    : geom.type === 'MultiPolygon'
      ? geom.arcs.flat()
      : [];

  for (const ring of rings) {
    for (const arcIdx of ring) {
      const pts = arcIdx >= 0
        ? decodedArcs[arcIdx]
        : [...decodedArcs[~arcIdx]].reverse();

      for (let i = 0; i < pts.length - 1; i++) {
        const [ax, ay, az] = toXYZ(...pts[i]);
        const [bx, by, bz] = toXYZ(...pts[i + 1]);
        // Scale slightly above sphere surface to avoid z-fighting with globe.
        const s = 1.003;
        floats.push(ax*s, ay*s, az*s, bx*s, by*s, bz*s);
      }
    }
  }
}

for (const geom of topo.objects.countries.geometries) {
  processGeometry(geom);
}

// ── Write binary ──────────────────────────────────────────────────────────────
const outDir  = join(root, 'rust/globe_desktop/assets');
mkdirSync(outDir, { recursive: true });

const buf = Buffer.alloc(floats.length * 4);
for (let i = 0; i < floats.length; i++) buf.writeFloatLE(floats[i], i * 4);

writeFileSync(join(outDir, 'borders.bin'), buf);
console.log(`Wrote ${floats.length / 6} line segments → ${buf.length} bytes`);
