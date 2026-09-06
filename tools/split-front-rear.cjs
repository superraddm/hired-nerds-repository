#!/usr/bin/env node
// Split one merged garment/hair layer into the -front and -rear files the game composites.
//
//   node tools/split-front-rear.cjs <merged.png> <category-id>   e.g. hair-hana-petalbob
//
// Rule (the registered-puppet contract): pixels that lie over the master's body
// silhouette are drawn in FRONT of the body, everything outside it goes BEHIND.
// The silhouette is dilated a little so anti-aliased garment edges at the body
// outline stay in front. Output goes to public/fireworks/assets/glowgirls/sol/final/
// as <category-id>-front.png and <category-id>-rear.png; the files they replace are copied
// to psd-import/backup/ (never into final/, which is deployed whole). Rebuild layers.json afterwards.
//
// Boots are the exception the rule cannot know about: the shaft interior above the
// front rim must be in the REAR file so the leg shows inside the boot. Split boots
// with this tool, then move the rim interior by hand.
const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'hirednerds-chat', 'app', 'node_modules', 'sharp'));
const [merged, id] = process.argv.slice(2);
if (!merged || !id || !/^(hair|top|bottom|shoes|face)-[a-z0-9-]+$/.test(id)) { console.error('usage: split-front-rear.cjs <merged.png> <cat-id>'); process.exit(2); }
const root = path.join(__dirname, '..', 'public', 'fireworks', 'assets', 'glowgirls', 'sol');
const W = 1024, H = 1536, DILATE = 2;
(async () => {
  const src = await sharp(merged).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  if (src.info.width !== W || src.info.height !== H) throw new Error(`merged layer must be ${W}x${H}, got ${src.info.width}x${src.info.height}`);
  const body = (await sharp(path.join(root, 'master.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true })).data;
  const inside = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (body[i * 4 + 3] > 0) inside[i] = 1;
  for (let r = 0; r < DILATE; r++) { const next = inside.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (inside[i]) continue;
      if (inside[i-1] || inside[i+1] || inside[i-W] || inside[i+W]) next[i] = 1; }
    inside.set(next); }
  const front = Buffer.alloc(W * H * 4), rear = Buffer.alloc(W * H * 4); let nf = 0, nr = 0;
  for (let i = 0; i < W * H; i++) { const a = src.data[i * 4 + 3]; if (!a) continue;
    const dst = inside[i] ? front : rear; src.data.copy(dst, i * 4, i * 4, i * 4 + 4); if (inside[i]) nf++; else nr++; }
  for (const [side, buf, n] of [['front', front, nf], ['rear', rear, nr]]) {
    const out = path.join(root, 'final', `${id}-${side}.png`);
    if (fs.existsSync(out)) { const bk = path.join(root, 'psd-import', 'backup'); fs.mkdirSync(bk, { recursive: true }); fs.copyFileSync(out, path.join(bk, path.basename(out))); }
    await sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
    console.log(`${path.basename(out)}: ${n} px${n ? '' : ' (empty: fine, the manifest will mark it)'}`);
  }
  console.log('now run: node tools/build-glowgirl-layers.cjs');
})().catch(e => { console.error(e.message); process.exit(1); });
