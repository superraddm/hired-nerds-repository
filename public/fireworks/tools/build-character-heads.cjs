const fs = require('fs');
const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const W = 1024;
const H = 1536;
const MASTER_BOUNDS = [299, 63, 719, 1406];
const HEAD_BOX = [420, 48, 610, 260];
const root = path.resolve(__dirname, '../assets/glowgirls/sol');
const sourceDir = path.join(root, 'patch-sources');
const finalDir = path.join(root, 'final');
const masterPath = path.join(root, 'master.png');

const characters = [
  { id: 'hana', source: 'head-hana-generated.png', tone: '#efc3a4' },
  { id: 'jia', source: 'head-jia-generated.png', tone: '#d8a179' },
];

function isBackdrop(r, g, b) {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  return (r + g + b) / 3 > 216 && hi - lo < 32;
}

function backdropFromEdges(source) {
  const candidate = new Uint8Array(W * H);
  for (let p = 0; p < W * H; p++) {
    const i = p * 3;
    candidate[p] = isBackdrop(source[i], source[i + 1], source[i + 2]);
  }

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
  return reached;
}

function boundsOfAlpha(rgba, alphaThreshold = 8) {
  let x0 = W;
  let y0 = H;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (rgba[(y * W + x) * 4 + 3] <= alphaThreshold) continue;
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  if (x1 < x0 || y1 < y0) throw new Error('No subject pixels found');
  return [x0, y0, x1, y1];
}

function subjectRgba(rgb, backdrop) {
  const rgba = Buffer.alloc(W * H * 4);
  for (let p = 0; p < W * H; p++) {
    if (backdrop[p]) continue;
    const si = p * 3;
    const di = p * 4;
    rgba[di] = rgb[si];
    rgba[di + 1] = rgb[si + 1];
    rgba[di + 2] = rgb[si + 2];
    rgba[di + 3] = 255;
  }
  return rgba;
}

async function registerSubject(rgba, sourceBounds) {
  const [sx0, sy0, sx1, sy1] = sourceBounds;
  const [tx0, ty0, tx1, ty1] = MASTER_BOUNDS;
  const sourceWidth = sx1 - sx0 + 1;
  const sourceHeight = sy1 - sy0 + 1;
  const targetWidth = tx1 - tx0 + 1;
  const targetHeight = ty1 - ty0 + 1;
  const body = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left: sx0, top: sy0, width: sourceWidth, height: sourceHeight })
    .resize(targetWidth, targetHeight, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
    .extend({
      left: tx0,
      top: ty0,
      right: W - tx0 - targetWidth,
      bottom: H - ty0 - targetHeight,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .raw()
    .toBuffer();
  return body;
}

function insideHeadEnvelope(x, y) {
  if (x < HEAD_BOX[0] || x > HEAD_BOX[2] || y < HEAD_BOX[1] || y > HEAD_BOX[3]) return false;
  if (y <= 229) return true;
  // Retain enough upper neck to make the new jaw seamless, while never touching
  // the shoulders or bodysuit used to register every wardrobe layer.
  const taper = Math.max(0, Math.min(1, (y - 229) / 31));
  const left = Math.round(448 + taper * 17);
  const right = Math.round(578 - taper * 17);
  return x >= left && x <= right;
}

function extractHead(registered) {
  const out = Buffer.alloc(W * H * 4);
  for (let y = HEAD_BOX[1]; y <= HEAD_BOX[3]; y++) for (let x = HEAD_BOX[0]; x <= HEAD_BOX[2]; x++) {
    if (!insideHeadEnvelope(x, y)) continue;
    const p = (y * W + x) * 4;
    if (registered[p + 3] <= 8) continue;
    out[p] = registered[p];
    out[p + 1] = registered[p + 1];
    out[p + 2] = registered[p + 2];
    out[p + 3] = registered[p + 3];
  }
  return out;
}

async function fitHeadToBounds(head, targetBounds) {
  if (!targetBounds) return head;
  const sourceBounds = boundsOfAlpha(head);
  const [sx0, sy0, sx1, sy1] = sourceBounds;
  const [tx0, ty0, tx1, ty1] = targetBounds;
  return sharp(head, { raw: { width: W, height: H, channels: 4 } })
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
}

function buildBaseHeadMask(master) {
  const mask = Buffer.alloc(W * H * 4);
  for (let y = HEAD_BOX[1]; y <= HEAD_BOX[3]; y++) for (let x = HEAD_BOX[0]; x <= HEAD_BOX[2]; x++) {
    // Remove only the old skull/jaw. The original registered neck stays behind
    // the replacement's short neck overlap, preventing a hard lower crop edge.
    if (!insideHeadEnvelope(x, y) || y > 229) continue;
    const p = (y * W + x) * 4;
    if (master[p + 3] <= 8) continue;
    mask[p] = mask[p + 1] = mask[p + 2] = 0;
    mask[p + 3] = master[p + 3];
  }
  return mask;
}

function isSkin(r, g, b) {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  if (mx < 77 || d === 0 || mx !== r || mn !== b) return false;
  const sat = d / mx;
  if (sat < 0.06 || sat > 0.62) return false;
  const hue = 60 * (g - b) / d;
  return hue >= 5 && hue <= 40;
}

function tintSkin(rgba, tone) {
  const out = Buffer.from(rgba);
  const tr = parseInt(tone.slice(1, 3), 16);
  const tg = parseInt(tone.slice(3, 5), 16);
  const tb = parseInt(tone.slice(5, 7), 16);
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (out[i + 3] < 8 || !isSkin(out[i], out[i + 1], out[i + 2])) continue;
    const lum = (out[i] * 0.299 + out[i + 1] * 0.587 + out[i + 2] * 0.114) / 255;
    const k = 0.35 + lum * 0.85;
    const mix = 0.7;
    out[i] += (Math.min(255, tr * k) - out[i]) * mix;
    out[i + 1] += (Math.min(255, tg * k) - out[i + 1]) * mix;
    out[i + 2] += (Math.min(255, tb * k) - out[i + 2]) * mix;
  }
  return out;
}

async function blank(file) {
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png()
    .toFile(file);
}

async function compositeCharacter(master, mask, head, tone) {
  const base = await sharp(tintSkin(master, tone), { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: mask, raw: { width: W, height: H, channels: 4 }, blend: 'dest-out' }])
    .raw()
    .toBuffer();
  const tintedHead = tintSkin(head, tone);
  return sharp(base, { raw: { width: W, height: H, channels: 4 } })
    .composite([{ input: tintedHead, raw: { width: W, height: H, channels: 4 } }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(finalDir, { recursive: true });
  const master = await sharp(masterPath).ensureAlpha().raw().toBuffer();
  const mask = buildBaseHeadMask(master);
  await sharp(mask, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toFile(path.join(finalDir, 'head-base-mask.png'));

  const previews = [await sharp(masterPath).png().toBuffer()];
  const reports = [];
  for (const character of characters) {
    const sourcePath = path.join(sourceDir, character.source);
    const { data: rgb, info } = await sharp(sourcePath).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    if (info.width !== W || info.height !== H || info.channels !== 3) {
      throw new Error(`${character.source} must normalize to ${W}x${H} RGB`);
    }
    const subject = subjectRgba(rgb, backdropFromEdges(rgb));
    const sourceBounds = boundsOfAlpha(subject);
    const registered = await registerSubject(subject, sourceBounds);
    const head = await fitHeadToBounds(extractHead(registered), character.targetHeadBounds);
    const headBounds = boundsOfAlpha(head);
    const front = path.join(finalDir, `head-${character.id}-front.png`);
    const rear = path.join(finalDir, `head-${character.id}-rear.png`);
    await sharp(head, { raw: { width: W, height: H, channels: 4 } }).png().toFile(front);
    await blank(rear);
    const registeredCharacter = await compositeCharacter(master, mask, head, character.tone);
    await fs.promises.writeFile(
      path.join(sourceDir, `master-${character.id}-registered.png`),
      registeredCharacter,
    );
    previews.push(registeredCharacter);
    reports.push({ id: character.id, sourceBounds, headBounds });
  }

  const panels = await Promise.all(previews.map(image => sharp(image)
    .resize(256, 384, { fit: 'fill' })
    .png()
    .toBuffer()));
  await sharp({ create: { width: 768, height: 384, channels: 4, background: { r: 20, g: 16, b: 31, alpha: 1 } } })
    .composite(panels.map((input, i) => ({ input, left: i * 256, top: 0 })))
    .png()
    .toFile(path.join(sourceDir, 'heads-bald-game-preview.png'));

  const facePanels = await Promise.all(previews.map(image => sharp(image)
    .extract({ left: 420, top: 48, width: 191, height: 213 })
    .resize(382, 426, { fit: 'fill' })
    .png()
    .toBuffer()));
  await sharp({ create: { width: 1146, height: 426, channels: 4, background: { r: 20, g: 16, b: 31, alpha: 1 } } })
    .composite(facePanels.map((input, i) => ({ input, left: i * 382, top: 0 })))
    .png()
    .toFile(path.join(sourceDir, 'heads-face-game-preview.png'));

  // Representative compatibility proof using an unchanged Sol-authored style.
  // Runtime order is rear hair -> registered character base -> front hair.
  const moonponyRear = path.join(finalDir, 'hair-moonpony-rear.png');
  const moonponyFront = path.join(finalDir, 'hair-moonpony-front.png');
  const jiaMoonpony = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: moonponyRear },
      { input: previews[2] },
      { input: moonponyFront },
    ])
    .png()
    .toBuffer();
  await sharp(jiaMoonpony).png().toFile(path.join(sourceDir, 'jia-moonpony-fit-preview.png'));
  const jiaMoonponyFace = await sharp(jiaMoonpony)
    .extract({ left: 380, top: 35, width: 270, height: 330 })
    .resize(540, 660, { fit: 'fill' })
    .png()
    .toBuffer();
  await sharp({ create: { width: 540, height: 660, channels: 4, background: { r: 20, g: 16, b: 31, alpha: 1 } } })
    .composite([{ input: jiaMoonponyFace }])
    .png()
    .toFile(path.join(sourceDir, 'jia-moonpony-face-fit-preview.png'));

  const solMoonpony = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: moonponyRear },
      { input: previews[0] },
      { input: moonponyFront },
    ])
    .png()
    .toBuffer();
  const comparisonFaces = await Promise.all([solMoonpony, jiaMoonpony].map(image => sharp(image)
    .extract({ left: 380, top: 35, width: 270, height: 330 })
    .resize(540, 660, { fit: 'fill' })
    .png()
    .toBuffer()));
  await sharp({ create: { width: 1080, height: 660, channels: 4, background: { r: 20, g: 16, b: 31, alpha: 1 } } })
    .composite(comparisonFaces.map((input, i) => ({ input, left: i * 540, top: 0 })))
    .png()
    .toFile(path.join(sourceDir, 'sol-jia-moonpony-comparison.png'));

  console.log(JSON.stringify({ masterBounds: MASTER_BOUNDS, headBox: HEAD_BOX, characters: reports }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
