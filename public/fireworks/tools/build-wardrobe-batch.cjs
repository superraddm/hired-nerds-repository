const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const root = path.resolve(__dirname, '../assets/glowgirls/sol');
const sourceDir = path.join(root, 'patch-sources');
const finalDir = path.join(root, 'final');
const masterPath = path.join(root, 'master.png');
const batch = JSON.parse(fs.readFileSync(path.join(__dirname, 'wardrobe-batch.json'), 'utf8'));
const W = 1024;
const H = 1536;

const regions = {
  top: { rect: [235, 190, 735, 735], minComponent: 18 },
  bottom: { rect: [260, 450, 765, 1475], minComponent: 18 },
  shoes: { rect: [285, 1140, 750, 1485], minComponent: 18 },
};

function isBackdrop(r, g, b) {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  // Image generation can flatten the transparency grid into near-neutral pixels.
  // Use a deliberately broad neutral-white test; enclosed white garment panels are
  // restored by the category silhouette pass below.
  return (r + g + b) / 3 > 216 && hi - lo < 32;
}

function buildBackdropMask(source) {
  const corner = (source[0] + source[1] + source[2]) / 3;
  const dark = corner < 96;
  const candidate = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const i = p * 3;
    const r = source[i];
    const g = source[i + 1];
    const b = source[i + 2];
    const hi = Math.max(r, g, b);
    const lo = Math.min(r, g, b);
    candidate[p] = dark
      ? ((r + g + b) / 3 < 3 && hi - lo < 3)
      : isBackdrop(r, g, b);
  }

  // Only remove candidate pixels connected to the canvas edge. This protects
  // light or dark fabric panels whose colours happen to resemble the backdrop.
  const reached = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let head = 0;
  let tail = 0;
  const push = p => {
    if (p < 0 || p >= candidate.length || reached[p] || !candidate[p]) return;
    reached[p] = 1;
    queue[tail++] = p;
  };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (head < tail) {
    const p = queue[head++];
    const x = p % W;
    if (x > 0) push(p - 1);
    if (x < W - 1) push(p + 1);
    if (p >= W) push(p - W);
    if (p < W * (H - 1)) push(p + W);
  }
  return { mask: reached, dark };
}

function isSkin(r, g, b) {
  return r > 132 && r - g > 4 && g - b > 3 && r - b > 20;
}

function isMasterBase(r, g, b, a) {
  return a > 20 && (r + g + b) / 3 < 82;
}

function isSameSkin(source, si, master, mi) {
  if (master[mi + 3] < 20) return false;
  if (!isSkin(master[mi], master[mi + 1], master[mi + 2])) return false;
  if (!isSkin(source[si], source[si + 1], source[si + 2])) return false;
  const dr = master[mi] - source[si];
  const dg = master[mi + 1] - source[si + 1];
  const db = master[mi + 2] - source[si + 2];
  return dr * dr + dg * dg + db * db < 1900;
}

function inside(rect, x, y) {
  return x >= rect[0] && x <= rect[2] && y >= rect[1] && y <= rect[3];
}

function categoryAllowed(category, itemId, x, y) {
  if (category === 'top') {
    if (itemId === 'orbitcape') {
      return (x >= 235 && x <= 700 && y >= 190 && y <= 575)
        || (x >= 605 && x <= 720 && y >= 250 && y <= 720);
    }
    return x >= 330 && x <= 700 && y >= 200 && y <= 475;
  }
  if (category === 'bottom') {
    if (itemId === 'orbitflares') {
      return y >= 475 && y <= 1475
        && (y <= 760 ? x >= 355 && x <= 670 : x >= 260 && x <= 765);
    }
    if (itemId === 'pixelpetals') return x >= 260 && x <= 765 && y >= 475 && y <= 960;
    if (itemId === 'cometbubble') return x >= 340 && x <= 735 && y >= 475 && y <= 1030;
    if (itemId === 'ribbonfringe') return x >= 335 && x <= 695 && y >= 475 && y <= 860;
    if (itemId === 'flareskort') return x >= 340 && x <= 690 && y >= 475 && y <= 760;
    return x >= 315 && x <= 715 && y >= 475 && y <= 805;
  }
  return x >= 285 && x <= 750 && y >= 1140 && y <= 1485;
}

function keepLargeComponents(mask, width, height, minSize) {
  const seen = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  const stack = [];
  const component = [];
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || seen[start]) continue;
    stack.push(start);
    seen[start] = 1;
    component.length = 0;
    while (stack.length) {
      const p = stack.pop();
      component.push(p);
      const x = p % width;
      const y = (p / width) | 0;
      for (const q of [p - 1, p + 1, p - width, p + width]) {
        if (q < 0 || q >= mask.length || seen[q] || !mask[q]) continue;
        const qx = q % width;
        const qy = (q / width) | 0;
        if (Math.abs(qx - x) + Math.abs(qy - y) !== 1) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    if (component.length >= minSize) for (const p of component) out[p] = 1;
  }
  return out;
}

function dilate(mask, width, height, radius = 1) {
  const out = new Uint8Array(mask);
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const p = y * width + x;
    if (!mask[p]) continue;
    for (let dy = -radius; dy <= radius; dy++) for (let dx = -radius; dx <= radius; dx++) {
      out[(y + dy) * width + x + dx] = 1;
    }
  }
  return out;
}

function garmentSeedMask(source, master, backdrop, darkBackdrop, rect, category, itemId, shiftX, shiftY) {
  const mask = new Uint8Array(W * H);
  for (let y = rect[1]; y <= rect[3]; y++) for (let x = rect[0]; x <= rect[2]; x++) {
    if (!categoryAllowed(category, itemId, x, y)) continue;
    const si = (y * W + x) * 3;
    const mx = Math.max(0, Math.min(W - 1, x + shiftX));
    const my = Math.max(0, Math.min(H - 1, y + shiftY));
    const mi = (my * W + mx) * 4;
    const masterBase = category !== 'shoes'
      && isMasterBase(master[mi], master[mi + 1], master[mi + 2], master[mi + 3]);
    const unchangedSkin = !darkBackdrop
      && category !== 'shoes'
      && !masterBase
      && (itemId === 'flareskort'
        ? isSameSkin(source, si, master, mi)
        : isSkin(source[si], source[si + 1], source[si + 2]));
    if (masterBase || (!backdrop[y * W + x]
      && !unchangedSkin)) mask[y * W + x] = 1;
  }
  return keepLargeComponents(mask, W, H, 8);
}

function fillRange(mask, y, x0, x1) {
  for (let x = Math.max(0, Math.round(x0)); x <= Math.min(W - 1, Math.round(x1)); x++) {
    mask[y * W + x] = 1;
  }
}

function fillCentralSilhouette(mask, category, itemId) {
  const bottomEnd = {
    relaypleats: 725,
    voltagewrap: 705,
    flareskort: 690,
    ribbonfringe: 690,
  }[itemId] || 720;
  const def = category === 'top'
    ? { y0: 210, y1: 470, x0: 370, x1: 655, minSpan: 14 }
    : { y0: 475, y1: bottomEnd, x0: 325, x1: 705, minSpan: 18 };
  for (let y = def.y0; y <= def.y1; y++) {
    let left = def.x1;
    let right = def.x0;
    let count = 0;
    for (let x = def.x0; x <= def.x1; x++) {
      if (!mask[y * W + x]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      count++;
    }
    if (count >= def.minSpan && right - left >= def.minSpan) fillRange(mask, y, left, right);
  }
}

function fillRightSidePanel(mask) {
  // Mint Comet's translucent comet tail contains a flattened checker pattern.
  // Its tinted outline is reliable, so close each outlined row before recoloring
  // neutral checker pixels during output.
  for (let y = 515; y <= 885; y++) {
    let left = 725;
    let right = 590;
    let count = 0;
    for (let x = 590; x <= 725; x++) {
      if (!mask[y * W + x]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      count++;
    }
    if (count >= 3 && right - left >= 3) fillRange(mask, y, left, right);
  }
}

function fillShoeSilhouettes(mask, backdrop) {
  for (let y = 1160; y <= 1455; y++) {
    for (const [lo, hi] of [[300, 505], [515, 735]]) {
      let x0 = hi;
      let x1 = lo;
      for (let x = lo; x <= hi; x++) {
        if (!backdrop[y * W + x]) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
        }
      }
      if (x1 > x0 + 8) fillRange(mask, y, x0 - 1, x1 + 1);
    }
  }
}

function alignmentScore(source, master, shiftX, shiftY) {
  const sampleRects = [
    [448, 60, 580, 225],
    [300, 300, 405, 770],
    [620, 300, 725, 770],
    [365, 790, 465, 1160],
    [560, 790, 660, 1160],
  ];
  let total = 0;
  let count = 0;
  for (const rect of sampleRects) for (let y = rect[1]; y <= rect[3]; y += 3) for (let x = rect[0]; x <= rect[2]; x += 3) {
    const mi = (y * W + x) * 4;
    if (!isSkin(master[mi], master[mi + 1], master[mi + 2])) continue;
    const sx = x - shiftX;
    const sy = y - shiftY;
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
    const si = (sy * W + sx) * 3;
    if (!isSkin(source[si], source[si + 1], source[si + 2])) {
      total += 18000;
    } else {
      const dr = master[mi] - source[si];
      const dg = master[mi + 1] - source[si + 1];
      const db = master[mi + 2] - source[si + 2];
      total += dr * dr + dg * dg + db * db;
    }
    count++;
  }
  return count ? total / count : Number.POSITIVE_INFINITY;
}

function detectAlignment(source, master) {
  let best = { x: 0, y: 0, score: Number.POSITIVE_INFINITY };
  for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
    const score = alignmentScore(source, master, x, y);
    if (score < best.score) best = { x, y, score };
  }
  return best;
}

async function writeBlank(file) {
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png().toFile(file);
}

async function extractCategory(source, master, backdropInfo, category, item, shiftX, shiftY) {
  const def = regions[category];
  const backdrop = backdropInfo.mask;
  let mask = garmentSeedMask(source, master, backdrop, backdropInfo.dark, def.rect, category, item.id, shiftX, shiftY);
  if (!backdropInfo.dark && (category === 'top' || category === 'bottom')
    && !(category === 'bottom' && item.id === 'flareskort')) {
    fillCentralSilhouette(mask, category, item.id);
  }
  if (!backdropInfo.dark && item.id === 'cometbubble') fillRightSidePanel(mask);
  if (!backdropInfo.dark && category === 'shoes') fillShoeSilhouettes(mask, backdrop);

  for (let y = def.rect[1]; y <= def.rect[3]; y++) for (let x = def.rect[0]; x <= def.rect[2]; x++) {
    if (!categoryAllowed(category, item.id, x, y)) {
      mask[y * W + x] = 0;
      continue;
    }
    const i = (y * W + x) * 3;
    const mx = Math.max(0, Math.min(W - 1, x + shiftX));
    const my = Math.max(0, Math.min(H - 1, y + shiftY));
    const mi = (my * W + mx) * 4;
    const r = source[i];
    const g = source[i + 1];
    const b = source[i + 2];
    const revealedSkin = category !== 'shoes' && isSkin(r, g, b)
      && isMasterBase(master[mi], master[mi + 1], master[mi + 2], master[mi + 3]);
    if (item.id === 'orbitflares' && y >= 1360 && isSkin(r, g, b)) {
      mask[y * W + x] = 0;
      continue;
    }
    if (!backdropInfo.dark && category !== 'shoes'
      && isSameSkin(source, i, master, mi) && !revealedSkin) {
      mask[y * W + x] = 0;
      continue;
    }
    if (revealedSkin) mask[y * W + x] = 1;
    if (category !== 'shoes' && isMasterBase(master[mi], master[mi + 1], master[mi + 2], master[mi + 3])) {
      mask[y * W + x] = 1;
    }
  }
  mask = keepLargeComponents(mask, W, H, def.minComponent);

  const rgba = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const sx = x - shiftX;
    const sy = y - shiftY;
    if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
    const sp = sy * W + sx;
    if (!mask[sp]) continue;
    const si = sp * 3;
    const di = (y * W + x) * 4;
    if (item.id === 'cometbubble' && x >= 590 && y >= 515 && backdrop[sp]) {
      rgba[di] = 190;
      rgba[di + 1] = 235;
      rgba[di + 2] = 235;
      rgba[di + 3] = 190;
    } else if (backdrop[sp]) {
      rgba[di] = backdropInfo.dark ? 34 : 247;
      rgba[di + 1] = backdropInfo.dark ? 42 : 247;
      rgba[di + 2] = backdropInfo.dark ? 72 : 249;
      rgba[di + 3] = 255;
    } else {
      rgba[di] = source[si];
      rgba[di + 1] = source[si + 1];
      rgba[di + 2] = source[si + 2];
      rgba[di + 3] = 255;
    }
  }

  const front = path.join(finalDir, `${category}-${item.id}-front.png`);
  const rear = path.join(finalDir, `${category}-${item.id}-rear.png`);
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toFile(front);
  await writeBlank(rear);
  return { front, rear };
}

async function makePreview(master, outfit, layers) {
  const rgba = Buffer.from(master);
  if (outfit.shoes) {
    for (let y = 1240; y < H; y++) for (let x = 0; x < W; x++) rgba[(y * W + x) * 4 + 3] = 0;
  }
  const composites = [];
  if (layers.bottom) composites.push({ input: layers.bottom.front });
  if (layers.top) composites.push({ input: layers.top.front });
  if (layers.shoes) composites.push({ input: layers.shoes.front });
  const preview = path.join(sourceDir, `outfit-${outfit.lookName.toLowerCase().replace(/[^a-z0-9]+/g, '')}-game-preview.png`);
  await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).composite(composites).png().toFile(preview);
  return preview;
}

async function makeContactSheet(previews) {
  const columns = Math.min(4, previews.length);
  const rows = Math.ceil(previews.length / columns);
  const composites = [];
  for (let i = 0; i < previews.length; i++) {
    composites.push({
      input: await sharp(previews[i]).resize(256, 384, { fit: 'fill' }).png().toBuffer(),
      left: (i % columns) * 256,
      top: Math.floor(i / columns) * 384,
    });
  }
  const output = path.join(sourceDir, 'wardrobe-batch-game-preview.png');
  await sharp({ create: { width: columns * 256, height: rows * 384, channels: 4, background: { r: 20, g: 16, b: 31, alpha: 1 } } })
    .composite(composites).png().toFile(output);
  return output;
}

async function main() {
  const selected = new Set(process.argv.slice(2));
  const master = await sharp(masterPath).ensureAlpha().raw().toBuffer();
  fs.mkdirSync(finalDir, { recursive: true });
  const loadedSources = new Map();
  const previews = [];

  async function loadSource(sourceName) {
    if (loadedSources.has(sourceName)) return loadedSources.get(sourceName);
    const sourcePath = path.join(sourceDir, sourceName);
    if (!fs.existsSync(sourcePath)) throw new Error(`${sourceName} not generated yet`);
    const metadata = await sharp(sourcePath).metadata();
    const deltaW = Math.abs(metadata.width - W);
    const deltaH = Math.abs(metadata.height - H);
    if (deltaW > 2 || deltaH > 2) throw new Error(`${sourceName} must be within 2px of ${W}x${H}`);
    const sourceImage = sharp(sourcePath);
    if (metadata.width !== W || metadata.height !== H) {
      sourceImage.resize(W, H, { fit: 'fill', kernel: sharp.kernel.lanczos3 });
      console.log(`normalize ${sourceName}: ${metadata.width}x${metadata.height} -> ${W}x${H}`);
    }
    const source = await sourceImage.removeAlpha().raw().toBuffer();
    const loaded = { source, backdrop: buildBackdropMask(source), alignment: detectAlignment(source, master) };
    loadedSources.set(sourceName, loaded);
    return loaded;
  }

  for (const outfit of batch) {
    if (selected.size && !selected.has(outfit.lookId) && !selected.has(outfit.lookName.toLowerCase().replace(/[^a-z0-9]+/g, ''))) continue;
    if (!fs.existsSync(path.join(sourceDir, outfit.source))) {
      console.log(`skip ${outfit.lookId} ${outfit.lookName}: ${outfit.source} not generated yet`);
      continue;
    }
    const primary = await loadSource(outfit.source);
    const layers = {};
    for (const category of ['top', 'bottom', 'shoes']) {
      if (!outfit[category]) continue;
      const sourceName = outfit[`${category}Source`] || outfit.source;
      const loaded = await loadSource(sourceName);
      layers[category] = await extractCategory(loaded.source, master, loaded.backdrop, category, outfit[category], loaded.alignment.x, loaded.alignment.y);
    }
    const preview = await makePreview(master, outfit, layers);
    previews.push(preview);
    console.log(`${outfit.lookId} ${outfit.lookName}: ${primary.backdrop.dark ? 'dark' : 'light'} backdrop; shift ${primary.alignment.x},${primary.alignment.y}; score ${primary.alignment.score.toFixed(1)}`);
    for (const [category, files] of Object.entries(layers)) {
      console.log(`  ${category}: ${path.basename(files.front)} + ${path.basename(files.rear)}`);
    }
    console.log(`  preview: ${path.basename(preview)}`);
  }
  if (previews.length) console.log(`contact sheet: ${path.basename(await makeContactSheet(previews))}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
