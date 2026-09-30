const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const W = 1024;
const H = 1536;
const root = path.resolve(__dirname, '..');
const assetRoot = path.join(root, 'assets/glowgirls/sol');
const sourceDir = path.join(assetRoot, 'patch-sources/hair-generated');
const baseDir = path.join(assetRoot, 'patch-sources');
const finalDir = path.join(assetRoot, 'final');

const referenceDir = path.join(assetRoot, 'patch-sources/hair-references');

const PROFILES = {
  'hana-rosewaves': {
    palette: 'pink',
    maxY: 760,
    frontMode: 'body-overlap',
    isolatedSource: 'hana-rosewaves-source.png',
    targetBounds: [273, 62, 757, 760],
  },
  'hana-petalbob': {
    palette: 'pink',
    maxY: 390,
    frontMode: 'body-overlap',
    isolatedSource: 'hana-petalbob-source.png',
    targetBounds: [370, 20, 654, 295],
  },
  'hana-starlittwins': {
    palette: 'lavender',
    maxY: 820,
    frontMode: 'outer-braids',
    isolatedSource: 'hana-starlittwins-source.png',
    targetBounds: [300, 28, 724, 760],
  },
  'hana-floralhalo': {
    palette: 'pink',
    maxY: 340,
    frontMode: 'body-overlap',
    generatedIsolated: 'hana-floralhalo-generated-v1.png',
    keyMode: 'checker',
    targetBounds: [375, 0, 655, 340],
  },
  'hana-petalpixie': {
    palette: 'pink',
    maxY: 260,
    frontMode: 'body-overlap',
    generatedIsolated: 'hana-petalpixie-generated-v1.png',
    keyMode: 'checker',
    targetBounds: [395, 0, 625, 260],
    eraseSkinBox: [568, 125, 616, 224],
  },
  'jia-neontails': {
    palette: 'blue',
    maxY: 840,
    copyFrom: 'neonbuns',
  },
  'jia-braidmatrix': {
    palette: 'blue',
    maxY: 880,
    frontMode: 'outer-braids',
    isolatedSource: 'jia-braidmatrix-source.png',
    targetBounds: [270, 40, 753, 780],
  },
  'jia-embershag': {
    palette: 'darkorange',
    maxY: 760,
    frontMode: 'head-only',
    isolatedSource: 'jia-embershag-source.png',
    targetBounds: [320, 20, 764, 670],
  },
  'jia-electricbob': {
    palette: 'blue',
    maxY: 320,
    frontMode: 'body-overlap',
    generatedIsolated: 'jia-electricbob-generated-v1.png',
    keyMode: 'checker',
    targetBounds: [380, 0, 660, 320],
  },
  'jia-circuitfauxhawk': {
    palette: 'blue',
    maxY: 640,
    frontMode: 'outer-only',
    generatedIsolated: 'jia-circuitfauxhawk-generated-v2-green.png',
    keyMode: 'green',
    targetBounds: [392, 0, 632, 640],
    preserveComponents: true,
    shiftLowerComponent: { x0: 454, x1: 570, y0: 228, dx: 116 },
  },
};

function isBackdrop(r, g, b) {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  return (r + g + b) / 3 > 210 && hi - lo < 30;
}

function subjectFromBackdrop(rgb) {
  const candidate = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const i = p * 3;
    candidate[p] = isBackdrop(rgb[i], rgb[i + 1], rgb[i + 2]);
  }
  const backdrop = new Uint8Array(W * H);
  const queue = new Int32Array(W * H);
  let head = 0;
  let tail = 0;
  const push = p => {
    if (p < 0 || p >= candidate.length || backdrop[p] || !candidate[p]) return;
    backdrop[p] = 1;
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
  const subject = new Uint8Array(W * H);
  for (let p = 0; p < subject.length; p++) subject[p] = backdrop[p] ? 0 : 1;
  return subject;
}

function hsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  return { h, s: max ? d / max : 0, v: max };
}

function paletteMatch(r, g, b, palette) {
  const { h, s, v } = hsv(r, g, b);
  if (palette === 'pink') {
    return (s > 0.18 && (h >= 315 || h <= 42)) || (r > 145 && r > g * 1.13 && r > b * 1.02);
  }
  if (palette === 'lavender') {
    return (s > 0.14 && h >= 265 && h <= 345) || (b > 105 && b > g * 1.05 && r > g * 1.03);
  }
  if (palette === 'blue') {
    return (s > 0.16 && h >= 172 && h <= 267) || (v < 0.36 && b > r * 1.08 && b > g * 0.95);
  }
  if (palette === 'darkorange') {
    return (s > 0.2 && (h <= 42 || h >= 285)) || (v < 0.25 && (b > r * 0.75));
  }
  return s > 0.18;
}

function dilateAlpha(base, radius = 3) {
  const near = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let found = false;
    for (let oy = -radius; oy <= radius && !found; oy++) for (let ox = -radius; ox <= radius; ox++) {
      const xx = x + ox;
      const yy = y + oy;
      if (xx < 0 || xx >= W || yy < 0 || yy >= H) continue;
      if (base[(yy * W + xx) * 4 + 3] > 8) { found = true; break; }
    }
    near[y * W + x] = found ? 1 : 0;
  }
  return near;
}

function protectFace(x, y, profile, r, g, b, diff) {
  const insideFace = x >= 466 && x <= 560 && y >= 118 && y <= 224;
  if (!insideFace) return false;
  if (y < 151 && paletteMatch(r, g, b, profile.palette) && diff > 145) return false;
  if ((x < 483 || x > 545) && paletteMatch(r, g, b, profile.palette) && diff > 165) return false;
  return true;
}

function boundsOfAlpha(rgba) {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  let count = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rgba[(y * W + x) * 4 + 3] <= 8) continue;
    count++;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { count, bounds: count ? [x0, y0, x1, y1] : null };
}

function removeGreen(rgb, width, height, preserveComponents = false) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const si = p * 3;
    const di = p * 4;
    const r = rgb[si];
    const g = rgb[si + 1];
    const b = rgb[si + 2];
    const dominance = g - Math.max(r, b);
    let alpha = 255;
    if (g > 80 && dominance > 10) alpha = Math.max(0, Math.min(255, 255 - (dominance - 10) * 3));
    if (alpha <= 4) continue;
    rgba[di] = r;
    rgba[di + 1] = Math.min(g, Math.max(r, b));
    rgba[di + 2] = b;
    rgba[di + 3] = alpha;
  }
  return preserveComponents ? rgba : keepLargestComponent(rgba, width, height);
}

function keepLargestComponent(rgba, width, height) {
  const seen = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let largest = [];
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || rgba[start * 4 + 3] <= 8) continue;
    let head = 0;
    let tail = 0;
    const component = [];
    seen[start] = 1;
    queue[tail++] = start;
    while (head < tail) {
      const p = queue[head++];
      component.push(p);
      const x = p % width;
      const neighbors = [];
      if (x > 0) neighbors.push(p - 1);
      if (x < width - 1) neighbors.push(p + 1);
      if (p >= width) neighbors.push(p - width);
      if (p < width * (height - 1)) neighbors.push(p + width);
      for (const n of neighbors) {
        if (seen[n] || rgba[n * 4 + 3] <= 8) continue;
        seen[n] = 1;
        queue[tail++] = n;
      }
    }
    if (component.length > largest.length) largest = component;
  }
  const keep = new Uint8Array(width * height);
  for (const p of largest) keep[p] = 1;
  for (let p = 0; p < width * height; p++) {
    if (!keep[p]) rgba[p * 4 + 3] = 0;
  }
  return rgba;
}

async function registeredIsolatedHair(profile) {
  const sourcePath = profile.generatedIsolated
    ? path.join(sourceDir, profile.generatedIsolated)
    : path.join(referenceDir, profile.isolatedSource);
  const { data: rgb, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  let keyed;
  if (profile.keyMode === 'checker') {
    if (info.width !== W || info.height !== H) throw new Error(`${path.basename(sourcePath)} must be ${W}x${H}`);
    const subject = subjectFromBackdrop(rgb);
    keyed = Buffer.alloc(info.width * info.height * 4);
    for (let p = 0; p < subject.length; p++) {
      if (!subject[p]) continue;
      keyed[p * 4] = rgb[p * 3];
      keyed[p * 4 + 1] = rgb[p * 3 + 1];
      keyed[p * 4 + 2] = rgb[p * 3 + 2];
      keyed[p * 4 + 3] = 255;
    }
    keyed = keepLargestComponent(keyed, info.width, info.height);
  } else {
    keyed = removeGreen(rgb, info.width, info.height, profile.preserveComponents);
  }
  let sx0 = info.width;
  let sy0 = info.height;
  let sx1 = -1;
  let sy1 = -1;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (keyed[(y * info.width + x) * 4 + 3] <= 8) continue;
    sx0 = Math.min(sx0, x);
    sy0 = Math.min(sy0, y);
    sx1 = Math.max(sx1, x);
    sy1 = Math.max(sy1, y);
  }
  if (sx1 < sx0 || sy1 < sy0) throw new Error(`No keyed hair in ${profile.isolatedSource}`);
  const [tx0, ty0, tx1, ty1] = profile.targetBounds;
  const registered = await sharp(keyed, { raw: { width: info.width, height: info.height, channels: 4 } })
    .extract({ left: sx0, top: sy0, width: sx1 - sx0 + 1, height: sy1 - sy0 + 1 })
    .resize(tx1 - tx0 + 1, ty1 - ty0 + 1, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .extend({
      left: tx0,
      top: ty0,
      right: W - tx1 - 1,
      bottom: H - ty1 - 1,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer();
  if (profile.shiftLowerComponent) {
    const { x0, x1, y0, dx } = profile.shiftLowerComponent;
    const shifted = Buffer.from(registered);
    for (let y = y0; y < H; y++) for (let x = x0; x <= x1; x++) {
      shifted[(y * W + x) * 4 + 3] = 0;
    }
    for (let y = y0; y < H; y++) for (let x = x0; x <= x1; x++) {
      const si = (y * W + x) * 4;
      if (registered[si + 3] <= 8 || x + dx >= W) continue;
      const di = (y * W + x + dx) * 4;
      shifted[di] = registered[si];
      shifted[di + 1] = registered[si + 1];
      shifted[di + 2] = registered[si + 2];
      shifted[di + 3] = registered[si + 3];
    }
    shifted.copy(registered);
  }
  if (profile.eraseSkinBox) {
    const [x0, y0, x1, y1] = profile.eraseSkinBox;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4;
      if (registered[i + 3] <= 8) continue;
      const color = hsv(registered[i], registered[i + 1], registered[i + 2]);
      if ((color.h <= 42 || color.h >= 350) && color.s >= 0.12 && color.s <= 0.62 && color.v >= 0.42) {
        registered[i + 3] = 0;
      }
    }
  }
  return registered;
}

function isFrontHair(x, y, profile, baseAlpha, r, g, b) {
  if (baseAlpha <= 8) return false;
  if (profile.frontMode === 'outer-braids') return y <= 280 || x <= 455 || x >= 570;
  if (profile.frontMode === 'outer-only') return x <= 455 || x >= 570;
  if (profile.frontMode === 'head-only') return y <= 260;
  if (profile.frontMode === 'orange-strands') {
    if (y <= 280) return true;
    const color = hsv(r, g, b);
    return color.s > 0.24 && (color.h <= 42 || color.h >= 338);
  }
  return true;
}

async function buildStyle(id) {
  const profile = PROFILES[id];
  if (!profile) throw new Error(`No extraction profile for ${id}`);
  const character = id.startsWith('hana-') ? 'hana' : 'jia';
  const basePath = path.join(baseDir, `master-${character}-registered.png`);
  const { data: base } = await sharp(basePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (profile.copyFrom) {
    const front = await sharp(path.join(finalDir, `hair-${profile.copyFrom}-front.png`)).ensureAlpha().raw().toBuffer();
    const rear = await sharp(path.join(finalDir, `hair-${profile.copyFrom}-rear.png`)).ensureAlpha().raw().toBuffer();
    return writeStyle(id, basePath, front, rear);
  }
  if (profile.isolatedSource || profile.generatedIsolated) {
    const hair = await registeredIsolatedHair(profile);
    const front = Buffer.alloc(W * H * 4);
    const rear = Buffer.alloc(W * H * 4);
    for (let p = 0; p < W * H; p++) {
      const i = p * 4;
      if (hair[i + 3] <= 4) continue;
      rear[i] = hair[i];
      rear[i + 1] = hair[i + 1];
      rear[i + 2] = hair[i + 2];
      rear[i + 3] = hair[i + 3];
      const y = Math.floor(p / W);
      const x = p % W;
      if (isFrontHair(x, y, profile, base[i + 3], hair[i], hair[i + 1], hair[i + 2])) {
        front[i] = hair[i];
        front[i + 1] = hair[i + 1];
        front[i + 2] = hair[i + 2];
        front[i + 3] = hair[i + 3];
      }
    }
    return writeStyle(id, basePath, front, rear);
  }

  const generatedPath = path.join(sourceDir, `${id}-generated-v1.png`);
  if (!fs.existsSync(generatedPath)) return null;
  const { data: rgb, info } = await sharp(generatedPath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (info.width !== W || info.height !== H || info.channels !== 3) {
    throw new Error(`${path.basename(generatedPath)} must be ${W}x${H} RGB`);
  }
  const subject = subjectFromBackdrop(rgb);
  const nearBase = dilateAlpha(base);
  const front = Buffer.alloc(W * H * 4);
  const rear = Buffer.alloc(W * H * 4);

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const p = y * W + x;
    if (!subject[p] || y > profile.maxY) continue;
    const gi = p * 3;
    const bi = p * 4;
    const r = rgb[gi];
    const g = rgb[gi + 1];
    const b = rgb[gi + 2];
    const baseAlpha = base[bi + 3];
    const diff = Math.abs(r - base[bi]) + Math.abs(g - base[bi + 1]) + Math.abs(b - base[bi + 2]);
    const palette = paletteMatch(r, g, b, profile.palette);
    let hair = false;
    if (baseAlpha > 8) {
      hair = diff > 95 && palette && !protectFace(x, y, profile, r, g, b, diff);
    } else if (nearBase[p]) {
      hair = palette;
    } else {
      hair = true;
    }
    if (!hair) continue;
    const target = baseAlpha > 8 ? front : rear;
    target[bi] = r;
    target[bi + 1] = g;
    target[bi + 2] = b;
    target[bi + 3] = 255;
  }

  return writeStyle(id, basePath, front, rear);
}

async function writeStyle(id, basePath, front, rear) {
  const frontPath = path.join(finalDir, `hair-${id}-front.png`);
  const rearPath = path.join(finalDir, `hair-${id}-rear.png`);
  await sharp(front, { raw: { width: W, height: H, channels: 4 } }).png().toFile(frontPath);
  await sharp(rear, { raw: { width: W, height: H, channels: 4 } }).png().toFile(rearPath);

  const previewPath = path.join(sourceDir, `${id}-registered-preview.png`);
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 24, g: 19, b: 34, alpha: 1 } } })
    .composite([{ input: rearPath }, { input: basePath }, { input: frontPath }])
    .png()
    .toFile(previewPath);
  return { id, front: boundsOfAlpha(front), rear: boundsOfAlpha(rear), previewPath };
}

async function main() {
  fs.mkdirSync(finalDir, { recursive: true });
  const reports = [];
  for (const id of Object.keys(PROFILES)) {
    const report = await buildStyle(id);
    if (report) reports.push(report);
  }
  console.log(JSON.stringify(reports, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
