// Offline puppet renders straight from the layer files (same stacking order as the game, no tint).
// node render.cjs sheet <out.jpg> <crop x,y,w,h> <scale> <girl>:<layer,layer,...> [...]
const path = require('path'), fs = require('fs');
const sharp = require('C:/hirednerds-portfolio/hirednerds-chat/app/node_modules/sharp');
const ROOT = 'C:/hirednerds-portfolio/public/fireworks/assets/glowgirls/sol/';
const W = 1024, H = 1536;
const file = k => k === 'master' ? (process.env.MASTER || ROOT + 'master.png') : ROOT + 'final/' + k + '.png';
async function puppet(girl, layers){
  // girl: sol|hana|jia. layers: list of item keys without side, e.g. hair-hana-petalbob, top-moonmoto
  const comps = [];
  const add = k => { if (fs.existsSync(file(k))) comps.push({ input: file(k) }); };
  for (const l of layers) add(l + '-rear');
  // body: master, with the head swapped for hana/jia
  if (girl === 'sol') comps.push({ input: file('master') });
  else {
    const mask = await sharp(file('head-base-mask')).ensureAlpha().raw().toBuffer();
    const body = await sharp(file('master')).ensureAlpha().raw().toBuffer();
    for (let i = 0; i < W * H; i++) if (mask[i * 4 + 3] > 0) body[i * 4 + 3] = Math.max(0, body[i * 4 + 3] - mask[i * 4 + 3]);
    comps.push({ input: await sharp(body, { raw: { width: W, height: H, channels: 4 } }).png().toBuffer() });
    add('head-' + girl + '-front');
  }
  for (const l of layers) add(l + '-front');
  return sharp({ create: { width: W, height: H, channels: 4, background: '#2c2039' } }).composite(comps).png().toBuffer();
}
(async () => {
  const [mode, out, crop, scale, ...specs] = process.argv.slice(2);
  const [cx, cy, cw, ch] = crop.split(',').map(Number), sc = +scale;
  const tiles = [];
  for (const spec of specs) {
    const [girl, list] = spec.split(':'); const layers = list ? list.split(',') : [];
    const buf = await puppet(girl, layers);
    tiles.push(await sharp(buf).extract({ left: cx, top: cy, width: cw, height: ch }).resize({ width: Math.round(cw * sc), height: Math.round(ch * sc), fit: "fill" }).png().toBuffer());
  }
  const tw = Math.round(cw * sc), th = Math.round(ch * sc);
  await sharp({ create: { width: tw * tiles.length, height: th, channels: 4, background: '#2c2039' } })
    .composite(tiles.map((t, i) => ({ input: t, left: i * tw, top: 0 }))).jpeg({ quality: 88 }).toFile(out);
  console.log('wrote', out, tiles.length, 'tiles');
})().catch(e => { console.error(e); process.exit(1); });
