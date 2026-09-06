#!/usr/bin/env node
// Peel an opaque near-black outline off a transparent PNG layer, writing a copy.
//
//   node tools/strip-dark-rim.cjs <in.png> <out.png> [--rounds 8] [--threshold 45]
//
// A pixel is peeled when it is not transparent, its mean RGB is under the threshold,
// and one of its eight neighbours is fully transparent. Rounds repeat the peel so a
// rim several pixels thick goes; a legitimately dark garment loses at most `rounds`
// pixels of edge, so keep rounds small and look at the result on a dark background.
// Never overwrites the input. Rebuild layers.json afterwards.
const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'hirednerds-chat', 'app', 'node_modules', 'sharp'));

const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf(k); return i >= 0 ? +args[i + 1] : null; };
const [inFile, outFile] = args.filter(a => !a.startsWith('--') && !/^\d+$/.test(a));
if (!inFile || !outFile || path.resolve(inFile) === path.resolve(outFile)) {
  console.error('usage: strip-dark-rim.cjs <in.png> <out.png> [--rounds 8] [--threshold 45]  (out must differ from in)');
  process.exit(2);
}
const rounds = opt('--rounds') || 8, thr = opt('--threshold') || 45;

(async () => {
  const { data, info } = await sharp(inFile).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height, d = data;
  let total = 0;
  for (let r = 0; r < rounds; r++) {
    const kill = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = (y * W + x) * 4;
      if (d[i + 3] === 0 || (d[i] + d[i + 1] + d[i + 2]) / 3 >= thr) continue;
      const nb = [i - 4, i + 4, i - W * 4, i + W * 4, i - W * 4 - 4, i - W * 4 + 4, i + W * 4 - 4, i + W * 4 + 4];
      if (nb.some(j => d[j + 3] === 0)) kill.push(i);
    }
    for (const i of kill) d[i] = d[i + 1] = d[i + 2] = d[i + 3] = 0;
    total += kill.length;
    if (!kill.length) break;
  }
  await sharp(d, { raw: { width: W, height: H, channels: 4 } }).png().toFile(outFile);
  console.log(`${path.basename(inFile)}: peeled ${total} px over up to ${rounds} rounds -> ${outFile}`);
})().catch(e => { console.error(e.message); process.exit(1); });
