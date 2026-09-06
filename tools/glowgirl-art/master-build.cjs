// Rebuild master.png from the original mannequin (black unitard):
//  1. chest skin from the tops' own painted skin (from originals/, longest midriff bands first)
//  2. waist: a vertical blend from the chest tone into the leg tone across the whole torso band
//  3. a bralet restored from the original unitard where every CLOSED top covers the bust
//     (open-front jackets/vests may show it: that is the undergarment look)
// Writes master.png and master-skin-only.png (step 2 result) next to this script for inspection.
const fs = require('fs');
const sharp = require('C:/hirednerds-portfolio/hirednerds-chat/app/node_modules/sharp');
const R = 'C:/hirednerds-portfolio/public/fireworks/assets/glowgirls/sol/', D = R + 'final/', W = 1024, H = 1536, BK = __dirname + '/originals/';
function isSkin(r,g,b){const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn; if(mx<77||d===0)return false; if(mx!==r||mn!==b)return false; const sat=d/mx; if(sat<0.06||sat>0.62)return false; const hue=60*(g-b)/d; return hue>=5&&hue<=40;}
function tight(r,g,b){ if(!isSkin(r,g,b))return false; const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn,hue=60*(g-b)/d,sat=d/mx; return hue>=8.5&&hue<=24.3&&sat>=0.14&&sat<=0.58; }
const OPEN = ['petaljacket', 'solarvest', 'moonmoto'];
(async () => {
  const m = await sharp(BK + 'master.png').ensureAlpha().raw().toBuffer(), out = Buffer.from(m);
  // 1. chest
  for (const t of ['top-petaljacket-front','top-moonmoto-front','top-bloomruffle-front','top-mintmesh-front','top-solarvest-front','top-auroratop-front','top-prismbolero-front','top-cherrycircuit-front','top-midnightbow-front','top-orbitcape-front']) {
    const d = await sharp(BK + t + '.png').ensureAlpha().raw().toBuffer();
    for (let y = 180; y < 440; y++) for (let x = 400; x < 620; x++) { const i = (y * W + x) * 4; if (d[i+3] < 250 || m[i+3] < 250) continue;
      if (!tight(d[i], d[i+1], d[i+2]) || tight(out[i], out[i+1], out[i+2])) continue; out[i] = d[i]; out[i+1] = d[i+1]; out[i+2] = d[i+2]; }
  }
  for (let y = 180; y < 440; y++) { const row = []; for (let x = 380; x < 640; x++) { const i = (y * W + x) * 4; if (m[i+3] >= 250 && tight(out[i], out[i+1], out[i+2])) row.push(x); } if (row.length < 8) continue;
    for (let x = 380; x < 640; x++) { const i = (y * W + x) * 4; if (m[i+3] < 250 || tight(out[i], out[i+1], out[i+2])) continue; let best = row[0]; for (const rx of row) if (Math.abs(rx - x) < Math.abs(best - x)) best = rx; const j = (y * W + best) * 4; out[i] = out[j]; out[i+1] = out[j+1]; out[i+2] = out[j+2]; } }
  // 2. waist blend
  const hi = new Array(W).fill(null), lo = new Array(W).fill(null), src = new Int16Array(W).fill(-1);
  for (let x = 380; x < 640; x++) {
    for (let y = 440; y < 800; y++) { const i = (y * W + x) * 4; if (m[i+3] > 250 && tight(m[i], m[i+1], m[i+2])) { src[x] = y; lo[x] = [m[i], m[i+1], m[i+2]]; break; } }
    const a = [0, 0, 0]; let na = 0; for (let y = 434; y < 440; y++) { const i = (y * W + x) * 4; if (m[i+3] > 250 && tight(out[i], out[i+1], out[i+2])) { a[0] += out[i]; a[1] += out[i+1]; a[2] += out[i+2]; na++; } } if (na) hi[x] = a.map(v => v / na);
  }
  const fillNear = arr => { for (let x = 380; x < 640; x++) { if (arr[x]) continue; let best = null, bd = 1e9; for (let k = 380; k < 640; k++) if (arr[k] && Math.abs(k - x) < bd) { bd = Math.abs(k - x); best = arr[k]; } arr[x] = best; } };
  fillNear(hi); fillNear(lo);
  const smooth = arr => { const o = arr.slice(); for (let x = 380; x < 640; x++) { const s = [0, 0, 0]; let n = 0; for (let k = x - 8; k <= x + 8; k++) if (arr[k]) { s[0] += arr[k][0]; s[1] += arr[k][1]; s[2] += arr[k][2]; n++; } o[x] = s.map(v => v / n); } return o; };
  const HI = smooth(hi), LO = smooth(lo);
  const hems = []; for (let x = 380; x < 640; x++) if (src[x] > 0) hems.push(src[x]); const medianHem = hems.sort((a, b) => a - b)[hems.length >> 1];
  for (let x = 380; x < 640; x++) { const end = src[x] > 0 ? src[x] : medianHem;
    for (let y = 440; y < end; y++) { const i = (y * W + x) * 4; if (m[i+3] < 250) continue; if (src[x] < 0 && tight(m[i], m[i+1], m[i+2])) continue; const t = (y - 440) / Math.max(1, end - 440); for (let c = 0; c < 3; c++) out[i+c] = Math.round(HI[x][c] * (1 - t) + LO[x][c] * t); } }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(__dirname + '/master-skin-only.png');
  // 3. bralet
  const tops = fs.readdirSync(D).filter(f => /^top-.*-front\.png$/.test(f) && !OPEN.some(o => f.includes(o)));
  let mask = new Uint8Array(W * H); for (let y = 325; y < 425; y++) for (let x = 400; x < 620; x++) { const i = y * W + x; if (m[i*4+3] >= 250) mask[i] = 1; }
  for (const t of tops) { const d = await sharp(D + t).ensureAlpha().raw().toBuffer(); for (let i = 0; i < W * H; i++) if (mask[i] && d[i*4+3] < 250) mask[i] = 0; }
  for (let r = 0; r < 2; r++) { const n = new Uint8Array(W * H); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (mask[i] && mask[i-1] && mask[i+1] && mask[i-W] && mask[i+W]) n[i] = 1; } mask = n; }
  let n = 0; for (let i = 0; i < W * H; i++) if (mask[i]) { out[i*4] = m[i*4]; out[i*4+1] = m[i*4+1]; out[i*4+2] = m[i*4+2]; n++; }
  await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png().toFile(R + 'master.png');
  console.log('master rebuilt: bralet', n, 'px; closed tops:', tops.length);
})().catch(e => { console.error(e); process.exit(1); });
