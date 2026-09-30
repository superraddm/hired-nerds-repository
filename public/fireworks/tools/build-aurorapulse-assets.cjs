const path = require('path');
const sharp = require('../../../hirednerds-chat/app/node_modules/sharp');

const root = path.resolve(__dirname, '../assets/glowgirls/sol');
const sourcePath = path.join(root, 'patch-sources', 'outfit-aurorapulse-dressed.png');
const masterPath = path.join(root, 'master.png');
const finalDir = path.join(root, 'final');
const W = 1024;
const H = 1536;
const SHIFT_X = -3;
const SHIFT_Y = -2;

const definitions = {
  top: { id: 'auroratop', rect: [410, 230, 620, 492], minComponent: 22 },
  bottom: { id: 'auroraskort', rect: [340, 490, 690, 753], minComponent: 22 },
  shoes: { id: 'aurorakicks', rect: [330, 1175, 700, 1450], minComponent: 22 },
};

function isBackdrop(r, g, b) {
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  return (r + g + b) / 3 > 232 && hi - lo < 13;
}

function isSkin(r, g, b) {
  return r > 132 && r - g > 4 && g - b > 3 && r - b > 20;
}

function isMasterBase(r, g, b, a) {
  return a > 20 && (r + g + b) / 3 < 82;
}

function inside(rect, x, y) {
  return x >= rect[0] && x <= rect[2] && y >= rect[1] && y <= rect[3];
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

function enclosedMask(source, rect) {
  let boundary = new Uint8Array(W * H);
  for (let y = rect[1]; y <= rect[3]; y++) for (let x = rect[0]; x <= rect[2]; x++) {
    const i = (y * W + x) * 3;
    if (!isBackdrop(source[i], source[i + 1], source[i + 2])
      && !isSkin(source[i], source[i + 1], source[i + 2])) boundary[y * W + x] = 1;
  }
  boundary = keepLargeComponents(boundary, W, H, 10);
  boundary = dilate(boundary, W, H, 2);

  const reached = new Uint8Array(W * H);
  const queue = new Int32Array((rect[2] - rect[0] + 1) * (rect[3] - rect[1] + 1));
  let head = 0, tail = 0;
  const push = (x, y) => {
    if (!inside(rect, x, y)) return;
    const p = y * W + x;
    if (reached[p] || boundary[p]) return;
    reached[p] = 1;
    queue[tail++] = p;
  };
  for (let x = rect[0]; x <= rect[2]; x++) { push(x, rect[1]); push(x, rect[3]); }
  for (let y = rect[1]; y <= rect[3]; y++) { push(rect[0], y); push(rect[2], y); }
  while (head < tail) {
    const p = queue[head++];
    const x = p % W;
    const y = (p / W) | 0;
    push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
  }

  const out = new Uint8Array(W * H);
  for (let y = rect[1]; y <= rect[3]; y++) for (let x = rect[0]; x <= rect[2]; x++) {
    const p = y * W + x;
    if (!reached[p]) out[p] = 1;
  }
  return out;
}

function fillRange(mask, y, x0, x1) {
  for (let x = Math.max(0, Math.round(x0)); x <= Math.min(W - 1, Math.round(x1)); x++) mask[y * W + x] = 1;
}

function fillBottomSilhouette(mask) {
  for (let y = 490; y <= 710; y++) {
    let left, right;
    if (y <= 500) {
      left = 436 - (y - 490) * 0.1;
      right = 588 + (y - 490) * 0.2;
    } else {
      left = 435 - Math.min(y - 500, 180) * 0.42 + Math.max(0, y - 680) * 0.8;
      right = 590 + (y - 500) * 0.4;
    }
    fillRange(mask, y, left, right);
  }
  for (let y = 711; y <= 730; y++) {
    fillRange(mask, y, 385 + (y - 711) * 1.2, 520);
    fillRange(mask, y, 600, 676 - (y - 711) * 0.2);
  }
  for (let y = 731; y <= 752; y++) fillRange(mask, y, 608, 672 - (y - 731) * 0.5);
}

function fillShoeSilhouettes(mask, source) {
  for (let y = 1190; y <= 1435; y++) {
    for (const [lo, hi] of [[330, 500], [520, 700]]) {
      let x0 = hi, x1 = lo;
      for (let x = lo; x <= hi; x++) {
        const i = (y * W + x) * 3;
        if (!isBackdrop(source[i], source[i + 1], source[i + 2])
          && !isSkin(source[i], source[i + 1], source[i + 2])) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x);
        }
      }
      if (x1 > x0 + 8) fillRange(mask, y, x0 - 1, x1 + 1);
    }
  }
}

async function writeBlank(file) {
  await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .png().toFile(file);
}

async function main() {
  const source = await sharp(sourcePath).removeAlpha().raw().toBuffer();
  const master = await sharp(masterPath).ensureAlpha().raw().toBuffer();

  for (const [category, def] of Object.entries(definitions)) {
    let mask = enclosedMask(source, def.rect);
    if (category === 'bottom') fillBottomSilhouette(mask);
    if (category === 'shoes') fillShoeSilhouettes(mask, source);
    for (let y = def.rect[1]; y <= def.rect[3]; y++) for (let x = def.rect[0]; x <= def.rect[2]; x++) {
      const i = (y * W + x) * 3;
      const mx = Math.max(0, Math.min(W - 1, x + SHIFT_X));
      const my = Math.max(0, Math.min(H - 1, y + SHIFT_Y));
      const mi = (my * W + mx) * 4;
      const r = source[i], g = source[i + 1], b = source[i + 2];
      const revealedSkin = category !== 'shoes' && isSkin(r, g, b)
        && isMasterBase(master[mi], master[mi + 1], master[mi + 2], master[mi + 3]);
      if (category !== 'shoes' && isSkin(r, g, b) && !revealedSkin) mask[y * W + x] = 0;
      if (revealedSkin) mask[y * W + x] = 1;
      if (category !== 'shoes' && isMasterBase(master[mi], master[mi + 1], master[mi + 2], master[mi + 3])) mask[y * W + x] = 1;
    }
    mask = keepLargeComponents(mask, W, H, def.minComponent);

    const rgba = Buffer.alloc(W * H * 4);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const sx = x - SHIFT_X;
      const sy = y - SHIFT_Y;
      if (sx < 0 || sx >= W || sy < 0 || sy >= H) continue;
      const sp = sy * W + sx;
      if (!mask[sp]) continue;
      const si = sp * 3;
      const di = (y * W + x) * 4;
      rgba[di] = source[si];
      rgba[di + 1] = source[si + 1];
      rgba[di + 2] = source[si + 2];
      rgba[di + 3] = 255;
    }

    const front = path.join(finalDir, `${category}-${def.id}-front.png`);
    const rear = path.join(finalDir, `${category}-${def.id}-rear.png`);
    if (category === 'shoes') {
      const fittedShoe = await sharp(rgba, { raw: { width: W, height: H, channels: 4 } })
        .extract({ left: 0, top: 1199, width: W, height: 226 })
        .resize({ width: W, height: 209, kernel: sharp.kernel.lanczos3 })
        .png().toBuffer();
      await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: fittedShoe, top: 1199, left: 0 }]).png().toFile(front);
    } else {
      await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toFile(front);
    }
    await writeBlank(rear);
    console.log(`${category}: ${path.basename(front)} + ${path.basename(rear)}`);
  }

  const preview = path.join(root, 'patch-sources', 'outfit-aurorapulse-game-preview.png');
  const gameMaster = Buffer.from(master);
  for (let y = 1240; y < H; y++) for (let x = 0; x < W; x++) gameMaster[(y * W + x) * 4 + 3] = 0;
  await sharp(gameMaster, { raw: { width: W, height: H, channels: 4 } }).composite([
    { input: path.join(finalDir, 'bottom-auroraskort-front.png') },
    { input: path.join(finalDir, 'top-auroratop-front.png') },
    { input: path.join(finalDir, 'shoes-aurorakicks-front.png') },
  ]).png().toFile(preview);
  console.log(`preview: ${preview}`);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
