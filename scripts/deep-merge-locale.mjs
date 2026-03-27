#!/usr/bin/env node
/**
 * Deep-merge a patch JSON into a locale file (objects merge recursively; arrays replaced).
 * Usage: node scripts/deep-merge-locale.mjs <base.json> <patch.json>
 */
import fs from "node:fs";
import path from "node:path";

function deepMerge(base, patch) {
  if (patch === null || patch === undefined) return base;
  if (typeof patch !== "object" || Array.isArray(patch)) return patch;
  if (typeof base !== "object" || base === null || Array.isArray(base)) return patch;
  const out = { ...base };
  for (const k of Object.keys(patch)) {
    const pv = patch[k];
    const bv = base[k];
    if (
      bv !== undefined &&
      typeof bv === "object" &&
      !Array.isArray(bv) &&
      typeof pv === "object" &&
      pv !== null &&
      !Array.isArray(pv)
    ) {
      out[k] = deepMerge(bv, pv);
    } else {
      out[k] = pv;
    }
  }
  return out;
}

const basePath = path.resolve(process.argv[2] || "");
const patchPath = path.resolve(process.argv[3] || "");
if (!basePath || !patchPath) {
  console.error("Usage: node scripts/deep-merge-locale.mjs <base.json> <patch.json>");
  process.exit(1);
}

const base = JSON.parse(fs.readFileSync(basePath, "utf8"));
const patch = JSON.parse(fs.readFileSync(patchPath, "utf8"));
const merged = deepMerge(base, patch);
fs.writeFileSync(basePath, `${JSON.stringify(merged, null, 2)}\n`);
