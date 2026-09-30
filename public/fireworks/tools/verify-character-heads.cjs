const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const W = 1024;
const H = 1536;
const BOX = [420, 48, 610, 260];
const root = path.resolve(__dirname, '..');
const finalDir = path.join(root, 'assets/glowgirls/sol/final');
const files = [
  'head-base-mask.png',
  'head-hana-front.png',
  'head-hana-rear.png',
  'head-jia-front.png',
  'head-jia-rear.png',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function alphaReport(data) {
  let count = 0;
  let outside = 0;
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] <= 8) continue;
    count++;
    if (x < BOX[0] || x > BOX[2] || y < BOX[1] || y > BOX[3]) outside++;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { count, outside, bounds: count ? [x0, y0, x1, y1] : null };
}

async function load(file) {
  const full = path.join(finalDir, file);
  assert(fs.existsSync(full), `Missing ${file}`);
  const image = sharp(full);
  const metadata = await image.metadata();
  assert(metadata.width === W && metadata.height === H, `${file} is not ${W}x${H}`);
  assert(metadata.hasAlpha && metadata.channels === 4, `${file} is not RGBA`);
  const data = await image.ensureAlpha().raw().toBuffer();
  return { file, data, report: alphaReport(data) };
}

function differentPixels(a, b) {
  let changed = 0;
  for (let y = BOX[1]; y <= BOX[3]; y++) for (let x = BOX[0]; x <= BOX[2]; x++) {
    const p = (y * W + x) * 4;
    let distance = 0;
    for (let c = 0; c < 4; c++) distance += Math.abs(a[p + c] - b[p + c]);
    if (distance > 48) changed++;
  }
  return changed;
}

async function main() {
  const loaded = new Map();
  for (const file of files) loaded.set(file, await load(file));

  for (const id of ['hana', 'jia']) {
    const front = loaded.get(`head-${id}-front.png`).report;
    const rear = loaded.get(`head-${id}-rear.png`).report;
    assert(front.count > 8000, `${id} head has too few visible pixels`);
    assert(front.outside === 0, `${id} head escapes the registered head envelope`);
    assert(front.bounds[1] === 63, `${id} crown must register at Y=63`);
    assert(rear.count === 0, `${id} rear layer must be transparent until rear hair is authored`);
  }
  const mask = loaded.get('head-base-mask.png').report;
  assert(mask.count > 8000 && mask.outside === 0, 'Head replacement mask is invalid');

  const distinct = differentPixels(
    loaded.get('head-hana-front.png').data,
    loaded.get('head-jia-front.png').data,
  );
  assert(distinct > 5000, 'Hana and Jia head paintings are not sufficiently distinct');

  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  for (const marker of ["head:'hana'", "head:'jia'", 'head-base-mask.png', 'head-hana-front.png', 'head-jia-front.png', 'function ggCharacterBase']) {
    assert(html.includes(marker), `index.html is missing ${marker}`);
  }
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]);
  for (const script of scripts) new Function(script);

  const baseUrl = process.argv[2];
  if (baseUrl) {
    for (const file of files) {
      const url = new URL(`assets/glowgirls/sol/final/${file}`, baseUrl).href;
      const response = await fetch(url);
      assert(response.ok, `${url} returned ${response.status}`);
      assert((await response.arrayBuffer()).byteLength > 0, `${url} was empty`);
    }
  }

  console.log(`PASS: 2 registered heads; 5 RGBA assets; ${distinct} distinct pixels; ${scripts.length} script block(s) parsed${baseUrl ? '; HTTP assets loaded' : ''}.`);
  for (const id of ['hana', 'jia']) {
    console.log(`${id}: ${JSON.stringify(loaded.get(`head-${id}-front.png`).report.bounds)}`);
  }
}

main().catch(error => {
  console.error(`FAIL: ${error.message}`);
  process.exitCode = 1;
});
