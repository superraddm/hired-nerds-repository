#!/usr/bin/env node
'use strict';
// Build an alpha-bounds manifest (layers.json) for the registered Glow Girls
// puppet layers. Every layer PNG is a transparent 1024x1536 canvas registered
// to master.png; the manifest records the padded tight bounds of alpha > 0
// pixels so the game can crop canvases at runtime. PNGs are never modified.
//
//   node tools/build-glowgirl-layers.cjs          # write layers.json
//   node tools/build-glowgirl-layers.cjs --check  # compare against existing, exit 1 on diff

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const SHARP_PATH = path.join(REPO_ROOT, 'hirednerds-chat', 'app', 'node_modules', 'sharp');
const SOL_DIR = path.join(REPO_ROOT, 'public', 'fireworks', 'assets', 'glowgirls', 'sol');
const FINAL_DIR = path.join(SOL_DIR, 'final');
const OUT_PATH = path.join(SOL_DIR, 'layers.json');
const W = 1024, H = 1536, PAD = 2;

if (!fs.existsSync(SHARP_PATH)) {
  console.error(`sharp not found at ${SHARP_PATH}\nInstall it in hirednerds-chat/app (npm install sharp) or adjust SHARP_PATH.`);
  process.exit(1);
}
const sharp = require(SHARP_PATH);

const CHECK = process.argv.includes('--check');

async function bounds(file) {
  const img = sharp(file);
  const meta = await img.metadata();
  if (meta.width !== W || meta.height !== H) {
    throw new Error(`${path.relative(REPO_ROOT, file)} is ${meta.width}x${meta.height}, expected ${W}x${H}`);
  }
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== W || info.height !== H || info.channels !== 4) {
    throw new Error(`${path.relative(REPO_ROOT, file)} decoded as ${info.width}x${info.height}x${info.channels}`);
  }
  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    const row = y * W * 4;
    for (let x = 0; x < W; x++) {
      if (data[row + x * 4 + 3] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { box: null, raw: null };
  const raw = { x0: minX, y0: minY, x1: maxX, y1: maxY };
  const x = Math.max(0, minX - PAD);
  const y = Math.max(0, minY - PAD);
  const x2 = Math.min(W - 1, maxX + PAD);
  const y2 = Math.min(H - 1, maxY + PAD);
  return { box: { x, y, w: x2 - x + 1, h: y2 - y + 1 }, raw };
}

function serialize(manifest) {
  const keys = Object.keys(manifest.layers).sort();
  const lines = keys.map((k) => `${JSON.stringify(k)}:${JSON.stringify(manifest.layers[k])}`);
  return `{"version":${manifest.version},"w":${manifest.w},"h":${manifest.h},"layers":{\n${lines.join(',\n')}\n}}\n`;
}

async function main() {
  if (!fs.existsSync(FINAL_DIR)) throw new Error(`missing ${FINAL_DIR}`);
  const files = [{ key: 'master', file: path.join(SOL_DIR, 'master.png') }];
  for (const name of fs.readdirSync(FINAL_DIR).sort()) {
    if (!/\.png$/i.test(name)) continue;
    files.push({ key: name.replace(/\.png$/i, ''), file: path.join(FINAL_DIR, name) });
  }
  if (!fs.existsSync(files[0].file)) throw new Error(`missing ${files[0].file}`);

  const layers = {};
  const rawBounds = {};
  for (const { key, file } of files) {
    if (key in layers) throw new Error(`duplicate layer key ${key}`);
    const { box, raw } = await bounds(file);
    layers[key] = box;
    rawBounds[key] = raw;
  }
  const sortedLayers = {};
  for (const k of Object.keys(layers).sort()) sortedLayers[k] = layers[k];
  const manifest = { version: 1, w: W, h: H, layers: sortedLayers };
  const text = serialize(manifest);

  // Summary
  const keys = Object.keys(sortedLayers);
  const empty = keys.filter((k) => sortedLayers[k] === null);
  const nonEmpty = keys.filter((k) => sortedLayers[k] !== null);
  const fullBytes = nonEmpty.length * W * H * 4;
  const cropBytes = nonEmpty.reduce((s, k) => s + sortedLayers[k].w * sortedLayers[k].h * 4, 0);
  const mib = (b) => (b / 1048576).toFixed(1);
  console.log(`Layers: ${keys.length} total, ${nonEmpty.length} non-empty, ${empty.length} empty`);
  console.log(`Full-canvas RGBA: ${mib(fullBytes)} MiB  ->  cropped RGBA: ${mib(cropBytes)} MiB  (${(100 * (1 - cropBytes / fullBytes)).toFixed(1)}% saving)`);
  console.log('Largest cropped layers:');
  nonEmpty
    .map((k) => ({ k, b: sortedLayers[k], area: sortedLayers[k].w * sortedLayers[k].h }))
    .sort((a, b) => b.area - a.area)
    .slice(0, 5)
    .forEach(({ k, b }) => console.log(`  ${k}: ${b.w}x${b.h} at (${b.x},${b.y})  ${mib(b.w * b.h * 4)} MiB`));
  console.log(`Empty layers (${empty.length}): ${empty.join(', ') || '(none)'}`);
  const edge = nonEmpty.filter((k) => {
    const r = rawBounds[k];
    return r.x0 === 0 || r.y0 === 0 || r.x1 === W - 1 || r.y1 === H - 1;
  });
  if (edge.length) {
    console.log(`Layers whose art touches the canvas edge (${edge.length}):`);
    for (const k of edge) {
      const r = rawBounds[k];
      const sides = [r.x0 === 0 && 'left', r.y0 === 0 && 'top', r.x1 === W - 1 && 'right', r.y1 === H - 1 && 'bottom'].filter(Boolean);
      console.log(`  ${k}: ${sides.join(',')}  raw bounds x ${r.x0}-${r.x1}, y ${r.y0}-${r.y1}`);
    }
  }

  if (CHECK) {
    if (!fs.existsSync(OUT_PATH)) {
      console.error(`--check: ${OUT_PATH} does not exist`);
      process.exit(1);
    }
    const existing = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'));
    const diffs = [];
    for (const f of ['version', 'w', 'h']) {
      if (existing[f] !== manifest[f]) diffs.push(`${f}: file has ${JSON.stringify(existing[f])}, computed ${JSON.stringify(manifest[f])}`);
    }
    const oldLayers = existing.layers || {};
    const allKeys = new Set([...Object.keys(oldLayers), ...keys]);
    for (const k of [...allKeys].sort()) {
      const a = JSON.stringify(oldLayers[k]);
      const b = JSON.stringify(sortedLayers[k]);
      if (!(k in oldLayers)) diffs.push(`${k}: missing from file, computed ${b}`);
      else if (!(k in sortedLayers)) diffs.push(`${k}: in file (${a}) but no PNG on disk`);
      else if (a !== b) diffs.push(`${k}: file ${a}, computed ${b}`);
    }
    if (fs.readFileSync(OUT_PATH, 'utf8') !== text && diffs.length === 0) {
      diffs.push('file text differs from canonical serialization (same data, different formatting)');
    }
    if (diffs.length) {
      console.error(`--check: ${diffs.length} difference(s):`);
      for (const d of diffs) console.error(`  ${d}`);
      process.exit(1);
    }
    console.log(`--check: ${path.relative(REPO_ROOT, OUT_PATH)} matches (${keys.length} layers)`);
  } else {
    fs.writeFileSync(OUT_PATH, text);
    console.log(`Wrote ${path.relative(REPO_ROOT, OUT_PATH)} (${keys.length} layers)`);
  }
}

main().catch((err) => {
  console.error(`build-glowgirl-layers: ${err.message}`);
  process.exit(1);
});
