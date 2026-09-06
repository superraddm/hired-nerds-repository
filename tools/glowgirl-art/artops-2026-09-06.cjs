// Batch art fixes on the registered layers. Every touched file is backed up to originals/ first.
//   node artops.cjs [--tops] [--master]
const fs = require('fs'), path = require('path');
const sharp = require('C:/hirednerds-portfolio/hirednerds-chat/app/node_modules/sharp');
const R = 'C:/hirednerds-portfolio/public/fireworks/assets/glowgirls/sol/', D = R + 'final/', W = 1024, H = 1536;
const BK = path.join(__dirname, 'originals'); fs.mkdirSync(BK, { recursive: true });
const args = process.argv.slice(2);
function isSkin(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; if(mx<77||d===0)return false; if(mx!==r||mn!==b)return false; const sat=d/mx; if(sat<0.06||sat>0.62)return false; const hue=60*(g-b)/d; return hue>=5&&hue<=40;}
// the master's own skin band, measured: hue 8.5-24.3, sat 0.14-0.58 (excludes gold, orange and pink fabrics)
function tight(r,g,b){ if(!isSkin(r,g,b))return false; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,hue=60*(g-b)/d,sat=d/mx; return hue>=8.5&&hue<=24.3&&sat>=0.14&&sat<=0.58; }
const backup = f => { const b = path.join(BK, path.basename(f)); if (!fs.existsSync(b)) fs.copyFileSync(f, b); };
const load = f => sharp(f).ensureAlpha().raw().toBuffer();
const save = (buf, f) => sharp(buf, { raw: { width: W, height: H, channels: 4 } }).png().toFile(f);
const log = [];
async function eraseSkin(f, opts = {}) {
  const d = await load(f); let n = 0;
  for (let y = opts.yMin || 0; y < (opts.yMax || H); y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (!d[i + 3]) continue; if (tight(d[i], d[i + 1], d[i + 2])) { d[i] = d[i+1] = d[i+2] = d[i+3] = 0; n++; } }
  // despeckle: skin pixels the classifier missed inside an erased region would show as freckles; drop opaque islands of < 30 px
  n += despeckle(d, 30);
  backup(f); await save(d, f); log.push(`${path.basename(f)}: erased ${n} skin px`);
}
function despeckle(d, minSize) {
  const seen = new Uint8Array(W * H); let removed = 0;
  for (let s = 0; s < W * H; s++) { if (seen[s] || !d[s * 4 + 3]) continue;
    const stack = [s], comp = []; seen[s] = 1;
    while (stack.length) { const i = stack.pop(); comp.push(i); const x = i % W, y = (i / W) | 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const j = ny * W + nx; if (seen[j] || !d[j * 4 + 3]) continue; seen[j] = 1; stack.push(j); }
      if (comp.length > minSize) break; }
    if (comp.length <= minSize) { for (const i of comp) d[i*4] = d[i*4+1] = d[i*4+2] = d[i*4+3] = 0; removed += comp.length; }
  }
  return removed;
}
async function shiftToStandingLine(f, rearF) {   // front decides the shift; the rear (shaft interior) moves with it
  const d = await load(f); let maxY = -1;
  for (let y = H - 1; y >= 0 && maxY < 0; y--) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { maxY = y; break; }
  const dy = maxY - 1408; if (dy <= 1) return;
  for (const g of [f, rearF]) { if (!g || !fs.existsSync(g)) continue; const src = g === f ? d : await load(g);
    const out = Buffer.alloc(W * H * 4); src.copy(out, 0, dy * W * 4); backup(g); await save(out, g); }
  log.push(`${path.basename(f)}: sole was at ${maxY}, moved up ${dy} px to 1408 (rear too if present)`);
}
async function cutBlueFabric(f) {   // orbitpoints: the navy trouser flares of orbitflares are baked into the boot layer
  const d = await load(f); let n = 0;
  for (let i = 0; i < W * H; i++) { const r = d[i*4], g = d[i*4+1], b = d[i*4+2], a = d[i*4+3]; if (!a) continue;
    const mx = Math.max(r,g,b); if (b > r + 25 && b >= g && mx < 200) { d[i*4] = d[i*4+1] = d[i*4+2] = d[i*4+3] = 0; n++; } }
  n += despeckle(d, 60);
  backup(f); await save(d, f); log.push(`${path.basename(f)}: removed ${n} navy fabric px`);
}
async function stripRim(f, rounds = 8, thr = 45) {
  const d = await load(f); let total = 0;
  for (let r = 0; r < rounds; r++) { const kill = [];
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = (y * W + x) * 4; if (!d[i+3] || (d[i]+d[i+1]+d[i+2])/3 >= thr) continue;
      const nb = [i-4,i+4,i-W*4,i+W*4,i-W*4-4,i-W*4+4,i+W*4-4,i+W*4+4]; if (nb.some(j => d[j+3] === 0)) kill.push(i); }
    for (const i of kill) d[i] = d[i+1] = d[i+2] = d[i+3] = 0; total += kill.length; if (!kill.length) break; }
  backup(f); await save(d, f); log.push(`${path.basename(f)}: peeled ${total} dark rim px`);
}
async function fillMasterTorso() {
  const f = R + 'master.png', m = await load(f), out = Buffer.from(m); let added = 0;
  for (const t of ['top-petaljacket-front','top-bloomruffle-front','top-solarvest-front','top-mintmesh-front','top-moonmoto-front','top-auroratop-front','top-prismbolero-front','top-cherrycircuit-front','top-midnightbow-front','top-orbitcape-front']) {
    const src = fs.existsSync(path.join(BK, t + '.png')) ? path.join(BK, t + '.png') : D + t + '.png';   // read the untouched tops
    const d = await load(src);
    for (let y = 180; y < 560; y++) for (let x = 400; x < 620; x++) { const i = (y * W + x) * 4; if (d[i+3] < 250 || m[i+3] < 250) continue;
      if (!tight(d[i], d[i+1], d[i+2]) || tight(out[i], out[i+1], out[i+2])) continue; out[i] = d[i]; out[i+1] = d[i+1]; out[i+2] = d[i+2]; added++; }
  }
  // whatever unitard is left inside the torso band gets the nearest skin colour in its row, so the mannequin is bare from neck to hip
  let filled = 0;
  for (let y = 180; y < 560; y++) { const row = []; for (let x = 380; x < 640; x++) { const i = (y * W + x) * 4; if (m[i+3] >= 250 && tight(out[i], out[i+1], out[i+2])) row.push(x); }
    if (row.length < 8) continue;
    for (let x = 380; x < 640; x++) { const i = (y * W + x) * 4; if (m[i+3] < 250 || tight(out[i], out[i+1], out[i+2])) continue;
      let best = row[0]; for (const rx of row) if (Math.abs(rx - x) < Math.abs(best - x)) best = rx; const j = (y * W + best) * 4;
      out[i] = out[j]; out[i+1] = out[j+1]; out[i+2] = out[j+2]; filled++; } }
  backup(f); await save(out, f); log.push(`master.png: torso skin filled from the tops' midriff bands, ${added} px, plus ${filled} px row-filled`);
}
(async () => {
  const files = fs.readdirSync(D).filter(f => f.endsWith('.png'));
  if (args.includes('--master')) await fillMasterTorso();          // before tops are erased: it reads their untouched skin bands
  for (const f of files) if (/^(bottom|shoes)-/.test(f)) await eraseSkin(D + f);
  if (args.includes('--tops')) for (const f of files) if (/^top-/.test(f)) await eraseSkin(D + f);
  await cutBlueFabric(D + 'shoes-orbitpoints-front.png');
  for (const f of files) if (/^shoes-.*-front\.png$/.test(f)) await shiftToStandingLine(D + f, D + f.replace('-front', '-rear'));
  for (const f of ['bottom-pixelpetals-front.png', 'top-bloomruffle-front.png']) await stripRim(D + f);
  for (const f of fs.readdirSync(D)) if (f.endsWith('.bak')) { fs.renameSync(D + f, path.join(BK, f.replace(/\.bak$/, ''))); log.push(`moved ${f} to originals/`); }
  console.log(log.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
