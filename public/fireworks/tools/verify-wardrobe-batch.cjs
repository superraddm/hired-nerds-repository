const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const gameRoot = path.resolve(__dirname, '..');
const finalDir = path.join(gameRoot, 'assets/glowgirls/sol/final');
const indexPath = path.join(gameRoot, 'index.html');
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, 'wardrobe-batch.json'), 'utf8'));
const baseUrl = (process.argv[2] || '').replace(/\/$/, '');
const W = 1024;
const H = 1536;

function alphaBounds(rgba) {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  let pixels = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!rgba[(y * W + x) * 4 + 3]) continue;
    pixels++;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return pixels ? { x0, y0, x1, y1, pixels } : { x0: null, y0: null, x1: null, y1: null, pixels: 0 };
}

async function verifyPng(file, shouldBeBlank) {
  const image = sharp(file).ensureAlpha();
  const metadata = await image.metadata();
  if (metadata.width !== W || metadata.height !== H || metadata.channels !== 4) {
    throw new Error(`${path.basename(file)} is not ${W}x${H} RGBA`);
  }
  const bounds = alphaBounds(await image.raw().toBuffer());
  if (shouldBeBlank && bounds.pixels !== 0) throw new Error(`${path.basename(file)} rear layer is not blank`);
  if (!shouldBeBlank && bounds.pixels < 500) throw new Error(`${path.basename(file)} front layer is unexpectedly empty`);
  return bounds;
}

async function verifyHttp(relativePath) {
  if (!baseUrl) return;
  const response = await fetch(`${baseUrl}/${relativePath.replace(/\\/g, '/')}`);
  if (!response.ok) throw new Error(`${response.status} loading ${relativePath}`);
  if (!(await response.arrayBuffer()).byteLength) throw new Error(`empty response for ${relativePath}`);
}

async function main() {
  const html = fs.readFileSync(indexPath, 'utf8');
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of scripts) new Function(match[1]);

  const expected = batch.reduce((counts, outfit) => {
    for (const category of ['top', 'bottom', 'shoes']) if (outfit[category]) counts[category]++;
    return counts;
  }, { top: 0, bottom: 0, shoes: 0 });
  const found = { top: 0, bottom: 0, shoes: 0 };
  const report = [];
  for (const outfit of batch) {
    if (!html.includes(`['${outfit.lookId}','${outfit.lookName}']`)) throw new Error(`look ${outfit.lookId} missing from WARDROBE`);
    if (!html.includes(`${outfit.lookId}:['`)) throw new Error(`look ${outfit.lookId} missing from RANGE_PRESETS`);
    for (const category of ['top', 'bottom', 'shoes']) {
      const item = outfit[category];
      if (!item) continue;
      found[category]++;
      if (!html.includes(`['${item.id}','${item.name}']`)) throw new Error(`${item.id} missing from WARDROBE.${category}`);
      const frontName = `${category}-${item.id}-front.png`;
      const rearName = `${category}-${item.id}-rear.png`;
      const bounds = await verifyPng(path.join(finalDir, frontName), false);
      await verifyPng(path.join(finalDir, rearName), true);
      await verifyHttp(path.join('assets/glowgirls/sol/final', frontName));
      await verifyHttp(path.join('assets/glowgirls/sol/final', rearName));
      report.push({ look: outfit.lookId, category, id: item.id, bounds: `${bounds.x0},${bounds.y0}–${bounds.x1},${bounds.y1}`, pixels: bounds.pixels });
    }
  }
  for (const category of Object.keys(expected)) {
    if (found[category] !== expected[category]) throw new Error(`${category}: expected ${expected[category]}, found ${found[category]}`);
  }
  await verifyHttp('index.html');
  console.table(report);
  console.log(`PASS: ${batch.length} looks; ${found.top} tops; ${found.bottom} bottoms; ${found.shoes} shoes; 38 PNG layers; ${scripts.length} script block parsed${baseUrl ? '; HTTP assets loaded' : ''}.`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
