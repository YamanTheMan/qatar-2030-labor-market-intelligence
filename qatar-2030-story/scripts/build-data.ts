/**
 * npm run build:data
 * Reads every CSV in data/, writes typed JSON to src/data/ and copies the raw
 * CSVs to public/data/ so readers can download the originals. Also copies the
 * map worker to public/vendor/.
 */
import fs from "node:fs";
import path from "node:path";
import { build } from "./pipeline";

const root = process.cwd();
const dataDir = path.join(root, "data");
const outDir = path.join(root, "src", "data");
const publicDir = path.join(root, "public", "data");

const t0 = Date.now();
const out = build(dataDir);

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });

const files: Record<string, unknown> = {
  "gaps.json": out.gaps,
  "signals.json": out.signals,
  "sources.json": out.sources,
  "weights.json": out.weights,
  "coefficients.json": out.coefficients,
  "postings.json": out.postings,
  "summary.json": out.summary,
};
for (const [name, value] of Object.entries(files)) {
  fs.writeFileSync(path.join(outDir, name), JSON.stringify(value) + "\n");
}

for (const f of fs.readdirSync(dataDir).filter((f) => f.endsWith(".csv"))) {
  fs.copyFileSync(path.join(dataDir, f), path.join(publicDir, f));
}

// The map library runs its tile parsing in a web worker that must be served from our own origin.
const workerSrc = path.join(root, "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const vendorDir = path.join(root, "public", "vendor");
if (fs.existsSync(workerSrc)) {
  fs.mkdirSync(vendorDir, { recursive: true });
  fs.copyFileSync(workerSrc, path.join(vendorDir, "maplibre-gl-worker.mjs"));
} else {
  console.warn("build:data ! maplibre-gl worker not found; run npm install");
}

const c = out.summary.counts;
console.log(
  `build:data ✓ ${c.rows} rows · ${c.shortfalls} shortfalls · ${c.sourceRecords} sources · ${c.signals} signals · ${c.postingsClassified} postings  (${Date.now() - t0} ms)`,
);
