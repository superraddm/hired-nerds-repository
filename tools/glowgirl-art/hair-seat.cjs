// Seat a hairstyle on its head: search shift (dx,dy) and scale s of the merged hair that best covers the skull
// above the brow and the temples without covering the face, keeping the crown inside the canvas. Writes the
// transformed merged layer to <style>.seated.png (does not touch final/).
const sharp = require('C:/hirednerds-portfolio/hirednerds-chat/app/node_modules/sharp');
const R = 'C:/hirednerds-portfolio/public/fireworks/assets/glowgirls/sol/', D = R + 'final/', W = 1024, H = 1536;
const load = f => sharp(f).ensureAlpha().raw().toBuffer();
const [girl, style, fdx, fdy, fs_] = process.argv.slice(2);
(async () => {
  const m = await load(R + 'master.png'), mask = await load(D + 'head-base-mask.png'), head = await load(D + 'head-' + girl + '-front.png');
  const hd = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) { const a = Math.max(Math.max(0, m[i*4+3] - mask[i*4+3]), head[i*4+3]); hd[i] = a >= 200 ? 1 : 0; }
  const merged = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: D + 'hair-' + style + '-rear.png' }, { input: D + 'hair-' + style + '-front.png' }]).png().toBuffer();
  // pivot for scaling: the head centre at the brow line
  const px = 516, py = 112;
  async function transformed(dx, dy, s) {
    const sw = Math.round(W * s), sh = Math.round(H * s);
    const scaled = await sharp(merged).resize(sw, sh).raw().toBuffer();
    const out = Buffer.alloc(W * H * 4);
    const ox = Math.round(px - px * s + dx), oy = Math.round(py - py * s + dy);   // where the scaled image's origin lands
    for (let y = 0; y < sh; y++) { const ty = y + oy; if (ty < 0 || ty >= H) continue; for (let x = 0; x < sw; x++) { const tx = x + ox; if (tx < 0 || tx >= W) continue; scaled.copy(out, (ty * W + tx) * 4, (y * sw + x) * 4, (y * sw + x) * 4 + 4); } }
    return out;
  }
  function score(h) {   // hair alpha over the head: front-of-head pixels are those inside the head silhouette (the split rule), so use head∩hair
    let scalp = 0, sc = 0, temple = 0, tc = 0, face = 0, fc = 0, crown = H;
    for (let y = 0; y < 240; y++) for (let x = 400; x < 640; x++) { const i = y * W + x, a = h[i*4+3] > 100;
      if (a && x >= 470 && x <= 560 && y < crown) crown = y;
      if (!hd[i]) continue;
      if (y < 112) { scalp++; if (a) sc++; } else if (y < 150 && (x < 478 || x > 555)) { temple++; if (a) tc++; } else if (y >= 155 && y < 235 && x >= 480 && x <= 552) { face++; if (a) fc++; } }
    const S = sc / scalp, T = tc / temple, F = fc / face;
    return { S, T, F, crown, total: S + 0.6 * T - 2.5 * F - (crown < 8 ? 0.4 : 0) };
  }
  const base = score(await transformed(0, 0, 1)); console.log('current', JSON.stringify({ S: +base.S.toFixed(2), T: +base.T.toFixed(2), F: +base.F.toFixed(2), crown: base.crown }));
  let best = { total: -9 };
  if (fdx !== undefined) best = { ...score(await transformed(+fdx, +fdy, +fs_)), dx: +fdx, dy: +fdy, s: +fs_ };
  else for (const s of [1.0, 1.06, 1.12, 1.18]) for (let dy = 0; dy <= 50; dy += 10) for (let dx = -24; dx <= 24; dx += 8) {
    const sc = score(await transformed(dx, dy, s)); if (sc.total > best.total) best = { ...sc, dx, dy, s };
  }
  console.log('best', JSON.stringify({ dx: best.dx, dy: best.dy, s: best.s, S: +best.S.toFixed(2), T: +best.T.toFixed(2), F: +best.F.toFixed(2), crown: best.crown }));
  const fin = await transformed(best.dx, best.dy, best.s);
  await sharp(fin, { raw: { width: W, height: H, channels: 4 } }).png().toFile(`${style}.seated.png`);
})().catch(e => { console.error(e); process.exit(1); });
